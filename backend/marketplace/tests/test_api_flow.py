from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from marketplace.models import TuneListing, TuneVersion
from tuners.models import TunerProfile

User = get_user_model()

class MarketplaceFlowTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='tuner', password='password')
        self.tuner = TunerProfile.objects.create(
            user=self.user, 
            business_name="FastTune", 
            slug="fasttune",
            tier=TunerProfile.Tier.NEW
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_create_listing_and_version(self):
        # 1. Create Listing
        listing_data = {
            "title": "Stage 1 ECU Flash",
            "slug": "stage-1-ecu-flash",
            "description": "More power!",
            "vehicle_make": "Yamaha",
            "vehicle_model": "R1",
            "vehicle_year_start": 2020,
            "vehicle_year_end": 2023,
            "price": "99.99"
        }
        res = self.client.post('/api/v1/tuner/listings/', listing_data)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        listing_id = res.data['id']
        
        # 2. Create Version (Draft)
        version_data = {
            "listing": listing_id,
            "version_number": "1.0.0",
            "changelog": "Initial release"
        }
        res = self.client.post('/api/v1/tuner/versions/', version_data)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        version_id = res.data['id']
        
        # 3. Init Upload
        res = self.client.post(f'/api/v1/tuner/versions/{version_id}/upload-init/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('note', res.data)
        
        # 4. Complete Upload (Simulates triggering validation)
        res = self.client.post(f'/api/v1/tuner/versions/{version_id}/upload-complete/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['status'], 'VALIDATING')
        
        # Verify DB State
        v = TuneVersion.objects.get(id=version_id)
        self.assertEqual(v.status, TuneVersion.State.VALIDATING)

    def test_apply_tuner(self):
        new_user = User.objects.create_user(username='newbie', email='newbie@example.com', password='password')
        client = APIClient()
        client.force_authenticate(user=new_user)
        
        data = {
            "business_name": "New Shop",
            "experience_summary": "I tune bikes",
            "website_url": "https://example.com"
        }
        res = client.post('/api/tuners/apply/', data)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
