from pydantic import BaseModel
from datetime import date


class ReportRequest(BaseModel):
    kpi_date: date