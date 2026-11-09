"""
backend/features/workspace/script_ai/providers/models.py
Gemini AI script and multimodal models manager.
"""

from typing import Any, Dict, List, Tuple
from backend.shared.ai_models import (
    DEFAULT_SCRIPT_MODEL,
    get_available_models,
    get_default_script_model,
    resolve_script_model,
)


def get_ai_script_models() -> Dict[str, Any]:
    """Returns available text/script generation models and the configured default model."""
    script_models, _ = get_available_models()
    return {
        "models": script_models,
        "defaultModel": get_default_script_model(),
    }

