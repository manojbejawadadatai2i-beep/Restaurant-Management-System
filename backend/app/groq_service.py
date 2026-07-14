from app.services.llm_service import llm_service, LLMServiceError

def get_llm_response(prompt: str, *, system_prompt: str) -> str:
    """Legacy compatibility wrapper for Groq LLM queries."""
    return llm_service.get_llm_response(prompt, system_prompt=system_prompt)
