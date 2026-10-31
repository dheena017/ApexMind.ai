"""
backend/features/workspace/studio_captions_service.py
Stage 4 of the ApexMind Studio Pipeline.
Generates scene-aligned, word-level timed captions from the final storyboard.
Each caption segment is pinned to its scene's start/duration window so timings
perfectly match the timeline's Captions Track without any manual adjustment.
Also produces SRT and WebVTT exports.
"""

import re
import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

logger = logging.getLogger("ApexMind.Studio.Captions")


# ── Time formatters ────────────────────────────────────────────────────────────

def _fmt_srt(seconds: float) -> str:
    ms = int(round((seconds - int(seconds)) * 1000))
    s = int(seconds) % 60
    m = (int(seconds) // 60) % 60
    h = int(seconds) // 3600
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def _fmt_vtt(seconds: float) -> str:
    ms = int(round((seconds - int(seconds)) * 1000))
    s = int(seconds) % 60
    m = (int(seconds) // 60) % 60
    h = int(seconds) // 3600
    return f"{h:02d}:{m:02d}:{s:02d}.{ms:03d}"


# ── Emphasis detection ─────────────────────────────────────────────────────────

_EMPHASIS_PATTERNS = re.compile(
    r"^(stop|start|never|always|now|today|you|your|wake|dead|broke|free|rich|win|lose|"
    r"truth|lie|real|fake|fear|pain|fire|rise|fall|fight|quit|done|go|no|yes|one|last)[\.\!\?,]?$",
    re.IGNORECASE,
)


def _is_emphasis(word: str) -> bool:
    return bool(_EMPHASIS_PATTERNS.match(word.strip(".,!?;:")))


# ── Core per-scene caption generator ──────────────────────────────────────────

def _generate_scene_captions(
    scene_number: int,
    text: str,
    scene_start: float,
    scene_duration: float,
    max_words: int,
    caption_color: str,
    caption_preset_class: str,
    pre_aligned_words: Optional[List[Dict[str, Any]]] = None,
) -> List[Dict[str, Any]]:
    """
    Distribute word-level timestamps proportionally within a scene's time window,
    or use pre-aligned acoustic words when available from Stage 2 Voice synthesis.
    Returns a list of caption segment dicts ready for the timeline LocalClips[].
    """
    raw_words = [w for w in text.split() if w.strip()]
    if not raw_words and not pre_aligned_words:
        return []

    chunk_size = max(1, min(max_words, 6))

    # Path A: High-precision pre-aligned words from speech acoustic model
    if pre_aligned_words and len(pre_aligned_words) > 0:
        word_timings = [
            {
                "word": w.get("word", ""),
                "start": float(w.get("start", scene_start)),
                "end": float(w.get("end", scene_start + scene_duration)),
                "emphasis": bool(w.get("emphasis", _is_emphasis(w.get("word", "")))),
                "highlightColor": w.get("highlightColor") or (caption_color if w.get("emphasis") else None),
            }
            for w in pre_aligned_words
            if str(w.get("word", "")).strip()
        ]
        if word_timings:
            segments: List[Dict[str, Any]] = []
            for i in range(0, len(word_timings), chunk_size):
                chunk = word_timings[i : i + chunk_size]
                segments.append({
                    "sceneNumber": scene_number,
                    "start": chunk[0]["start"],
                    "end": chunk[-1]["end"],
                    "duration": round(chunk[-1]["end"] - chunk[0]["start"], 3),
                    "text": " ".join(c["word"] for c in chunk),
                    "words": chunk,
                    "captionPresetClass": caption_preset_class,
                    "captionPresetColor": caption_color,
                })
            return segments

    # Path B: Fallback phonetic syllable-weighted distribution
    from .audio_aligner import compute_word_weight

    weights = [
        compute_word_weight(w, is_first=(i == 0), is_last=(i == len(raw_words) - 1))
        for i, w in enumerate(raw_words)
    ]

    total_weight = sum(weights) or 1.0
    available = max(0.1, scene_duration)

    word_timings = []
    cursor = scene_start
    for i, w in enumerate(raw_words):
        w_dur = (weights[i] / total_weight) * available
        word_timings.append({
            "word": w,
            "start": round(cursor, 3),
            "end": round(cursor + w_dur, 3),
            "emphasis": _is_emphasis(w),
            "highlightColor": caption_color if _is_emphasis(w) else None,
        })
        cursor += w_dur

    if word_timings:
        word_timings[-1]["end"] = round(scene_start + scene_duration, 3)

    segments = []
    for i in range(0, len(word_timings), chunk_size):
        chunk = word_timings[i : i + chunk_size]
        segments.append({
            "sceneNumber": scene_number,
            "start": chunk[0]["start"],
            "end": chunk[-1]["end"],
            "duration": round(chunk[-1]["end"] - chunk[0]["start"], 3),
            "text": " ".join(c["word"] for c in chunk),
            "words": chunk,
            "captionPresetClass": caption_preset_class,
            "captionPresetColor": caption_color,
        })

    return segments


# ── Main entry point ───────────────────────────────────────────────────────────

def run_studio_captions(
    storyboard_scenes: List[Dict[str, Any]],
    duration_seconds: float,
    full_narration_text: Optional[str] = None,
    style_preset: str = "sub-hormozi",
    max_words_per_segment: int = 4,
    aspect_ratio: str = "9:16",
    caption_color: str = "#FACC15",
    caption_font_family: str = "Impact, sans-serif",
) -> Dict[str, Any]:
    """
    Studio pipeline Stage 4: Generate scene-aligned word-level captions.

    Returns a pipeline-ready envelope with:
      - stageId: "captions"
      - data.segments[]: word-level, scene-pinned segments
      - data.timelineClips[]: ready-to-use LocalClips[] for StudioTimelinePane
      - data.srtExport: str
      - data.vttExport: str
    """
    if not storyboard_scenes and not full_narration_text:
        raise ValueError("Provide either storyboardScenes or fullNarrationText.")

    logger.info(
        f"[Studio/Captions] Starting Stage 4 | scenes={len(storyboard_scenes)} "
        f"duration={duration_seconds}s preset={style_preset}"
    )

    all_segments: List[Dict[str, Any]] = []

    # ── Scene-aligned path (preferred) ────────────────────────────────────────
    if storyboard_scenes:
        sorted_scenes = sorted(storyboard_scenes, key=lambda s: s.get("sceneNumber", 0))
        for scene in sorted_scenes:
            scene_text = (scene.get("subtitleText") or "").strip()
            if not scene_text:
                continue
            segs = _generate_scene_captions(
                scene_number=scene.get("sceneNumber", 0),
                text=scene_text,
                scene_start=float(scene.get("start", 0.0)),
                scene_duration=float(scene.get("duration", 3.0)),
                max_words=max_words_per_segment,
                caption_color=scene.get("captionPresetColor") or caption_color,
                caption_preset_class=scene.get("captionPresetClass") or style_preset,
                pre_aligned_words=scene.get("words"),
            )
            all_segments.extend(segs)

    # ── Fallback: flat narration text distributed over total duration ──────────
    elif full_narration_text:
        from .captions_service import generate_closed_captions
        flat = generate_closed_captions(
            text=full_narration_text,
            duration_seconds=duration_seconds,
            style_preset=style_preset,
            max_words_per_segment=max_words_per_segment,
        )
        for seg in flat.get("segments", []):
            all_segments.append({
                "sceneNumber": None,
                "start": seg["start"],
                "end": seg["end"],
                "duration": round(seg["end"] - seg["start"], 3),
                "text": seg["text"],
                "words": seg.get("words", []),
                "captionPresetClass": style_preset,
                "captionPresetColor": caption_color,
            })

    # Assign global segment indices
    for idx, seg in enumerate(all_segments):
        seg["segmentIndex"] = idx

    # ── Build timeline-ready LocalClips[] ─────────────────────────────────────
    timeline_clips = [
        {
            "text": seg["text"],
            "start": seg["start"],
            "duration": seg["duration"],
            "captionPresetClass": seg.get("captionPresetClass", style_preset),
            "captionPresetColor": seg.get("captionPresetColor", caption_color),
            "words": seg.get("words", []),
        }
        for seg in all_segments
        if seg.get("duration", 0) > 0
    ]

    # ── SRT export ────────────────────────────────────────────────────────────
    srt_lines = []
    for i, seg in enumerate(all_segments, start=1):
        srt_lines += [
            str(i),
            f"{_fmt_srt(seg['start'])} --> {_fmt_srt(seg['end'])}",
            seg["text"],
            "",
        ]
    srt_export = "\n".join(srt_lines)

    # ── WebVTT export ─────────────────────────────────────────────────────────
    vtt_lines = ["WEBVTT", ""]
    for i, seg in enumerate(all_segments, start=1):
        vtt_lines += [
            str(i),
            f"{_fmt_vtt(seg['start'])} --> {_fmt_vtt(seg['end'])}",
            seg["text"],
            "",
        ]
    vtt_export = "\n".join(vtt_lines)

    total_words = sum(len(seg["text"].split()) for seg in all_segments)
    logger.info(
        f"[Studio/Captions] Stage 4 complete | segments={len(all_segments)} "
        f"words={total_words} timelineClips={len(timeline_clips)}"
    )

    return {
        "success": True,
        "stageId": "captions",
        "data": {
            "durationSeconds": round(duration_seconds, 3),
            "totalWords": total_words,
            "stylePreset": style_preset,
            "captionColor": caption_color,
            "captionFontFamily": caption_font_family,
            "segments": all_segments,
            "timelineClips": timeline_clips,
            "srtExport": srt_export,
            "vttExport": vtt_export,
        },
        "generatedAt": datetime.now(timezone.utc).isoformat(),
    }

