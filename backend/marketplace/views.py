"""
Marketplace API views.

Covers:
  - Public browsing and details
  - Tuner listing/version management (CRUD + upload flow)
  - Purchase flow (Stripe-based — entitlements via webhook only)
  - Download with entitlement check + rate limiting
  - Version status check (mobile pre-flash gate)
  - Admin suspend/publish actions
"""

import uuid
import logging

from rest_framework import generics, permissions, status, viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from django.shortcuts import get_object_or_404
from django.utils import timezone

from .models import TuneListing, TuneVersion, PurchaseEntitlement, ValidationReport
from .serializers import (
    TuneListingSerializer,
    TuneVersionSerializer,
    TuneVersionDetailSerializer,
    PurchaseEntitlementSerializer,
    ValidationReportSerializer,
)
from tuners.models import TunerProfile
from core.permissions import IsTuner as CoreIsTuner, IsModerator, IsAdmin
from core.throttles import DownloadRateThrottle, UploadRateThrottle
from core.models import AuditLog

logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────────────────────────────
# Permissions
# ─────────────────────────────────────────────────────────────────────

class IsTuner(permissions.BasePermission):
    """User must have an active (non-suspended) TunerProfile."""
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and hasattr(request.user, 'tuner_profile')
            and not request.user.tuner_profile.is_suspended
        )


class IsListingOwner(permissions.BasePermission):
    """Object-level: user owns the listing (or the listing of the version)."""
    def has_object_permission(self, request, view, obj):
        if isinstance(obj, TuneListing):
            return obj.tuner.user == request.user
        if isinstance(obj, TuneVersion):
            return obj.listing.tuner.user == request.user
        return False


# ─────────────────────────────────────────────────────────────────────
# Public Marketplace Views
# ─────────────────────────────────────────────────────────────────────

class MarketplaceBrowseView(generics.ListAPIView):
    """
    Public marketplace browsing. Lists all active tune listings.
    Supports filtering by vehicle_make and vehicle_model.
    """
    queryset = TuneListing.objects.filter(is_active=True).order_by('-created_at')
    serializer_class = TuneListingSerializer
    permission_classes = [permissions.AllowAny]
    filterset_fields = ['vehicle_make', 'vehicle_model']


class MarketplaceDetailView(generics.RetrieveAPIView):
    """
    Public marketplace detail for a single listing.
    """
    queryset = TuneListing.objects.filter(is_active=True)
    serializer_class = TuneListingSerializer
    permission_classes = [permissions.AllowAny]


# ─────────────────────────────────────────────────────────────────────
# Tuner Management Views
# ─────────────────────────────────────────────────────────────────────

class TunerListingViewSet(viewsets.ModelViewSet):
    """
    Manage Listings (Create Draft, Edit Metadata).
    Only for Approved Tuners.
    """
    serializer_class = TuneListingSerializer
    permission_classes = [IsTuner, IsListingOwner]

    def get_queryset(self):
        return TuneListing.objects.filter(tuner__user=self.request.user)

    def perform_create(self, serializer):
        tuner_profile = self.request.user.tuner_profile
        serializer.save(tuner=tuner_profile)


