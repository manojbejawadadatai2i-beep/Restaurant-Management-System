from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from dependencies import get_db
from Services.dashboard_service import DashboardService

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

@router.get("")
def get_dashboard(
    userId: int = Query(..., description="ID of the switched active user"),
    filterRegionId: Optional[int] = Query(None, description="Region filter ID"),
    filterDistrictId: Optional[int] = Query(None, description="District filter ID"),
    filterStoreId: Optional[int] = Query(None, description="Store filter ID"),
    hourFilter: Optional[str] = Query(None, description="Hour aggregation slot filter"),
    db: Session = Depends(get_db)
):
    """Retrieve full dashboard KPI, staff, peak hour, and order metrics scoped to user permissions."""
    try:
        return DashboardService.get_dashboard_data(
            db, userId, filterRegionId, filterDistrictId, filterStoreId, hourFilter
        )
    except HTTPException as exc:
        raise exc
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Failed to retrieve dashboard data")
