import sys
from pathlib import Path

# Add backend directory to sys.path so we can import the central database.py
sys.path.append(str(Path(__file__).resolve().parent.parent))

from sqlalchemy import text
from database import engine

def check_database():
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        print("[SUCCESS] Database connection successful")
    except Exception as e:
        print("[ERROR] Database connection failed")
        print(e)

if __name__ == "__main__":
    check_database()
