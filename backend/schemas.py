from typing import Any, List, Optional, Dict
from pydantic import BaseModel, Field

class ChatRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=2000, description="Natural language question")
    session_id: Optional[str] = Field(default=None, max_length=128, description="Unique session ID")


class ChatResponse(BaseModel):
    sql: str = Field(..., description="Generated PostgreSQL SELECT query")
    answer: str = Field(..., description="Natural language answer summary")
    rows_returned: int = Field(..., description="Number of rows returned from execution")


class MessageHistoryItem(BaseModel):
    question: str
    answer: str


class ChatHistoryResponse(BaseModel):
    session_id: str
    history: List[MessageHistoryItem]


class SessionCreateResponse(BaseModel):
    session_id: str
    message: str = "Session created successfully"


class SessionListResponse(BaseModel):
    sessions: List[str]


class SuggestionsResponse(BaseModel):
    suggestions: List[str]


class AuthenticatedUser(BaseModel):
    user_id: str
    role: str
    corporate_id: Optional[int] = None
    region_id: Optional[int] = None
    district_id: Optional[int] = None
    store_id: Optional[int] = None

    @classmethod
    def from_claims(cls, claims: dict[str, Any]) -> "AuthenticatedUser":
        role = claims.get("role") or claims.get("roles")
        if isinstance(role, list):
            role = role[0] if len(role) == 1 else None
        return cls(
            user_id=str(claims.get("user_id") or claims.get("sub") or ""),
            role=str(role or ""),
            corporate_id=claims.get("corporate_id"),
            region_id=claims.get("region_id"),
            district_id=claims.get("district_id"),
            store_id=claims.get("store_id"),
        )


class HealthResponse(BaseModel):
    status: str
    details: Optional[Dict[str, Any]] = None
