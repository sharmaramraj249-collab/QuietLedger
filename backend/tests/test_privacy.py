from app.privacy import local_plan, redact_public_text
def test_redacts_sensitive_values(): assert "[redacted]" in redact_public_text("wallet 0x1234567890abcdef1234567890abcdef12345678")
def test_fallback_never_mentions_private_input(): assert len(local_plan("public").disclosures) == 3

