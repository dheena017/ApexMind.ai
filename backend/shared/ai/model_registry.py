"""
backend/shared/ai/model_registry.py
AI Model Registry & Resolution facade.
"""

from backend.shared.ai_models import (
    DEFAULT_SCRIPT_MODEL,
    resolve_script_model as resolve_available_script_model,
    resolve_tts_model as resolve_available_tts_model,
    get_script_fallback_models,
    get_tts_fallback_models,
    get_cached_models,
)


def resolve_script_model(model_name: str | None = None) -> str:
    """Select and validate a script model against the dynamically discovered list."""
    return resolve_available_script_model(model_name)


def resolve_tts_model(model_name: str | None = None) -> str:
    """Resolve a supported Gemini TTS model without requiring a hardcoded fallback."""
    return resolve_available_tts_model(model_name)