class TunerVersionViewSet(viewsets.ModelViewSet):
    """
    Manage Versions (Create, Upload, Submit for Review).
    Implements the upload flow: init → upload to quarantine → complete → validate.
    """
    serializer_class = TuneVersionSerializer
    permission_classes = [IsTuner, IsListingOwner]

    def get_queryset(self):
        return TuneVersion.objects.filter(listing__tuner__user=self.request.user)

    @action(detail=True, methods=['post'], url_path='upload-init')
    def upload_init(self, request, pk=None):
        """
        Generate a quarantine path for the tuner to upload their .revsyncpkg.
        
        The tuner then uses their Supabase client (anon key) to upload
        directly to the quarantine bucket at this path.
        
        Version must be in DRAFT or FAILED state (allows re-upload after fix).
        """
        version = self.get_object()
        
        if version.status not in (TuneVersion.State.DRAFT, TuneVersion.State.FAILED):
            return Response(
                {'error': f'Version must be in DRAFT or FAILED to upload (current: {version.status})'},
                status=400
            )

        # Generate unique quarantine path
        user_id = str(request.user.id)
        listing_id = str(version.listing.id)
        version_id = str(version.id)
        filename = f"upload.revsyncpkg"
        
        path = f"tuner/{user_id}/{listing_id}/{version_id}/{filename}"

        # Save intended path (reset to DRAFT if was FAILED)
        version.quarantine_path = path
        if version.status == TuneVersion.State.FAILED:
            version.status = TuneVersion.State.DRAFT
        version.save(update_fields=['quarantine_path', 'status', 'updated_at'])

        logger.info(f"Upload init: version={version_id} path={path}")

        return Response({
            'bucket': 'revsync-quarantine',
            'path': path,
            'version_id': version_id,
            'note': 'Upload your .revsyncpkg to this path using Supabase storage client, then call /upload-complete',
        })

    @action(detail=True, methods=['post'], url_path='upload-complete')
    def upload_complete(self, request, pk=None):
        """
        Called after tuner confirms upload is complete.
        Triggers the Celery validation pipeline.
        """
        version = self.get_object()

        if version.status != TuneVersion.State.DRAFT:
            return Response(
                {'error': f'Version must be in DRAFT to start validation (current: {version.status})'},
                status=400
            )

        if not version.quarantine_path:
            return Response(
                {'error': 'No quarantine path set. Call /upload-init first.'},
                status=400
            )

        version.status = TuneVersion.State.VALIDATING
        version.save(update_fields=['status', 'updated_at'])

        # Trigger validation pipeline
        from .tasks import validate_tune_version
        try:
            validate_tune_version.delay(str(version.id))
        except Exception as exc:  # pragma: no cover - fallback for local/test envs without broker
            logger.warning(
                "Failed to enqueue validation task for version %s (%s). Keep status as VALIDATING for retry.",
                version.id,
                exc,
            )

        logger.info(f"Validation started for version {version.id}")

        return Response({
            'status': 'VALIDATING',
            'message': 'Validation pipeline started. Check /validation endpoint for results.',
        })

    @action(detail=True, methods=['get'])
    def validation(self, request, pk=None):
        """Returns the validation report for a version."""
        version = self.get_object()
        try:
            report = version.validation_report
            return Response(ValidationReportSerializer(report).data)
        except ValidationReport.DoesNotExist:
            return Response({
                'status': version.status,
                'message': 'Validation report not yet available',
            })

    @action(detail=True, methods=['post'], url_path='submit-review')
    def submit_review(self, request, pk=None):
        """
        Submit a validated version for review.
        
        Trusted tuners → auto-approve + publish.
        New tuners → stays at READY_FOR_REVIEW for admin approval.
        """
        version = self.get_object()

        if version.status not in (TuneVersion.State.READY_FOR_REVIEW, TuneVersion.State.APPROVED):
            return Response(
                {'error': f'Version must be READY_FOR_REVIEW or APPROVED (current: {version.status})'},
                status=400
            )

        is_trusted = request.user.tuner_profile.tier == 'TRUSTED'

        if is_trusted:
            version.status = TuneVersion.State.PUBLISHED
            version.save(update_fields=['status', 'updated_at'])
            
            AuditLog.objects.create(
                user=request.user,
                action='AUTO_PUBLISH_TUNE',
                data={
                    'version_id': str(version.id),
                    'listing_id': str(version.listing.id),
                    'reason': 'trusted_tuner_auto_approve',
                },
            )
            
            return Response({
                'status': 'PUBLISHED',
                'message': 'Trusted tuner: auto-approved and published.',
            })
        else:
            # Already READY_FOR_REVIEW — nothing to change
            return Response({
                'status': 'READY_FOR_REVIEW',
                'message': 'Submitted for admin review.',
            })


# ─────────────────────────────────────────────────────────────────────
# Purchase (Stripe-based — entitlement created via webhook ONLY)
# ─────────────────────────────────────────────────────────────────────

