# Production deployment

Quiet Ledger deploys as two services: Netlify serves the Vite frontend, and Render runs the FastAPI backend. The browser sends only reviewed public metadata to the Render origin; it never sends the witness, nullifier secret, raw worker response, or wallet address to the API.

## 1. Prepare Neon

1. Create separate `development` and `production` branches in Neon/Lakebase Postgres.
2. Copy the production branch's pooled URL into Render as `DATABASE_URL`.
3. Copy the production branch's direct, non-pooled URL into Render as `DATABASE_URL_UNPOOLED`.

The Render service uses the pooled connection for normal traffic. The container runs Alembic with the direct connection before starting FastAPI, so the health check cannot pass until the schema is ready. This startup sequence works on the free single-instance service without Render's paid-only pre-deploy command.

## 2. Deploy the API on Render

Create a Blueprint from the repository's `render.yaml`. The Blueprint explicitly selects Render's free web-service plan. Before the first deploy, provide these secret values in Render:

- `DATABASE_URL`: pooled Neon production URL.
- `DATABASE_URL_UNPOOLED`: direct Neon production URL.
- `CORS_ORIGINS`: the exact Netlify production origin, such as `https://quiet-ledger.netlify.app`. Do not add a trailing slash and do not use `*`.
- `GEMINI_API_KEY`: optional; add it in the Render dashboard if the public-policy assistant should use Gemini.

Render builds `Dockerfile.backend`. The container runs `alembic upgrade head`, starts FastAPI on Render's `PORT`, and then serves `/health`. Record the resulting URL, such as `https://quiet-ledger-api.onrender.com`.

## 3. Deploy the frontend on Netlify

Import the same repository into Netlify. `netlify.toml` sets the build command to `npm run build`, publishes `dist`, supplies the SPA fallback for `/guide` and `/privacy`, and adds baseline response headers.

Set these build environment variables in Netlify:

- `VITE_API_BASE_URL`: the Render origin, with no trailing slash.

The frontend supports both Midnight Preview and Preprod in the same deployment. Contract addresses are public routing data, not secrets, so they do not belong in Netlify environment variables. After deploying the Compact contract on each network, edit `public/quiet-ledger.config.json`:

```json
{
  "contractArtifactUrl": "/contracts/quiet-ledger/contract/index.js",
  "networks": {
    "preview": { "contractAddress": "<preview address>", "transactionExplorerUrl": "" },
    "preprod": { "contractAddress": "<preprod address>", "transactionExplorerUrl": "" }
  }
}
```

Keep an address blank until that network is actually deployed; the app will identify it as unavailable instead of submitting to the wrong chain. `transactionExplorerUrl` is optional and can contain a `{txHash}` placeholder. Compile with `npm run contract:compile` and commit the generated `contracts/managed` deployment artifacts before connecting Netlify. The Vite production build publishes them under the configured public artifact path and fails if an address is configured but the generated client is missing.

Only `VITE_API_BASE_URL` is embedded in the browser bundle. Never place database credentials, Gemini keys, wallet secrets, or private witness material in a `VITE_*` variable.

## 4. Close the CORS loop

After Netlify assigns the final production URL, confirm that Render's `CORS_ORIGINS` matches it exactly. Trigger a Render redeploy if you changed the value. Add comma-separated origins only when both a preview and production frontend genuinely need API access.

## 5. Release verification

- Confirm `GET <render-url>/health` returns `status: ok` and the expected release identifier.
- Confirm `GET <render-url>/api/v1/metrics` succeeds from the Netlify site without a CORS error.
- Open `/guide` and `/privacy` directly on Netlify to verify the SPA rewrite.
- Test both Preview and Preprod: changing network must disconnect the current wallet session and require a fresh 1AM authorization.
- Complete the connected-wallet journey and verify that the UI shows the connected wallet address, the selected network's contract address, and a transaction hash found in 1AM transaction history.
- Confirm Render logs and any analytics exclude API request bodies on worker routes.

## Operational rules

- Production refuses SQLite and wildcard CORS.
- API responses carry request IDs and defensive response headers; public API routes are marked `no-store`.
- Keep proof generation in the wallet/browser or a worker-controlled prover. Never move private witnesses to Render.
- Use the direct Neon URL only for migrations and the pooled URL for normal API traffic.
- Treat browser session storage as temporary state, not as a wallet or hardware security boundary.
