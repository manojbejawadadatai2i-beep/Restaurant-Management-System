from sqlalchemy.orm import Session
from app.connection import SessionLocal
from app.models import KPI
from app.prompt import build_prompt
from app.llm import generate_insights


def generate_business_insights(kpi_date):

    db: Session = SessionLocal()

    try:
        kpi_records = db.query(KPI).filter(
            KPI.kpi_date == kpi_date
        ).all()

        if not kpi_records:
            return {
                "message": f"No KPI data found for {kpi_date}"
            }

        kpi_text = ""

        for row in kpi_records:
            kpi_text += f"""
Store ID: {row.store_id}
KPI ID: {row.kpi_id}
Report Date: {row.kpi_date}

Total Revenue: ₹{row.total_revenue}
Total Orders: {row.total_orders}
Average Order Value: ₹{row.average_order_value}
Customer Count: {row.customer_count}
Cancelled Orders: {row.cancelled_orders}
Online Orders: {row.online_orders}
Takeaway Orders: {row.takeaway_orders}
Dine-in Orders: {row.dine_in_orders}

---------------------------------------
"""

        prompt = build_prompt(kpi_text)

        insights = generate_insights(prompt)

        return insights

    finally:
        db.close()