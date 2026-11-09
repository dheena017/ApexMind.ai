"""
backend/features/workspace/studio/captions_service.py
Stage 4 of the ApexMind Studio Production Pipeline.
Generates scene-aligned, word-level timed captions from the final storyboard.
Each caption segment is pinned to its scene's start/duration window so timings
perfectly match the timeline's Captions Track without any manual adjustment.
Also produces SRT and WebVTT exports.
"""

from datetime import datetime, timezone
import logging
import re
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


def generate_closed_captions(
    text: str,
    duration_seconds: float = 5.0,
    style_preset: str = "sub-hormozi",
    max_words_per_segment: int = 4,
) -> Dict[str, Any]:
    """
    Generates word-level timed captions distributed across duration_seconds,
    safe-zone chunked for mobile 9:16 screens, with SRT and WebVTT exports.
    """
    clean_text = (text or "").strip()
    if not clean_text:
        return {
            "durationSeconds": 0.0,
            "totalWords": 0,
            "stylePreset": style_preset,
            "segments": [],
            "srtExport": "",
            "vttExport": "WEBVTT\n\n",
        }

    raw_words = [w for w in clean_text.split() if w.strip()]
    if not raw_words:
        return {
            "durationSeconds": 0.0,
            "totalWords": 0,
            "stylePreset": style_preset,
            "segments": [],
            "srtExport": "",
            "vttExport": "WEBVTT\n\n",
        }

    total_words = len(raw_words)
    time_per_word = duration_seconds / float(total_words) if total_words > 0 else 0.5

    segments = []
    chunk_size = max(1, min(max_words_per_segment, 6))

    for seg_idx, i in enumerate(range(0, total_words, chunk_size)):
        chunk_words = raw_words[i : i + chunk_size]
        start_t = round(i * time_per_word, 2)
        end_t = round(min(duration_seconds, (i + len(chunk_words)) * time_per_word), 2)

        word_timings = []
        for w_idx, w in enumerate(chunk_words):
            w_start = round(start_t + (w_idx * time_per_word), 2)
            w_end = round(min(duration_seconds, w_start + time_per_word), 2)
            word_timings.append({
                "word": w,
                "start": w_start,
                "end": w_end,
                "emphasis": bool(re.search(r'[!?:A-Z]{2,}', w)),
            })

        segments.append({
            "segmentIndex": seg_idx,
            "start": start_t,
            "end": end_t,
            "text": " ".join(chunk_words),
            "words": word_timings,
        })

    # Build SRT
    srt_lines = []
    for seg in segments:
        srt_lines.append(str(seg["segmentIndex"] + 1))
        srt_lines.append(f"{_fmt_srt(seg['start'])} --> {_fmt_srt(seg['end'])}")
        srt_lines.append(seg["text"])
        srt_lines.append("")
    srt_export = "\n".join(srt_lines)

    # Build VTT
    vtt_lines = ["WEBVTT", ""]
    for seg in segments:
        vtt_lines.append(str(seg["segmentIndex"] + 1))
        vtt_lines.append(f"{_fmt_vtt(seg['start'])} --> {_fmt_vtt(seg['end'])}")
        vtt_lines.append(seg["text"])
        vtt_lines.append("")
    vtt_export = "\n".join(vtt_lines)

    return {
        "durationSeconds": duration_seconds,
        "totalWords": total_words,
        "stylePreset": style_preset,
        "segments": segments,
        "srtExport": srt_export,
        "vttExport": vtt_export,
    }


