from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import text
from sqlalchemy.orm import Session
from app.dependencies import get_db
from app.services.llm_service import llm_service
from app.schemas import HealthResponse

router = APIRouter(prefix="/health", tags=["health"])

@router.get("", response_model=HealthResponse)
def get_health():
    """Verify chatbot API is up and running."""
    return {"status": "ok", "details": {"version": "1.0.0"}}

@router.get("/database", response_model=HealthResponse)
def get_database_health(db: Session = Depends(get_db)):
    """Check database health by running a simple query."""
    try:
        db.execute(text("SELECT 1"))
        return {"status": "ok", "details": {"connection": "healthy"}}
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Database is unreachable: {str(exc)}"
        )

@router.get("/llm", response_model=HealthResponse)
def get_llm_health():
    """Verify Groq LLM API connectivity and model status."""
    is_healthy = llm_service.test_connection()
    if is_healthy:
        return {"status": "ok", "details": {"llm_provider": "Groq", "status": "connected"}}
    else:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="LLM service is unreachable or returned an error."
        )
