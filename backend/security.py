"""Authentication and role enforcement module."""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
import jwt

from config import get_settings
from schemas import AuthenticatedUser
from Services.rbac_service import RBACService, ROLE_NAMES

security_scheme = HTTPBearer(auto_error=False)

def get_current_user(credentials: HTTPAuthorizationCredentials | None = Depends(security_scheme)) -> AuthenticatedUser:
    """Validate bearer JWT token or session token and return user scopes and roles."""
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Authentication token is missing. Please provide authorization header."
        )
    settings = get_settings()
    token_str = credentials.credentials
    
    # Try decoding standard JWT token
    try:
        claims = jwt.decode(token_str, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        user = AuthenticatedUser.from_claims(claims)
        if not user.user_id or user.role.strip().lower() not in ROLE_NAMES:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, 
                detail="User role is not authorized for decision support access"
            )
        return user
    except jwt.PyJWTError:
        # Fallback for session token string like token_emp_1_17200000 or google_token_1_17200000
        if token_str.startswith("token_emp_") or token_str.startswith("google_token_"):
            try:
                parts = token_str.split("_")
                user_id_int = int(parts[2])
                from database import engine
                from sqlalchemy import text
                with engine.connect() as conn:
                    row = conn.execute(
                        text("SELECT id, username, role, assigned_store_id, assigned_district_id, assigned_region_id FROM users WHERE id = :id"),
                        {"id": user_id_int}
                    ).mappings().first()
                    if row:
                        return AuthenticatedUser(
                            user_id=f"emp_{row['id']}",
                            role=row['role'],
                            assigned_store_id=row['assigned_store_id'],
                            assigned_district_id=row['assigned_district_id'],
                            assigned_region_id=row['assigned_region_id']
                        )
            except Exception:
                pass

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Invalid or expired authentication token. Please log in again."
        )


def scope_for_user(user: AuthenticatedUser) -> tuple[str | None, dict[str, int]]:
    """Legacy compatibility wrapper for getting user data scope constraint."""
    return RBACService.get_scope_for_user(user)


def validate_read_only_sql(sql: str, scope_column: str | None) -> str:
    """Legacy compatibility wrapper for validating safe read-only SQL queries."""
    return RBACService.validate_read_only_sql(sql, scope_column)
