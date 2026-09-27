import json
import logging
from uuid import uuid4
from contextlib import asynccontextmanager
from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from .database import engine, get_session
from .gemini import compose_plan
from .models import Base, ProofReceipt, PublicRequest
from .privacy import public_requirement_hash
from .schemas import Metrics, PolicyPlan, PolicyRequest, ReceiptCreate, ServiceStatus
from .settings import get_settings

logger = logging.getLogger("quiet_ledger.api")
settings = get_settings()

@asynccontextmanager
async def lifespan(_: FastAPI):
    if settings.should_bootstrap_schema:
        async with engine.begin() as connection:
            await connection.run_sync(Base.metadata.create_all)
    try:
        yield
    finally:
        await engine.dispose()

app = FastAPI(
    title="Quiet Ledger public API",
    version="0.2.0",
    lifespan=lifespan,
    docs_url="/api/docs" if settings.environment != "production" else None,
    redoc_url=None,
)
if settings.allowed_origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins,
        allow_methods=["GET", "POST"],
        allow_headers=["Content-Type", "X-Request-ID"],
        expose_headers=["X-Request-ID"],
        max_age=600,
    )


@app.middleware("http")
async def attach_operational_headers(request: Request, call_next):
    request_id = request.headers.get("X-Request-ID") or str(uuid4())
    try:
        response = await call_next(request)
    except Exception:
        logger.exception("Unhandled API error request_id=%s path=%s", request_id, request.url.path)
        response = JSONResponse(status_code=500, content={"detail": "The service could not complete this request.", "request_id": request_id})
    response.headers["X-Request-ID"] = request_id
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Referrer-Policy"] = "no-referrer"
    if request.url.path.startswith("/api/"):
        response.headers["Cache-Control"] = "no-store"
    return response


@app.exception_handler(RequestValidationError)
async def validation_error(_: Request, __: RequestValidationError):
    return JSONResponse(status_code=422, content={"detail": "The public payload was invalid or contains prohibited fields."})

@app.get("/health", response_model=ServiceStatus)
async def health(session: AsyncSession = Depends(get_session)):
    await session.execute(select(1))
    return ServiceStatus(status="ok", storage="public metadata only", release=settings.release_id)

@app.get("/api/v1/metrics", response_model=Metrics)
async def metrics(session: AsyncSession = Depends(get_session)):
    count = await session.scalar(select(func.count()).select_from(ProofReceipt)) or 0
    windows = await session.scalar(select(func.count(func.distinct(ProofReceipt.window_id)))) or 0
    return Metrics(finalized_receipts=count, unique_windows=windows)

@app.post("/api/v1/public-policy-plan", response_model=PolicyPlan)
async def policy_plan(payload: PolicyRequest, session: AsyncSession = Depends(get_session)):
    plan, source = await compose_plan(payload.requirement)
    digest = public_requirement_hash(payload.requirement)
    if not await session.scalar(select(PublicRequest).where(PublicRequest.requirement_hash == digest)):
        session.add(PublicRequest(requirement_hash=digest, plan_source=source))
        try:
            await session.commit()
        except IntegrityError:
            await session.rollback()
    return plan

@app.post("/api/v1/proof-receipts", status_code=201)
async def create_receipt(payload: ReceiptCreate, session: AsyncSession = Depends(get_session)):
    if await session.scalar(select(ProofReceipt).where(ProofReceipt.transaction_id == payload.transaction_id)):
        raise HTTPException(status_code=409, detail="Receipt already recorded")
    session.add(ProofReceipt(transaction_id=payload.transaction_id, network=payload.network, window_id=payload.window_id, disclosure_scope=json.dumps(payload.disclosure_scope)))
    try:
        await session.commit()
    except IntegrityError:
        await session.rollback()
        raise HTTPException(status_code=409, detail="Receipt already recorded") from None
    return {"accepted": True}
