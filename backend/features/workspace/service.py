"""
backend/features/workspace/service.py
Workspace Presets & Media Synthesis Service.
Provides centralized catalog access and backward-compatible voiceover routing.
"""

import logging
from typing import Any, Dict, Optional

from backend.database.repository import (
    add_notification,
    get_media_library as db_get_media_library,
)
from backend.features.workspace.studio.voice_service import synthesize_voice_audio

logger = logging.getLogger("ApexMind.Workspace.Service")


def synthesize_voiceover(
    text: str,
    voice_name: Optional[str],
    model: Optional[str] = None,
    storyboard: Optional[list] = None,
) -> Dict[str, Any]:
    """
    Synthesizes voiceover audio by delegating to the Studio Stage 2 Voice Service.
    Maintains 100% backward compatibility for legacy /api/generate-voiceover callers.
    """
    if not voice_name or not str(voice_name).strip():
        raise ValueError("Voice name is required. Please select a workspace voice before generating audio.")

    clean_text = (text or "").strip()
    if not clean_text:
        raise ValueError("Text is required for voiceover synthesis.")

    # Delegate to the modernized Studio Stage 2 voice synthesis engine
    result = synthesize_voice_audio(
        voice_name=voice_name,
        text=clean_text,
        model=model,
    )

    raw_sec = float(result.get("rawDurationSeconds", 0.0))
    dur_display = f"{raw_sec:.1f}s" if raw_sec > 0 else "0s"

    try:
        add_notification(
            title="Voiceover Synthesized",
            message=f"Voice track rendered using voice '{voice_name}' ({dur_display})",
            type="success",
            category="studio",
            action_url="/workspace",
        )
    except Exception as e:
        logger.warning(f"Could not dispatch voiceover notification: {e}")

    return {
        "success": True,
        "voiceName": voice_name,
        "mimeType": result.get("mimeType", "audio/wav"),
        "audioBase64": result.get("audioBase64"),
        "audioUrl": result.get("audioUrl"),
        "duration": raw_sec,
        "durationFormatted": dur_display,
        "toneModulation": result.get("toneModulation"),
        "message": "Voiceover synthesized successfully",
    }


def get_media_library() -> Dict[str, Any]:
    """Retrieves built-in preset catalog (music tracks, backdrops, and voice profiles)."""
    catalog = db_get_media_library()
    logger.debug(
        f"Retrieved media library catalog: {len(catalog.get('audioTracks', []))} tracks | "
        f"{len(catalog.get('backdrops', []))} backdrops | {len(catalog.get('voices', []))} voice presets"
    )
    return {"success": True, "data": catalog}
