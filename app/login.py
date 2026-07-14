# pyrefly: ignore [missing-import]
from fastapi import FastAPI, HTTPException
# pyrefly: ignore [missing-import]
from pydantic import BaseModel
# pyrefly: ignore [missing-import]
from sqlalchemy import text
# pyrefly: ignore [missing-import]
import bcrypt
# pyrefly: ignore [missing-import]
import jwt
from datetime import datetime, timedelta, timezone

from app.connection import engine

app = FastAPI()

# In a real app, load this from .env (e.g., os.getenv("SECRET_KEY"))
SECRET_KEY = "your-super-secret-key-for-jwt-signing"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

class LoginRequest(BaseModel):
    email: str
    password: str

@app.post("/login")
def login(user: LoginRequest):
    try:
        with engine.connect() as conn:
            # 1. Search users table using email
            result = conn.execute(
                text("SELECT * FROM users WHERE email = :email"),
                {"email": user.email}
            ).mappings().first()

            # 2. If email does not exist, return 401
            if result is None:
                raise HTTPException(
                    status_code=401,
                    detail="Invalid email or password"
                )

            # 3. Retrieve stored bcrypt hash
            stored_hash = result["password_hash"]

            # 4 & 5. Compare plain-text password with stored hash
            try:
                is_valid = bcrypt.checkpw(
                    user.password.encode('utf-8'),
                    stored_hash.encode('utf-8')
                )
            except Exception:
                is_valid = False

            if not is_valid:
                raise HTTPException(
                    status_code=401,
                    detail="Invalid email or password"
                )

            # 6. Generate JWT Access Token
            expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
            
            # Claims included in the token
            token_claims = {
                "user_id": result.get("id"),
                "employee_id": result.get("employee_id"),
                "email": result.get("email"),
                "role_id": result.get("role_id"),
                "exp": expire
            }
            
            # Create the JWT
            access_token = jwt.encode(token_claims, SECRET_KEY, algorithm=ALGORITHM)

            # 7. Return successful response
            return {
                "message": "Login Successful",
                "access_token": access_token,
                "token_type": "Bearer",
                "user": {
                    "user_id": result.get("id"),
                    "employee_id": result.get("employee_id"),
                    "full_name": result.get("full_name"),
                    "email": result.get("email"),
                    "role_id": result.get("role_id")
                }
            }

    except HTTPException:
        raise
    except Exception as e:
        print(f"INTERNAL ERROR: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")