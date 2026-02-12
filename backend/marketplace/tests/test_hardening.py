"""
Backend tests for RevSync validation pipeline, payments, and security.

Tests cover:
  1. Validation pipeline stages
  2. Stripe webhook security + handlers
  3. Download entitlement checks
  4. Rate limiting
  5. Zip slip prevention
  6. Admin actions
"""

import hashlib
import io
import json
import os
import tempfile
import uuid
import zipfile
from decimal import Decimal
from unittest.mock import patch, MagicMock

from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework.test import APITestCase, APIClient

from users.models import User
from tuners.models import TunerProfile
from marketplace.models import TuneListing, TuneVersion, PurchaseEntitlement, ValidationReport
from payments.models import PaymentTransaction
from garage.models import Vehicle, FlashJob, EcuBackup
from core.models import AuditLog
from marketplace.manifest_schema import validate_manifest
from marketplace.tasks import is_safe_zip_path, compute_sha256


# ─────────────────────────────────────────────────────────────────────
# Test Helpers
# ─────────────────────────────────────────────────────────────────────

def create_test_user(email='testuser@revsync.com', password='testpass123', **kwargs):
    """Create a test user."""
    return User.objects.create_user(
        username=kwargs.get('username', email.split('@')[0]),
        email=email,
        password=password,
        **{k: v for k, v in kwargs.items() if k != 'username'}
    )


def create_tuner(user, tier='NEW'):
    """Create a tuner profile for a user."""
    user.is_tuner = True
    user.tuner_tier = tier
    user.save()
    profile, _ = TunerProfile.objects.get_or_create(
        user=user,
        defaults={
            'business_name': f'{user.username} Tunes',
            'slug': f'{user.username}-tunes',
            'tier': tier,
        }
    )
    return profile


def create_listing(tuner_profile, price=29.99, **kwargs):
    """Create a test tune listing."""
    return TuneListing.objects.create(
        tuner=tuner_profile,
        title=kwargs.get('title', 'Stage 1 Power Tune'),
        description='High-performance ECU calibration',
        vehicle_make=kwargs.get('vehicle_make', 'Yamaha'),
        vehicle_model=kwargs.get('vehicle_model', 'MT-09'),
        vehicle_year_start=2021,
        vehicle_year_end=2025,
        price=Decimal(str(price)),
    )


def create_version(listing, status=TuneVersion.State.DRAFT, **kwargs):
    """Create a test tune version."""
    return TuneVersion.objects.create(
        listing=listing,
        version_number=kwargs.get('version_number', '1.0.0'),
        status=status,
        **{k: v for k, v in kwargs.items() if k != 'version_number'}
    )


def make_valid_manifest(listing_id=None, user_id=None):
    """Create a valid manifest.json dict."""
    return {
        "uploader_supabase_user_id": str(user_id or uuid.uuid4()),
        "listing_id": str(listing_id or uuid.uuid4()),
        "version": "1.0.0",
        "created_at": "2026-02-01T00:00:00Z",
        "supported_ecu": {
            "ecu_family": "Bosch_ME17",
            "hw_ids": ["HW001", "HW002"],
            "sw_ids": ["SW100"],
            "cal_ids": ["CAL200"]
        },
        "bike_fitment": {
            "make": "Yamaha",
            "model": "MT-09",
            "year_from": 2021,
            "year_to": 2025
        },
        "requirements": {
            "fuel_octane_min": 91,
            "required_mods": ["Full exhaust"],
            "warnings": ["May void warranty"]
        },
        "safety": {
            "risk_level": "MED",
            "known_limitations": ["Rev limit adjusted"]
        },
        "file": {
            "tune_filename": "tune.bin",
            "tune_size_bytes": 1024
        }
    }


def make_revsyncpkg(manifest_data=None, tune_data=None, extra_files=None):
    """Create a valid .revsyncpkg (zip) file in memory."""
    if manifest_data is None:
        manifest_data = make_valid_manifest()
    if tune_data is None:
        tune_data = os.urandom(manifest_data['file']['tune_size_bytes'])

    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, 'w', zipfile.ZIP_DEFLATED) as zf:
        zf.writestr('manifest.json', json.dumps(manifest_data))
        zf.writestr('tune.bin', tune_data)
        if extra_files:
            for name, data in extra_files.items():
                zf.writestr(name, data)
    buffer.seek(0)
    return buffer.read()


