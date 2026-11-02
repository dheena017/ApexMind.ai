import logging
from typing import Dict, Any, Optional
from .repository import (
    fetch_media_library,
)
from backend.shared.gemini import generate_gemini_script, generate_gemini_voiceover
from backend.shared.config import settings
from backend.database.repository import add_notification

# ==============================================================================
# Defaults & Fixed Constants (Placed at Top Below Imports)
# ==============================================================================

DEFAULT_SCRIPT_MODEL: str = settings.DEFAULT_SCRIPT_MODEL
DEFAULT_ASPECT_RATIO: str = "9:16"

logger = logging.getLogger("ApexMind.Workspace")


def generate_script(
    category: str,
    topic: str,
    tone: str = "",
    length: str = "",
    model: str = DEFAULT_SCRIPT_MODEL,
    audio_mood: str | None = None,
    background_style: str | None = None,
    text_style: str | None = None,
    video_style: str | None = None,
    voice_name: str | None = None,
    aspect_ratio: str | None = None,
    music_track: str | None = None,
    caption_style: str | None = None,
    visual_theme: str | None = None,
    motion_style: str | None = None,
    output_format: str | None = None,
    creative_context: dict | None = None,
    available_assets: dict | None = None,
    user_prompt: str | None = None,
) -> Dict[str, Any]:
    aspect_ratio = aspect_ratio or DEFAULT_ASPECT_RATIO
    logger.debug(f"Crafting AI script & storyboard | Theme: '{category}' | Topic: '{topic}' | Voice: '{voice_name or 'Default'}' | Model: {model}")
    merged_assets = dict(available_assets or {})

    data = generate_gemini_script(
        category=category,
        topic=topic,
        tone=tone,
        length=length,
        memory_quotes=[],
        model=model,
        audio_mood=audio_mood,
        background_style=background_style,
        text_style=text_style,
        video_style=video_style,
        voice_name=voice_name,
        aspect_ratio=aspect_ratio,
        music_track=music_track,
        caption_style=caption_style,
        visual_theme=visual_theme,
        motion_style=motion_style,
        output_format=output_format,
        creative_context=creative_context,
        available_assets=merged_assets,
        user_prompt=user_prompt,
    )
    if data.get("title") and data.get("quote"):
        scenes_count = len(data.get("storyboard") or data.get("scenes") or [])
        logger.debug(f"Generated AI script: '{data.get('title')}' ({scenes_count} scenes, {data.get('estimatedDuration', '30s')})")
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

def synthesize_voiceover(text: str, voice_name: str | None, model: str | None = None, storyboard: list | None = None) -> Dict[str, Any]:
    if not voice_name or not str(voice_name).strip():
        raise ValueError("Voice name is required. Please select a workspace voice before generating audio.")
    logger.debug(f"Synthesizing voiceover audio for voice '{voice_name}' | Length: {len(text)} characters | Model: {model or 'gemini'}")
    result = generate_gemini_voiceover(text=text, voice_name=voice_name, model=model, storyboard=storyboard)
    dur_display = result.get("durationFormatted") or (f"{result['duration']}s" if result.get("duration") else "0s")
    logger.debug(f"Voiceover audio ready: voice '{voice_name}' | Duration: {dur_display}")
    try:
        add_notification(
            title="Voiceover Synthesized",
            message=f"Voice track rendered using voice '{voice_name}'",
            type="success",
            category="studio",
            action_url="/workspace",
        )
    except Exception as e:
        logger.warning(f"Could not dispatch voiceover notification: {e}")
    return result

def get_media_library() -> Dict[str, Any]:
    catalog = fetch_media_library()
    logger.debug(f"Retrieved media library catalog: {len(catalog.get('audioTracks', []))} tracks | {len(catalog.get('backdrops', []))} backdrops | {len(catalog.get('voices', []))} voice presets")
    return {"success": True, "data": catalog}



def generate_metadata(
    category: str = "Stoic Mindset & Discipline",
    topic: str = "Daily discipline and focus",
    title: str = "",
    hook: str = "",
    quote: str = "",
    cta: str = "",
    model: Optional[str] = None,
) -> Dict[str, Any]:
    from backend.shared.gemini import generate_gemini_metadata
    return generate_gemini_metadata(
        category=category,
        topic=topic,
        title=title,
        hook=hook,
        quote=quote,
        cta=cta,
        model=model,
    )
