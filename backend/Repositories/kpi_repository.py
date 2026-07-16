import sys
from pathlib import Path
from datetime import date
from sqlalchemy.orm import Session

# Add parent directory to sys.path so we can import models from backend root
sys.path.append(str(Path(__file__).resolve().parent.parent))

from models import KPI

class KPIRepository:
    @staticmethod
    def get_kpis_by_date(db: Session, kpi_date: date):
        """
        Retrieves all KPI records matching a specific date from the daily_store_kpis table.
        """
        return db.query(KPI).filter(KPI.kpi_date == kpi_date).all()