# ─────────────────────────────────────────────────────────────────────
# 1. Manifest Schema Tests
# ─────────────────────────────────────────────────────────────────────

class ManifestSchemaTests(TestCase):
    """Tests for manifest.json JSON Schema validation."""

    def test_valid_manifest_passes(self):
        """A complete, valid manifest should pass validation."""
        manifest = make_valid_manifest()
        is_valid, errors = validate_manifest(manifest)
        self.assertTrue(is_valid, f"Valid manifest should pass: {errors}")
        self.assertEqual(errors, [])

    def test_missing_supported_ecu_fails(self):
        """Missing required 'supported_ecu' field should fail."""
        manifest = make_valid_manifest()
        del manifest['supported_ecu']
        is_valid, errors = validate_manifest(manifest)
        self.assertFalse(is_valid)
        self.assertTrue(any('supported_ecu' in e for e in errors))

    def test_missing_ecu_family_fails(self):
        """Missing ecu_family within supported_ecu should fail."""
        manifest = make_valid_manifest()
        del manifest['supported_ecu']['ecu_family']
        is_valid, errors = validate_manifest(manifest)
        self.assertFalse(is_valid)

    def test_invalid_version_format_fails(self):
        """Non-semver version string should fail."""
        manifest = make_valid_manifest()
        manifest['version'] = 'v1.0'
        is_valid, errors = validate_manifest(manifest)
        self.assertFalse(is_valid)

    def test_year_range_invalid_fails(self):
        """year_to < year_from should fail cross-field validation."""
        manifest = make_valid_manifest()
        manifest['bike_fitment']['year_from'] = 2025
        manifest['bike_fitment']['year_to'] = 2020
        is_valid, errors = validate_manifest(manifest)
        self.assertFalse(is_valid)
        self.assertTrue(any('year_to' in e for e in errors))

    def test_extra_fields_rejected(self):
        """Extra properties not in schema should fail."""
        manifest = make_valid_manifest()
        manifest['extra_field'] = 'not allowed'
        is_valid, errors = validate_manifest(manifest)
        self.assertFalse(is_valid)

    def test_invalid_risk_level_fails(self):
        """risk_level must be LOW, MED, or HIGH."""
        manifest = make_valid_manifest()
        manifest['safety']['risk_level'] = 'EXTREME'
        is_valid, errors = validate_manifest(manifest)
        self.assertFalse(is_valid)


# ─────────────────────────────────────────────────────────────────────
# 2. Zip Safety Tests
# ─────────────────────────────────────────────────────────────────────

class ZipSafetyTests(TestCase):
    """Tests for zip slip prevention."""

    def setUp(self):
        self.extract_dir = tempfile.mkdtemp()

    def test_safe_path_passes(self):
        self.assertTrue(is_safe_zip_path('manifest.json', self.extract_dir))
        self.assertTrue(is_safe_zip_path('tune.bin', self.extract_dir))
        self.assertTrue(is_safe_zip_path('notes.md', self.extract_dir))

    def test_path_traversal_blocked(self):
        """Paths containing '..' must be rejected."""
        self.assertFalse(is_safe_zip_path('../../etc/passwd', self.extract_dir))
        self.assertFalse(is_safe_zip_path('../../../root/.ssh/id_rsa', self.extract_dir))

    def test_absolute_path_blocked(self):
        """Absolute paths must be rejected."""
        self.assertFalse(is_safe_zip_path('/etc/passwd', self.extract_dir))
        self.assertFalse(is_safe_zip_path('/tmp/evil.sh', self.extract_dir))

    def test_dot_dot_in_middle_blocked(self):
        """Path with .. in the middle segments."""
        self.assertFalse(is_safe_zip_path('subdir/../../etc/passwd', self.extract_dir))


# ─────────────────────────────────────────────────────────────────────
# 3. Stripe Webhook Tests
# ─────────────────────────────────────────────────────────────────────

