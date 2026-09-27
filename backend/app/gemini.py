from google import genai
from .privacy import local_plan, redact_public_text
from .schemas import PolicyPlan
from .settings import get_settings

async def compose_plan(requirement: str) -> tuple[PolicyPlan, str]:
    settings = get_settings()
    safe_requirement = redact_public_text(requirement)
    if not settings.gemini_api_key or safe_requirement != requirement:
        return local_plan(safe_requirement), "local"
    try:
        client = genai.Client(api_key=settings.gemini_api_key)
        response = client.models.generate_content(
            model=settings.gemini_model,
            contents=f"Explain only this public proof policy. Do not request personal data: {safe_requirement}",
            config={"response_mime_type": "application/json", "response_schema": PolicyPlan},
        )
        return PolicyPlan.model_validate_json(response.text), "gemini"
    except Exception:
        return local_plan(safe_requirement), "local"

