import time
from sqlalchemy import text
from sqlalchemy.exc import DBAPIError, SQLAlchemyError

from config import get_settings
from database import engine

class DatabaseQueryError(RuntimeError):
    pass

def execute_sql(query: str, params: dict[str, int]) -> tuple[dict, float]:
    settings = get_settings()
    started = time.perf_counter()
    try:
        with engine.connect() as connection:
            connection.execute(
                text("SELECT set_config('statement_timeout', :timeout, true)"),
                {"timeout": str(settings.database_statement_timeout_ms)},
            )
            result = connection.execute(text(query), params)
            rows = result.mappings().fetchmany(settings.max_query_rows + 1)
        if len(rows) > settings.max_query_rows:
            rows = rows[:settings.max_query_rows]
        return {"columns": list(result.keys()), "rows": [dict(row) for row in rows]}, time.perf_counter() - started
    except (DBAPIError, SQLAlchemyError) as exc:
        raise DatabaseQueryError("The requested data could not be retrieved.") from exc
