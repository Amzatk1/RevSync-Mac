from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase


class AuthFlowTests(APITestCase):
    def test_register_login_refresh_and_me(self):
        register_payload = {
            "username": "web_auth_test",
            "email": "web_auth_test@example.com",
            "password": "Passw0rd!",
            "first_name": "Web",
            "last_name": "Auth",
            "role": "RIDER",
        }

        register_res = self.client.post(reverse("register"), register_payload, format="json")
        self.assertEqual(register_res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(register_res.data["email"], register_payload["email"])

        login_res = self.client.post(
            reverse("token_obtain_pair"),
            {"email": register_payload["email"], "password": register_payload["password"]},
            format="json",
        )
        self.assertEqual(login_res.status_code, status.HTTP_200_OK)
        self.assertIn("access", login_res.data)
        self.assertIn("refresh", login_res.data)

        refresh_res = self.client.post(
            reverse("token_refresh"),
            {"refresh": login_res.data["refresh"]},
            format="json",
        )
        self.assertEqual(refresh_res.status_code, status.HTTP_200_OK)
        self.assertIn("access", refresh_res.data)

        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {login_res.data['access']}")
        me_res = self.client.get(reverse("user_me"))
        self.assertEqual(me_res.status_code, status.HTTP_200_OK)
        self.assertEqual(me_res.data["email"], register_payload["email"])
