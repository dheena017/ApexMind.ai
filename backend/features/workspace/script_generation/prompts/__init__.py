"""
backend/features/workspace/script_generation/prompts/__init__.py
Prompt templates for script generation profiles.
"""

from .base_prompt import format_creative_brief
from .motivational_reel import MOTIVATIONAL_REEL_SYSTEM_PROMPT, build_motivational_prompt
from .cinematic_3d_story import CINEMATIC_3D_SYSTEM_PROMPT, build_cinematic_3d_prompt

__all__ = [
    "format_creative_brief",
    "MOTIVATIONAL_REEL_SYSTEM_PROMPT",
    "build_motivational_prompt",
    "CINEMATIC_3D_SYSTEM_PROMPT",
    "build_cinematic_3d_prompt",
]

