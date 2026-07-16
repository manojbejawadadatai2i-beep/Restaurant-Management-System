from fastapi import APIRouter, Depends, HTTPException, status
from typing import List

from dependencies import get_current_user
from schemas import (
    AuthenticatedUser,
    ChatRequest,
    ChatResponse,
    ChatHistoryResponse,
    SessionCreateResponse,
    SessionListResponse,
    SuggestionsResponse
)
from Services.chatbot_service import chatbot_service
from Services.memory_service import memory_service
from Repositories.sql_executor import DatabaseQueryError
from Services.llm_service import LLMServiceError

router = APIRouter(prefix="/chat", tags=["chat"])

@router.post("/query", response_model=ChatResponse)
def query_chatbot(request: ChatRequest, user: AuthenticatedUser = Depends(get_current_user)):
    """Accept natural language questions, execute generated SQL, and return a simple summary answer."""
    try:
        result = chatbot_service.process_query(request.query, user, request.session_id)
        return result
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc)
        )
    except DatabaseQueryError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database service is temporarily unavailable. Failed to run generated query."
        )
    except LLMServiceError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI service is temporarily unavailable."
        )


@router.get("/history/{session_id}", response_model=ChatHistoryResponse)
def get_chat_history(session_id: str, user: AuthenticatedUser = Depends(get_current_user)):
    """Fetch the conversation history for a specific session ID."""
    history = memory_service.get_history(session_id)
    return {"session_id": session_id, "history": history}


@router.delete("/history/{session_id}")
def clear_chat_history(session_id: str, user: AuthenticatedUser = Depends(get_current_user)):
    """Clear message history in the specified session without deleting the session ID."""
    history = memory_service.get_history(session_id)
    if not history and session_id not in memory_service.list_sessions():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    memory_service.clear_history(session_id)
    return {"message": "Chat history cleared successfully"}


@router.post("/session", response_model=SessionCreateResponse)
def create_session(user: AuthenticatedUser = Depends(get_current_user)):
    """Create a new chat session and return the unique session_id."""
    session_id = memory_service.create_session()
    return {"session_id": session_id, "message": "Session created successfully"}


@router.get("/sessions", response_model=SessionListResponse)
def list_sessions(user: AuthenticatedUser = Depends(get_current_user)):
    """List all active chat session IDs."""
    sessions = memory_service.list_sessions()
    return {"sessions": sessions}


@router.delete("/session/{session_id}")
def delete_session(session_id: str, user: AuthenticatedUser = Depends(get_current_user)):
    """Delete a chat session and all its conversation history."""
    deleted = memory_service.delete_session(session_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    return {"message": "Session and history deleted successfully"}


@router.get("/suggestions", response_model=SuggestionsResponse)
def get_suggested_questions(user: AuthenticatedUser = Depends(get_current_user)):
    """Return a list of predefined recommended queries for restaurant decision support."""
    suggestions = [
        "How many stores are there?",
        "Show today's revenue.",
        "Which district has the highest profit?",
        "Top 5 stores.",
        "Lowest-performing stores.",
        "Show inactive stores.",
        "Which region generated maximum sales?",
        "Compare Hyderabad and Vijayawada.",
        "Average order value.",
        "Revenue trend.",
        "Profit trend.",
        "Customer count.",
        "Employee count.",
        "Daily KPI summary.",
        "Monthly KPI summary."
    ]
    return {"suggestions": suggestions}
