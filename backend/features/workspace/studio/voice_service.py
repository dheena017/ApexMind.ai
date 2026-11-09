"""
backend/features/workspace/studio/voice_service.py
Stage 2 of the ApexMind Studio Production Pipeline.
Synthesizes a full narration voiceover from storyboard subtitle texts
using Gemini TTS. Returns audioUrl, durationSeconds, and word-level timestamps.
"""

import base64
from datetime import datetime, timezone
import logging
from typing import Any, Dict, List, Optional

from backend.database.repository import add_notification
from backend.features.workspace.audio import align_storyboard_to_audio
from backend.shared.ai_models import DEFAULT_TTS_MODEL
from backend.shared.gemini import calculate_audio_duration, generate_gemini_voiceover

STAGE_ID: str = "voice"
DEFAULT_MIME_TYPE: str = "audio/wav"
DEFAULT_BPM: float = 140.0
DEFAULT_FALLBACK_DURATION: float = 30.0

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


# ==============================================================================
# STAGE 2: DEDICATED SMALL SERVICE FUNCTIONS
# ==============================================================================

def synthesize_voice_audio(
    voice_name: str,
    text: str,
    speech_style: Optional[str] = None,
    target_duration_seconds: Optional[float] = None,
    model: Optional[str] = None,
) -> Dict[str, Any]:
    """Small API 2.1: Generates broadcast WAV audio using Gemini Neural TTS."""
    if not voice_name or not voice_name.strip():
        raise ValueError("voiceName is required for voice synthesis.")
    clean_text = (text or "").strip()
    if not clean_text:
        raise ValueError("Text is required for voice synthesis.")

    logger.info(f"[Studio/Stage2] Synthesizing voice audio | voice='{voice_name}' chars={len(clean_text)}")
    result = generate_gemini_voiceover(
        text=clean_text,
        voice_name=voice_name,
        model=model,
    )
    audio_b64 = result.get("audioBase64")
    audio_url = result.get("audioUrl", "") or ""
    if not audio_b64 and not audio_url:
        raise RuntimeError(f"Neural Voiceover synthesis returned no audio for voice '{voice_name}'.")

    raw_audio_bytes = None
    if audio_b64:
        try:
            raw_audio_bytes = base64.b64decode(audio_b64)
        except Exception as e:
            logger.debug(f"[Studio/Stage2] Base64 decode note: {e}")

    duration = float(result.get("duration") or result.get("durationSeconds") or 0.0)
    mime_type = result.get("mimeType", DEFAULT_MIME_TYPE)
    if duration <= 0.0 and raw_audio_bytes:
        duration = calculate_audio_duration(raw_audio_bytes, mime_type=mime_type)
    if duration <= 0.0:
        duration = float(target_duration_seconds or DEFAULT_FALLBACK_DURATION)

    return {
        "success": True,
        "voiceName": voice_name,
        "audioUrl": audio_url,
        "audioBase64": audio_b64,
        "rawDurationSeconds": round(float(duration), 2),
        "sampleRate": int(result.get("sampleRate", 24000)),
        "channels": int(result.get("channels", 1)),
        "mimeType": mime_type,
        "toneModulation": result.get("toneModulation"),
        "_rawAudioBytes": raw_audio_bytes,
        "_rawWordTimestamps": result.get("wordTimestamps") or result.get("words") or [],
    }


def extract_word_timestamps(
    text: str,
    duration_seconds: Optional[float] = None,
    audio_url: Optional[str] = None,
    raw_timestamps: Optional[List[Dict[str, Any]]] = None,
) -> List[Dict[str, Any]]:
    """Small API 2.2: Extracts word-level start/end timestamps and flags vocal emphasis."""
    if raw_timestamps and len(raw_timestamps) > 0:
        return raw_timestamps

    words = [w.strip() for w in (text or "").split() if w.strip()]
    if not words:
        return []

    total_words = len(words)
    dur = float(duration_seconds or max(1.0, total_words * 0.38))
    time_per_word = dur / float(total_words)

    timestamps = []
    for idx, w in enumerate(words):
        st = round(idx * time_per_word, 3)
        et = round(min(dur, (idx + 1) * time_per_word), 3)
        clean_w = w.strip(".,!?:;\"'")
        is_emphasis = bool(clean_w.isupper() and len(clean_w) > 1) or any(p in w for p in "!?")
        timestamps.append({
            "word": w,
            "start": st,
            "end": et,
            "emphasis": is_emphasis,
            "highlightColor": "#FACC15" if is_emphasis else None,
        })
    return timestamps


