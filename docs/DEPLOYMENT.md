# Production deployment

Quiet Ledger uses one Vercel project for the Vite client and FastAPI function. The browser sends public metadata to same-origin `/api/*`; it never sends the witness, nullifier secret, raw worker response, or wallet address to the API.

## Release order

1. Create `development`, preview, and `production` branches in Neon/Lakebase Postgres. Use a pooled Postgres URL for `DATABASE_URL` in Vercel, and keep the direct URL only for migration jobs.
2. Export `DATABASE_URL_UNPOOLED` with the direct Neon URL, then run `cd backend` followed by `alembic upgrade head` against a branch before it is promoted. Do not run migrations from a Vercel request.
3. Compile Compact 0.31.1 / language 0.23 in a supported Linux or WSL environment, review the generated artifacts, then deploy the contract with the intended wallet and network. Configure `VITE_CONTRACT_ADDRESS` and the generated artifact URL only after both are verified.
4. Import the repository into Vercel and set `APP_ENV=production`, `DATABASE_URL`, `GEMINI_API_KEY` (optional), `GEMINI_MODEL` (optional), `RELEASE_ID`, and `CORS_ORIGINS` (only for explicit cross-origin clients). Never expose Gemini or database values as `VITE_*` variables.
5. Verify `/health`, `/api/v1/metrics`, the connected-wallet proof journey, and a real transaction finalization before directing workers to the service.

## Operational rules

- The production app refuses SQLite and wildcard CORS. API responses include an `X-Request-ID`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, and `Cache-Control: no-store` for API routes.
- Vercel requests are short-lived. Keep proof generation in the wallet/browser; use a worker-controlled prover or 1AM’s in-browser provider rather than moving witnesses to the server.
- Apply a Vercel WAF/rate-limit policy to `/api/v1/*`. In-process rate limiting is intentionally not used because it is not a reliable serverless control.
- Use a Neon branch for each risky schema change, test the Alembic migration there, and use the direct non-pooled URL for migration commands. Keep the pooled URL for application traffic.
- Alert on Vercel function errors and database connection failures. Keep the release id visible through `/health` to correlate a worker issue with a deployment.

## Privacy release check

- Confirm that logs, error reporting, and analytics exclude request bodies on worker routes.
- Confirm receipt payloads contain only transaction id, network, public window, and the reviewed public disclosure labels.
- Do not treat browser session storage as a wallet. Clear it at session end; credential custody belongs in the wallet/issuer integration before handling sensitive production credentials.
