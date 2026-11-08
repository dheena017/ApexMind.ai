"""
backend/shared/script/__init__.py
Modular Stage 1 AI Script & Storyboard Production Package.
Separated into specialized modules for script writing, viral hook creation,
storyboard scene direction, sound design, and composite orchestration.
"""

from .constants import (
    CTA_EXCLUSION_TERMS,
    DEFAULT_DUCKING_CONFIG,
    DEFAULT_TONE_MODULATION,
    SCRIPT_SYSTEM_INSTRUCTION,
    parse_target_seconds,
)
from .script_writer import write_script
from .hooks_generator import generate_hooks
from .storyboard_generator import generate_storyboard
from .sound_designer import design_sound
from .composite import generate_full_script

__all__ = [
    "CTA_EXCLUSION_TERMS",
    "DEFAULT_DUCKING_CONFIG",
    "DEFAULT_TONE_MODULATION",
    "SCRIPT_SYSTEM_INSTRUCTION",
    "parse_target_seconds",
    "write_script",
    "generate_hooks",
    "generate_storyboard",
    "design_sound",
    "generate_full_script",
]

