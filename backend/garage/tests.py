from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from garage.models import EcuBackup, Vehicle

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
