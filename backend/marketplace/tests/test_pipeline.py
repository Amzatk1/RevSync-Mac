import json
import os
import tempfile
import zipfile
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import TestCase

from marketplace.models import TuneListing, TuneVersion
from marketplace.tasks import validate_tune_version
from tuners.models import TunerProfile

User = get_user_model()


class ValidationPipelineTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='tuner', password='password')
        self.tuner = TunerProfile.objects.create(user=self.user, business_name='FastTune', slug='fasttune')
        self.listing = TuneListing.objects.create(
            tuner=self.tuner,
            title='Test',
            slug='test',
            description='desc',
            vehicle_make='Honda',
            vehicle_model='Civic',
            vehicle_year_start=2020,
            vehicle_year_end=2022,
            price=10,
        )
        self.version = TuneVersion.objects.create(
            listing=self.listing,
            version_number='1.0.0',
            status=TuneVersion.State.UPLOADED,
            quarantine_path='mock/path/pkg.zip',
        )

    def _create_valid_package(self) -> str:
        fd, path = tempfile.mkstemp(suffix='.revsyncpkg')
        os.close(fd)

        tune_data = b'fake_tune_data'
        manifest = {
            'uploader_supabase_user_id': str(self.user.id),
            'listing_id': str(self.listing.id),
            'version': '1.0.0',
            'created_at': '2026-02-01T00:00:00Z',
            'supported_ecu': {
                'ecu_family': 'Bosch_ME17',
                'hw_ids': ['HW001'],
                'sw_ids': ['SW001'],
                'cal_ids': ['CAL001'],
            },
            'bike_fitment': {
                'make': self.listing.vehicle_make,
                'model': self.listing.vehicle_model,
                'year_from': 2020,
                'year_to': 2022,
            },
            'requirements': {'fuel_octane_min': 91, 'required_mods': [], 'warnings': []},
            'safety': {'risk_level': 'MED', 'known_limitations': []},
            'file': {'tune_filename': 'tune.bin', 'tune_size_bytes': len(tune_data)},
        }

        with zipfile.ZipFile(path, 'w', zipfile.ZIP_DEFLATED) as zf:
            zf.writestr('manifest.json', json.dumps(manifest))
            zf.writestr('tune.bin', tune_data)

        return path

    @patch('marketplace.tasks.sign_data', return_value='mock_signature_base64')
    @patch('marketplace.tasks.storage_client.upload_file')
    @patch('marketplace.tasks.storage_client.move_cross_bucket')
    @patch('marketplace.tasks.storage_client.delete_file')
    @patch('marketplace.tasks.storage_client.download_to_temp')
    def test_validation_success(self, mock_download, _mock_delete, mock_move, mock_upload, _mock_sign):
        pkg_path = self._create_valid_package()
        self.addCleanup(lambda: os.path.exists(pkg_path) and os.remove(pkg_path))

        mock_download.return_value = pkg_path

        validate_tune_version(str(self.version.id))

        v = TuneVersion.objects.get(id=self.version.id)
        self.assertEqual(v.status, TuneVersion.State.READY_FOR_REVIEW)
        self.assertTrue(v.validation_report.is_passed)
        self.assertEqual(v.signature_base64, 'mock_signature_base64')
        self.assertIsNotNone(v.signed_at)
        mock_move.assert_called_once()
        self.assertEqual(mock_upload.call_count, 2)

    @patch('marketplace.tasks.storage_client.download_to_temp', side_effect=Exception('S3 Error'))
    def test_validation_failure(self, _mock_download):
        validate_tune_version(str(self.version.id))

        v = TuneVersion.objects.get(id=self.version.id)
        self.assertEqual(v.status, TuneVersion.State.FAILED)
        self.assertFalse(v.validation_report.is_passed)
