from fastapi import FastAPI
from app.routes import router

app = FastAPI(
    title="AI Agent Service",
    description="AI Agent for generating business insights using Gemini",
    version="1.0.0"
)

app.include_router(router)


@app.get("/")
def root():
    return {
        "message": "AI Agent Service is running successfully!"
    }