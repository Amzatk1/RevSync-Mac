from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase


class AuthFlowTests(APITestCase):
    def setUp(self):
        self.register_payload = {
            "username": "web_auth_test",
            "email": "web_auth_test@example.com",
            "password": "Passw0rd!",
            "first_name": "Web",
            "last_name": "Auth",
            "role": "RIDER",
        }

    def _register(self):
        return self.client.post(reverse("register"), self.register_payload, format="json")

    def _login(self, password: str | None = None):
        return self.client.post(
            reverse("token_obtain_pair"),
            {
                "email": self.register_payload["email"],
                "password": password or self.register_payload["password"],
            },
            format="json",
        )

    def test_register_login_refresh_and_me(self):
        register_res = self._register()
        self.assertEqual(register_res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(register_res.data["email"], self.register_payload["email"])

        login_res = self._login()
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
        self.assertEqual(me_res.data["email"], self.register_payload["email"])

    def test_login_with_invalid_credentials_returns_401(self):
        self._register()
        login_res = self._login(password="wrong-password")
        self.assertEqual(login_res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_refresh_without_token_returns_400(self):
        refresh_res = self.client.post(reverse("token_refresh"), {}, format="json")
        self.assertEqual(refresh_res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_refresh_with_invalid_token_returns_401(self):
        refresh_res = self.client.post(
            reverse("token_refresh"),
            {"refresh": "not-a-valid-jwt"},
            format="json",
        )
        self.assertEqual(refresh_res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_refresh_rotation_path_returns_new_refresh_token(self):
        self._register()
        login_res = self._login()
        self.assertEqual(login_res.status_code, status.HTTP_200_OK)
        old_refresh = login_res.data["refresh"]

        refresh_res = self.client.post(
            reverse("token_refresh"),
            {"refresh": old_refresh},
            format="json",
        )
        self.assertEqual(refresh_res.status_code, status.HTTP_200_OK)
        self.assertIn("access", refresh_res.data)
        self.assertIn("refresh", refresh_res.data)
        self.assertNotEqual(refresh_res.data["refresh"], old_refresh)
