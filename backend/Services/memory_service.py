from collections import deque
from threading import Lock
from typing import List, Dict, Optional
import uuid

class MemoryService:
    def __init__(self, history_limit: int = 20):
        self.history_limit = history_limit
        self._history: Dict[str, deque] = {}
        self._lock = Lock()

    def create_session(self, session_id: Optional[str] = None) -> str:
        with self._lock:
            sid = session_id or f"session_{uuid.uuid4().hex[:8]}"
            if sid not in self._history:
                self._history[sid] = deque(maxlen=self.history_limit)
            return sid

    def list_sessions(self) -> List[str]:
        with self._lock:
            return list(self._history.keys())

    def delete_session(self, session_id: str) -> bool:
        with self._lock:
            if session_id in self._history:
                del self._history[session_id]
                return True
            return False

    def get_history(self, session_id: str, limit: Optional[int] = None) -> List[dict]:
        with self._lock:
            if session_id not in self._history:
                # Lazy initialization for session_id if requested directly
                self._history[session_id] = deque(maxlen=self.history_limit)
            history_list = list(self._history[session_id])
            if limit:
                return history_list[-limit:]
            return history_list

    def clear_history(self, session_id: str) -> bool:
        with self._lock:
            if session_id in self._history:
                self._history[session_id].clear()
                return True
            return False

    def append_interaction(self, session_id: str, question: str, answer: str) -> None:
        with self._lock:
            if session_id not in self._history:
                self._history[session_id] = deque(maxlen=self.history_limit)
            self._history[session_id].append({"question": question, "answer": answer})

# Global singleton instance for the app instance
memory_service = MemoryService()