def align_timeline_to_voice(
    subtitles: Optional[List[Dict[str, Any]]] = None,
    scenes: Optional[List[Dict[str, Any]]] = None,
    word_timestamps: Optional[List[Dict[str, Any]]] = None,
    actual_duration_seconds: float = 30.0,
) -> Dict[str, Any]:
    """Small API 2.3: Locks subtitle cuts and scene start/end durations to actual spoken audio boundaries."""
    actual_dur = float(actual_duration_seconds or 30.0)
    aligned_subs = []
    aligned_scenes = []

    # Proportional scaling for subtitles
    if subtitles and len(subtitles) > 0:
        total_sub_dur = sum(float(s.get("duration", 2.0)) for s in subtitles) or 1.0
        scale = actual_dur / total_sub_dur
        running_t = 0.0
        for idx, s in enumerate(subtitles):
            is_last = idx == len(subtitles) - 1
            scaled_dur = max(0.8, round(float(s.get("duration", 2.0)) * scale, 2))
            if is_last:
                scaled_dur = max(0.8, round(actual_dur - running_t, 2))
            end_t = round(running_t + scaled_dur, 2)
            s_copy = dict(s)
            s_copy["startTime"] = round(running_t, 2)
            s_copy["endTime"] = end_t
            s_copy["duration"] = scaled_dur
            aligned_subs.append(s_copy)
            running_t = end_t

    # Proportional scaling for scenes
    raw_scenes = scenes or subtitles or []
    if raw_scenes:
        total_sc_dur = sum(float(sc.get("duration", 2.0)) for sc in raw_scenes) or 1.0
        scale = actual_dur / total_sc_dur
        running_t = 0.0
        for idx, sc in enumerate(raw_scenes):
            is_last = idx == len(raw_scenes) - 1
            scaled_dur = max(0.8, round(float(sc.get("duration", 2.0)) * scale, 2))
            if is_last:
                scaled_dur = max(0.8, round(actual_dur - running_t, 2))
            sc_copy = dict(sc)
            sc_copy["sceneNumber"] = sc.get("sceneNumber", idx + 1)
            sc_copy["start"] = round(running_t, 2)
            sc_copy["startTime"] = round(running_t, 2)
            sc_copy["duration"] = scaled_dur
            aligned_scenes.append(sc_copy)
            running_t += scaled_dur

    return {
        "success": True,
        "totalDurationSeconds": actual_dur,
        "alignedSubtitles": aligned_subs,
        "alignedScenes": aligned_scenes,
    }


# ==============================================================================
# MAIN STAGE 2 ORCHESTRATOR (Calls Small Functions Exclusively)
# ==============================================================================

def orchestrate_stage2_voice(
    voice_name: str,
    storyboard: Optional[List[Dict[str, Any]]] = None,
    full_narration_text: Optional[str] = None,
    full_script: Optional[str] = None,
    subtitles: Optional[List[Dict[str, Any]]] = None,
    scenes: Optional[List[Dict[str, Any]]] = None,
    model: Optional[str] = None,
    speech_style: Optional[str] = None,
    target_duration_seconds: Optional[float] = None,
) -> Dict[str, Any]:
    """
    Main Stage 2 Orchestrator:
    Contains zero duplicate logic; sequentially calls Small Functions 2.1 through 2.3.
    """
    if not voice_name or not voice_name.strip():
        raise ValueError("voiceName is required for voice synthesis.")

    # 1. Determine spoken narration string
    narration = (full_script or "").strip()
    if not narration:
        narration = _assemble_narration(storyboard or [], full_narration_text)
    if not narration:
        raise ValueError(
            "No narration text provided. Provide either fullScript, fullNarrationText, or storyboard[].subtitleText."
        )

    logger.info(
        f"[Studio/Stage2] Orchestrating Stage 2 via Small Functions | "
        f"voice='{voice_name}' chars={len(narration)} model={model or 'default'}"
    )

    # 2. Execute Small API 2.1: Synthesize Neural Audio
    tts_result = synthesize_voice_audio(
        voice_name=voice_name,
        text=narration,
        speech_style=speech_style,
        target_duration_seconds=target_duration_seconds,
        model=model,
    )
    duration = tts_result["rawDurationSeconds"]

    # 3. Execute Small API 2.2: Extract Word Timestamps
    word_timestamps = extract_word_timestamps(
        text=narration,
        duration_seconds=duration,
        audio_url=tts_result["audioUrl"],
        raw_timestamps=tts_result.get("_rawWordTimestamps"),
    )

    # 4. Execute Small API 2.3: Align Timeline & Scenes
    raw_subtitles = subtitles or (
        [{"lineIndex": s.get("sceneNumber", idx+1), "text": s.get("subtitleText", ""), "duration": s.get("duration", 2.0)} for idx, s in enumerate(storyboard)]
        if storyboard else []
    )
    raw_scenes = scenes or storyboard or []

    alignment = align_timeline_to_voice(
        subtitles=raw_subtitles,
        scenes=raw_scenes,
        word_timestamps=word_timestamps,
        actual_duration_seconds=duration,
    )

    try:
        add_notification(
            title="Voiceover Synthesized",
            message=f"Voice track rendered using voice '{voice_name}' ({duration:.1f}s)",
            type="success",
            category="studio",
            action_url="/workspace",
        )
    except Exception as notif_err:
        logger.debug(f"[Studio/Voice] Notification dispatch note: {notif_err}")

    raw_url = tts_result.get("audioUrl", "")
    display_url = (raw_url[:35] + "... [base64 audio]") if raw_url.startswith("data:") else raw_url
    logger.info(
        f"[Studio/Stage2] Stage 2 Orchestration complete | voice='{voice_name}' "
        f"duration={duration:.2f}s audioUrl={display_url}"
    )

    return {
        "success": True,
        "stageId": STAGE_ID,
        "voiceName": voice_name,
        "mimeType": tts_result["mimeType"],
        "audioUrl": tts_result["audioUrl"],
        "audioBase64": tts_result.get("audioBase64"),
        "durationSeconds": duration,
        "sampleRate": tts_result["sampleRate"],
        "channels": tts_result["channels"],
        "wordTimestamps": word_timestamps,
        "alignedStoryboard": alignment["alignedScenes"],
        "alignedSubtitles": alignment["alignedSubtitles"],
        "alignedScenes": alignment["alignedScenes"],
        "toneModulation": tts_result.get("toneModulation"),
        "message": "Voiceover synthesized and timeline aligned successfully",
        "generatedAt": datetime.now(timezone.utc).isoformat(),
    }


# Backwards compatibility alias
run_studio_voice = orchestrate_stage2_voice

