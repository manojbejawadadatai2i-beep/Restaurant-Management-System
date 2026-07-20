import unittest
import sys
from pathlib import Path

# Add backend directory to path
sys.path.append(str(Path(__file__).resolve().parent.parent))

from fastapi.testclient import TestClient
from main import app

class TestReportsAPI(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_sales_by_store(self):
        response = self.client.get("/api/reports/sales-by-store?userId=1")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIsInstance(data, list)
        self.assertGreater(len(data), 0)
        self.assertIn("store_name", data[0])
        self.assertIn("total_revenue", data[0])

    def test_sales_by_category(self):
        response = self.client.get("/api/reports/sales-by-category?userId=1")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIsInstance(data, list)
        self.assertGreater(len(data), 0)
        self.assertIn("category", data[0])
        self.assertIn("total_revenue", data[0])

    def test_orders_list(self):
        response = self.client.get("/api/reports/orders?userId=1")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIsInstance(data, list)
        self.assertGreater(len(data), 0)
        self.assertIn("customer_name", data[0])
        self.assertIn("total_amount", data[0])

if __name__ == "__main__":
    unittest.main()
