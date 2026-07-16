import uvicorn
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from Api.ai_insights import router as insights_router
from Api.chat import router as chat_router
from Api.auth import router as auth_router
from Api.health import router as health_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s"
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Restaurant Decision Support Chatbot Service",
    description="Backend API for the Restaurant DSS Chatbot & AI Insights Module.",
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
app.include_router(insights_router)
app.include_router(chat_router)
app.include_router(auth_router)
app.include_router(health_router)

@app.get("/")
def read_root():
    return {
        "message": "Welcome to the Restaurant Decision Support Chatbot API",
        "health_check": "/health"
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
