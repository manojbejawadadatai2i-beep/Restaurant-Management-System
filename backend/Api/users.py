from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel, Field
from dependencies import get_db
from Services.user_service import UserService

router = APIRouter(prefix="/api/users", tags=["users"])

class UserCreate(BaseModel):
    username: str
    email: Optional[str] = None
    password: Optional[str] = None
    role: str
    assigned_store_id: Optional[str] = None
    assigned_district_id: Optional[str] = None
    assigned_region_id: Optional[str] = None
    addNewStore: Optional[bool] = False
    newStoreName: Optional[str] = None
    newStoreId: Optional[str] = None

class UserUpdate(BaseModel):
    role: str
    assigned_store_id: Optional[str] = None
    assigned_district_id: Optional[str] = None
    assigned_region_id: Optional[str] = None

@router.get("")
def get_users(db: Session = Depends(get_db)):
    """Retrieve all users with metadata and mock JWT tokens."""
    return UserService.get_users_list(db)

@router.post("")
def create_user(request: UserCreate, db: Session = Depends(get_db)):
    """Create a new user with store assignment option."""
    try:
        user_dict = request.model_dump()
        created = UserService.create_user(db, user_dict)
        return {
            "success": True,
            "message": "User added successfully",
            "userId": created.id
        }
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Failed to add user")

@router.put("/{id}")
def update_user(id: int, request: UserUpdate, db: Session = Depends(get_db)):
    """Update a user's role and scopes."""
    try:
        user_dict = request.model_dump()
        UserService.update_user(db, id, user_dict)
        return {
            "success": True,
            "message": "User updated successfully"
        }
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Failed to update user")

@router.delete("/{id}")
def delete_user(id: int, db: Session = Depends(get_db)):
    """Delete a user."""
    try:
        UserService.delete_user(db, id)
        return {
            "success": True,
            "message": "User deleted successfully"
        }
    except ValueError as exc:
        # Check specific forbidden case (Corporate Admin)
        if "Corporate Administrator" in str(exc):
            raise HTTPException(status_code=403, detail=str(exc))
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Failed to delete user")
