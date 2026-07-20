from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from dependencies import get_db
from Services.meta_service import MetaService

router = APIRouter(prefix="/api/meta", tags=["metadata"])

@router.get("")
def get_meta(db: Session = Depends(get_db)):
    """Retrieve dropdown layout metadata for stores, districts, and regions."""
    return MetaService.get_meta_data(db)
