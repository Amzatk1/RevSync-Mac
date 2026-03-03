from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase


class HealthCheckTests(APITestCase):
    def test_health_endpoint_reports_ok(self):
        res = self.client.get(reverse('health_check'))
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['status'], 'ok')
        self.assertEqual(res.data['service'], 'revsync-backend')
        self.assertIn('checks', res.data)
        self.assertEqual(res.data['checks']['database'], 'ok')
