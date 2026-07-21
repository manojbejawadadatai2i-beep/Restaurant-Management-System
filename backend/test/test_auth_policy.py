import sys
import unittest
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parent.parent))

from fastapi.testclient import TestClient
from main import app


class TestAuthPolicy(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_seeded_admin_can_login_with_password(self):
        response = self.client.post(
            "/login",
            json={"email": "corporate_admin@restaurant.com", "password": "corp@123"},
        )
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertIn("access_token", payload)
        self.assertEqual(payload["user"]["email"], "corporate_admin@restaurant.com")


if __name__ == "__main__":
    unittest.main()
