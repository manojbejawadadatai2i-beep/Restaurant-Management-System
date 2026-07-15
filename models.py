from sqlalchemy import Column, Integer, Float, Date, DateTime
from app.connection import Base
class KPI(Base):
    __tablename__ = "daily_store_kpis"

    kpi_id = Column(Integer, primary_key=True)
    store_id = Column(Integer)
    kpi_date = Column(Date)

    total_revenue = Column(Float)
    total_orders = Column(Integer)
    average_order_value = Column(Float)

    customer_count = Column(Integer)
    cancelled_orders = Column(Integer)

    online_orders = Column(Integer)
    takeaway_orders = Column(Integer)
    dine_in_orders = Column(Integer)

    created_at = Column(DateTime)
    updated_at = Column(DateTime)