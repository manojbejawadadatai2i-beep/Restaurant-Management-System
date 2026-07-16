import re
from fastapi import HTTPException, status
from schemas import AuthenticatedUser

ROLE_NAMES = {"corporate admin", "region manager", "district manager", "store manager"}
FORBIDDEN_SQL = re.compile(r"\b(insert|update|delete|drop|alter|truncate|create|grant|revoke|copy|call|execute|vacuum)\b", re.I)

class RBACService:
    @staticmethod
    def get_scope_for_user(user: AuthenticatedUser) -> tuple[str | None, dict[str, int]]:
        role = user.role.strip().lower()
        if role == "corporate admin":
            return None, {}
        
        scope_column = {
            "region manager": "region_id",
            "district manager": "district_id",
            "store manager": "store_id"
        }.get(role)
        
        if not scope_column:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, 
                detail="User role is not authorized for chat scope check"
            )
            
        value = getattr(user, scope_column)
        if value is None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, 
                detail=f"{scope_column} is required for this role"
            )
        return scope_column, {scope_column: value}

    @staticmethod
    def validate_read_only_sql(sql: str, scope_column: str | None) -> str:
        candidate = sql.strip().rstrip(";").strip()
        if not candidate or ";" in candidate or not re.match(r"^(select|with)\b", candidate, re.I):
            raise ValueError("Only one SELECT query is allowed.")
        if "--" in candidate or "/*" in candidate or FORBIDDEN_SQL.search(candidate):
            raise ValueError("Unsafe SQL was generated.")
        if scope_column and not re.search(rf"\b{re.escape(scope_column)}\b\s*=\s*:{re.escape(scope_column)}\b", candidate, re.I):
            raise ValueError("The generated query does not contain the required data scope.")
        return candidate
