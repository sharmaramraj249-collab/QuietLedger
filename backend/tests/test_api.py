import pytest
import pytest_asyncio
from uuid import uuid4
from httpx import ASGITransport, AsyncClient
from app.main import app

@pytest_asyncio.fixture
async def client():
    async with app.router.lifespan_context(app):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as test_client:
            yield test_client

@pytest.mark.asyncio
async def test_health(client: AsyncClient):
    response = await client.get("/health")
    assert response.status_code == 200 and response.json()["status"] == "ok"
    assert response.headers["X-Request-ID"]
    assert response.headers["X-Content-Type-Options"] == "nosniff"

@pytest.mark.asyncio
async def test_gemini_fallback_is_structured(client: AsyncClient):
    response = await client.post("/api/v1/public-policy-plan", json={"requirement": "One worker may participate once."})
    assert response.status_code == 200 and response.json()["headline"]

@pytest.mark.asyncio
async def test_public_receipt_rejects_private_field(client: AsyncClient):
    response = await client.post("/api/v1/proof-receipts", json={"transaction_id": "tx-public-123", "network": "preprod", "window_id": "2026-04", "disclosure_scope": ["credential secret"]})
    assert response.status_code == 422

@pytest.mark.asyncio
async def test_policy_rejects_non_public_text(client: AsyncClient):
    response = await client.post("/api/v1/public-policy-plan", json={"requirement": "My credential secret is personal"})
    assert response.status_code == 422

@pytest.mark.asyncio
async def test_api_responses_are_not_cacheable(client: AsyncClient):
    response = await client.get("/api/v1/metrics")
    assert response.headers["Cache-Control"] == "no-store"

@pytest.mark.asyncio
async def test_receipt_and_metrics(client: AsyncClient):
    receipt = {"transaction_id": f"tx-final-{uuid4()}", "network": "preview", "window_id": "2026-04", "disclosure_scope": ["aggregate signal count"]}
    assert (await client.post("/api/v1/proof-receipts", json=receipt)).status_code == 201
    assert (await client.post("/api/v1/proof-receipts", json=receipt)).status_code == 409
    assert (await client.get("/api/v1/metrics")).json()["finalized_receipts"] >= 1
