import logging
from sqlalchemy.orm import Session
from sqlalchemy import text
from models import User, Store, District, Region, KPI, DistrictKPI, RegionKPI, CorporateKPI, Order, MenuItem, OrderItem

logger = logging.getLogger(__name__)

class DashboardRepository:
    @staticmethod
    def get_latest_kpi_date(db: Session) -> str:
        # Check daily store kpis for latest date
        result = db.execute(text("SELECT MAX(kpi_date) FROM daily_store_kpis")).scalar()
        if result:
            return str(result)
        return "2026-07-10"

    @staticmethod
    def get_metrics_and_trends(db: Session, scope_type: str, scope_id: int | None, latest_date: str):
        total_revenue = 0.0
        total_orders = 0
        customer_count = 0
        cancelled_orders = 0
        average_order_value = 0.0

        if scope_type == 'store' and scope_id is not None:
            # Query daily_store_kpis
            sql = text("SELECT * FROM daily_store_kpis WHERE store_id = :scope_id AND kpi_date = :kpi_date")
            row = db.execute(sql, {"scope_id": scope_id, "kpi_date": latest_date}).mappings().first()
            if row:
                total_revenue = float(row["total_revenue"] or 0)
                total_orders = int(row["total_orders"] or 0)
                customer_count = int(row["customer_count"] or 0)
                cancelled_orders = int(row["cancelled_orders"] or 0)
                average_order_value = float(row["average_order_value"] or 0)
        elif scope_type == 'district' and scope_id is not None:
            # Query district_kpis
            sql = text("SELECT * FROM district_kpis WHERE district_id = :scope_id AND kpi_date = :kpi_date")
            row = db.execute(sql, {"scope_id": scope_id, "kpi_date": latest_date}).mappings().first()
            if row:
                total_revenue = float(row["total_revenue"] or 0)
                total_orders = int(row["total_orders"] or 0)
                customer_count = int(row["customer_count"] or 0)
                cancelled_orders = int(row["cancelled_orders"] or 0)
                average_order_value = float(row["average_order_value"] or 0)
        elif scope_type == 'region' and scope_id is not None:
            # Query region_kpis
            sql = text("SELECT * FROM region_kpis WHERE region_id = :scope_id AND kpi_date = :kpi_date")
            row = db.execute(sql, {"scope_id": scope_id, "kpi_date": latest_date}).mappings().first()
            if row:
                total_revenue = float(row["total_revenue"] or 0)
                total_orders = int(row["total_orders"] or 0)
                customer_count = int(row["customer_count"] or 0)
                cancelled_orders = int(row["cancelled_orders"] or 0)
                average_order_value = float(row["average_order_value"] or 0)
        else:
            # Corporate/All
            sql = text("""
                SELECT SUM(total_revenue) as total_revenue, 
                       SUM(total_orders) as total_orders, 
                       SUM(customer_count) as customer_count, 
                       SUM(cancelled_orders) as cancelled_orders
                FROM region_kpis 
                WHERE kpi_date = :kpi_date
            """)
            row = db.execute(sql, {"kpi_date": latest_date}).mappings().first()
            if row and row["total_revenue"] is not None:
                total_revenue = float(row["total_revenue"])
                total_orders = int(row["total_orders"])
                customer_count = int(row["customer_count"])
                cancelled_orders = int(row["cancelled_orders"])
                average_order_value = (total_revenue / total_orders) if total_orders > 0 else 0.0

        return {
            "total_revenue": total_revenue,
            "total_orders": total_orders,
            "customer_count": customer_count,
            "cancelled_orders": cancelled_orders,
            "average_order_value": average_order_value
        }

    @staticmethod
    def get_scope_details(db: Session, scope_type: str, scope_id: int | None):
        scope_name = "All Stores"
        regions_count = 0
        districts_count = 0
        stores_count = 0

        if scope_type == 'store' and scope_id is not None:
            store = db.query(Store).filter(Store.id == scope_id).first()
            if store:
                scope_name = store.store_name
            regions_count = 1
            districts_count = 1
            stores_count = 1
        elif scope_type == 'district' and scope_id is not None:
            district = db.query(District).filter(District.id == scope_id).first()
            if district:
                scope_name = district.district_name
            regions_count = 1
            districts_count = 1
            stores_count = db.query(Store).filter(Store.district_id == scope_id).count()
        elif scope_type == 'region' and scope_id is not None:
            region = db.query(Region).filter(Region.id == scope_id).first()
            if region:
                scope_name = region.region_name
            regions_count = 1
            districts_count = db.query(District).filter(District.region_id == scope_id).count()
            stores_count = db.query(Store).join(District, Store.district_id == District.id).filter(District.region_id == scope_id).count()
        else:
            scope_name = "All Stores"
            regions_count = db.query(Region).count()
            districts_count = db.query(District).count()
            stores_count = db.query(Store).count()

        return {
            "scopeName": scope_name,
            "regions": regions_count,
            "districts": districts_count,
            "stores": stores_count
        }

    @staticmethod
    def get_staff_by_scope(db: Session, scope_type: str, scope_id: int | None):
        # We query the users table and join roles and stores
        query = db.execute(text("""
            SELECT u.full_name as username, r.role_name as role,
                   COALESCE(s.store_name, d.district_name, reg.region_name, 'System-Wide') as assignment_name
            FROM users u
            JOIN roles r ON u.role_id = r.id
            LEFT JOIN stores s ON u.store_id = s.id
            LEFT JOIN districts d ON u.district_id = d.id
            LEFT JOIN regions reg ON u.region_id = reg.id
            ORDER BY r.role_name, u.full_name
        """)).mappings().all()

        staff_list = [dict(row) for row in query]
        
        # Filter based on scope
        if scope_type == 'store' and scope_id is not None:
            return [s for s in staff_list if s["assignment_name"] == db.query(Store.store_name).filter(Store.id == scope_id).scalar()]
        elif scope_type == 'district' and scope_id is not None:
            # District scope includes district manager and stores in the district
            district_name = db.query(District.district_name).filter(District.id == scope_id).scalar()
            store_names = [st.store_name for st in db.query(Store).filter(Store.district_id == scope_id).all()]
            return [s for s in staff_list if s["assignment_name"] == district_name or s["assignment_name"] in store_names]
        elif scope_type == 'region' and scope_id is not None:
            region_name = db.query(Region.region_name).filter(Region.id == scope_id).scalar()
            district_names = [dt.district_name for dt in db.query(District).filter(District.region_id == scope_id).all()]
            store_names = [st.store_name for st in db.query(Store).join(District, Store.district_id == District.id).filter(District.region_id == scope_id).all()]
            return [s for s in staff_list if s["assignment_name"] == region_name or s["assignment_name"] in district_names or s["assignment_name"] in store_names]

        return staff_list

    @staticmethod
    def get_recent_orders_by_scope(db: Session, scope_type: str, scope_id: int | None):
        # Build SQL based on scope
        sql = """
            SELECT o.id, s.store_name as store_name, o.customer_name, o.total_amount, o.status, o.created_at,
                   (SELECT string_agg(mi.name || ' x' || oi.quantity, ', ') 
                    FROM order_items oi 
                    JOIN menu_items mi ON oi.menu_item_id = mi.id 
                    WHERE oi.order_id = o.id) as items_summary
            FROM orders o
            JOIN stores s ON o.store_id = s.id
        """
        params = {}
        if scope_type == 'store' and scope_id is not None:
            sql += " WHERE o.store_id = :scope_id"
            params["scope_id"] = scope_id
        elif scope_type == 'district' and scope_id is not None:
            sql += " WHERE s.district_id = :scope_id"
            params["scope_id"] = scope_id
        elif scope_type == 'region' and scope_id is not None:
            sql += " JOIN districts d ON s.district_id = d.id WHERE d.region_id = :scope_id"
            params["scope_id"] = scope_id

        sql += " ORDER BY o.created_at DESC LIMIT 5"
        
        result = db.execute(text(sql), params).mappings().all()
        orders = []
        for r in result:
            o_dict = dict(r)
            # Format datetime as ISO string for frontend
            o_dict["created_at"] = o_dict["created_at"].isoformat()
            orders.append(o_dict)
        return orders
