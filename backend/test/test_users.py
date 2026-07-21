import unittest
import sys
from pathlib import Path

# Add backend directory to path
sys.path.append(str(Path(__file__).resolve().parent.parent))

from fastapi.testclient import TestClient
from main import app
from database import SessionLocal
from models import User

class TestUsersAPI(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        self.db = SessionLocal()

    def tearDown(self):
        self.db.close()

    def test_get_users(self):
        response = self.client.get("/api/users")
        self.assertEqual(response.status_code, 200)
        users = response.json()
        self.assertIsInstance(users, list)
        self.assertGreater(len(users), 0)
        # Check matching schema fields
        self.assertIn("username", users[0])
        self.assertIn("role", users[0])
        self.assertIn("token", users[0])

    def test_create_update_delete_user_flow(self):
        # 1. Create User
        payload = {
            "username": "Test User Name",
            "email": "test_unique_email@restaurant.com",
            "role": "Store Manager",
            "assigned_store_id": "1",
            "assigned_district_id": "1",
            "assigned_region_id": "1",
            "addNewStore": False
        }
        response = self.client.post("/api/users", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])
        self.assertEqual(data["username"], "Test User Name")
        self.assertEqual(data["email"], "test_unique_email@restaurant.com")
        self.assertEqual(data["role"], "Store Manager")
        self.assertIn("password", data)
        user_id = data["userId"]

        # Verify created in DB
        created_user = self.db.query(User).filter(User.id == user_id).first()
        self.assertIsNotNone(created_user)
        self.assertEqual(created_user.full_name, "Test User Name")

        # 2. Update User
        update_payload = {
            "role": "District Manager",
            "assigned_store_id": "",
            "assigned_district_id": "2",
            "assigned_region_id": "1"
        }
        response = self.client.put(f"/api/users/{user_id}", json=update_payload)
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()["success"])

        # Verify updated in DB
        self.db.refresh(created_user)
        self.assertEqual(created_user.district_id, 2)

        # 3. Delete User
        response = self.client.delete(f"/api/users/{user_id}")
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()["success"])

        # Verify deleted in DB
        deleted_user = self.db.query(User).filter(User.id == user_id).first()
        self.assertIsNone(deleted_user)

    def test_delete_corporate_admin_forbidden(self):
        # User ID 1 is seeded as Corporate Admin
        response = self.client.delete("/api/users/1")
        self.assertEqual(response.status_code, 403)

    def test_recreate_deleted_user_with_same_email(self):
        email = "recreate_email_test@restaurant.com"
        create_payload = {
            "username": "Recreate Test User",
            "email": email,
            "role": "Store Manager",
            "assigned_store_id": "1",
            "assigned_district_id": "1",
            "assigned_region_id": "1",
            "addNewStore": False
        }

        response = self.client.post("/api/users", json=create_payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])
        user_id = data["userId"]

        delete_response = self.client.delete(f"/api/users/{user_id}")
        self.assertEqual(delete_response.status_code, 200)

        recreate_response = self.client.post("/api/users", json=create_payload)
        self.assertEqual(recreate_response.status_code, 200)
        recreate_data = recreate_response.json()
        self.assertTrue(recreate_data["success"])
        self.assertEqual(recreate_data["email"], email)

if __name__ == "__main__":
    unittest.main()