def _generate_scene_captions(
    scene_number: int,
    text: str,
    scene_start: float,
    scene_duration: float,
    max_words: int = 4,
    caption_color: str = "#FACC15",
    caption_preset_class: str = "sub-hormozi",
    pre_aligned_words: Optional[List[Dict[str, Any]]] = None,
) -> List[Dict[str, Any]]:
    """
    Chunks a single scene's subtitle text into caption segments,
    pinning the times to [scene_start, scene_start + scene_duration].
    """
    clean = (text or "").strip()
    if not clean:
        return []

    if pre_aligned_words and len(pre_aligned_words) > 0:
        words = [w.get("word", "") for w in pre_aligned_words if w.get("word")]
        word_objs = pre_aligned_words
    else:
        words = [w for w in clean.split() if w.strip()]
        if not words:
            return []
        time_per_word = scene_duration / float(len(words))
        word_objs = [
            {
                "word": w,
                "start": round(scene_start + (i * time_per_word), 3),
                "end": round(scene_start + ((i + 1) * time_per_word), 3),
                "emphasis": bool(re.search(r"[!?:A-Z]{2,}", w)),
            }
            for i, w in enumerate(words)
        ]

    chunk_size = max(1, min(max_words, 6))
    segments: List[Dict[str, Any]] = []

    for i in range(0, len(word_objs), chunk_size):
        chunk = word_objs[i : i + chunk_size]
        seg_start = chunk[0]["start"]
        seg_end = chunk[-1]["end"]
        seg_text = " ".join(w["word"] for w in chunk)

        segments.append({
            "sceneNumber": scene_number,
            "start": round(seg_start, 3),
            "end": round(seg_end, 3),
            "duration": round(seg_end - seg_start, 3),
            "text": seg_text,
            "words": chunk,
            "captionPresetClass": caption_preset_class,
            "captionPresetColor": caption_color,
        })

    return segments


