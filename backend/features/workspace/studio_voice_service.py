"""
backend/features/workspace/studio_voice_service.py
Stage 2 of the ApexMind Studio Pipeline.
Synthesizes a full narration voiceover from storyboard subtitle texts
using Gemini TTS. Returns audioUrl, durationSeconds, and word-level timestamps.
"""

import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from .service import synthesize_voiceover

logger = logging.getLogger("ApexMind.Studio.Voice")


def _assemble_narration(
    storyboard: List[Dict[str, Any]],
    full_narration_text: Optional[str],
) -> str:
    """
    Build the full narration string from storyboard subtitle texts.
    Falls back to full_narration_text if provided directly.
    Storyboard takes priority so scene ordering is preserved.
    """
    if storyboard:
        parts = []
        for scene in sorted(storyboard, key=lambda s: s.get("sceneNumber", 0)):
            text = (scene.get("subtitleText") or "").strip()
            if text:
                parts.append(text)
        if parts:
            return " ".join(parts)

    return (full_narration_text or "").strip()


def run_studio_voice(
    voice_name: str,
    storyboard: Optional[List[Dict[str, Any]]] = None,
    full_narration_text: Optional[str] = None,
    model: Optional[str] = None,
    speech_style: Optional[str] = None,
    target_duration_seconds: Optional[float] = None,
) -> Dict[str, Any]:
    """
    Studio pipeline Stage 2: Synthesize AI voiceover.

    Accepts either:
      - storyboard[]  →  auto-assembles narration from subtitleText fields
      - full_narration_text  →  used directly when no storyboard provided

    Returns a pipeline-ready envelope with:
      - stageId: "voice"
      - audioUrl: str (served static file path)
      - durationSeconds: float
      - mimeType: str
      - wordTimestamps: list[{word, start, end, emphasis}]
    """
    if not voice_name or not voice_name.strip():
        raise ValueError("voiceName is required for voice synthesis.")

    narration = _assemble_narration(storyboard or [], full_narration_text)
    if not narration:
        raise ValueError(
            "No narration text could be assembled. "
            "Provide either storyboard[].subtitleText or fullNarrationText."
        )

    logger.info(
        f"[Studio/Voice] Starting Stage 2 | voice='{voice_name}' "
        f"chars={len(narration)} model={model or 'default'}"
    )

    result = synthesize_voiceover(
        text=narration,
        voice_name=voice_name,
        model=model,
        storyboard=storyboard,
    )

    # Enrich with stage metadata and dynamic audio alignment
    import base64
    from .audio_aligner import align_storyboard_to_audio

    duration = float(result.get("duration") or result.get("durationSeconds") or 0.0)
    mime_type = result.get("mimeType", "audio/wav")

    raw_audio_bytes = None
    audio_b64 = result.get("audioBase64")
    if audio_b64:
        try:
            raw_audio_bytes = base64.b64decode(audio_b64)
        except Exception as b64_err:
            logger.debug(f"[Studio/Voice] Could not decode base64 audio for energy alignment: {b64_err}")

    aligned_storyboard = storyboard or []
    word_timestamps: List[Dict[str, Any]] = []

    if storyboard and duration > 0:
        try:
            # Convert storyboard items to plain dicts if they are pydantic models
            raw_sb_dicts = [s if isinstance(s, dict) else s.model_dump() for s in storyboard]
            sfx_drops = [float(s["start"]) for s in raw_sb_dicts if s.get("sfxUrl") and isinstance(s.get("start"), (int, float)) and s.get("start") > 0]
            aligned_storyboard, word_timestamps = align_storyboard_to_audio(
                storyboard=raw_sb_dicts,
                audio_bytes=raw_audio_bytes,
                mime_type=mime_type,
                total_duration_seconds=duration,
                bpm=140.0,
                sfx_drops=sfx_drops,
            )
            logger.info(
                f"[Studio/Voice] High-precision alignment complete: {len(aligned_storyboard)} scenes, "
                f"{len(word_timestamps)} words aligned to audio duration {duration:.2f}s"
            )
        except Exception as align_err:
            logger.warning(f"[Studio/Voice] Alignment fallback notice: {align_err}")
            word_timestamps = result.get("wordTimestamps") or result.get("words") or []
    else:
        word_timestamps = result.get("wordTimestamps") or result.get("words") or []

    raw_url = result.get("audioUrl", "") or ""
    display_url = (raw_url[:35] + "... [base64 audio]") if raw_url.startswith("data:") else raw_url
    logger.info(
        f"[Studio/Voice] Stage 2 complete | voice='{voice_name}' "
        f"duration={duration:.2f}s audioUrl={display_url}"
    )

    return {
        "success": True,
        "stageId": "voice",
        "voiceName": voice_name,
        "mimeType": mime_type,
        "audioUrl": result.get("audioUrl", ""),
        "audioBase64": result.get("audioBase64"),
        "durationSeconds": float(duration),
        "sampleRate": result.get("sampleRate", 24000),
        "channels": result.get("channels", 1),
        "wordTimestamps": word_timestamps,
        "alignedStoryboard": aligned_storyboard,
        "message": result.get("message", "Voiceover synthesized and aligned successfully"),
        "generatedAt": datetime.now(timezone.utc).isoformat(),
    }

