import hashlib
import re
from .schemas import PolicyPlan

SENSITIVE = re.compile(r"(seed phrase|mnemonic|0x[a-f0-9]{40,}|\b\d{12,19}\b|\b[A-Z]{2}\d{2}[A-Z0-9]{11,30}\b)", re.I)

def redact_public_text(value: str) -> str:
    return SENSITIVE.sub("[redacted]", value)

def local_plan(_: str) -> PolicyPlan:
    return PolicyPlan(headline="A proof, not a profile", explanation="The service checks the public window rule against your local eligibility material. It does not need your identity or the material itself.", disclosures=["eligibility condition holds", "active listening window", "aggregate signal count"])

def public_requirement_hash(value: str) -> str:
    return hashlib.sha256(value.encode()).hexdigest()
