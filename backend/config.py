"""Application configuration loaded from environment variables."""
from typing import Optional
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    database_url: str
    groq_api_key: str
    jwt_secret: str
    jwt_algorithm: str = "HS256"
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440
    google_client_id: Optional[str] = None
    groq_model: str = "llama-3.3-70b-versatile"
    database_statement_timeout_ms: int = 10_000
    max_query_rows: int = 200
    memory_history_limit: int = 8

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

@lru_cache
def get_settings() -> Settings:
    return Settings()