class PurchaseCheckView(APIView):
    """
    Check if the user already owns a listing (has active entitlement).
    
    This does NOT create entitlements — that only happens via Stripe webhook.
    Use this endpoint to show "Already Purchased" vs "Buy Now" in the UI.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, listing_id):
        listing = get_object_or_404(TuneListing, pk=listing_id)

        entitlement = PurchaseEntitlement.objects.filter(
            user=request.user,
            listing=listing,
            is_revoked=False,
        ).first()

        return Response({
            'owns': entitlement is not None,
            'listing_id': str(listing.id),
            'entitlement_id': str(entitlement.id) if entitlement else None,
        })


class MyEntitlementsView(generics.ListAPIView):
    """List all active (non-revoked) entitlements for the current user."""
    serializer_class = PurchaseEntitlementSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return PurchaseEntitlement.objects.filter(
            user=self.request.user,
            is_revoked=False,
        ).select_related('listing', 'listing__tuner')


# ─────────────────────────────────────────────────────────────────────
# Download
# ─────────────────────────────────────────────────────────────────────

class DownloadLinkView(APIView):
    """
    Generate a short-lived signed URL for downloading a validated tune package.
    
    Security checks:
      1. User must be authenticated
      2. Active (non-revoked) entitlement for the listing
      3. Version must be in PUBLISHED state
      4. Rate limited to 10 downloads/hour
    
    Returns:
      - download_url: 5-minute signed URL to the .revsyncpkg
      - signature_url: 5-minute signed URL to the .sig file
      - hashes: inline hashes.json content
      - signature_b64: Ed25519 signature (also in .sig file)
      - expires_in: seconds until URLs expire
    """
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [DownloadRateThrottle]

    def post(self, request, version_id):
        version = get_object_or_404(
            TuneVersion.objects.select_related('listing'),
            pk=version_id
        )

        # ─── Check 1: Entitlement ───
        has_entitlement = PurchaseEntitlement.objects.filter(
            user=request.user,
            listing=version.listing,
            is_revoked=False,
        ).exists()

        if not has_entitlement:
            logger.warning(
                f"Download denied: no entitlement user={request.user.id} listing={version.listing.id}"
            )
            return Response(
                {'error': 'No active entitlement for this tune.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # ─── Check 2: Version is PUBLISHED ───
        if version.status != TuneVersion.State.PUBLISHED:
            return Response(
                {'error': f'Version is not available for download (status: {version.status}).'},
                status=status.HTTP_403_FORBIDDEN
            )

        # ─── Check 3: Validated path exists ───
        if not version.validated_path:
            return Response(
                {'error': 'Validated package not found. Contact support.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        # ─── Generate Signed URLs ───
        from core.supabase_client import create_signed_url

        try:
            expires_in = 300  # 5 minutes

            # Package URL
            pkg_url = create_signed_url('validated', version.validated_path, expires_in)

            # Signature URL
            sig_path = version.validated_path.replace('package.revsyncpkg', 'signature.sig')
            sig_url = create_signed_url('validated', sig_path, expires_in)

            # Hashes URL
            hashes_path = version.validated_path.replace('package.revsyncpkg', 'hashes.json')
            hashes_url = create_signed_url('validated', hashes_path, expires_in)

        except Exception as e:
            logger.error(f"Failed to generate signed URLs: {e}")
            return Response(
                {'error': 'Failed to generate download link. Please try again.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        # ─── Audit Log ───
        AuditLog.objects.create(
            user=request.user,
            action='DOWNLOAD_TUNE',
            ip_address=self._get_client_ip(request),
            data={
                'version_id': str(version.id),
                'listing_id': str(version.listing.id),
            },
        )

        return Response({
            'download_url': pkg_url,
            'signature_url': sig_url,
            'hashes_url': hashes_url,
            'signature_b64': version.signature_base64,
            'tune_hash_sha256': version.file_hash_sha256,
            'manifest_hash_sha256': version.manifest_hash_sha256,
            'version_id': str(version.id),
            'version_number': version.version_number,
            'expires_in': 300,
        })

    @staticmethod
    def _get_client_ip(request):
        xff = request.META.get('HTTP_X_FORWARDED_FOR')
        if xff:
            return xff.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR')


# ─────────────────────────────────────────────────────────────────────
# Version Status Check (Pre-Flash Gate)
# ─────────────────────────────────────────────────────────────────────

class VersionStatusCheckView(APIView):
    """
    Mobile calls this right before flashing to confirm:
      1. Version is still PUBLISHED (not SUSPENDED)
      2. Entitlement is still active (not revoked)
    
    This is a critical safety gate that prevents flashing a suspended/revoked tune.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, version_id):
        version = get_object_or_404(
            TuneVersion.objects.select_related('listing'),
            pk=version_id
        )

        has_entitlement = PurchaseEntitlement.objects.filter(
            user=request.user,
            listing=version.listing,
            is_revoked=False,
        ).exists()

        is_published = version.status == TuneVersion.State.PUBLISHED
        listing_active = version.listing.is_active

        return Response({
            'version_id': str(version.id),
            'status': version.status,
            'is_published': is_published,
            'listing_active': listing_active,
            'has_entitlement': has_entitlement,
            'flash_allowed': is_published and listing_active and has_entitlement,
            'signature_b64': version.signature_base64 if is_published else None,
            'tune_hash_sha256': version.file_hash_sha256 if is_published else None,
        })


