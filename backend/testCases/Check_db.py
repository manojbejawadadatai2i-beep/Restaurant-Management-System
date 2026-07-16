from sqlalchemy import text
from test.database import engine

def check_database():
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        print("✅ Database connection successful")
    except Exception as e:
        print("❌ Database connection failed")
        print(e)

if __name__ == "__main__":
    check_database()