class WebhookSecurityTests(APITestCase):
    """Tests for Stripe webhook security and handlers."""

    def setUp(self):
        self.client = APIClient()
        self.user = create_test_user()
        self.tuner_user = create_test_user(email='tuner@revsync.com')
        self.tuner_profile = create_tuner(self.tuner_user)
        self.listing = create_listing(self.tuner_profile)
        self.url = '/api/payments/webhook/'

    @override_settings(STRIPE_WEBHOOK_SECRET='whsec_test_secret')
    def test_webhook_invalid_signature_rejected(self):
        """POST with an invalid Stripe-Signature header should return 400."""
        payload = json.dumps({
            'id': 'evt_test123',
            'type': 'payment_intent.succeeded',
            'data': {'object': {'id': 'pi_test', 'metadata': {}}}
        })

        response = self.client.post(
            self.url,
            data=payload,
            content_type='application/json',
            HTTP_STRIPE_SIGNATURE='bad_signature'
        )
        self.assertEqual(response.status_code, 400)

    @override_settings(STRIPE_WEBHOOK_SECRET='')
    def test_webhook_payment_success_creates_entitlement(self):
        """payment_intent.succeeded should create a PurchaseEntitlement."""
        # Pre-create the PaymentTransaction
        PaymentTransaction.objects.create(
            user=self.user,
            listing=self.listing,
            stripe_payment_intent_id='pi_test_success',
            amount=Decimal('29.99'),
            status=PaymentTransaction.Status.PENDING,
        )

        payload = json.dumps({
            'id': 'evt_success_001',
            'type': 'payment_intent.succeeded',
            'data': {
                'object': {
                    'id': 'pi_test_success',
                    'latest_charge': 'ch_test',
                    'metadata': {
                        'listing_id': str(self.listing.id),
                        'user_id': str(self.user.id),
                    }
                }
            }
        })

        response = self.client.post(
            self.url,
            data=payload,
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)

        # Entitlement should exist
        self.assertTrue(
            PurchaseEntitlement.objects.filter(
                user=self.user, listing=self.listing, is_revoked=False
            ).exists()
        )

        # Transaction should be updated
        txn = PaymentTransaction.objects.get(stripe_payment_intent_id='pi_test_success')
        self.assertEqual(txn.status, 'succeeded')
        self.assertEqual(txn.webhook_event_id, 'evt_success_001')

    @override_settings(STRIPE_WEBHOOK_SECRET='')
    def test_webhook_idempotency(self):
        """Same event ID sent twice should create only 1 entitlement."""
        PaymentTransaction.objects.create(
            user=self.user,
            listing=self.listing,
            stripe_payment_intent_id='pi_idempotent',
            amount=Decimal('29.99'),
            status=PaymentTransaction.Status.PENDING,
        )

        payload = json.dumps({
            'id': 'evt_idempotent_001',
            'type': 'payment_intent.succeeded',
            'data': {
                'object': {
                    'id': 'pi_idempotent',
                    'latest_charge': 'ch_test',
                    'metadata': {}
                }
            }
        })

        # Send twice
        self.client.post(self.url, data=payload, content_type='application/json')
        self.client.post(self.url, data=payload, content_type='application/json')

        # Should have exactly 1 entitlement
        count = PurchaseEntitlement.objects.filter(
            user=self.user, listing=self.listing
        ).count()
        self.assertEqual(count, 1)

    @override_settings(STRIPE_WEBHOOK_SECRET='')
    def test_refund_revokes_entitlement(self):
        """charge.refunded should revoke the entitlement."""
        # Setup: create transaction and entitlement
        PaymentTransaction.objects.create(
            user=self.user,
            listing=self.listing,
            stripe_payment_intent_id='pi_refund_test',
            amount=Decimal('29.99'),
            status=PaymentTransaction.Status.SUCCEEDED,
        )
        PurchaseEntitlement.objects.create(
            user=self.user,
            listing=self.listing,
            transaction_id='pi_refund_test',
            is_revoked=False,
        )

        payload = json.dumps({
            'id': 'evt_refund_001',
            'type': 'charge.refunded',
            'data': {
                'object': {
                    'id': 'ch_refund',
                    'payment_intent': 'pi_refund_test',
                    'refunds': {
                        'data': [{
                            'id': 're_test',
                            'amount': 2999,
                            'reason': 'requested_by_customer',
                        }]
                    }
                }
            }
        })

        response = self.client.post(self.url, data=payload, content_type='application/json')
        self.assertEqual(response.status_code, 200)

        # Entitlement should be revoked
        entitlement = PurchaseEntitlement.objects.get(user=self.user, listing=self.listing)
        self.assertTrue(entitlement.is_revoked)

        # Transaction should be refunded
        txn = PaymentTransaction.objects.get(stripe_payment_intent_id='pi_refund_test')
        self.assertEqual(txn.status, 'refunded')


