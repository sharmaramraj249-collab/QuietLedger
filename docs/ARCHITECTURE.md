# Architecture

```text
React + local credential  ── private witness ──> 1AM proving provider
         │                                              │
         │ public policy only                           ▼
         ├──> FastAPI ──> Gemini (structured public explanation)  Midnight Compact
         │       │                                      │               │
         │       └──> Neon/Lakebase Postgres <── public receipts ────────┘
         ▼
browser localStorage (never server storage)
```

Normal API traffic uses `DATABASE_URL` (Neon pooled URL). Alembic migrations use `DATABASE_URL_UNPOOLED` (direct URL). Development falls back to async SQLite. Create a Neon production branch and a `development` branch; run and validate migrations on development before promotion.

