# Quiet Ledger

[![CI](https://github.com/OWNER/quiet-ledger/actions/workflows/ci.yml/badge.svg)](https://github.com/OWNER/quiet-ledger/actions/workflows/ci.yml)

Quiet Ledger is a worker-first privacy DApp for time-bounded workplace listening. A worker proves that they are eligible and have not already participated in the current window, without publishing an identity, credential, wallet address, raw note, or private response.

> **Status:** submission-ready codebase; deployment, contract artifact generation, and a live demo require the external credentials/services listed in [Known limitations](#known-limitations).

## Why Midnight

Traditional feedback tooling centralizes the identity trail that makes honest participation risky. Midnight lets the contract check a local witness against public eligibility commitments and preserve a one-signal-per-window rule using a scoped nullifier. The chain can verify a valid aggregate signal while not learning the worker or their raw data. See [the privacy model](docs/PRIVACY_MODEL.md).

## Architecture

React/Vite renders the worker flow and keeps credential material in browser local storage. The 1AM-preferred DApp Connector integration discovers UUID-keyed providers from `window.midnight`, resets the session on network change, and calls the generated Compact client only when a real deployed contract is configured. FastAPI stores public receipt metadata and public policy hashes only. Gemini receives sanitized public policy text and produces structured explanations with a deterministic fallback. See [architecture](docs/ARCHITECTURE.md).

## Stack

- React 19, TypeScript, Vite, Framer Motion and accessible responsive CSS
- Midnight DApp Connector API v4.0.1, Midnight.js v4.1.1, Compact language 0.23/toolchain 0.31.1
- FastAPI, SQLAlchemy async, Alembic, Pydantic, asyncpg and Neon/Lakebase Postgres
- Official Google GenAI Python SDK with Pydantic structured output
- GitHub Actions, Vercel Functions, and a production guardrail for Neon/Lakebase Postgres

## Local setup

Prerequisites: Node 22, Python 3.11+, [uv](https://docs.astral.sh/uv/), Docker Desktop, a Midnight wallet (1AM preferred), and Compact toolchain 0.31.1 (language 0.23).

```bash
cp .env.example .env
npm ci
npm run dev
uv sync --project backend --all-groups
uv run --project backend uvicorn app.main:app --reload --port 8000
```

For development SQLite is automatic. For Neon, set `DATABASE_URL` to the pooled URL for API traffic and `DATABASE_URL_UNPOOLED` to the direct URL for Alembic. Link a Neon project, create `production` and `development` branches, run migrations against development, then promote after review. Do not commit either URL.

```bash
cd backend
DATABASE_URL_UNPOOLED="$DATABASE_URL_UNPOOLED" alembic upgrade head
```

## Compact and proof server

The contract source is [contracts/quiet-ledger.compact](contracts/quiet-ledger.compact). It has public eligibility commitments, window state, nullifiers, and an aggregate counter; its witnesses stay local. Compile it with the verified Compact toolchain and commit the emitted `contracts/managed/contract`, `zkir`, and proving key artifacts for browser deployment:

```bash
npm run contract:check
npm run contract:compile
docker compose -f docker-compose.proof.yml up -d
```

The proof server listens on port 6300. It must be local or a machine you control; it processes private witness data. 1AM can use its in-browser proving provider; other compatible wallets may require the proof server. The UI never reports a successful chain transaction without the wallet returning a real transaction ID.

## Wallet connection

Open the app with the wallet extension enabled. Select Preview or Preprod, then press **Connect** directly; wallets may reject popups that are not triggered by a click. Quiet Ledger prefers 1AM when it is present but lets the worker select a compatible discovered provider. Switching networks clears the session by design.

## Gemini configuration

Set `GEMINI_API_KEY` and optionally `GEMINI_MODEL` on the API server only. The assistant receives a public policy phrase after redaction and returns a Pydantic-validated explanation. Missing keys, sensitive patterns, or SDK errors use the deterministic local plan. It never receives private witnesses, holder secrets, wallet addresses, raw credentials, identity documents, exact values, or feedback.

## Verification

```bash
npm run lint
npm test
npm run build
npm run contract:check
uv run --project backend ruff check .
uv run --directory backend pytest
```

## CI/CD

`.github/workflows/ci.yml` runs linting, frontend tests/build, backend lint/tests, Compact compilation and generated-artifact validation on every push and pull request. Vercel’s Git integration should deploy successful `main` builds; no deployment is claimed until the Vercel project is connected and reports a production deployment.

## Vercel deployment

Both the Vite application and FastAPI service are arranged for one Vercel project: `api/index.py` exposes FastAPI as a Python serverless function, while `vercel.json` builds the frontend and keeps `/guide` and `/privacy` as client-routed pages. Import the repository into Vercel, set the root directory to this repository, and add `APP_ENV=production`, `RELEASE_ID` (the deployed Git SHA), `DATABASE_URL`, `GEMINI_API_KEY`, `GEMINI_MODEL`, and `CORS_ORIGINS` in Vercel’s environment settings. Set `VITE_API_BASE_URL` only if frontend and API use different origins; otherwise it uses same-origin `/api` automatically.

Vercel’s serverless filesystem is ephemeral, so production requires Neon; SQLite is only a local fallback. The API will refuse to start in production if it receives SQLite or wildcard CORS. Use the production branch’s pooled URL in `DATABASE_URL`, and run Alembic separately with the direct URL before release. Add the Vercel production domain to `CORS_ORIGINS` only when a cross-origin client actually needs it; same-origin API calls do not need browser CORS.

## Repository structure

```text
contracts/   Compact source and generated deployment artifacts
src/         Responsive React worker experience and wallet boundary
backend/     FastAPI, async public-metadata store, Gemini safety service
docs/        Proposal, architecture, privacy model and demo script
.github/     CI and Pages deployment
```

## Screenshots

Add real screenshots from a configured local run to `docs/assets/` before submission; do not substitute illustrations or fabricated output. The proof flow’s empty receipt state is intentional until a wallet finalizes a real transaction.

## Live demo

Not deployed. After configuring GitHub Pages, a backend host, Neon, a deployed contract and the appropriate wallet network, add the verified URL here.

## Known limitations

- This repository cannot deploy a Midnight contract, create Neon branches, call Gemini, or publish a URL without the account credentials and wallet approvals owned by the deployer.
- The Compact compiler must generate and commit the browser artifacts in `contracts/managed/` before a real circuit call can execute. No generated artifacts are fabricated in this repository.
- The product intentionally does not collect raw feedback. A future encrypted off-chain message channel would need a separate threat model and key-management review.
- Session storage narrows browser retention but is not a hardware security boundary. Production credentials should ultimately be held and proved by the selected wallet / credential issuer integration.

## Future improvements

Add independently governed encrypted message delivery, threshold-release aggregation, issuer tooling for commitments, real indexer confirmation polling, and accessibility research with workers and representatives.
