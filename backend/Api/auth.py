from fastapi import APIRouter, Depends
from dependencies import get_current_user
from schemas import AuthenticatedUser

router = APIRouter(tags=["auth"])

@router.get("/chat/me", response_model=AuthenticatedUser)
def get_me(current_user: AuthenticatedUser = Depends(get_current_user)):
    """Get the current authenticated user's metadata and scopes from the JWT."""
    return current_user
