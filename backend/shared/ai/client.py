"""
backend/shared/ai/client.py
Gemini API client initialization and authentication factory.
"""

import logging
from google import genai
from backend.shared.config import settings

logger = logging.getLogger("ApexMind.AI.Client")


def get_gemini_client() -> genai.Client | None:
    """Dynamically initializes or retrieves the GenAI client with the latest environment key."""
    key = settings.GEMINI_API_KEY
    if not key or not key.strip():
        return None
    try:
        return genai.Client(api_key=key.strip())
    except Exception as err:
        logger.warning(f"Could not initialize GenAI client: {err}")
        return None

