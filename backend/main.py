import uvicorn
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from Api.chat import router as chat_router
from Api.auth import router as auth_router
from Api.health import router as health_router
from Api.users import router as users_router
from Api.meta import router as meta_router
from Api.dashboard import router as dashboard_router
from Api.reports import router as reports_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s"
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Ocean View AI Chatbot Service",
    description="Backend API for the Ocean View Decision Support Chatbot.",
    version="1.0.0"
)

# Enable CORS for frontend integration (React Dashboard)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production as needed
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(chat_router)
app.include_router(auth_router)
app.include_router(health_router)
app.include_router(users_router)
app.include_router(meta_router)
app.include_router(dashboard_router)
app.include_router(reports_router)

@app.get("/")
def read_root():
    return {
        "message": "Welcome to the Ocean View Decision Support Chatbot API",
        "health_check": "/health"
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
