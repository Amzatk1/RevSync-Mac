from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

User = get_user_model()


class UserPreferencesApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='prefs@example.com',
            username='prefs_user',
            password='Passw0rd!',
            first_name='Prefs',
            last_name='Tester',
            role='RIDER',
        )
        self.client.force_authenticate(user=self.user)
        self.url = reverse('user_preferences')

    def test_create_update_and_list_preferences(self):
        create_res = self.client.post(
            self.url,
            {'key': 'notifications_recommendations', 'value': True},
            format='json',
        )
        self.assertEqual(create_res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(create_res.data['key'], 'notifications_recommendations')
        self.assertTrue(create_res.data['value'])

        update_res = self.client.post(
            self.url,
            {'key': 'notifications_recommendations', 'value': False},
            format='json',
        )
        self.assertEqual(update_res.status_code, status.HTTP_201_CREATED)
        self.assertFalse(update_res.data['value'])

        list_res = self.client.get(self.url)
        self.assertEqual(list_res.status_code, status.HTTP_200_OK)
        self.assertIn('results', list_res.data)
        self.assertEqual(len(list_res.data['results']), 1)
        self.assertEqual(list_res.data['results'][0]['key'], 'notifications_recommendations')
        self.assertFalse(list_res.data['results'][0]['value'])

    def test_unknown_preference_key_is_rejected(self):
        res = self.client.post(
            self.url,
            {'key': 'unknown_preference_key', 'value': True},
            format='json',
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('key', res.data)

    def test_invalid_preference_type_is_rejected(self):
        res = self.client.post(
            self.url,
            {'key': 'notifications_flash_updates', 'value': 'yes'},
            format='json',
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('value', res.data)
