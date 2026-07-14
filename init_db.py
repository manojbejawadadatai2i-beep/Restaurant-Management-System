# pyrefly: ignore [missing-import]
import bcrypt
from app.connection import engine
# pyrefly: ignore [missing-import]
from sqlalchemy import text

def init_db():
    with engine.connect() as conn:
        # Create users table if it doesn't exist
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS users (
                employee_id VARCHAR(50) PRIMARY KEY,
                password_hash VARCHAR(255) NOT NULL,
                "fullName" VARCHAR(100),
                role_id VARCHAR(50)
            )
        """))
        
        # Check if the admin user exists
        result = conn.execute(text("SELECT * FROM users WHERE employee_id = 'admin'")).first()
        
        if not result:
            # Hash password "admin123"
            password = "admin123"
            hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
            
            # Insert the user
            conn.execute(
                text("""
                    INSERT INTO users (employee_id, password_hash, "fullName", role_id)
                    VALUES (:employee_id, :password_hash, :fullName, :role_id)
                """),
                {
                    "employee_id": "admin",
                    "password_hash": hashed,
                    "fullName": "System Administrator",
                    "role_id": "admin"
                }
            )
            print("Admin user created successfully.")
        else:
            print("Admin user already exists.")
            
        conn.commit()

if __name__ == "__main__":
    init_db()
    print("Database initialization complete.")
