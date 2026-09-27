import pytest
from pydantic import ValidationError

from app.settings import Settings


def test_production_requires_postgres():
    with pytest.raises(ValidationError, match="DATABASE_URL"):
        Settings(environment="production", database_url="sqlite+aiosqlite:///./quiet_ledger.db")


def test_production_rejects_wildcard_cors():
    with pytest.raises(ValidationError, match="CORS_ORIGINS"):
        Settings(environment="production", database_url="postgresql+asyncpg://example", cors_origins="*")


def test_origin_list_is_trimmed():
    settings = Settings(cors_origins=" http://localhost:5173/ , https://app.example.com ")
    assert settings.allowed_origins == ["http://localhost:5173", "https://app.example.com"]
