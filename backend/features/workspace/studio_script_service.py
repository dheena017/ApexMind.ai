"""
backend/features/workspace/studio_script_service.py
Stage 1 of the ApexMind Studio Pipeline.
Handles AI script + multi-scene storyboard generation via Gemini.
Thin wrapper that delegates to the existing generate_script() service,
adding a pipeline-ready response envelope with a stageId field.
"""

import logging
from datetime import datetime, timezone
from typing import Any, Dict, Optional

from .service import generate_script
from .repository import fetch_quote_memory

logger = logging.getLogger("ApexMind.Studio.Script")


def run_studio_script(
    category: str,
    topic: str,
    tone: str = "",
    length: str = "",
    model: str = "gemini-2.5-flash",
    aspect_ratio: str = "9:16",
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
) -> Dict[str, Any]:
    """
    Studio pipeline Stage 1: Generate AI script + storyboard.

    Returns a pipeline-ready envelope with:
      - stageId: "script"
      - data: full GeneratedScriptData (storyboard scenes mediaStatus="unresolved")
      - memoryCount: int
      - generatedAt: ISO timestamp
    """
    logger.info(
        f"[Studio/Script] Starting Stage 1 | category='{category}' "
        f"topic='{topic}' model={model} aspect={aspect_ratio}"
    )

    # Merge user prompt into topic if provided
    effective_topic = user_prompt.strip() if user_prompt and user_prompt.strip() else topic

    result = generate_script(
        category=category,
        topic=effective_topic,
        tone=tone,
        length=length,
        model=model,
        audio_mood=audio_mood,
        background_style=background_style or (backdrop_id or ""),
        text_style=text_style or (caption_style_preset or ""),
        video_style=video_style,
        voice_name=voice_name,
        aspect_ratio=aspect_ratio,
        music_track=music_track_id,
        caption_style=caption_style_preset,
        visual_theme=visual_theme or backdrop_id,
        motion_style=motion_style,
        output_format=output_format,
        creative_context=creative_context,
        available_assets=available_assets,
    )

    logger.info(
        f"[Studio/Script] Stage 1 complete | title='{result.get('data', {}).get('title')}' "
        f"scenes={len(result.get('data', {}).get('storyboard', []))}"
    )

    return {
        "success": True,
        "stageId": "script",
        "data": result.get("data", {}),
        "memoryCount": result.get("memoryCount", 0),
        "generatedAt": datetime.now(timezone.utc).isoformat(),
    }

