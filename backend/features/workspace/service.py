"""
backend/features/workspace/service.py
Workspace Presets & Legacy Media Synthesis Helper Service.
"""

import logging
from typing import Any, Dict, Optional

from backend.database.repository import (
    add_notification,
    get_media_library as db_get_media_library,
)
from backend.shared.gemini import generate_gemini_voiceover

logger = logging.getLogger("ApexMind.Workspace")


def synthesize_voiceover(
    text: str,
    voice_name: Optional[str],
    model: Optional[str] = None,
    storyboard: Optional[list] = None,
) -> Dict[str, Any]:
    """Synthesizes voiceover audio using the shared Gemini TTS engine."""
    if not voice_name or not str(voice_name).strip():
        raise ValueError("Voice name is required. Please select a workspace voice before generating audio.")

    logger.debug(
        f"Synthesizing voiceover audio for voice '{voice_name}' | "
        f"Length: {len(text)} characters | Model: {model or 'gemini'}"
    )
    result = generate_gemini_voiceover(
        text=text,
        voice_name=voice_name,
        model=model,
        storyboard=storyboard,
    )
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
    """Retrieves built-in preset catalog (music tracks, backdrops, and voice profiles)."""
    catalog = db_get_media_library()
    logger.debug(
        f"Retrieved media library catalog: {len(catalog.get('audioTracks', []))} tracks | "
        f"{len(catalog.get('backdrops', []))} backdrops | {len(catalog.get('voices', []))} voice presets"
    )
    return {"success": True, "data": catalog}