# ─────────────────────────────────────────────────────────────────────
# 4. Download Entitlement Tests
# ─────────────────────────────────────────────────────────────────────

class DownloadEntitlementTests(APITestCase):
    """Tests for download link generation with entitlement checks."""

    def setUp(self):
        self.client = APIClient()
        self.user = create_test_user()
        self.tuner_user = create_test_user(email='tuner2@revsync.com')
        self.tuner_profile = create_tuner(self.tuner_user)
        self.listing = create_listing(self.tuner_profile)
        self.version = create_version(
            self.listing,
            status=TuneVersion.State.PUBLISHED,
            validated_path='listing/test/v1/package.revsyncpkg',
            signature_base64='dGVzdC1zaWduYXR1cmU=',
            file_hash_sha256='abc123',
        )

    def test_download_without_entitlement_rejected(self):
        """User without entitlement should get 403."""
        self.client.force_authenticate(user=self.user)
        url = f'/api/v1/marketplace/download/{self.version.id}/'
        response = self.client.post(url)
        self.assertEqual(response.status_code, 403)

    def test_download_with_revoked_entitlement_rejected(self):
        """User with revoked entitlement should get 403."""
        PurchaseEntitlement.objects.create(
            user=self.user,
            listing=self.listing,
            transaction_id='tx_test',
            is_revoked=True,
        )
        self.client.force_authenticate(user=self.user)
        url = f'/api/v1/marketplace/download/{self.version.id}/'
        response = self.client.post(url)
        self.assertEqual(response.status_code, 403)

    def test_download_suspended_version_rejected(self):
        """Downloading a SUSPENDED version should return 403."""
        self.version.status = TuneVersion.State.SUSPENDED
        self.version.save()

        PurchaseEntitlement.objects.create(
            user=self.user,
            listing=self.listing,
            transaction_id='tx_test',
            is_revoked=False,
        )
        self.client.force_authenticate(user=self.user)
        url = f'/api/v1/marketplace/download/{self.version.id}/'
        response = self.client.post(url)
        self.assertEqual(response.status_code, 403)

    @patch('core.supabase_client.create_signed_url')
    def test_download_with_valid_entitlement_succeeds(self, mock_signed_url):
        """User with active entitlement should get download URLs."""
        mock_signed_url.return_value = 'https://storage.example.com/signed?token=abc'

        PurchaseEntitlement.objects.create(
            user=self.user,
            listing=self.listing,
            transaction_id='tx_test',
            is_revoked=False,
        )
        self.client.force_authenticate(user=self.user)
        url = f'/api/v1/marketplace/download/{self.version.id}/'
        response = self.client.post(url)
        self.assertEqual(response.status_code, 200)

        data = response.json()
        self.assertIn('download_url', data)
        self.assertIn('signature_url', data)
        self.assertIn('signature_b64', data)
        self.assertIn('tune_hash_sha256', data)
        self.assertEqual(data['version_id'], str(self.version.id))


# ─────────────────────────────────────────────────────────────────────
# 5. Version Status Check Tests (Pre-Flash Gate)
# ─────────────────────────────────────────────────────────────────────

class VersionStatusCheckTests(APITestCase):
    """Tests for the pre-flash version status check endpoint."""

    def setUp(self):
        self.client = APIClient()
        self.user = create_test_user()
        self.tuner_user = create_test_user(email='tuner3@revsync.com')
        self.tuner_profile = create_tuner(self.tuner_user)
        self.listing = create_listing(self.tuner_profile)
        self.version = create_version(
            self.listing, status=TuneVersion.State.PUBLISHED,
            signature_base64='dGVzdA==', file_hash_sha256='abc',
        )

    def test_published_with_entitlement_allows_flash(self):
        """PUBLISHED version + active entitlement → flash_allowed=True."""
        PurchaseEntitlement.objects.create(
            user=self.user, listing=self.listing,
            transaction_id='tx', is_revoked=False,
        )
        self.client.force_authenticate(user=self.user)
        url = f'/api/v1/marketplace/version-status/{self.version.id}/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()['flash_allowed'])

    def test_suspended_version_blocks_flash(self):
        """SUSPENDED version → flash_allowed=False."""
        self.version.status = TuneVersion.State.SUSPENDED
        self.version.save()
        PurchaseEntitlement.objects.create(
            user=self.user, listing=self.listing,
            transaction_id='tx', is_revoked=False,
        )
        self.client.force_authenticate(user=self.user)
        url = f'/api/v1/marketplace/version-status/{self.version.id}/'
        response = self.client.get(url)
        self.assertFalse(response.json()['flash_allowed'])


