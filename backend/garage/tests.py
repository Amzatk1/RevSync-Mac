from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from garage.models import EcuBackup, Vehicle, FlashJob
from marketplace.models import PurchaseEntitlement, TuneListing, TuneVersion
from tuners.models import TunerProfile

User = get_user_model()


class GarageApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='garage@example.com',
            username='garage_user',
            password='Passw0rd!',
            first_name='Garage',
            last_name='Tester',
        )
        self.other_user = User.objects.create_user(
            email='other-garage@example.com',
            username='other_garage_user',
            password='Passw0rd!',
            first_name='Other',
            last_name='User',
        )
        self.client.force_authenticate(user=self.user)

        self.vehicle = Vehicle.objects.create(
            user=self.user,
            name='My Bike',
            make='Yamaha',
            model='R1',
            year=2022,
        )
        Vehicle.objects.create(
            user=self.other_user,
            name='Other Bike',
            make='Honda',
            model='CBR600RR',
            year=2021,
        )

    def test_vehicle_list_returns_only_current_users_records(self):
        res = self.client.get(reverse('vehicle_list_create'))

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('results', res.data)
        self.assertEqual(len(res.data['results']), 1)
        self.assertEqual(res.data['results'][0]['id'], self.vehicle.id)

    def test_vehicle_list_rejects_invalid_since_filter(self):
        res = self.client.get(reverse('vehicle_list_create'), {'since': 'not-a-timestamp'})

        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('since', res.data)

    def test_backup_list_endpoint_uses_queryset_without_assertion(self):
        EcuBackup.objects.create(
            user=self.user,
            vehicle=self.vehicle,
            storage_key='backups/my-bike-stock.bin',
            checksum='a' * 64,
            file_size_kb=512,
        )

        res = self.client.get(reverse('backup_list_create'))

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('results', res.data)
        self.assertEqual(len(res.data['results']), 1)

    def test_backup_create_accepts_verified_client_metadata(self):
        res = self.client.post(
            reverse('backup_list_create'),
            {
                'vehicle': self.vehicle.id,
                'storage_key': 'device-local/backups/backup_123.bin',
                'checksum': 'a' * 64,
                'file_size_kb': 512,
                'notes': 'Captured via BLE device read',
            },
            format='json',
        )

        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        backup = EcuBackup.objects.get(id=res.data['id'])
        self.assertEqual(backup.user, self.user)
        self.assertEqual(backup.checksum, 'a' * 64)
        self.assertEqual(backup.file_size_kb, 512)

    def test_flash_job_update_appends_log_and_sets_completion_time(self):
        flash_job = FlashJob.objects.create(
            user=self.user,
            vehicle=self.vehicle,
            status=FlashJob.Status.CREATED,
            progress=0,
            connection_type=FlashJob.ConnectionType.BLE,
            device_id='dev-1',
        )

        res = self.client.patch(
            reverse('flash_job_detail', args=[flash_job.id]),
            {
                'status': 'FLASHING',
                'progress': 42,
                'log_message': 'Chunk 16/40 acknowledged',
                'chunks_sent': 16,
                'total_chunks': 40,
            },
            format='json',
        )

        self.assertEqual(res.status_code, status.HTTP_200_OK)

        flash_job.refresh_from_db()
        self.assertEqual(flash_job.status, FlashJob.Status.FLASHING)
        self.assertEqual(flash_job.progress, 42)
        self.assertEqual(flash_job.chunks_sent, 16)
        self.assertEqual(flash_job.total_chunks, 40)
        self.assertTrue(flash_job.logs)
        self.assertIsNotNone(flash_job.flash_started_at)

        res = self.client.patch(
            reverse('flash_job_detail', args=[flash_job.id]),
            {
                'status': 'COMPLETED',
                'progress': 100,
                'log_message': 'Verification passed and ECU responded normally',
            },
            format='json',
        )

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        flash_job.refresh_from_db()
        self.assertEqual(flash_job.status, FlashJob.Status.COMPLETED)
        self.assertEqual(flash_job.progress, 100)
        self.assertIsNotNone(flash_job.flash_completed_at)

    def test_flash_job_create_requires_verified_backup(self):
        tuner_profile = TunerProfile.objects.create(
            user=self.other_user,
            business_name='Other Tunes',
            slug='other-tunes',
            tier=TunerProfile.Tier.TRUSTED,
        )
        listing = TuneListing.objects.create(
            tuner=tuner_profile,
            title='Stage 1',
            description='Test tune',
            vehicle_make='Yamaha',
            vehicle_model='R1',
            vehicle_year_start=2020,
            vehicle_year_end=2024,
            price='49.99',
        )
        version = TuneVersion.objects.create(
            listing=listing,
            version_number='1.0.0',
            status=TuneVersion.State.PUBLISHED,
            manifest_data={
                'bike_fitment': {
                    'make': 'Yamaha',
                    'model': 'R1',
                    'year_from': 2020,
                    'year_to': 2024,
                },
                'supported_ecu': {
                    'hw_ids': [],
                },
            },
        )
        PurchaseEntitlement.objects.create(
            user=self.user,
            listing=listing,
            transaction_id='tx-test',
            is_revoked=False,
        )
        backup = EcuBackup.objects.create(
            user=self.user,
            vehicle=self.vehicle,
            storage_key='backups/pending.bin',
            checksum='PENDING_VERIFICATION',
            file_size_kb=0,
        )

        res = self.client.post(
            reverse('flash_job_list_create'),
            {
                'vehicle': self.vehicle.id,
                'tune': listing.id,
                'version': str(version.id),
                'backup': backup.id,
                'connection_type': 'BLE',
                'device_id': 'dev-1',
            },
            format='json',
        )

        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Backup is not verified yet', str(res.data))

    def test_flash_job_create_rejects_vehicle_outside_version_fitment(self):
        tuner_profile = TunerProfile.objects.create(
            user=self.other_user,
            business_name='Other Tunes 2',
            slug='other-tunes-2',
            tier=TunerProfile.Tier.TRUSTED,
        )
        listing = TuneListing.objects.create(
            tuner=tuner_profile,
            title='Stage 2',
            description='Test tune',
            vehicle_make='Yamaha',
            vehicle_model='R1',
            vehicle_year_start=2020,
            vehicle_year_end=2024,
            price='0.00',
        )
        version = TuneVersion.objects.create(
            listing=listing,
            version_number='1.0.0',
            status=TuneVersion.State.PUBLISHED,
            manifest_data={
                'bike_fitment': {
                    'make': 'Yamaha',
                    'model': 'R1',
                    'year_from': 2023,
                    'year_to': 2024,
                },
                'supported_ecu': {
                    'hw_ids': [],
                },
            },
        )

        res = self.client.post(
            reverse('flash_job_list_create'),
            {
                'vehicle': self.vehicle.id,
                'tune': listing.id,
                'version': str(version.id),
                'connection_type': 'BLE',
                'device_id': 'dev-1',
            },
            format='json',
        )

        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('older than the tune version fitment range', str(res.data))
