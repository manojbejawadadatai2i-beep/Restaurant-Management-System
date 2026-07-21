"""Application configuration loaded from environment variables."""
import os
from pathlib import Path
from typing import Optional
from functools import lru_cache
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent

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

    model_config = SettingsConfigDict(
        env_file=(BASE_DIR / ".env", BASE_DIR / "backend" / ".env"),
        extra="ignore",
        case_sensitive=False,
    )

    @field_validator("google_client_id", mode="before")
    @classmethod
    def normalize_google_client_id(cls, value):
        if isinstance(value, str):
            value = value.strip().strip('"').strip("'")
        return value

@lru_cache
def get_settings() -> Settings:
    return Settings()
