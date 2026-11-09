"""
backend/features/workspace/script_ai/service.py
Central AI Script, Storyboard, and Metadata service.
Orchestrates:
- AI Storyboard Script Generation (Stage 1 Studio Pipeline)
- Core Gemini multi-scene script creation & notifications
- High-CTR viral metadata generation (titles, SEO description, hashtags)
- Gemini model discovery & resolution
"""

from datetime import datetime, timezone
import logging
from typing import Any, Dict, Optional

from backend.database.repository import add_notification
from backend.shared.ai_models import DEFAULT_SCRIPT_MODEL, resolve_script_model
from .providers import (
    GeminiMetadataProvider,
    GeminiScriptProvider,
    get_ai_script_models,
)

logger = logging.getLogger("ApexMind.Workspace.ScriptAIService")

_SCRIPT_PROVIDER = GeminiScriptProvider()
_METADATA_PROVIDER = GeminiMetadataProvider()

STAGE_ID: str = "script"
DEFAULT_ASPECT_RATIO: str = "9:16"


def get_script_providers_status() -> Dict[str, bool]:
    """Returns connectivity status for AI script and metadata providers."""
    return {
        "gemini_script": _SCRIPT_PROVIDER.is_configured(),
        "gemini_metadata": _METADATA_PROVIDER.is_configured(),
    }


def generate_script(
    category: str,
    topic: str,
    tone: str = "",
    length: str = "",
    model: str = DEFAULT_SCRIPT_MODEL,
    audio_mood: Optional[str] = None,
    background_style: Optional[str] = None,
    text_style: Optional[str] = None,
    video_style: Optional[str] = None,
    voice_name: Optional[str] = None,
    aspect_ratio: Optional[str] = None,
    music_track: Optional[str] = None,
    caption_style: Optional[str] = None,
    visual_theme: Optional[str] = None,
    motion_style: Optional[str] = None,
    output_format: Optional[str] = None,
    creative_context: Optional[Dict[str, Any]] = None,
    available_assets: Optional[Dict[str, Any]] = None,
    user_prompt: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Core script generation orchestrator.
    Generates structured script + storyboard scenes and dispatches in-app notification.
    """
    effective_aspect = aspect_ratio or DEFAULT_ASPECT_RATIO
    data = _SCRIPT_PROVIDER.generate_script(
        category=category,
        topic=topic,
        tone=tone,
        length=length,
        model=model,
        audio_mood=audio_mood,
        background_style=background_style,
        text_style=text_style,
        video_style=video_style,
        voice_name=voice_name,
        aspect_ratio=effective_aspect,
        music_track=music_track,
        caption_style=caption_style,
        visual_theme=visual_theme,
        motion_style=motion_style,
        output_format=output_format,
        creative_context=creative_context,
        available_assets=available_assets,
        user_prompt=user_prompt,
    )

    scenes_count = len(data.get("storyboard") or data.get("scenes") or [])
    logger.debug(
        f"Generated AI script: '{data.get('title')}' ({scenes_count} scenes, "
        f"{data.get('estimatedDuration', '30s')})"
    )

    try:
        add_notification(
            title="AI Script Crafted",
            message=f"Generated script: '{data.get('title')}' in {category or 'General Motivation'}",
            type="info",
            category="studio",
            action_url="/workspace",
        )
    except Exception as e:
        logger.warning(f"Could not dispatch script notification: {e}")

    return {
        "success": True,
        "data": data,
        "memoryCount": 0,
    }


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
) -> Dict[str, Any]:
    """
    Studio pipeline Stage 1: Generate AI script + storyboard.
    Wraps generated script data into the standard Stage 1 envelope.
    """
    effective_model = resolve_script_model(model)
    logger.info(
        f"[Studio/Script] Starting Stage 1 | category='{category}' "
        f"topic='{topic}' model={effective_model} aspect={aspect_ratio}"
    )

    effective_topic = user_prompt.strip() if user_prompt and user_prompt.strip() else topic

    result = generate_script(
        category=category,
        topic=effective_topic,
        tone=tone,
        length=length,
        model=effective_model,
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
        user_prompt=user_prompt,
    )

    logger.info(
        f"[Studio/Script] Stage 1 complete | title='{result.get('data', {}).get('title')}' "
        f"scenes={len(result.get('data', {}).get('storyboard', []))}"
    )

    return {
        "success": True,
        "stageId": STAGE_ID,
        "data": result.get("data", {}),
        "memoryCount": result.get("memoryCount", 0),
        "generatedAt": datetime.now(timezone.utc).isoformat(),
    }


def generate_metadata(
    category: str = "",
    topic: str = "",
    title: str = "",
    hook: str = "",
    quote: str = "",
    cta: str = "",
    model: Optional[str] = None,
) -> Dict[str, Any]:
    """Generates viral titles, SEO description, hashtags, and quotes."""
    return _METADATA_PROVIDER.generate_metadata(
        category=category,
        topic=topic,
        title=title,
        hook=hook,
        quote=quote,
        cta=cta,
        model=model,
    )


def get_available_ai_models() -> Dict[str, Any]:
    """Returns available Gemini text/script generation models."""
    return get_ai_script_models()

