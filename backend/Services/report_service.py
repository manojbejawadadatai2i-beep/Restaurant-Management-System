from sqlalchemy.orm import Session
from sqlalchemy import text
from Repositories.report_repository import ReportRepository
from Repositories.user_repository import UserRepository
from Repositories.dashboard_repository import DashboardRepository
from models import Store

class ReportService:
    @staticmethod
    def resolve_user_scope_stores(db: Session, user_id: int):
        user = UserRepository.get_user_by_id(db, user_id)
        if not user:
            raise ValueError("User not found")

        role_name = UserRepository.get_role_name_by_id(db, user.role_id)
        
        is_filtered = False
        store_ids = []

        if role_name == 'Store Manager':
            is_filtered = True
            store_ids = [user.store_id] if user.store_id else [-1]
        elif role_name == 'District Manager':
            is_filtered = True
            if user.district_id:
                stores_in_district = db.query(Store.id).filter(Store.district_id == user.district_id).all()
                store_ids = [s.id for s in stores_in_district]
            else:
                store_ids = [-1]
        elif role_name == 'Regional Manager':
            is_filtered = True
            if user.region_id:
                # Region stores can be fetched via district region_id join
                stores_in_region = db.query(Store.id).join(Store.district_id == Store.id).filter(Store.region_id == user.region_id).all()
                # Wait, regions in models.py does NOT have region_id in stores table?
                # Let's check schema.sql or models.py: Region has corporate_id, District has region_id, Store has district_id.
                # So stores in region is fetched by: stores -> district -> region.
                # Let's write the query correctly:
                stores_in_region = db.execute(text("""
                    SELECT s.id 
                    FROM stores s
                    JOIN districts d ON s.district_id = d.id
                    WHERE d.region_id = :region_id
                """), {"region_id": user.region_id}).all()
                store_ids = [s[0] for s in stores_in_region]
            else:
                store_ids = [-1]
                
        return is_filtered, store_ids

    @staticmethod
    def get_sales_by_store(db: Session, user_id: int):
        is_filtered, store_ids = ReportService.resolve_user_scope_stores(db, user_id)
        latest_date = DashboardRepository.get_latest_kpi_date(db)
        return ReportRepository.get_sales_by_store(db, is_filtered, store_ids, latest_date)

    @staticmethod
    def get_sales_by_category(db: Session, user_id: int):
        is_filtered, store_ids = ReportService.resolve_user_scope_stores(db, user_id)
        latest_date = DashboardRepository.get_latest_kpi_date(db)
        return ReportRepository.get_sales_by_category(db, is_filtered, store_ids, latest_date)

    @staticmethod
    def get_orders_list(db: Session, user_id: int):
        is_filtered, store_ids = ReportService.resolve_user_scope_stores(db, user_id)
        return ReportRepository.get_orders_list(db, is_filtered, store_ids)
