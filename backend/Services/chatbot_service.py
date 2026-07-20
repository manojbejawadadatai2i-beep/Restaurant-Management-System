import logging
import time
from typing import Optional

from config import get_settings
from schemas import AuthenticatedUser
from Services.llm_service import llm_service
from Services.memory_service import memory_service
from Services.rbac_service import RBACService
from Repositories.sql_executor import execute_sql

logger = logging.getLogger(__name__)

class ChatbotService:
    def __init__(self):
        self.settings = get_settings()

    def process_query(self, question: str, user: AuthenticatedUser, session_id: Optional[str] = None) -> dict:
        # Determine unique session key
        session_key = session_id or f"user_{user.user_id}"
        
        # 1. Fetch conversation history
        history = memory_service.get_history(session_key, self.settings.memory_history_limit)
        
        # 2. Get scoping rules from RBAC
        scope_column, params = RBACService.get_scope_for_user(user)
        
        # 3. Generate SQL using the LLM
        sql = llm_service.generate_sql(question, user, history)
        
        # Check if the LLM tagged this as unrelated
        if "NOT_RESTAURANT_RELATED" in sql:
            answer = "I'm sorry, but I can only answer questions related to Ocean View's restaurant operations, sales, stores, performance, and KPIs."
            memory_service.append_interaction(session_key, question, answer)
            return {
                "sql": "N/A (Unrelated Question)",
                "answer": answer,
                "rows_returned": 0
            }
            
        # 4. Validate SQL for read-only safety and scoping constraint
        try:
            valid_sql = RBACService.validate_read_only_sql(sql, scope_column)
        except ValueError as exc:
            logger.warning("SQL Validation failed for user %s: %s (SQL: %s)", user.user_id, str(exc), sql)
            raise ValueError(f"Unable to safely execute query: {str(exc)}") from exc
            
        # 5. Execute SQL
        result, duration = execute_sql(valid_sql, params)
        rows_count = len(result.get("rows", []))
        
        # 6. Generate Natural Language Answer from Query Results
        answer = llm_service.generate_answer(question, result)
        
        # 7. Persist interaction to memory
        memory_service.append_interaction(session_key, question, answer)
        
        logger.info(
            "chatbot_query user_id=%s role=%s rows=%s duration_ms=%.1f sql=%s",
            user.user_id, user.role, rows_count, duration * 1000, valid_sql
        )
        
        return {
            "sql": valid_sql,
            "answer": answer,
            "rows_returned": rows_count
        }

# Global singleton
chatbot_service = ChatbotService()
