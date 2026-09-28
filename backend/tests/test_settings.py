import pytest
from pydantic import ValidationError

from app.settings import Settings, normalize_async_database_url


def test_production_requires_postgres():
    with pytest.raises(ValidationError, match="DATABASE_URL"):
        Settings(environment="production", database_url="sqlite+aiosqlite:///./quiet_ledger.db")


def test_production_rejects_wildcard_cors():
    with pytest.raises(ValidationError, match="CORS_ORIGINS"):
        Settings(environment="production", database_url="postgresql+asyncpg://example", cors_origins="*")


def test_origin_list_is_trimmed():
    settings = Settings(cors_origins=" http://localhost:5173/ , https://app.example.com ")
    assert settings.allowed_origins == ["http://localhost:5173", "https://app.example.com"]


def test_render_runtime_defaults_to_production(monkeypatch):
    monkeypatch.setenv("RENDER", "true")
    monkeypatch.setenv("RENDER_GIT_COMMIT", "release-sha")
    settings = Settings(database_url="postgresql+asyncpg://example", _env_file=None)
    assert settings.environment == "production"
    assert settings.release_id == "release-sha"


def test_neon_url_uses_asyncpg_and_supported_ssl_parameters():
    normalized = normalize_async_database_url(
        "postgresql://user:pass@example.neon.tech/db?sslmode=require&channel_binding=require"
    )
    assert normalized == "postgresql+asyncpg://user:pass@example.neon.tech/db?ssl=require"


def test_legacy_postgres_scheme_is_supported():
    assert normalize_async_database_url("postgres://user:pass@example/db") == (
        "postgresql+asyncpg://user:pass@example/db"
    )
