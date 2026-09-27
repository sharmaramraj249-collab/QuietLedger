# Production deployment

Quiet Ledger deploys as two services: Netlify serves the Vite frontend, and Render runs the FastAPI backend. The browser sends only reviewed public metadata to the Render origin; it never sends the witness, nullifier secret, raw worker response, or wallet address to the API.

## 1. Prepare Neon

1. Create separate `development` and `production` branches in Neon/Lakebase Postgres.
2. Copy the production branch's pooled URL into Render as `DATABASE_URL`.
3. Copy the production branch's direct, non-pooled URL into Render as `DATABASE_URL_UNPOOLED`.

The Render service uses the pooled connection for normal traffic. The container runs Alembic with the direct connection before starting FastAPI, so the health check cannot pass until the schema is ready. This startup sequence works on both free and paid single-instance Render services; Render's separate pre-deploy command is a paid feature.

## 2. Deploy the API on Render

Create a Blueprint from the repository's `render.yaml`. Before the first deploy, provide these secret values in Render:

- `DATABASE_URL`: pooled Neon production URL.
- `DATABASE_URL_UNPOOLED`: direct Neon production URL.
- `CORS_ORIGINS`: the exact Netlify production origin, such as `https://quiet-ledger.netlify.app`. Do not add a trailing slash and do not use `*`.
- `GEMINI_API_KEY`: optional; add it in the Render dashboard if the public-policy assistant should use Gemini.

Render builds `Dockerfile.backend`. The container runs `alembic upgrade head`, starts FastAPI on Render's `PORT`, and then serves `/health`. Record the resulting URL, such as `https://quiet-ledger-api.onrender.com`.

## 3. Deploy the frontend on Netlify

Import the same repository into Netlify. `netlify.toml` sets the build command to `npm run build`, publishes `dist`, supplies the SPA fallback for `/guide` and `/privacy`, and adds baseline response headers.

Set these build environment variables in Netlify:

- `VITE_API_BASE_URL`: the Render origin, with no trailing slash.
- `VITE_MIDNIGHT_NETWORK`: `preview` or `preprod`.
- `VITE_CONTRACT_ADDRESS`: the verified deployed Midnight contract address.
- `VITE_CONTRACT_ARTIFACT_URL`: the public path or URL for the generated Compact client artifact.

Every `VITE_*` value is embedded in the browser bundle. Never place database credentials, Gemini keys, wallet secrets, or private witness material in a `VITE_*` variable.

## 4. Close the CORS loop

After Netlify assigns the final production URL, confirm that Render's `CORS_ORIGINS` matches it exactly. Trigger a Render redeploy if you changed the value. Add comma-separated origins only when both a preview and production frontend genuinely need API access.

## 5. Release verification

- Confirm `GET <render-url>/health` returns `status: ok` and the expected release identifier.
- Confirm `GET <render-url>/api/v1/metrics` succeeds from the Netlify site without a CORS error.
- Open `/guide` and `/privacy` directly on Netlify to verify the SPA rewrite.
- Complete the connected-wallet journey and verify that a receipt appears only after the wallet returns a real transaction identifier.
- Confirm Render logs and any analytics exclude API request bodies on worker routes.

## Operational rules

- Production refuses SQLite and wildcard CORS.
- API responses carry request IDs and defensive response headers; public API routes are marked `no-store`.
- Keep proof generation in the wallet/browser or a worker-controlled prover. Never move private witnesses to Render.
- Use the direct Neon URL only for migrations and the pooled URL for normal API traffic.
- Treat browser session storage as temporary state, not as a wallet or hardware security boundary.
