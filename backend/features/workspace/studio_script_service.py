"""
backend/features/workspace/studio_script_service.py
Stage 1 of the ApexMind Studio Pipeline.
Handles AI script + multi-scene storyboard generation via modular Script Generation service.
Returns complete ScriptGenerationResponse envelope while maintaining full backward compatibility.
"""

import logging
from datetime import datetime, timezone
from typing import Any, Dict, Optional

from backend.features.workspace.script_generation.generation_service import run_script_generation
from backend.shared.ai_models import DEFAULT_SCRIPT_MODEL

STAGE_ID: str = "script"
DEFAULT_ASPECT_RATIO: str = "9:16"

logger = logging.getLogger("ApexMind.Studio.Script")


def run_studio_script(
    category: str,
    topic: str,
    tone: str = "",
    length: str = "",
    model: str = DEFAULT_SCRIPT_MODEL,
    aspect_ratio: str = DEFAULT_ASPECT_RATIO,
    voice_name: Optional[str] = None,
    music_track_id: Optional[str] = None,
    caption_style_preset: Optional[str] = None,
    backdrop_id: Optional[str] = None,
    audio_mood: Optional[str] = None,
    background_style: Optional[str] = None,
    text_style: Optional[str] = None,
    video_style: Optional[str] = None,
    visual_theme: Optional[str] = None,
    motion_style: Optional[str] = None,
    output_format: Optional[str] = None,
    creative_context: Optional[Dict[str, Any]] = None,
    available_assets: Optional[Dict[str, Any]] = None,
    user_prompt: Optional[str] = None,
    generation_profile: str = "motivational_reel",
    visual_style: Optional[str] = None,
    subtitle_style: Optional[str] = None,
    music_mood: Optional[str] = None,
    project_id: Optional[str] = None,
    user_id: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Studio pipeline Stage 1: Generate AI script + storyboard.
    Delegates to run_script_generation to support both motivational_reel and cinematic_3d_story.
    """
    effective_topic = user_prompt.strip() if user_prompt and user_prompt.strip() else topic
    effective_visual_style = visual_style or background_style or visual_theme or backdrop_id or "dark_cinematic"
    effective_subtitle_style = subtitle_style or caption_style_preset or text_style or "hormozi"
    effective_music_mood = music_mood or audio_mood or "orchestral"

    logger.info(
        f"[Studio/Script] Starting Stage 1 | profile='{generation_profile}' "
        f"category='{category}' topic='{effective_topic}' model={model} aspect={aspect_ratio}"
    )

    result = run_script_generation(
        category=category,
        topic=effective_topic,
        user_prompt=user_prompt,
        generation_profile=generation_profile,
        tone=tone,
        length=length or "30 seconds",
        model=model,
        aspect_ratio=aspect_ratio or DEFAULT_ASPECT_RATIO,
        voice_name=voice_name,
        visual_style=effective_visual_style,
        subtitle_style=effective_subtitle_style,
        music_mood=effective_music_mood,
        project_id=project_id,
        user_id=user_id,
        music_track_id=music_track_id,
        creative_context=creative_context,
        available_assets=available_assets,
    )

    logger.info(
        f"[Studio/Script] Stage 1 complete | id='{result.get('generationId')}' "
        f"scenes={len(result.get('script', {}).get('scenes', []))}"
    )

    return result