# ─────────────────────────────────────────────────────────────────────
# Admin Actions
# ─────────────────────────────────────────────────────────────────────

class AdminApproveVersionView(APIView):
    """
    Admin/Moderator approves a version that is READY_FOR_REVIEW.
    Transitions to APPROVED or PUBLISHED.
    """
    permission_classes = [permissions.IsAuthenticated, IsModerator]

    def post(self, request, version_id):
        version = get_object_or_404(TuneVersion, pk=version_id)

        if version.status != TuneVersion.State.READY_FOR_REVIEW:
            return Response(
                {'error': f'Version is not in READY_FOR_REVIEW state (current: {version.status})'},
                status=400
            )

        # Approve and optionally publish
        publish = request.data.get('publish', False)
        if publish:
            version.status = TuneVersion.State.PUBLISHED
        else:
            version.status = TuneVersion.State.APPROVED

        version.save(update_fields=['status', 'updated_at'])

        AuditLog.objects.create(
            user=request.user,
            action='ADMIN_APPROVE_TUNE',
            data={
                'version_id': str(version.id),
                'new_status': version.status,
                'listing_id': str(version.listing.id),
            },
        )

        return Response({
            'status': version.status,
            'message': f'Version {"published" if publish else "approved"}.',
        })


class AdminPublishVersionView(APIView):
    """Admin publishes an APPROVED version."""
    permission_classes = [permissions.IsAuthenticated, IsModerator]

    def post(self, request, version_id):
        version = get_object_or_404(TuneVersion, pk=version_id)

        if version.status != TuneVersion.State.APPROVED:
            return Response(
                {'error': f'Version is not APPROVED (current: {version.status})'},
                status=400
            )

        version.status = TuneVersion.State.PUBLISHED
        version.save(update_fields=['status', 'updated_at'])

        AuditLog.objects.create(
            user=request.user,
            action='ADMIN_PUBLISH_TUNE',
            data={'version_id': str(version.id)},
        )

        return Response({'status': 'PUBLISHED'})


class AdminSuspendVersionView(APIView):
    """
    Kill switch: Admin suspends a published version.
    
    Immediately blocks all downloads. Mobile pre-flash check will
    reject this version. Existing downloads will still fail the
    pre-flash status check.
    """
    permission_classes = [permissions.IsAuthenticated, IsModerator]

    def post(self, request, version_id):
        version = get_object_or_404(TuneVersion, pk=version_id)

        if version.status not in (TuneVersion.State.PUBLISHED, TuneVersion.State.APPROVED):
            return Response(
                {'error': f'Can only suspend PUBLISHED or APPROVED versions (current: {version.status})'},
                status=400
            )

        reason = request.data.get('reason', 'Admin action')
        previous_status = version.status

        version.status = TuneVersion.State.SUSPENDED
        version.save(update_fields=['status', 'updated_at'])

        AuditLog.objects.create(
            user=request.user,
            action='ADMIN_SUSPEND_TUNE',
            data={
                'version_id': str(version.id),
                'listing_id': str(version.listing.id),
                'previous_status': previous_status,
                'reason': reason,
            },
        )

        logger.warning(
            f"KILL SWITCH: version {version.id} SUSPENDED by {request.user.email}. Reason: {reason}"
        )

        return Response({
            'status': 'SUSPENDED',
            'message': f'Version suspended. Reason: {reason}',
        })


class AdminUnsuspendVersionView(APIView):
    """Re-enable a suspended version."""
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def post(self, request, version_id):
        version = get_object_or_404(TuneVersion, pk=version_id)

        if version.status != TuneVersion.State.SUSPENDED:
            return Response(
                {'error': 'Version is not suspended'},
                status=400
            )

        version.status = TuneVersion.State.PUBLISHED
        version.save(update_fields=['status', 'updated_at'])

        AuditLog.objects.create(
            user=request.user,
            action='ADMIN_UNSUSPEND_TUNE',
            data={'version_id': str(version.id)},
        )

        return Response({'status': 'PUBLISHED', 'message': 'Version re-enabled.'})
