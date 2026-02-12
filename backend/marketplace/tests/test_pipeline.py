"""
Tests for the validation pipeline with the new architecture.

The pipeline now uses core.supabase_client helpers instead of a module-level
storage_client object. These tests mock the supabase helpers at the correct paths.
"""

import io
import json
import os
import tempfile
import zipfile

from django.test import TestCase
from django.contrib.auth import get_user_model
from unittest.mock import patch, MagicMock

from marketplace.models import TuneListing, TuneVersion, ValidationReport
from marketplace.tasks import validate_tune_version, is_safe_zip_path
from tuners.models import TunerProfile

User = get_user_model()


def make_valid_manifest(listing_id=None, user_id=None):
    """Create a valid manifest.json dict."""
    import uuid
    return {
        "uploader_supabase_user_id": str(user_id or uuid.uuid4()),
        "listing_id": str(listing_id or uuid.uuid4()),
        "version": "1.0.0",
        "created_at": "2026-02-01T00:00:00Z",
        "supported_ecu": {
            "ecu_family": "Bosch_ME17",
            "hw_ids": ["HW001"],
        },
        "bike_fitment": {
            "make": "Honda",
            "model": "Civic",
            "year_from": 2020,
            "year_to": 2022,
        },
        "requirements": {
            "fuel_octane_min": 91,
        },
        "safety": {
            "risk_level": "LOW",
        },
        "file": {
            "tune_filename": "tune.bin",
            "tune_size_bytes": 256,
        },
    }


def make_revsyncpkg(manifest_data=None, tune_data=None):
    """Create a valid .revsyncpkg (zip) file in memory, write to temp file."""
    if manifest_data is None:
        manifest_data = make_valid_manifest()
    if tune_data is None:
        tune_data = os.urandom(manifest_data['file']['tune_size_bytes'])

    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, 'w', zipfile.ZIP_DEFLATED) as zf:
        zf.writestr('manifest.json', json.dumps(manifest_data))
        zf.writestr('tune.bin', tune_data)
    buffer.seek(0)

    # Write to temp file (simulates download_to_temp)
    fd, path = tempfile.mkstemp(suffix='.revsyncpkg', prefix='revsync_test_')
    with os.fdopen(fd, 'wb') as f:
        f.write(buffer.read())
    return path


class ValidationPipelineTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='tuner', password='password')
        self.tuner = TunerProfile.objects.create(
            user=self.user, business_name="FastTune", slug="fasttune",
            tier='NEW',
        )
        self.listing = TuneListing.objects.create(
            tuner=self.tuner, title="Test", slug="test", description="desc",
            vehicle_make="Honda", vehicle_model="Civic",
            vehicle_year_start=2020, vehicle_year_end=2022, price=10,
        )
        self.version = TuneVersion.objects.create(
            listing=self.listing, version_number="1.0.0",
            status=TuneVersion.State.UPLOADED,
            quarantine_path="mock/path/pkg.zip",
        )

    @patch('core.supabase_client.upload_file')
    @patch('core.supabase_client.move_cross_bucket')
    @patch('marketplace.tasks.sign_data', return_value='mock_signature_base64')
    @patch('core.supabase_client.download_to_temp')
    def test_validation_success(self, mock_download, mock_sign, mock_move, mock_upload):
        """Full pipeline should succeed with a valid .revsyncpkg."""
        # Create a valid package and set mock to return its path
        manifest = make_valid_manifest(listing_id=str(self.listing.id), user_id=str(self.user.id))
        pkg_path = make_revsyncpkg(manifest)
        mock_download.return_value = pkg_path

        # Run task synchronously
        result = validate_tune_version(str(self.version.id))

        # Reload
        v = TuneVersion.objects.get(id=self.version.id)

        # Should be READY_FOR_REVIEW (NEW tuner)
        self.assertEqual(v.status, TuneVersion.State.READY_FOR_REVIEW)
        self.assertTrue(v.validation_report.is_passed)
        self.assertIsNotNone(v.signature_base64)
        self.assertIsNotNone(v.signed_at)
        self.assertTrue(v.file_hash_sha256)

        # Cross-bucket move should have been called
        mock_move.assert_called_once()
        # Signature + hashes should have been uploaded
        self.assertEqual(mock_upload.call_count, 2)

    @patch('core.supabase_client.download_to_temp')
    def test_validation_failure_download(self, mock_download):
        """Pipeline should fail if quarantine download fails."""
        mock_download.side_effect = RuntimeError("Storage connection error")

        validate_tune_version(str(self.version.id))

        v = TuneVersion.objects.get(id=self.version.id)
        self.assertEqual(v.status, TuneVersion.State.FAILED)
        self.assertFalse(v.validation_report.is_passed)

    @patch('core.supabase_client.download_to_temp')
    def test_validation_invalid_zip(self, mock_download):
        """Pipeline should fail if file is not a valid zip."""
        # Create a non-zip temp file
        fd, path = tempfile.mkstemp(suffix='.revsyncpkg')
        with os.fdopen(fd, 'wb') as f:
            f.write(b'not a zip file')
        mock_download.return_value = path

        validate_tune_version(str(self.version.id))

        v = TuneVersion.objects.get(id=self.version.id)
        self.assertEqual(v.status, TuneVersion.State.FAILED)
        report = v.validation_report
        self.assertFalse(report.is_passed)
        self.assertTrue(any('ZIP' in b or 'zip' in b.lower() for b in report.blockers))

    @patch('core.supabase_client.download_to_temp')
    def test_validation_missing_manifest(self, mock_download):
        """Pipeline should fail if manifest.json is missing from zip."""
        # Create zip without manifest.json
        buffer = io.BytesIO()
        with zipfile.ZipFile(buffer, 'w') as zf:
            zf.writestr('tune.bin', os.urandom(256))
        buffer.seek(0)

        fd, path = tempfile.mkstemp(suffix='.revsyncpkg')
        with os.fdopen(fd, 'wb') as f:
            f.write(buffer.read())
        mock_download.return_value = path

        validate_tune_version(str(self.version.id))

        v = TuneVersion.objects.get(id=self.version.id)
        self.assertEqual(v.status, TuneVersion.State.FAILED)
        self.assertTrue(any('manifest' in b.lower() for b in v.validation_report.blockers))
