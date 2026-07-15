from fastapi import FastAPI
from app.api import api_router

app = FastAPI(
    title="Restaurant Management System API",
    description="API backend for managing restaurant operations, dashboard metrics, reports, and stores.",
    version="1.0.0"
)

# Include all aggregated API endpoints under the /api prefix
app.include_router(api_router, prefix="/api")

@app.get("/")
async def root():
    return {
        "message": "Welcome to the Restaurant Management System API",
        "docs_url": "/docs",
        "redoc_url": "/redoc"
    }
