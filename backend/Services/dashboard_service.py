import math
from datetime import datetime
from sqlalchemy.orm import Session
from Repositories.dashboard_repository import DashboardRepository
from Repositories.user_repository import UserRepository

class DashboardService:
    @staticmethod
    def get_dashboard_data(db: Session, user_id: int, filter_region_id: int | None, filter_district_id: int | None, filter_store_id: int | None, hour_filter: str | None, kpi_date: str | None):
        user = UserRepository.get_user_by_id(db, user_id)
        if not user:
            raise ValueError("User not found")

        role_name = UserRepository.get_role_name_by_id(db, user.role_id)
        
        # 1. Resolve scope
        scope_type = 'corporate'
        scope_id = None
        
        user_store_id = user.assigned_store_id or user.store_id
        user_district_id = user.assigned_district_id or user.district_id
        user_region_id = user.assigned_region_id or user.region_id

        if role_name == 'Store Manager':
            scope_type = 'store'
            scope_id = user_store_id
            if filter_store_id and filter_store_id != user_store_id:
                from fastapi import HTTPException
                raise HTTPException(status_code=403, detail="Access Denied: Requested store is out of your scope")
            if filter_district_id:
                from fastapi import HTTPException
                raise HTTPException(status_code=403, detail="Access Denied: Requested district is out of your scope")
            if filter_region_id:
                from fastapi import HTTPException
                raise HTTPException(status_code=403, detail="Access Denied: Requested region is out of your scope")
        elif role_name == 'District Manager':
            if filter_store_id:
                from models import Store
                store = db.query(Store).filter(Store.id == filter_store_id).first()
                if not store or store.district_id != user_district_id:
                    from fastapi import HTTPException
                    raise HTTPException(status_code=403, detail="Access Denied: Requested store is out of your district scope")
                scope_type = 'store'
                scope_id = filter_store_id
            else:
                scope_type = 'district'
                scope_id = user_district_id
                if filter_district_id and filter_district_id != user_district_id:
                    from fastapi import HTTPException
                    raise HTTPException(status_code=403, detail="Access Denied: Requested district is out of your scope")
                if filter_region_id:
                    from fastapi import HTTPException
                    raise HTTPException(status_code=403, detail="Access Denied: Requested region is out of your scope")
        elif role_name == 'Regional Manager':
            if filter_store_id:
                from models import Store, District
                is_match = db.query(Store).join(District, Store.district_id == District.id)\
                    .filter(Store.id == filter_store_id, District.region_id == user_region_id).first() is not None
                if not is_match:
                    from fastapi import HTTPException
                    raise HTTPException(status_code=403, detail="Access Denied: Requested store is out of your regional scope")
                scope_type = 'store'
                scope_id = filter_store_id
            elif filter_district_id:
                from models import District
                district = db.query(District).filter(District.id == filter_district_id).first()
                if not district or district.region_id != user_region_id:
                    from fastapi import HTTPException
                    raise HTTPException(status_code=403, detail="Access Denied: Requested district is out of your regional scope")
                scope_type = 'district'
                scope_id = filter_district_id
            else:
                scope_type = 'region'
                scope_id = user_region_id
                if filter_region_id and filter_region_id != user_region_id:
                    from fastapi import HTTPException
                    raise HTTPException(status_code=403, detail="Access Denied: Requested region is out of your scope")
        else:
            # Admin/Corporate Admin
            if filter_store_id:
                scope_type = 'store'
                scope_id = filter_store_id
            elif filter_district_id:
                scope_type = 'district'
                scope_id = filter_district_id
            elif filter_region_id:
                scope_type = 'region'
                scope_id = filter_region_id

        # 2. Resolve KPI date
        selected_date = kpi_date or datetime.utcnow().date().isoformat()
        resolved_date = DashboardRepository.resolve_kpi_date(db, selected_date)

        # 3. Get metrics
        metrics = DashboardRepository.get_metrics_and_trends(db, scope_type, scope_id, resolved_date)
        
        # Use the raw KPI values from the database for the dashboard display.
        # The previous hour-based scaling was synthetic and caused the mismatch
        # between database totals and the values shown in the UI.
        total_rev = float(metrics["total_revenue"])
        total_ord = int(metrics["total_orders"])
        cust_cnt = int(metrics["customer_count"])
        canc_ord = int(metrics["cancelled_orders"])
        avg_val = (total_rev / total_ord) if total_ord > 0 else 0.0

        # Calculations
        total_cost = float(round(total_rev * 0.58, 2))
        total_profit = float(round(total_rev - total_cost, 2))
        profit_margin = int(round((total_profit / total_rev) * 100)) if total_rev > 0 else 0
        cancellation_rate = int(round((canc_ord / total_ord) * 100)) if total_ord > 0 else 0

        # Count total menu items
        total_menu_items = 12 # constant based on menu_items seed list size

        # 4. Scope Directory
        scope_details = DashboardRepository.get_scope_details(db, scope_type, scope_id)

        # 5. Staff
        staff = DashboardRepository.get_staff_by_scope(db, scope_type, scope_id)

        # 6. Real 30-day daily revenue trend (revenue, profit, completed, cancelled per day)
        daily_trend = DashboardRepository.get_daily_revenue_trend(db, scope_type, scope_id)

        # Split into two parallel datasets that the frontend already expects:
        #   revenueTrend  - name / revenue / profit  (for the Area chart)
        #   peakHours     - name / Completed / Cancelled  (for the Line chart)
        revenue_trend = [
            {"name": d["name"], "revenue": d["revenue"], "profit": d["profit"]}
            for d in daily_trend
        ]
        peak_hours = [
            {"name": d["name"], "Completed": d["completed"], "Cancelled": d["cancelled"]}
            for d in daily_trend
        ]

        # 7. Top Selling — derived from the selected-date orders total
        top_selling = [
            { "name": "Seafood Platter", "category": "Mains", "sold": int(round(total_ord * 0.25)), "revenue": float(round(total_rev * 0.30, 2)) },
            { "name": "Garlic Butter Lobster", "category": "Mains", "sold": int(round(total_ord * 0.20)), "revenue": float(round(total_rev * 0.25, 2)) },
            { "name": "Grilled Salmon", "category": "Mains", "sold": int(round(total_ord * 0.18)), "revenue": float(round(total_rev * 0.20, 2)) },
            { "name": "Crispy Calamari", "category": "Appetizers", "sold": int(round(total_ord * 0.15)), "revenue": float(round(total_rev * 0.15, 2)) },
            { "name": "Chocolate Lava Cake", "category": "Desserts", "sold": int(round(total_ord * 0.10)), "revenue": float(round(total_rev * 0.10, 2)) }
        ]

        # 9. Recent Orders
        recent_orders = DashboardRepository.get_recent_orders_by_scope(db, scope_type, scope_id)

        return {
            "role": role_name,
            "scopeName": scope_details["scopeName"],
            "metrics": {
                "totalOrders": total_ord,
                "totalRevenue": total_rev,
                "totalCustomers": cust_cnt,
                "totalMenuItems": total_menu_items,
                "totalCost": total_cost,
                "totalProfit": total_profit,
                "profitMargin": profit_margin,
                "avgOrderValue": avg_val,
                "cancellationRate": cancellation_rate
            },
            "scopeDirectory": {
                "regions": scope_details["regions"],
                "districts": scope_details["districts"],
                "stores": scope_details["stores"]
            },
            "staff": staff,
            "revenueTrend": revenue_trend,
            "peakHours": peak_hours,
            "topSelling": top_selling,
            "recentOrders": recent_orders
        }
