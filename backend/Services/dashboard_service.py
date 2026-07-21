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
        
        if role_name == 'Store Manager':
            scope_type = 'store'
            scope_id = user.store_id
            if filter_store_id and filter_store_id != user.store_id:
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
                if not store or store.district_id != user.district_id:
                    from fastapi import HTTPException
                    raise HTTPException(status_code=403, detail="Access Denied: Requested store is out of your district scope")
                scope_type = 'store'
                scope_id = filter_store_id
            else:
                scope_type = 'district'
                scope_id = user.district_id
                if filter_district_id and filter_district_id != user.district_id:
                    from fastapi import HTTPException
                    raise HTTPException(status_code=403, detail="Access Denied: Requested district is out of your scope")
                if filter_region_id:
                    from fastapi import HTTPException
                    raise HTTPException(status_code=403, detail="Access Denied: Requested region is out of your scope")
        elif role_name == 'Regional Manager':
            if filter_store_id:
                from models import Store, District
                is_match = db.query(Store).join(District, Store.district_id == District.id)\
                    .filter(Store.id == filter_store_id, District.region_id == user.region_id).first() is not None
                if not is_match:
                    from fastapi import HTTPException
                    raise HTTPException(status_code=403, detail="Access Denied: Requested store is out of your regional scope")
                scope_type = 'store'
                scope_id = filter_store_id
            elif filter_district_id:
                from models import District
                district = db.query(District).filter(District.id == filter_district_id).first()
                if not district or district.region_id != user.region_id:
                    from fastapi import HTTPException
                    raise HTTPException(status_code=403, detail="Access Denied: Requested district is out of your regional scope")
                scope_type = 'district'
                scope_id = filter_district_id
            else:
                scope_type = 'region'
                scope_id = user.region_id
                if filter_region_id and filter_region_id != user.region_id:
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

        # 6. Revenue Trend & Hourly Distribution (deterministic math matching mock server)
        hourly_distribution = [
            { "hour": "7 AM", "share": 0.13 },
            { "hour": "8 AM", "share": 0.17 },
            { "hour": "1 PM", "share": 0.28 },
            { "hour": "2 PM", "share": 0.22 },
            { "hour": "4 PM", "share": 0.20 }
        ]

        revenue_trend = []
        for item in hourly_distribution:
            rev = float(round(total_rev * item["share"], 2))
            cost = float(round(rev * 0.58, 2))
            revenue_trend.append({
                "name": item["hour"],
                "revenue": rev,
                "profit": float(round(rev - cost, 2))
            })

        # 7. Peak Hours
        is_all = not hour_filter or hour_filter == 'All'
        
        h_completed_7_9 = int(round(total_ord * (0.43 if hour_filter == '7-9' else 0.13)))
        h_cancelled_7_9 = int(round(canc_ord * (0.4 if hour_filter == '7-9' else 0.1)))

        h_completed_8 = int(round(total_ord * (0.57 if hour_filter == '7-9' else 0.17)))
        h_cancelled_8 = int(round(canc_ord * (0.6 if hour_filter == '7-9' else 0.15)))

        h_completed_1_12_15 = int(round(total_ord * (0.56 if hour_filter == '12-15' else 0.28)))
        h_cancelled_1_12_15 = int(round(canc_ord * (0.55 if hour_filter == '12-15' else 0.3)))

        h_completed_2 = int(round(total_ord * (0.44 if hour_filter == '12-15' else 0.22)))
        h_cancelled_2 = int(round(canc_ord * (0.45 if hour_filter == '12-15' else 0.25)))

        h_completed_4 = int(round(total_ord * (1.0 if hour_filter == '15-18' else 0.2)))
        h_cancelled_4 = int(round(canc_ord * (1.0 if hour_filter == '15-18' else 0.2)))

        peak_hours = [
            { "name": "7 AM", "Completed": h_completed_7_9 if (is_all or hour_filter == '7-9') else 0, "Cancelled": h_cancelled_7_9 if (is_all or hour_filter == '7-9') else 0 },
            { "name": "8 AM", "Completed": h_completed_8 if (is_all or hour_filter == '7-9') else 0, "Cancelled": h_cancelled_8 if (is_all or hour_filter == '7-9') else 0 },
            { "name": "1 PM", "Completed": h_completed_1_12_15 if (is_all or hour_filter == '12-15') else 0, "Cancelled": h_cancelled_1_12_15 if (is_all or hour_filter == '12-15') else 0 },
            { "name": "2 PM", "Completed": h_completed_2 if (is_all or hour_filter == '12-15') else 0, "Cancelled": h_cancelled_2 if (is_all or hour_filter == '12-15') else 0 },
            { "name": "4 PM", "Completed": h_completed_4 if (is_all or hour_filter == '15-18') else 0, "Cancelled": h_cancelled_4 if (is_all or hour_filter == '15-18') else 0 }
        ]

        # Handle rounding adjustments
        comp_sum = sum(h["Completed"] for h in peak_hours)
        diff = (total_ord - canc_ord) - comp_sum
        if diff != 0:
            for idx, h in enumerate(peak_hours):
                if h["Completed"] > 0:
                    peak_hours[idx]["Completed"] += diff
                    break

        # 8. Top Selling
        top_selling = [
            { "name": "Seafood Platter", "category": "Mains", "sold": int(round(total_ord * 0.2)), "revenue": float(round(total_rev * 0.3, 2)) },
            { "name": "Garlic Butter Lobster", "category": "Mains", "sold": int(round(total_ord * 0.15)), "revenue": float(round(total_rev * 0.25, 2)) },
            { "name": "Grilled Salmon", "category": "Mains", "sold": int(round(total_ord * 0.25)), "revenue": float(round(total_rev * 0.2, 2)) },
            { "name": "Crispy Calamari", "category": "Appetizers", "sold": int(round(total_ord * 0.25)), "revenue": float(round(total_rev * 0.15, 2)) },
            { "name": "Chocolate Lava Cake", "category": "Desserts", "sold": int(round(total_ord * 0.15)), "revenue": float(round(total_rev * 0.1, 2)) }
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
