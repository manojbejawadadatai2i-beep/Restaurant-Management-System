from fastapi import APIRouter

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/")
async def users_root():
    return {"message": "Users endpoint"}
