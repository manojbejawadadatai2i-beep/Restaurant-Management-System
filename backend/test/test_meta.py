import unittest
import sys
from pathlib import Path

# Add backend directory to path
sys.path.append(str(Path(__file__).resolve().parent.parent))

from fastapi.testclient import TestClient
from main import app

class TestMetaAPI(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_get_meta(self):
        response = self.client.get("/api/meta")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("regions", data)
        self.assertIn("districts", data)
        self.assertIn("stores", data)
        
        self.assertIsInstance(data["regions"], list)
        self.assertIsInstance(data["districts"], list)
        self.assertIsInstance(data["stores"], list)
        
        self.assertGreater(len(data["regions"]), 0)
        self.assertGreater(len(data["districts"]), 0)
        self.assertGreater(len(data["stores"]), 0)

if __name__ == "__main__":
    unittest.main()
