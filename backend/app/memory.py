from app.services.memory_service import memory_service

def get_history(session_id: str, limit: int) -> list[dict]:
    """Legacy compatibility wrapper to retrieve session message history."""
    return memory_service.get_history(session_id, limit)

def append_interaction(session_id: str, question: str, answer: str) -> None:
    """Legacy compatibility wrapper to save message interaction."""
    memory_service.append_interaction(session_id, question, answer)