# ─────────────────────────────────────────────────────────────────────
# 6. Admin Action Tests
# ─────────────────────────────────────────────────────────────────────

class AdminActionTests(APITestCase):
    """Tests for admin suspend/unsuspend/approve actions."""

    def setUp(self):
        self.admin = create_test_user(email='admin@revsync.com')
        self.admin.is_admin = True
        self.admin.is_moderator = True
        self.admin.save()

        self.tuner_user = create_test_user(email='tuner4@revsync.com')
        self.tuner_profile = create_tuner(self.tuner_user)
        self.listing = create_listing(self.tuner_profile)
        self.version = create_version(
            self.listing, status=TuneVersion.State.PUBLISHED
        )

    def test_admin_can_suspend_published_version(self):
        """Admin should be able to suspend a published version (kill switch)."""
        self.client.force_authenticate(user=self.admin)
        url = f'/api/v1/admin-api/version/{self.version.id}/suspend/'
        response = self.client.post(url, {'reason': 'Safety concern'})
        self.assertEqual(response.status_code, 200)

        self.version.refresh_from_db()
        self.assertEqual(self.version.status, TuneVersion.State.SUSPENDED)

        # Audit log should exist
        self.assertTrue(
            AuditLog.objects.filter(action='ADMIN_SUSPEND_TUNE').exists()
        )

    def test_non_admin_cannot_suspend(self):
        """Regular user should NOT be able to suspend."""
        user = create_test_user(email='regular@revsync.com')
        self.client.force_authenticate(user=user)
        url = f'/api/v1/admin-api/version/{self.version.id}/suspend/'
        response = self.client.post(url, {'reason': 'Attempt'})
        self.assertEqual(response.status_code, 403)


# ─────────────────────────────────────────────────────────────────────
# 7. Hashing Tests
# ─────────────────────────────────────────────────────────────────────

class HashingTests(TestCase):
    """Tests for compute_sha256 utility."""

    def test_sha256_correct(self):
        """Computed hash should match Python's hashlib."""
        data = b'RevSync tune data for ECU flash'
        expected = hashlib.sha256(data).hexdigest()

        # Write to temp file and compute
        with tempfile.NamedTemporaryFile(delete=False) as f:
            f.write(data)
            f.flush()
            result = compute_sha256(f.name)

        self.assertEqual(result, expected)
        os.remove(f.name)


# ─────────────────────────────────────────────────────────────────────
# 8. FlashJob Model Tests
# ─────────────────────────────────────────────────────────────────────

class FlashJobModelTests(TestCase):
    """Tests for the FlashJob state machine."""

    def setUp(self):
        self.user = create_test_user(email='flasher@revsync.com')
        self.vehicle = Vehicle.objects.create(
            user=self.user,
            name='My MT-09',
            make='Yamaha',
            model='MT-09',
            year=2023,
        )

    def test_default_status_is_created(self):
        """New FlashJob should start in CREATED status."""
        job = FlashJob.objects.create(
            user=self.user,
            vehicle=self.vehicle,
        )
        self.assertEqual(job.status, FlashJob.Status.CREATED)

    def test_add_log(self):
        """add_log should append timestamped entries."""
        job = FlashJob.objects.create(
            user=self.user,
            vehicle=self.vehicle,
        )
        job.add_log("Starting pre-check")
        job.add_log("Battery OK")

        job.refresh_from_db()
        self.assertEqual(len(job.logs), 2)
        self.assertEqual(job.logs[0]['message'], "Starting pre-check")
        self.assertIn('timestamp', job.logs[0])
