from fastapi import APIRouter
from app.schemas import ReportRequest
from app.service import generate_business_insights

router = APIRouter()


@router.get("/health")
def health_check():
    return {
        "status": "success",
        "message": "AI Agent is running successfully."
    }


@router.post("/generate-insights")
def generate_report(request: ReportRequest):

    insights = generate_business_insights(request.kpi_date)

    return {
        "status": "success",
        "report": insights
    }