import uvicorn
from fastapi import FastAPI
from Api.ai_insights import router as insights_router

app = FastAPI(
    title="AI Agent Service",
    description="AI Agent for generating business insights using Groq Llama-3.3",
    version="1.0.0"
)

# Register router
app.include_router(insights_router)

@app.get("/")
def root():
    return {
        "message": "AI Agent Service is running successfully!"
    }

@app.get("/health")
def health_check():
    return {
        "status": "success",
        "message": "AI Agent is running successfully."
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
