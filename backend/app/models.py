from datetime import datetime
from sqlalchemy import DateTime, String, Text, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

class Base(DeclarativeBase):
    pass

class ProofReceipt(Base):
    __tablename__ = "proof_receipts"
    id: Mapped[int] = mapped_column(primary_key=True)
    transaction_id: Mapped[str] = mapped_column(String(160), unique=True, index=True)
    network: Mapped[str] = mapped_column(String(20))
    window_id: Mapped[str] = mapped_column(String(40))
    disclosure_scope: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

class PublicRequest(Base):
    __tablename__ = "public_requests"
    id: Mapped[int] = mapped_column(primary_key=True)
    requirement_hash: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    plan_source: Mapped[str] = mapped_column(String(20))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
