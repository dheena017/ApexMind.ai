import logging
from fastapi import APIRouter

from backend.shared.config import settings

logger = logging.getLogger("ApexMind.Settings")
router = APIRouter(prefix="/api/settings", tags=["Settings"])


@router.get(
    "/gemini",
    summary="Get Gemini API configuration status",
    description="Reports whether the server has a Gemini API key configured. Does not expose the key or claim account credit data.",
)
def get_gemini_api_status() -> dict[str, bool | str]:
    is_conf = bool(settings.GEMINI_API_KEY.strip())
    logger.info(f"Verified Gemini AI API configuration status ➔ Configured: {is_conf}")
    return {
        "configured": is_conf,
        "usageUrl": "https://aistudio.google.com/usage",
    }
