from pathlib import Path
import os

from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(env_path)

DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

if __name__ == "__main__":
    try:
        with engine.connect() as conn:
            version = conn.execute(text("SELECT version();")).scalar()
        # print(f"DATABASE URL = {DATABASE_URL}")
        print("✅ Database connected successfully!")
        print(version)

    except Exception as e:
        print("❌ Database connection failed")
        print(e)