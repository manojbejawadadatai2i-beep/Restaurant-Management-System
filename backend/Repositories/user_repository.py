from sqlalchemy.orm import Session
from sqlalchemy import func, text
from datetime import datetime
from models import User, Store, District, Region, Role

class UserRepository:
    @staticmethod
    def get_all_users(db: Session):
        # We perform joins to fetch region/district/store names
        return db.query(
            User.id,
            User.full_name.label("username"),
            User.email,
            User.role_id,
            User.login_method,
            User.store_id.label("assigned_store_id"),
            User.district_id.label("assigned_district_id"),
            User.region_id.label("assigned_region_id"),
            Store.store_name.label("store_name"),
            District.district_name.label("district_name"),
            Region.region_name.label("region_name")
        ).outerjoin(Store, User.store_id == Store.id)\
         .outerjoin(District, User.district_id == District.id)\
         .outerjoin(Region, User.region_id == Region.id)\
         .order_by(User.id.asc()).all()

    @staticmethod
    def get_user_by_id(db: Session, user_id: int):
        return db.query(User).filter(User.id == user_id).first()

    @staticmethod
    def get_user_by_email(db: Session, email: str):
        normalized_email = email.strip().lower()
        return db.query(User).filter(func.lower(User.email) == normalized_email).first()

    @staticmethod
    def get_user_by_employee_id(db: Session, employee_id: str):
        return db.query(User).filter(User.employee_id == employee_id).first()

    @staticmethod
    def get_role_by_name(db: Session, role_name: str):
        # Maps frontend role string to DB role
        # Roles in DB: 'Corporate Administrator', 'Regional Manager', 'District Manager', 'Store Manager', 'Administrator'
        # Frontend roles: 'Corporate Administrator', 'Regional Manager', 'District Manager', 'Store Manager', 'Administrator'
        return db.query(Role).filter(Role.role_name == role_name).first()

    @staticmethod
    def get_role_name_by_id(db: Session, role_id: int) -> str:
        role = db.query(Role).filter(Role.id == role_id).first()
        return role.role_name if role else "Store Manager"

    @staticmethod
    def check_store_exists(db: Session, store_id: int):
        return db.query(Store).filter(Store.id == store_id).first() is not None

    @staticmethod
    def check_store_name_exists(db: Session, store_name: str):
        return db.query(Store).filter(Store.store_name == store_name).first() is not None

    @staticmethod
    def create_store(db: Session, store_id: int, name: str, district_id: int, region_id: int):
        # We need to construct code or other columns required in schema.sql
        # stores table requires: district_id, store_code, store_name, city, opened_on, status
        store_code = f"STR{store_id:03d}"
        now = datetime.utcnow()
        store = Store(
            id=store_id,
            district_id=district_id,
            store_code=store_code,
            store_name=name,
            city="Demo City",
            opened_on=now.date(),
            status="ACTIVE",
            created_at=now,
            updated_at=now
        )
        db.add(store)
        db.flush()
        return store

    @staticmethod
    def create_user(db: Session, user: User):
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def update_user(db: Session, user_id: int, role_id: int, store_id: int | None, district_id: int | None, region_id: int | None, login_method: str | None = None):
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            user.role_id = role_id
            user.store_id = store_id
            user.assigned_store_id = store_id
            user.district_id = district_id
            user.assigned_district_id = district_id
            user.region_id = region_id
            user.assigned_region_id = region_id
            if login_method is not None:
                user.login_method = login_method
            db.commit()
            return user
        return None

    @staticmethod
    def delete_user(db: Session, user_id: int) -> bool:
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            db.delete(user)
            db.commit()
            return True
        return False
