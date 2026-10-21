"""
backend/features/workspace/captions_service.py
Closed Captions subtitle generation service. Produces word-level karaoke timestamps,
viewport safe-zone line wrapping (max 3-4 words per line for 9:16), SRT, and WebVTT.
"""

import re
from typing import List, Dict, Any


def _format_srt_time(seconds: float) -> str:
    millis = int((seconds - int(seconds)) * 1000)
    total_seconds = int(seconds)
    hours = total_seconds // 3600
    minutes = (total_seconds % 3600) // 60
    secs = total_seconds % 60
    return f"{hours:02d}:{minutes:02d}:{secs:02d},{millis:03d}"


def _format_vtt_time(seconds: float) -> str:
    millis = int((seconds - int(seconds)) * 1000)
    total_seconds = int(seconds)
    hours = total_seconds // 3600
    minutes = (total_seconds % 3600) // 60
    secs = total_seconds % 60
    return f"{hours:02d}:{minutes:02d}:{secs:02d}.{millis:03d}"


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

    # Weight word durations by character length + punctuation pause
    weights = []
    for w in raw_words:
        weight = max(1, len(w))
        if any(p in w for p in [".", "!", "?", ";", ":"]):
            weight += 2.5  # Add pause weight for sentence endings
        elif any(p in w for p in [",", "-", "—"]):
            weight += 1.5
        weights.append(weight)

    total_weight = sum(weights) or 1
    total_duration = max(1.0, float(duration_seconds))

    # Calculate exact start/end for each word
    word_timings = []
    current_time = 0.0
    for idx, w in enumerate(raw_words):
        w_dur = (weights[idx] / total_weight) * total_duration
        word_start = round(current_time, 2)
        word_end = round(current_time + w_dur, 2)
        word_timings.append({
            "word": w,
            "start": word_start,
            "end": word_end,
        })
        current_time += w_dur

    # Ensure last word reaches total duration
    if word_timings:
        word_timings[-1]["end"] = round(total_duration, 2)

    # Group into safe-zone segments (3-4 words per line)
    segments = []
    chunk_size = max(1, min(max_words_per_segment, 6))
    for i in range(0, len(word_timings), chunk_size):
        chunk = word_timings[i : i + chunk_size]
        seg_start = chunk[0]["start"]
        seg_end = chunk[-1]["end"]
        seg_text = " ".join(c["word"] for c in chunk)
        segments.append({
            "segmentIndex": len(segments) + 1,
            "start": seg_start,
            "end": seg_end,
            "text": seg_text,
            "words": chunk,
        })

    # Generate SRT
    srt_lines = []
    for seg in segments:
        srt_lines.append(str(seg["segmentIndex"]))
        srt_lines.append(f"{_format_srt_time(seg['start'])} --> {_format_srt_time(seg['end'])}")
        srt_lines.append(seg["text"])
        srt_lines.append("")
    srt_export = "\n".join(srt_lines)

    # Generate WebVTT
    vtt_lines = ["WEBVTT", ""]
    for seg in segments:
        vtt_lines.append(str(seg["segmentIndex"]))
        vtt_lines.append(f"{_format_vtt_time(seg['start'])} --> {_format_vtt_time(seg['end'])}")
        vtt_lines.append(seg["text"])
        vtt_lines.append("")
    vtt_export = "\n".join(vtt_lines)

    return {
        "durationSeconds": round(total_duration, 2),
        "totalWords": len(raw_words),
        "stylePreset": style_preset,
        "segments": segments,
        "srtExport": srt_export,
        "vttExport": vtt_export,
    }
