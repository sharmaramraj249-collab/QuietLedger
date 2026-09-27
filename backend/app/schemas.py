import re

from pydantic import BaseModel, ConfigDict, Field, field_validator

PRIVATE_FIELDS = {"secret", "credential", "witness", "seed", "phrase", "document", "address", "identity", "note", "response", "bid", "salary"}
WALLET_OR_EMAIL = re.compile(r"(?:0x[a-fA-F0-9]{20,}|\b[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}\b)")

class PolicyRequest(BaseModel):
    requirement: str = Field(min_length=4, max_length=1000)

    @field_validator("requirement")
    @classmethod
    def require_public_policy_text(cls, value: str) -> str:
        lowered = value.lower()
        if any(word in lowered for word in PRIVATE_FIELDS) or WALLET_OR_EMAIL.search(value):
            raise ValueError("Policy requests must contain public policy text only")
        return value

class PolicyPlan(BaseModel):
    headline: str = Field(max_length=100)
    explanation: str = Field(max_length=500)
    disclosures: list[str] = Field(max_length=5)

class ReceiptCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    transaction_id: str = Field(min_length=8, max_length=160, pattern=r"^[A-Za-z0-9_.:-]+$")
    network: str = Field(pattern="^(preview|preprod)$")
    window_id: str = Field(min_length=3, max_length=40, pattern=r"^[A-Za-z0-9_.:-]+$")
    disclosure_scope: list[str] = Field(min_length=1, max_length=8)

    @field_validator("disclosure_scope")
    @classmethod
    def reject_private_words(cls, values: list[str]) -> list[str]:
        joined = " ".join(values).lower()
        if any(word in joined for word in PRIVATE_FIELDS):
            raise ValueError("Public receipt payload may not name private fields")
        if WALLET_OR_EMAIL.search(joined):
            raise ValueError("Public receipt payload may not contain an address or email")
        return values

class Metrics(BaseModel):
    finalized_receipts: int
    unique_windows: int


class ServiceStatus(BaseModel):
    status: str
    storage: str
    release: str
