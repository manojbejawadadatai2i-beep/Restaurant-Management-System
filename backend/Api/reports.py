from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from dependencies import get_db
from Services.report_service import ReportService

router = APIRouter(prefix="/api/reports", tags=["reports"])

@router.get("/sales-by-store")
def get_sales_by_store(
    userId: int = Query(..., description="ID of the switched active user"),
    db: Session = Depends(get_db)
):
    """Retrieve detailed store sales reports scoped by active user."""
    try:
        return ReportService.get_sales_by_store(db, userId)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Failed to retrieve store sales report")

@router.get("/sales-by-category")
def get_sales_by_category(
    userId: int = Query(..., description="ID of the switched active user"),
    db: Session = Depends(get_db)
):
    """Retrieve category-level revenue share reports scoped by active user."""
    try:
        return ReportService.get_sales_by_category(db, userId)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Failed to retrieve category sales report")

@router.get("/orders")
def get_orders_list(
    userId: int = Query(..., description="ID of the switched active user"),
    db: Session = Depends(get_db)
):
    """Retrieve detailed orders listing scoped by active user."""
    try:
        return ReportService.get_orders_list(db, userId)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Failed to retrieve orders list report")