def run_studio_captions(
    storyboard_scenes: Optional[List[Dict[str, Any]]] = None,
    duration_seconds: float = 10.0,
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
        f"[Studio/Captions] Starting Stage 4 | scenes={len(storyboard_scenes or [])} "
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

# ==============================================================================
# STAGE 4: DEDICATED SMALL SERVICE FUNCTIONS
# ==============================================================================

def chunk_subtitles_by_words(
    word_timestamps: List[Dict[str, Any]],
    max_words_per_chunk: int = 4,
) -> List[Dict[str, Any]]:
    """
    Small API 4.1: Chunks word timestamps into mobile safe-zone subtitle lines (3-4 words max).
    """
    if not word_timestamps:
        return []

    chunk_size = max(1, min(max_words_per_chunk, 6))
    chunks = []
    
    for i in range(0, len(word_timestamps), chunk_size):
        chunk_words = word_timestamps[i : i + chunk_size]
        seg_start = float(chunk_words[0].get("start", 0.0))
        seg_end = float(chunk_words[-1].get("end", seg_start + 1.0))
        seg_text = " ".join(str(w.get("word", "")).strip() for w in chunk_words if str(w.get("word", "")).strip())

        chunks.append({
            "chunkIndex": len(chunks) + 1,
            "segmentIndex": len(chunks),
            "start": round(seg_start, 3),
            "end": round(seg_end, 3),
            "startTime": round(seg_start, 3),
            "endTime": round(seg_end, 3),
            "duration": round(max(0.2, seg_end - seg_start), 3),
            "text": seg_text,
            "words": chunk_words,
        })

    return chunks


def style_caption_segments(
    chunks: List[Dict[str, Any]],
    style_preset: str = "sub-hormozi",
    highlight_color: str = "#FACC15",
) -> List[Dict[str, Any]]:
    """
    Small API 4.2: Applies preset typography styling and colors emphasis words for dynamic popup subtitles.
    """
    styled = []
    for chunk in chunks:
        words = chunk.get("words", [])
        styled_words = []
        for w in words:
            is_emp = bool(w.get("emphasis")) or bool(re.search(r"[!?:A-Z]{2,}", str(w.get("word", ""))))
            styled_words.append({
                "word": w.get("word", ""),
                "start": float(w.get("start", 0.0)),
                "end": float(w.get("end", 0.0)),
                "emphasis": is_emp,
                "highlightColor": highlight_color if is_emp else None,
            })

        c_copy = dict(chunk)
        c_copy["captionPresetClass"] = style_preset
        c_copy["captionPresetColor"] = highlight_color
        c_copy["words"] = styled_words
        styled.append(c_copy)

    return styled


def export_captions_srt(segments: List[Dict[str, Any]]) -> str:
    """
    Small API 4.3: Converts timed caption segments into standard SubRip (.srt) subtitle format.
    """
    srt_lines = []
    for i, seg in enumerate(segments, start=1):
        st = float(seg.get("start", seg.get("startTime", 0.0)))
        et = float(seg.get("end", seg.get("endTime", st + 1.5)))
        srt_lines += [
            str(i),
            f"{_fmt_srt(st)} --> {_fmt_srt(et)}",
            str(seg.get("text", "")).strip(),
            "",
        ]
    return "\n".join(srt_lines)


def export_captions_vtt(segments: List[Dict[str, Any]]) -> str:
    """
    Small API 4.4: Converts timed caption segments into standard WebVTT (.vtt) format for HTML5 players.
    """
    vtt_lines = ["WEBVTT", ""]
    for i, seg in enumerate(segments, start=1):
        st = float(seg.get("start", seg.get("startTime", 0.0)))
        et = float(seg.get("end", seg.get("endTime", st + 1.5)))
        vtt_lines += [
            str(i),
            f"{_fmt_vtt(st)} --> {_fmt_vtt(et)}",
            str(seg.get("text", "")).strip(),
            "",
        ]
    return "\n".join(vtt_lines)


# ==============================================================================
# MAIN STAGE 4 ORCHESTRATOR (Calls Small Functions Exclusively)
# ==============================================================================

def orchestrate_stage4_captions(
    storyboard_scenes: Optional[List[Dict[str, Any]]] = None,
    full_narration_text: Optional[str] = None,
    duration_seconds: float = 10.0,
    style_preset: str = "sub-hormozi",
    max_words_per_segment: int = 4,
    aspect_ratio: str = "9:16",
    caption_color: str = "#FACC15",
    caption_font_family: str = "Impact, sans-serif",
    word_timestamps: Optional[List[Dict[str, Any]]] = None,
) -> Dict[str, Any]:
    """
    Main Stage 4 Orchestrator:
    Contains zero duplicate logic; coordinates Small Functions 4.1 through 4.4.
    """
    logger.info(f"[Studio/Stage4] Orchestrating Word-Timed Captions (Preset: {style_preset})")
    all_segments: List[Dict[str, Any]] = []

    # 1. Gather raw word timestamps from input or generate from scenes
    if word_timestamps and len(word_timestamps) > 0:
        chunks = chunk_subtitles_by_words(word_timestamps, max_words_per_chunk=max_words_per_segment)
        all_segments = style_caption_segments(chunks, style_preset=style_preset, highlight_color=caption_color)
    elif storyboard_scenes:
        for scene in sorted(storyboard_scenes, key=lambda s: s.get("sceneNumber", 0)):
            sc_text = scene.get("subtitleText") or ""
            sc_start = float(scene.get("start", 0.0))
            sc_dur = float(scene.get("duration", 3.0))
            
            segs = _generate_scene_captions(
                scene_number=scene.get("sceneNumber", 1),
                text=sc_text,
                scene_start=sc_start,
                scene_duration=sc_dur,
                max_words=max_words_per_segment,
                caption_color=scene.get("captionPresetColor") or caption_color,
                caption_preset_class=scene.get("captionPresetClass") or style_preset,
                pre_aligned_words=scene.get("words"),
            )
            all_segments.extend(segs)
    elif full_narration_text:
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
                "startTime": seg["start"],
                "endTime": seg["end"],
                "duration": round(seg["end"] - seg["start"], 3),
                "text": seg["text"],
                "words": seg.get("words", []),
                "captionPresetClass": style_preset,
                "captionPresetColor": caption_color,
            })

    # Assign segment indices
    for idx, seg in enumerate(all_segments):
        seg["segmentIndex"] = idx

    # Build timeline clips
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

    # Small Functions 4.3 & 4.4: Export standard formats
    srt_export = export_captions_srt(all_segments)
    vtt_export = export_captions_vtt(all_segments)

    total_words = sum(len(str(seg.get("text", "")).split()) for seg in all_segments)
    dur = float(all_segments[-1]["end"]) if all_segments else duration_seconds

    logger.info(
        f"[Studio/Stage4] Stage 4 Orchestration complete | segments={len(all_segments)} "
        f"words={total_words} timelineClips={len(timeline_clips)}"
    )

    return {
        "success": True,
        "stageId": "captions",
        "data": {
            "durationSeconds": round(dur, 3),
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


# Backwards compatibility alias
run_studio_captions = orchestrate_stage4_captions

