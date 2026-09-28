# Architecture

```text
React + local credential ──> Midnight.js personal deployment ──> 1AM
         │                              │                         │
         │ public policy only           │ contract address        │ balance + submit
         ├──> FastAPI ──> Gemini        ▼                         ▼
         │       │                personal Compact contract ──> Midnight ledger
         │       └──> Neon <──── finalized public receipt hash ──┘
         ▼
browser sessionStorage (credential + personal deployment pointer)
```

Netlify serves the Vite SPA and calls the FastAPI service on Render through the explicit `VITE_API_BASE_URL`. Normal API traffic uses `DATABASE_URL` (Neon pooled URL). Render's pre-deploy migration uses `DATABASE_URL_UNPOOLED` (direct URL). Development falls back to async SQLite. Create a Neon production branch and a `development` branch; run and validate migrations on development before promotion.

The Netlify Linux build compiles and publishes the Compact JavaScript, proving keys, verifier keys, and ZKIR. At runtime the worker connects 1AM, deploys one personal contract for the selected network and listening window, and receives a real contract address plus deployment transaction hash. The browser keeps that pointer for the current session; Render never receives wallet addresses or private contract state.

