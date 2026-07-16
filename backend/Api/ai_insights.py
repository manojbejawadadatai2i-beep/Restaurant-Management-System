import sys
from pathlib import Path
from datetime import date
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

# Add parent directory to sys.path so we can import from backend root
sys.path.append(str(Path(__file__).resolve().parent.parent))

from database import get_db
from Services.insight_service import InsightService

router = APIRouter()

class ReportRequest(BaseModel):
    kpi_date: date

@router.post("/generate-insights")
def generate_report(request: ReportRequest, db: Session = Depends(get_db)):
    """
    POST endpoint to generate Business Intelligence insights for a given date.
    Fetches daily KPIs from the DB, builds a context prompt, sends it to Groq LLM,
    and returns structured business insights.
    """
    try:
        service = InsightService()
        insights = service.generate_business_insights(db, request.kpi_date)
        return {
            "status": "success",
            "report": insights
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
