from fastapi import APIRouter

router = APIRouter(prefix="/stores", tags=["Stores"])

@router.get("/")
async def stores_root():
    return {"message": "Stores endpoint"}
