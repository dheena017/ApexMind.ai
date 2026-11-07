"""
backend/shared/ai/providers/gemini/__init__.py
Modular Gemini Provider implementation.
"""

from .client import get_gemini_client
from .audio_utils import (
    convert_l16_pcm_to_wav,
    extract_voiceover_audio,
    calculate_audio_duration,
    normalize_voiceover_text,
)
from .response_parser import parse_gemini_json_response
from .script_generator import (
    generate_gemini_script,
    parse_target_seconds,
    expand_storyboard_to_target_duration,
)
from .voice_generator import generate_gemini_voiceover
from .metadata_generator import generate_gemini_metadata

__all__ = [
    "get_gemini_client",
    "convert_l16_pcm_to_wav",
    "extract_voiceover_audio",
    "calculate_audio_duration",
    "normalize_voiceover_text",
    "parse_gemini_json_response",
    "generate_gemini_script",
    "parse_target_seconds",
    "expand_storyboard_to_target_duration",
    "generate_gemini_voiceover",
    "generate_gemini_metadata",
]

