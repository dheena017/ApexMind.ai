"""
backend/shared/gemini.py
Backward-compatibility facade for the modular Gemini AI infrastructure.

Preserves exact API signatures and imports for all existing callers in workspace/service.py,
router.py, and elsewhere while delegating to the modular providers in backend.shared.ai.
"""

import logging
from typing import Any

from backend.shared.ai.client import get_gemini_client
from backend.shared.ai.rate_tracker import GeminiRateTracker, rate_tracker
from backend.shared.ai.model_registry import resolve_script_model, resolve_tts_model
from backend.shared.ai.providers.gemini.audio_utils import (
    convert_l16_pcm_to_wav,
    extract_voiceover_audio,
    calculate_audio_duration,
    normalize_voiceover_text,
)
from backend.shared.ai.providers.gemini.voice_generator import (
    generate_gemini_voiceover,
    DEFAULT_TONE_MODULATION,
)
from backend.shared.ai.providers.gemini.metadata_generator import generate_gemini_metadata
from backend.shared.ai.providers.gemini.script_generator import (
    generate_gemini_script,
    _generate_script_with_fallback,
    _build_emergency_theme_script,
    parse_target_seconds,
    expand_storyboard_to_target_duration,
    SCRIPT_SYSTEM_INSTRUCTION,
    DEFAULT_DUCKING_CONFIG,
    CTA_EXCLUSION_TERMS,
)

logger = logging.getLogger("ApexMind.Gemini.Facade")
gemini_client = get_gemini_client()

__all__ = [
    "get_gemini_client",
    "gemini_client",
    "GeminiRateTracker",
    "rate_tracker",
    "resolve_script_model",
    "resolve_tts_model",
    "normalize_voiceover_text",
    "convert_l16_pcm_to_wav",
    "extract_voiceover_audio",
    "calculate_audio_duration",
    "parse_target_seconds",
    "expand_storyboard_to_target_duration",
    "_generate_script_with_fallback",
    "_build_emergency_theme_script",
    "generate_gemini_script",
    "generate_gemini_voiceover",
    "generate_gemini_metadata",
    "SCRIPT_SYSTEM_INSTRUCTION",
    "DEFAULT_DUCKING_CONFIG",
    "DEFAULT_TONE_MODULATION",
    "CTA_EXCLUSION_TERMS",
]
