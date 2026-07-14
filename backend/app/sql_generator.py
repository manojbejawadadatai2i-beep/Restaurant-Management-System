from app.schemas import AuthenticatedUser
from app.services.llm_service import llm_service

def generate_sql(question: str, user: AuthenticatedUser, history: list[dict]) -> str:
    """Legacy compatibility wrapper for generating SQL queries."""
    return llm_service.generate_sql(question, user, history)
