from fastapi import APIRouter

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.get("/")
async def reports_root():
    return {"message": "Reports endpoint"}
