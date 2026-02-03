from django.test import TestCase
from marketplace.models import TuneListing, TuneVersion, ValidationReport
from marketplace.tasks import validate_tune_version
from tuners.models import TunerProfile
from django.contrib.auth import get_user_model
from unittest.mock import patch, MagicMock

User = get_user_model()

class ValidationPipelineTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='tuner', password='password')
        self.tuner = TunerProfile.objects.create(user=self.user, business_name="FastTune", slug="fasttune")
        self.listing = TuneListing.objects.create(
            tuner=self.tuner, title="Test", slug="test", description="desc",
            vehicle_make="Honda", vehicle_model="Civic", 
            vehicle_year_start=2020, vehicle_year_end=2022, price=10
        )
        self.version = TuneVersion.objects.create(
            listing=self.listing, version_number="1.0.0", 
            status=TuneVersion.State.UPLOADED,
            quarantine_path="mock/path/pkg.zip"
        )

    @patch('marketplace.tasks.storage_client')
    def test_validation_success(self, mock_storage):
        # Mock Storage
        mock_storage.download_to_temp.return_value = "/tmp/mock_pkg"
        mock_storage.move_object.return_value = True
        
        # Run Task Synchronously
        validate_tune_version(self.version.id)
        
        # Reload
        v = TuneVersion.objects.get(id=self.version.id)
        
        # Check State
        self.assertEqual(v.status, TuneVersion.State.READY_FOR_REVIEW)
        self.assertTrue(v.validation_report.is_passed)
        self.assertIsNotNone(v.signature_base64)
        self.assertIsNotNone(v.signed_at)

    @patch('marketplace.tasks.storage_client')
    def test_validation_failure(self, mock_storage):
        # Force failure by making download fail
        mock_storage.download_to_temp.side_effect = Exception("S3 Error")
        
        validate_tune_version(self.version.id)
        
        v = TuneVersion.objects.get(id=self.version.id)
        self.assertEqual(v.status, TuneVersion.State.FAILED)
        self.assertFalse(v.validation_report.is_passed)
