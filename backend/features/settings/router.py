from fastapi import APIRouter

from backend.shared.config import settings

router = APIRouter(prefix="/api/settings", tags=["Settings"])


@router.get(
    "/gemini",
    summary="Get Gemini API configuration status",
    description="Reports whether the server has a Gemini API key configured. Does not expose the key or claim account credit data.",
)
def get_gemini_api_status() -> dict[str, bool | str]:
    return {
        "configured": bool(settings.GEMINI_API_KEY.strip()),
        "usageUrl": "https://aistudio.google.com/usage",
    }
