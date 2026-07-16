"""Authentication and role enforcement module."""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
import jwt

from config import get_settings
from schemas import AuthenticatedUser
from Services.rbac_service import RBACService, ROLE_NAMES

security_scheme = HTTPBearer(auto_error=False)

def get_current_user(credentials: HTTPAuthorizationCredentials | None = Depends(security_scheme)) -> AuthenticatedUser:
    """Validate bearer JWT token and return user scopes and roles."""
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Authentication token is missing. Please provide authorization header."
        )
    settings = get_settings()
    try:
        claims = jwt.decode(credentials.credentials, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except jwt.PyJWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Invalid or expired authentication token. Please log in again."
        ) from exc
    
    user = AuthenticatedUser.from_claims(claims)
    if not user.user_id or user.role.strip().lower() not in ROLE_NAMES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="User role is not authorized for decision support access"
        )
    return user


def scope_for_user(user: AuthenticatedUser) -> tuple[str | None, dict[str, int]]:
    """Legacy compatibility wrapper for getting user data scope constraint."""
    return RBACService.get_scope_for_user(user)


def validate_read_only_sql(sql: str, scope_column: str | None) -> str:
    """Legacy compatibility wrapper for validating safe read-only SQL queries."""
    return RBACService.validate_read_only_sql(sql, scope_column)
