from fastapi import APIRouter

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/")
async def dashboard_root():
    return {"message": "Dashboard endpoint"}
