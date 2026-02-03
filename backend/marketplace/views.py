from rest_framework import generics, permissions, status, viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from django.shortcuts import get_object_or_404
from .models import TuneListing, TuneVersion, PurchaseEntitlement
from .serializers import (
    TuneListingSerializer, TuneVersionSerializer, TuneVersionDetailSerializer,
    PurchaseEntitlementSerializer
)
from tuners.models import TunerProfile
import uuid

# --- Permissions ---

class IsTuner(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and hasattr(request.user, 'tuner_profile')

class IsListingOwner(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        # obj is TuneListing or TuneVersion
        if isinstance(obj, TuneListing):
            return obj.tuner.user == request.user
        if isinstance(obj, TuneVersion):
            return obj.listing.tuner.user == request.user
        return False

# --- Views ---

class MarketplaceBrowseView(generics.ListAPIView):
    """
    Public marketplace browsing.
    """
    queryset = TuneListing.objects.filter(is_active=True)
    serializer_class = TuneListingSerializer
    permission_classes = [permissions.AllowAny]
    filterset_fields = ['vehicle_make', 'vehicle_model']

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
    Manage Versions (Create, Upload, Submit).
    """
    serializer_class = TuneVersionSerializer
    permission_classes = [IsTuner, IsListingOwner]

    def get_queryset(self):
        return TuneVersion.objects.filter(listing__tuner__user=self.request.user)

    @action(detail=True, methods=['post'], url_path='upload-init')
    def upload_init(self, request, pk=None):
        version = self.get_object()
        if version.status != TuneVersion.State.DRAFT:
             return Response({'error': 'Version must be in DRAFT to upload'}, status=400)

        # Generate Quarantine Path
        filename = f"{uuid.uuid4()}.revsyncpkg"
        bucket = "revsync-quarantine"
        path = f"{request.user.id}/{version.listing.id}/{version.id}/{filename}"
        
        # MOCK Signed URL (Replace with Supabase Logic)
        upload_url = f"https://mock-supabase.com/upload/{bucket}/{path}"
        
        # Save intended path
        version.quarantine_path = path
        version.save()
        
        return Response({
            'bucket': bucket,
            'path': path,
            'upload_url': upload_url
        })
        
    @action(detail=True, methods=['post'], url_path='upload-complete')
    def upload_complete(self, request, pk=None):
        version = self.get_object()
        # Trigger Celery Task
        # task = validate_tune_version.delay(version.id)
        
        version.status = TuneVersion.State.VALIDATING
        version.save()
        
        return Response({'status': 'VALIDATING', 'message': 'Pipeline started'})

    @action(detail=True, methods=['get'])
    def validation(self, request, pk=None):
        version = self.get_object()
        if hasattr(version, 'validation_report'):
             from .serializers import ValidationReportSerializer
             return Response(ValidationReportSerializer(version.validation_report).data)
        return Response({'status': 'processing'})

    @action(detail=True, methods=['post'], url_path='submit-review')
    def submit_review(self, request, pk=None):
        version = self.get_object()
        if version.status != TuneVersion.State.READY_FOR_REVIEW:
            return Response({'error': 'Validation not passed or already submitted'}, status=400)
            
        # Logic for Trusted Tuners -> Auto Approve
        is_trusted = request.user.tuner_profile.tier == 'TRUSTED'
        
        if is_trusted:
            version.status = TuneVersion.State.PUBLISHED
            version.save()
            return Response({'status': 'PUBLISHED', 'message': 'Auto-approved'})
        else:
            # Set to PENDING_APPROVAL if we had that state, otherwise keep READY_FOR_REVIEW for Admin
             return Response({'status': 'READY_FOR_REVIEW', 'message': 'Submitted to admins'})

class PurchaseView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, listing_id):
        listing = get_object_or_404(TuneListing, pk=listing_id)
        
        # MOCK Payment
        entitlement, created = PurchaseEntitlement.objects.get_or_create(
            user=request.user,
            listing=listing,
            defaults={'transaction_id': str(uuid.uuid4())}
        )
        return Response({'status': 'purchased', 'entitlement_id': entitlement.id})

class DownloadLinkView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, version_id):
        version = get_object_or_404(TuneVersion, pk=version_id)
        
        # Check Entitlement
        has_entitlement = PurchaseEntitlement.objects.filter(
            user=request.user, 
            listing=version.listing, 
            is_revoked=False
        ).exists()
        
        if not has_entitlement:
            return Response({'error': 'No active entitlement'}, status=403)
            
        if version.status != TuneVersion.State.PUBLISHED:
            return Response({'error': 'Version not published'}, status=403)
            
        # Generate Signed URL for Validated Bucket
        # MOCK
        signed_url = f"https://mock-storage.com/validated/{version.validated_path}?token=xyz"
        
        return Response({'download_url': signed_url, 'expires_in': 300})
