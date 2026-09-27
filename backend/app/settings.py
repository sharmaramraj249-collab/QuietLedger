import os
from functools import lru_cache
from typing import Literal

from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
    environment: Literal["development", "test", "production"] = Field(
        default_factory=lambda: "production" if os.getenv("RENDER") == "true" else "development"
    )
    database_url: str = "sqlite+aiosqlite:///./quiet_ledger.db"
    database_url_unpooled: str | None = None
    gemini_api_key: str | None = None
    gemini_model: str = "gemini-3.8-flash"
    cors_origins: str = "http://localhost:5173"
    release_id: str = Field(default_factory=lambda: os.getenv("RENDER_GIT_COMMIT", "local"))

    @model_validator(mode="after")
    def validate_production_settings(self) -> "Settings":
        if self.environment == "production" and self.database_url.startswith("sqlite"):
            raise ValueError("DATABASE_URL must be a pooled Postgres URL in production; SQLite is local-only.")
        if self.environment == "production" and "*" in self.cors_origins:
            raise ValueError("CORS_ORIGINS may not use a wildcard in production.")
        return self

    @property
    def allowed_origins(self) -> list[str]:
        return [origin.strip().rstrip("/") for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def should_bootstrap_schema(self) -> bool:
        return self.environment in {"development", "test"}

@lru_cache
def get_settings() -> Settings:
    return Settings()
