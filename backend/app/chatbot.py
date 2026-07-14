from app.schemas import AuthenticatedUser
from app.services.chatbot_service import chatbot_service

def chatbot(question: str, user: AuthenticatedUser, session_id: str | None = None) -> dict:
    """Legacy compatibility wrapper function for the chatbot."""
    return chatbot_service.process_query(question, user, session_id)
