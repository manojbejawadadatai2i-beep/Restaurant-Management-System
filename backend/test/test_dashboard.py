import unittest
import sys
from pathlib import Path

# Add backend directory to path
sys.path.append(str(Path(__file__).resolve().parent.parent))

from fastapi.testclient import TestClient
from main import app

class TestDashboardAPI(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        from database import SessionLocal
        import models
        self.db = SessionLocal()
        # Find active roles and corporate
        self.corp = self.db.query(models.Corporate).first()
        self.reg_role = self.db.query(models.Role).filter(models.Role.role_name == 'Regional Manager').first()
        self.dist_role = self.db.query(models.Role).filter(models.Role.role_name == 'District Manager').first()
        self.store_role = self.db.query(models.Role).filter(models.Role.role_name == 'Store Manager').first()
        
        from datetime import datetime
        now = datetime.utcnow()
        # Create Regional Manager for Region 1 (Andhra Pradesh)
        self.reg_user = models.User(
            employee_id="EMP-T01",
            full_name="Test Reg Manager",
            email="test_reg@restaurant.com",
            password_hash="...",
            role_id=self.reg_role.id,
            corporate_id=self.corp.id,
            region_id=1,
            is_active=True,
            created_at=now,
            updated_at=now
        )
        # Create District Manager for District 3 (Hyderabad)
        self.dist_user = models.User(
            employee_id="EMP-T02",
            full_name="Test Dist Manager",
            email="test_dist@restaurant.com",
            password_hash="...",
            role_id=self.dist_role.id,
            corporate_id=self.corp.id,
            district_id=3,
            is_active=True,
            created_at=now,
            updated_at=now
        )
        # Create Store Manager for Store 2
        self.store_user = models.User(
            employee_id="EMP-T03",
            full_name="Test Store Manager",
            email="test_store@restaurant.com",
            password_hash="...",
            role_id=self.store_role.id,
            corporate_id=self.corp.id,
            store_id=2,
            is_active=True,
            created_at=now,
            updated_at=now
        )
        self.db.add(self.reg_user)
        self.db.add(self.dist_user)
        self.db.add(self.store_user)
        self.db.commit()
        
        # Refresh to get IDs
        self.db.refresh(self.reg_user)
        self.db.refresh(self.dist_user)
        self.db.refresh(self.store_user)

    def tearDown(self):
        import models
        self.db.query(models.User).filter(models.User.full_name.like("Test % Manager")).delete(synchronize_session=False)
        self.db.commit()
        self.db.close()

    def test_get_dashboard_as_admin(self):
        # User ID 1 is Corporate Admin
        response = self.client.get("/api/dashboard?userId=1")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # Verify schema
        self.assertIn("role", data)
        self.assertIn("scopeName", data)
        self.assertIn("metrics", data)
        self.assertIn("scopeDirectory", data)
        self.assertIn("staff", data)
        self.assertIn("revenueTrend", data)
        self.assertIn("peakHours", data)
        self.assertIn("topSelling", data)
        self.assertIn("recentOrders", data)

        # Check metrics
        metrics = data["metrics"]
        self.assertGreater(metrics["totalRevenue"], 0)
        self.assertGreater(metrics["totalOrders"], 0)

        # Check trend points count
        self.assertEqual(len(data["revenueTrend"]), 5)

    def test_get_dashboard_with_filters(self):
        response = self.client.get("/api/dashboard?userId=1&filterRegionId=1&hourFilter=7-9")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertGreater(data["metrics"]["totalRevenue"], 0)

    def test_get_dashboard_uses_selected_date(self):
        response = self.client.get("/api/dashboard?userId=1&kpiDate=2026-07-11")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertGreater(data["metrics"]["totalRevenue"], 0)

        response_previous = self.client.get("/api/dashboard?userId=1&kpiDate=2026-07-10")
        self.assertEqual(response_previous.status_code, 200)
        previous_data = response_previous.json()

        self.assertNotEqual(data["metrics"]["totalRevenue"], previous_data["metrics"]["totalRevenue"])

    def test_dashboard_uses_raw_kpi_values(self):
        from sqlalchemy import text

        row = self.db.execute(text("SELECT total_revenue, total_orders FROM daily_store_kpis WHERE store_id = 1 AND kpi_date = '2026-07-11'"))
        db_row = row.mappings().first()
        self.assertIsNotNone(db_row)

        response = self.client.get("/api/dashboard?userId=1&filterStoreId=1&kpiDate=2026-07-11")
        self.assertEqual(response.status_code, 200)
        data = response.json()

        self.assertEqual(float(data["metrics"]["totalRevenue"]), float(db_row["total_revenue"]))
        self.assertEqual(int(data["metrics"]["totalOrders"]), int(db_row["total_orders"]))

    def test_get_dashboard_missing_user(self):
        response = self.client.get("/api/dashboard?userId=99999")
        self.assertEqual(response.status_code, 404)

    def test_scope_validation_regional_manager(self):
        # Store 1 is in Region 1 (Andhra Pradesh) -> Allowed
        response = self.client.get(f"/api/dashboard?userId={self.reg_user.id}&filterStoreId=1")
        self.assertEqual(response.status_code, 200)
        
        # Store 2 is in Region 2 (Telangana) -> Forbidden
        response = self.client.get(f"/api/dashboard?userId={self.reg_user.id}&filterStoreId=2")
        self.assertEqual(response.status_code, 403)
        self.assertIn("Requested store is out of your regional scope", response.json()["detail"])

    def test_scope_validation_district_manager(self):
        # Store 2 is in District 3 (Hyderabad District) -> Allowed
        response = self.client.get(f"/api/dashboard?userId={self.dist_user.id}&filterStoreId=2")
        self.assertEqual(response.status_code, 200)
        
        # Store 1 is in District 1 (Vijayawada District) -> Forbidden
        response = self.client.get(f"/api/dashboard?userId={self.dist_user.id}&filterStoreId=1")
        self.assertEqual(response.status_code, 403)
        self.assertIn("Requested store is out of your district scope", response.json()["detail"])

    def test_scope_validation_store_manager(self):
        # Store 2 is their store -> Allowed
        response = self.client.get(f"/api/dashboard?userId={self.store_user.id}&filterStoreId=2")
        self.assertEqual(response.status_code, 200)
        
        # Store 6 is another store -> Forbidden
        response = self.client.get(f"/api/dashboard?userId={self.store_user.id}&filterStoreId=6")
        self.assertEqual(response.status_code, 403)
        self.assertIn("Requested store is out of your scope", response.json()["detail"])

if __name__ == "__main__":
    unittest.main()
