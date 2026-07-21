import re
from fastapi import HTTPException, status
from schemas import AuthenticatedUser

ROLE_NAMES = {
    "corporate admin", "corporate administrator", "administrator", "admin",
    "region manager", "regional manager",
    "district manager",
    "store manager"
}
FORBIDDEN_SQL = re.compile(r"\b(insert|update|delete|drop|alter|truncate|create|grant|revoke|copy|call|execute|vacuum)\b", re.I)

class RBACService:
    @staticmethod
    def get_scope_for_user(user: AuthenticatedUser) -> tuple[str | None, dict[str, int]]:
        role = user.role.strip().lower()
        if "corporate" in role or "admin" in role:
            return None, {}
        
        if "region" in role:
            scope_column = "region_id"
        elif "district" in role:
            scope_column = "district_id"
        elif "store" in role:
            scope_column = "store_id"
        else:
            scope_column = None
        
        if not scope_column:
            # Default to no filter for unmapped admin roles
            return None, {}
            
        value = getattr(user, scope_column, None)
        if value is None:
            # Fallback to no filter if scope column is not populated
            return None, {}
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
