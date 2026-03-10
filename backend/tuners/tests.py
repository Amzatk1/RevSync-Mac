from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from tuners.models import TunerApplication, TunerProfile

User = get_user_model()


class TunerApplicationApiTests(APITestCase):
    def setUp(self):
        self.admin_user = User.objects.create_user(
            email='admin@example.com',
            username='admin_user',
            password='Passw0rd!',
            first_name='Admin',
            last_name='User',
            is_staff=True,
        )
        self.applicant = User.objects.create_user(
            email='tuner@example.com',
            username='tuner_user',
            password='Passw0rd!',
            first_name='Tune',
            last_name='Applicant',
        )

    def test_status_returns_404_when_user_has_no_application(self):
        self.client.force_authenticate(user=self.applicant)

        res = self.client.get(reverse('tuner-app-status'))

        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_admin_approval_sets_tuner_access_and_creates_unique_slug(self):
        TunerProfile.objects.create(
            user=self.admin_user,
            business_name='Existing Shop',
            slug='fast-tunes',
        )
        application = TunerApplication.objects.create(
            user=self.applicant,
            business_name='Fast Tunes',
            experience_summary='I calibrate ECUs.',
            website_url='https://example.com',
        )

        self.client.force_authenticate(user=self.admin_user)
        res = self.client.post(
            reverse('admin-tuner-action', kwargs={'pk': application.pk}),
            {'action': 'approve'},
            format='json',
        )

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['status'], 'approved')

        application.refresh_from_db()
        self.assertEqual(application.status, TunerApplication.Status.APPROVED)

        self.applicant.refresh_from_db()
        self.assertTrue(self.applicant.is_tuner)
        self.assertEqual(self.applicant.role, self.applicant.Role.TUNER)

        profile = TunerProfile.objects.get(user=self.applicant)
        self.assertEqual(profile.business_name, 'Fast Tunes')
        self.assertEqual(profile.slug, 'fast-tunes-2')
