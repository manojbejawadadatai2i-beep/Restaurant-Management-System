from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from Services.llm_service import llm_service

router = APIRouter(prefix="", tags=["Insights"])

class InsightsRequest(BaseModel):
    total_revenue: Optional[float] = 0
    total_orders: Optional[int] = 0
    average_order_value: Optional[float] = 0
    customer_count: Optional[int] = 0
    cancelled_orders: Optional[int] = 0
    total_expenses: Optional[float] = 0
    scope_name: Optional[str] = "All Operations"

@router.post("/generate-insights")
@router.post("/api/generate-insights")
def generate_insights(request: InsightsRequest):
    try:
        metrics_dict = request.model_dump()
        insights_data = llm_service.generate_insights(metrics_dict)
        return {
            "status": "success",
            "insights": insights_data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate AI insights: {str(e)}")
