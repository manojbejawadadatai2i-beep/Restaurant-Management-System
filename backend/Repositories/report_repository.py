from sqlalchemy.orm import Session
from sqlalchemy import text
import logging

logger = logging.getLogger(__name__)

class ReportRepository:
    @staticmethod
    def get_sales_by_store(db: Session, is_filtered: bool, store_ids: list[int], latest_date: str):
        sql = """
            SELECT s.id, s.store_name as store_name, d.district_name as district_name, r.region_name as region_name,
                   COALESCE(k.total_orders, 0) as total_orders,
                   COALESCE(k.total_revenue, 0) as total_revenue,
                   COALESCE(k.average_order_value, 0) as avg_order_value
            FROM stores s
            LEFT JOIN districts d ON s.district_id = d.id
            LEFT JOIN regions r ON d.region_id = r.id
            LEFT JOIN daily_store_kpis k ON s.id = k.store_id AND k.kpi_date = :latest_date
        """
        params = {"latest_date": latest_date}
        if is_filtered and store_ids:
            # PostgreSQL ANY operator with a list parameter requires passing it as a list
            sql += " WHERE s.id = ANY(:store_ids)"
            params["store_ids"] = store_ids
            
        sql += " ORDER BY total_revenue DESC"
        
        result = db.execute(text(sql), params).mappings().all()
        # Convert numeric fields to float/int
        rows = []
        for row in result:
            r_dict = dict(row)
            r_dict["total_revenue"] = float(r_dict["total_revenue"] or 0)
            r_dict["avg_order_value"] = float(r_dict["avg_order_value"] or 0)
            r_dict["total_orders"] = int(r_dict["total_orders"] or 0)
            rows.append(r_dict)
        return rows

    @staticmethod
    def get_sales_by_category(db: Session, is_filtered: bool, store_ids: list[int], latest_date: str):
        # We calculate the total revenue within the resolved scope for the latest date
        if is_filtered and store_ids:
            sql = text("SELECT SUM(total_revenue) FROM daily_store_kpis WHERE store_id = ANY(:store_ids) AND kpi_date = :latest_date")
            total_revenue = db.execute(sql, {"store_ids": store_ids, "latest_date": latest_date}).scalar()
        else:
            sql = text("SELECT SUM(total_revenue) FROM region_kpis WHERE kpi_date = :latest_date")
            total_revenue = db.execute(sql, {"latest_date": latest_date}).scalar()

        total = float(total_revenue or 0)

        # Distribute based on the business rules
        categories = [
            { "category": "Mains", "items_sold": int(round(total * 0.0008)), "total_revenue": float(round(total * 0.55, 2)) },
            { "category": "Appetizers", "items_sold": int(round(total * 0.001)), "total_revenue": float(round(total * 0.20, 2)) },
            { "category": "Desserts", "items_sold": int(round(total * 0.0006)), "total_revenue": float(round(total * 0.12, 2)) },
            { "category": "Soups", "items_sold": int(round(total * 0.0005)), "total_revenue": float(round(total * 0.08, 2)) },
            { "category": "Beverages", "items_sold": int(round(total * 0.0004)), "total_revenue": float(round(total * 0.05, 2)) }
        ]
        return categories

    @staticmethod
    def get_orders_list(db: Session, is_filtered: bool, store_ids: list[int]):
        sql = """
            SELECT o.id, s.store_name as store_name, o.customer_name, o.total_amount, o.status, o.created_at,
                   (
                     SELECT string_agg(mi.name || ' (x' || oi.quantity || ')', ', ')
                     FROM order_items oi
                     JOIN menu_items mi ON oi.menu_item_id = mi.id
                     WHERE oi.order_id = o.id
                   ) as items_list
            FROM orders o
            JOIN stores s ON o.store_id = s.id
        """
        params = {}
        if is_filtered and store_ids:
            sql += " WHERE o.store_id = ANY(:store_ids)"
            params["store_ids"] = store_ids
            
        sql += " ORDER BY o.created_at DESC"
        
        result = db.execute(text(sql), params).mappings().all()
        rows = []
        for row in result:
            r_dict = dict(row)
            r_dict["total_amount"] = float(r_dict["total_amount"] or 0)
            r_dict["created_at"] = r_dict["created_at"].isoformat()
            rows.append(r_dict)
        return rows
