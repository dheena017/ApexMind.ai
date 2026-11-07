"""
backend/features/workspace/script_generation/prompt_builder.py
Prompt construction orchestrator for ApexMind script generation.
"""

from typing import Tuple
from .prompts.motivational_reel import MOTIVATIONAL_REEL_SYSTEM_PROMPT, build_motivational_prompt
from .prompts.cinematic_3d_story import CINEMATIC_3D_SYSTEM_PROMPT, build_cinematic_3d_prompt


def build_generation_prompt(
    category: str,
    topic: str,
    user_prompt: str | None = None,
    generation_profile: str = "motivational_reel",
    tone: str | None = None,
    length: str = "30 seconds",
    aspect_ratio: str = "9:16",
    visual_style: str | None = None,
    subtitle_style: str | None = None,
    music_mood: str | None = None,
) -> Tuple[str, str]:
    """
    Returns (system_instruction, user_prompt) tailored to the requested generation profile.
    """
    if generation_profile == "cinematic_3d_story":
        system_instruction = CINEMATIC_3D_SYSTEM_PROMPT
        prompt = build_cinematic_3d_prompt(
            category=category,
            topic=topic,
            user_prompt=user_prompt,
            tone=tone,
            length=length,
            aspect_ratio=aspect_ratio,
            visual_style=visual_style,
            subtitle_style=subtitle_style,
            music_mood=music_mood,
        )
    else:
        system_instruction = MOTIVATIONAL_REEL_SYSTEM_PROMPT
        prompt = build_motivational_prompt(
            category=category,
            topic=topic,
            user_prompt=user_prompt,
            tone=tone,
            length=length,
            aspect_ratio=aspect_ratio,
            visual_style=visual_style,
            subtitle_style=subtitle_style,
            music_mood=music_mood,
        )

    return system_instruction, prompt

