from fastapi import APIRouter
from .auth import router as auth_router
from .dashboard import router as dashboard_router
from .reports import router as reports_router
from .stores import router as stores_router
from .users import router as users_router

api_router = APIRouter()

# Include all the API sub-routers
api_router.include_router(auth_router)
api_router.include_router(dashboard_router)
api_router.include_router(reports_router)
api_router.include_router(stores_router)
api_router.include_router(users_router)
