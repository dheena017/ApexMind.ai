"""
backend/shared/ai/__init__.py
Core AI infrastructure package for ApexMind.ai.
"""

from .client import get_gemini_client
from .rate_tracker import GeminiRateTracker, rate_tracker
from .model_registry import resolve_script_model, resolve_tts_model

__all__ = [
    "get_gemini_client",
    "GeminiRateTracker",
    "rate_tracker",
    "resolve_script_model",
    "resolve_tts_model",
]

