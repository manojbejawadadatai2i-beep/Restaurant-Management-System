from fastapi import APIRouter

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.get("/")
async def auth_root():
    return {"message": "Auth endpoint"}

@router.post("/api/login")
async def login():
    return {"message": "Login endpoint"}
    
