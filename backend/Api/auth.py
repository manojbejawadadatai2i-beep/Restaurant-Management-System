import bcrypt
import jwt
from datetime import datetime, timedelta, timezone
from typing import Optional, Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import HTMLResponse
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel, Field
from sqlalchemy import text
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

from database import engine
from config import get_settings
from schemas import AuthenticatedUser
from dependencies import get_current_user as get_current_user_original

router = APIRouter(tags=["auth"])

# ---------------- RBAC Role Constants ----------------
ROLE_NAMES = {
    1: "Corporate Admin",
    2: "Regional Manager",
    3: "District Manager",
    4: "Store Manager",
    5: "Employee",
}

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login", auto_error=False)

def create_access_token(data: dict):
    settings = get_settings()
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expire_minutes)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.jwt_secret, algorithm=settings.jwt_algorithm)

def get_decoded_claims(token: str = Depends(oauth2_scheme)) -> dict:
    if not token:
        # Fallback to check Authorization header manually just in case
        raise HTTPException(status_code=401, detail="Token is missing")
    settings = get_settings()
    try:
        return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

class LoginRequest(BaseModel):
    email: str
    password: str

class GoogleLoginRequest(BaseModel):
    id_token: str

@router.post("/login")
def login(request: LoginRequest):
    try:
        with engine.connect() as conn:
            # 1. Search users table using email
            result = conn.execute(
                text("SELECT * FROM users WHERE email = :email"),
                {"email": request.email}
            ).mappings().first()

            if result is None:
                raise HTTPException(status_code=401, detail="Invalid email or password")

            stored_hash = result["password_hash"]

            # Try bcrypt first, fallback to plaintext comparison if the DB has unhashed passwords
            try:
                is_valid = bcrypt.checkpw(request.password.encode('utf-8'), stored_hash.encode('utf-8'))
            except ValueError:
                is_valid = (request.password == stored_hash)
            except Exception:
                is_valid = False

            if not is_valid:
                raise HTTPException(status_code=401, detail="Invalid email or password")

            # Fetch role name from the database to map standard chatbot permissions
            role_result = conn.execute(
                text("SELECT role_name FROM roles WHERE id = :role_id"),
                {"role_id": result.get("role_id")}
            ).mappings().first()
            role_name = role_result["role_name"] if role_result else "Store Manager"

            # Map the database role to the chatbot standard role names
            mapped_role = "store manager"
            role_lower = role_name.lower().strip()
            if "corporate" in role_lower or "admin" in role_lower:
                mapped_role = "corporate admin"
            elif "region" in role_lower:
                mapped_role = "region manager"
            elif "district" in role_lower:
                mapped_role = "district manager"

            # Formulate token claims that satisfy BOTH chatbot services and standard requirements
            token_claims = {
                "user_id": f"emp_{result.get('id')}",
                "sub": f"emp_{result.get('id')}",
                "role": mapped_role,
                "corporate_id": result.get("corporate_id") or 1,
                "region_id": result.get("region_id"),
                "district_id": result.get("district_id"),
                "store_id": result.get("store_id"),
                "employee_id": result.get("employee_id"),
                "email": result.get("email"),
                "role_id": result.get("role_id")
            }
            
            access_token = create_access_token(token_claims)

            is_default_password = (stored_hash == "$2b$12$PLACEHOLDER_HASH" or request.password == "$2b$12$PLACEHOLDER_HASH")

            return {
                "message": "Login Successful",
                "access_token": access_token,
                "token_type": "Bearer",
                "user": {
                    "id": result.get("id"),
                    "user_id": f"emp_{result.get('id')}",
                    "username": result.get("full_name") or result.get("username"),
                    "email": result.get("email"),
                    "role": role_name,
                    "assigned_store_id": result.get("store_id"),
                    "assigned_district_id": result.get("district_id"),
                    "assigned_region_id": result.get("region_id"),
                    "requires_password_change": is_default_password,
                    "is_new_user": is_default_password
                }
            }

    except HTTPException:
        raise
    except Exception as e:
        print(f"INTERNAL ERROR: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.post("/login/google")
def login_google(request: GoogleLoginRequest):
    settings = get_settings()
    try:
        if not settings.google_client_id:
            raise HTTPException(status_code=500, detail="Google Client ID not configured")
            
        # Verify the Google id_token
        idinfo = id_token.verify_oauth2_token(
            request.id_token, google_requests.Request(), settings.google_client_id
        )

        email = idinfo.get("email")
        if not email:
            raise HTTPException(status_code=400, detail="Token does not contain an email")

        with engine.connect() as conn:
            # Check if user exists
            result = conn.execute(
                text("SELECT * FROM users WHERE email = :email"),
                {"email": email}
            ).mappings().first()

            if result is None:
                raise HTTPException(status_code=401, detail="User not found. Please register first.")

            # Fetch role name from the database
            role_result = conn.execute(
                text("SELECT role_name FROM roles WHERE id = :role_id"),
                {"role_id": result.get("role_id")}
            ).mappings().first()
            role_name = role_result["role_name"] if role_result else "Store Manager"

            # Map the database role to the chatbot standard role names
            mapped_role = "store manager"
            role_lower = role_name.lower().strip()
            if "corporate" in role_lower or "admin" in role_lower:
                mapped_role = "corporate admin"
            elif "region" in role_lower:
                mapped_role = "region manager"
            elif "district" in role_lower:
                mapped_role = "district manager"

            # Formulate token claims
            token_claims = {
                "user_id": f"emp_{result.get('id')}",
                "sub": f"emp_{result.get('id')}",
                "role": mapped_role,
                "corporate_id": result.get("corporate_id") or 1,
                "region_id": result.get("region_id"),
                "district_id": result.get("district_id"),
                "store_id": result.get("store_id"),
                "employee_id": result.get("employee_id"),
                "email": result.get("email"),
                "role_id": result.get("role_id")
            }
            
            access_token = create_access_token(token_claims)

            return {
                "message": "Google Login Successful",
                "access_token": access_token,
                "token_type": "Bearer",
                "user": {
                    "id": result.get("id"),
                    "user_id": f"emp_{result.get('id')}",
                    "username": result.get("full_name"),
                    "email": result.get("email"),
                    "role": role_name,
                    "assigned_store_id": result.get("store_id"),
                    "assigned_district_id": result.get("district_id"),
                    "assigned_region_id": result.get("region_id")
                }
            }

    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid Google Token")
    except HTTPException:
        raise
    except Exception as e:
        print(f"INTERNAL ERROR: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.get("/users/me")
def read_users_me(claims: dict = Depends(get_decoded_claims)):
    """
    Returns the decoded JWT payload along with the user's role name.
    """
    role_id = claims.get("role_id")
    return {
        "current_user": claims,
        "role_name": ROLE_NAMES.get(role_id, "Unknown")
    }

@router.get("/chat/me", response_model=AuthenticatedUser)
def get_me(current_user: AuthenticatedUser = Depends(get_current_user_original)):
    """Get the current authenticated user's metadata and scopes from the JWT."""
    return current_user
