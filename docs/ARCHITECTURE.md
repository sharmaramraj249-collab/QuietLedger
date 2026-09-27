# Architecture

```text
React + local credential  ── private witness ──> 1AM proving provider
         │                                              │
         │ public policy only                           ▼
         ├──> FastAPI ──> Gemini (structured public explanation)  Midnight Compact
         │       │                                      │               │
         │       └──> Neon/Lakebase Postgres <── public receipts ────────┘
         ▼
browser sessionStorage (never server storage)
```

Netlify serves the Vite SPA and calls the FastAPI service on Render through the explicit `VITE_API_BASE_URL`. Normal API traffic uses `DATABASE_URL` (Neon pooled URL). Render's pre-deploy migration uses `DATABASE_URL_UNPOOLED` (direct URL). Development falls back to async SQLite. Create a Neon production branch and a `development` branch; run and validate migrations on development before promotion.

