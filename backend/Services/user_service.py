import jwt
import logging
from datetime import datetime
from sqlalchemy.orm import Session
from config import get_settings
from Repositories.user_repository import UserRepository
from models import User, Store

logger = logging.getLogger(__name__)

class UserService:
    @staticmethod
    def generate_jwt_token(user_id: str, role_name: str, corporate_id: int | None, region_id: int | None, district_id: int | None, store_id: int | None) -> str:
        settings = get_settings()
        
        # Map database roles to chatbot service ROLE_NAMES
        # ROLE_NAMES in rbac_service: {"corporate admin", "region manager", "district manager", "store manager"}
        mapped_role = "store manager"
        role_lower = role_name.lower().strip()
        if "corporate" in role_lower or "admin" in role_lower:
            mapped_role = "corporate admin"
        elif "region" in role_lower:
            mapped_role = "region manager"
        elif "district" in role_lower:
            mapped_role = "district manager"
            
        payload = {
            "user_id": user_id,
            "sub": user_id,
            "role": mapped_role,
            "corporate_id": corporate_id or 1,
            "region_id": region_id,
            "district_id": district_id,
            "store_id": store_id
        }
        return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)

    @staticmethod
    def get_users_list(db: Session):
        db_users = UserRepository.get_all_users(db)
        users = []
        for u in db_users:
            role_name = UserRepository.get_role_name_by_id(db, u.role_id)
            # Generate JWT token
            token = UserService.generate_jwt_token(
                user_id=f"emp_{u.id}",
                role_name=role_name,
                corporate_id=1,
                region_id=u.assigned_region_id,
                district_id=u.assigned_district_id,
                store_id=u.assigned_store_id
            )
            users.append({
                "id": u.id,
                "username": u.username,
                "email": u.email,
                "role": role_name,
                "assigned_store_id": u.assigned_store_id,
                "store_name": u.store_name,
                "assigned_district_id": u.assigned_district_id,
                "district_name": u.district_name,
                "assigned_region_id": u.assigned_region_id,
                "region_name": u.region_name,
                "token": token
            })
        return users

    @staticmethod
    def create_user(db: Session, data: dict):
        role_name = data.get("role", "Store Manager")
        role = UserRepository.get_role_by_name(db, role_name)
        if not role:
            raise ValueError(f"Role '{role_name}' is not supported")

        role_id = role.id
        
        # Check if username or email already exists
        # In models.py/schema.sql, user uses employee_id (unique), email (unique), full_name
        username = data.get("username")
        email = data.get("email")
        
        if email:
            existing = UserRepository.get_user_by_email(db, email)
            if existing:
                raise ValueError("Email already exists")
                
        # We will generate a unique employee ID
        latest_user = db.query(User).order_by(User.id.desc()).first()
        next_id = (latest_user.id + 1) if latest_user else 1
        employee_id = f"EMP{next_id:03d}"

        # If adding a new store
        store_id = data.get("assigned_store_id")
        if data.get("addNewStore"):
            new_store_name = data.get("newStoreName")
            
            if not new_store_name:
                raise ValueError("New Store Name is required")
                
            if UserRepository.check_store_name_exists(db, new_store_name):
                raise ValueError("Store name already exists")
                
            district_id = data.get("assigned_district_id")
            region_id = data.get("assigned_region_id")
            if not district_id or not region_id:
                raise ValueError("Region and District are required to create a new store")
                
            # Auto-calculate the next available unique Store ID
            max_store = db.query(Store.id).order_by(Store.id.desc()).first()
            new_store_id = (max_store[0] + 1) if max_store else 1
            
            UserRepository.create_store(db, new_store_id, new_store_name, int(district_id), int(region_id))
            store_id = new_store_id

        # Encrypt the password using bcrypt
        raw_password = data.get("password") or "Manoj@4462"
        import bcrypt
        hashed_password = bcrypt.hashpw(raw_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

        # Insert user
        now = datetime.utcnow()
        user = User(
            employee_id=employee_id,
            full_name=username,
            email=email or f"{username.lower().replace(' ', '_')}@restaurant.com",
            password_hash=hashed_password,
            role_id=role_id,
            corporate_id=1,
            region_id=int(data.get("assigned_region_id")) if data.get("assigned_region_id") else None,
            district_id=int(data.get("assigned_district_id")) if data.get("assigned_district_id") else None,
            store_id=int(store_id) if store_id else None,
            is_active=True,
            created_at=now,
            updated_at=now
        )
        
        created = UserRepository.create_user(db, user)
        return created

    @staticmethod
    def update_user(db: Session, user_id: int, data: dict):
        role_name = data.get("role", "Store Manager")
        role = UserRepository.get_role_by_name(db, role_name)
        if not role:
            raise ValueError(f"Role '{role_name}' is not supported")

        role_id = role.id
        store_id = int(data.get("assigned_store_id")) if data.get("assigned_store_id") else None
        district_id = int(data.get("assigned_district_id")) if data.get("assigned_district_id") else None
        region_id = int(data.get("assigned_region_id")) if data.get("assigned_region_id") else None

        updated = UserRepository.update_user(db, user_id, role_id, store_id, district_id, region_id)
        if not updated:
            raise ValueError("User not found")
        return updated

    @staticmethod
    def delete_user(db: Session, user_id: int):
        user = UserRepository.get_user_by_id(db, user_id)
        if not user:
            raise ValueError("User not found")
            
        role_name = UserRepository.get_role_name_by_id(db, user.role_id)
        if role_name == "Corporate Administrator":
            raise ValueError("Corporate Administrator cannot be deleted")
            
        return UserRepository.delete_user(db, user_id)
