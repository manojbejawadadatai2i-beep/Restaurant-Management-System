import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import chat, auth, health

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s"
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Restaurant Decision Support Chatbot Service",
    description="Backend API for the Restaurant DSS Chatbot Module.",
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
app.include_router(chat.router)
app.include_router(auth.router)
app.include_router(health.router)

@app.get("/")
def read_root():
    return {
        "message": "Welcome to the Restaurant Decision Support Chatbot API",
        "health_check": "/health"
    }
