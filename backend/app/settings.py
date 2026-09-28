import os
from functools import lru_cache
from typing import Literal
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from pydantic import Field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


def normalize_async_database_url(value: str | None) -> str | None:
    """Convert provider-style Postgres URLs to SQLAlchemy's asyncpg dialect."""
    if not value:
        return value
    if value.startswith("postgres://"):
        value = "postgresql+asyncpg://" + value.removeprefix("postgres://")
    elif value.startswith("postgresql://"):
        value = "postgresql+asyncpg://" + value.removeprefix("postgresql://")
    if not value.startswith("postgresql+asyncpg://"):
        return value

    parts = urlsplit(value)
    query = dict(parse_qsl(parts.query, keep_blank_values=True))
    ssl_mode = query.pop("sslmode", None)
    query.pop("channel_binding", None)
    if ssl_mode and "ssl" not in query:
        query["ssl"] = "require" if ssl_mode in {"require", "verify-ca", "verify-full"} else ssl_mode
    return urlunsplit((parts.scheme, parts.netloc, parts.path, urlencode(query), parts.fragment))

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

    @field_validator("database_url", "database_url_unpooled", mode="before")
    @classmethod
    def use_async_postgres_driver(cls, value: str | None) -> str | None:
        return normalize_async_database_url(value)

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
