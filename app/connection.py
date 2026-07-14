# pyrefly: ignore [missing-import]
from sqlalchemy import create_engine, text

DATABASE_URL = "postgresql://postgres:yourpassword@localhost:5432/restaurant_dashboard"
engine = create_engine(DATABASE_URL)

# Print table columns for debugging
try:
    with engine.connect() as conn:
        print("Connected to:", DATABASE_URL.split("/")[-1])
        cols = conn.execute(text(
            "SELECT column_name FROM information_schema.columns WHERE table_name = 'users' ORDER BY ordinal_position"
        )).fetchall()
        print("Users table columns:")
        for c in cols:
            print(f"  - {c[0]}")
except Exception as e:
    print(f"Connection error: {e}")
