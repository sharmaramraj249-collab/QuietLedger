import asyncio
import os
import sys
from pathlib import Path

from alembic import context
from sqlalchemy import pool
from sqlalchemy.ext.asyncio import async_engine_from_config

# Alembic is commonly invoked from the repository root in CI and release jobs.
# Make the backend package resolvable without relying on the caller's cwd.
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from app.models import Base
from app.settings import normalize_async_database_url

config = context.config
target_metadata = Base.metadata

# Migrations must use the direct Neon connection. The app's pooled DATABASE_URL
# is intentionally not read here: PgBouncer transaction pooling is not suitable
# for Alembic's session-level migration work.
if database_url := os.getenv("DATABASE_URL_UNPOOLED"):
    config.set_main_option("sqlalchemy.url", normalize_async_database_url(database_url) or database_url)


def run_migrations_offline() -> None:
    context.configure(
        url=config.get_main_option("sqlalchemy.url"),
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


async def run_migrations_online() -> None:
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await connectable.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    asyncio.run(run_migrations_online())
