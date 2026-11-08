"""
backend/shared/script/storyboard_generator.py
Stage 1C: Storyboard Scene Director via Gemini AI.
Divides monologue into sequential visual scenes with camera motions, cut transitions,
search queries, and word-level karaoke synchronization.
Zero hardcoded fallbacks — strict error reporting on failure.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

from backend.shared.ai_models import DEFAULT_SCRIPT_MODEL, resolve_script_model
from .constants import CTA_EXCLUSION_TERMS

logger = logging.getLogger("ApexMind.Script.Storyboard")


def generate_storyboard(
    hook: str,
    quote: str,
    cta: str,
    target_seconds: int = 30,
    aspect_ratio: str = "9:16",
    category: str = "",
    topic: str = "",
    visual_theme: str = "",
    motion_style: str = "",
    caption_style: str = "",
    model: str = DEFAULT_SCRIPT_MODEL,
    catalog: Optional[Dict[str, Any]] = None,
) -> List[Dict[str, Any]]:
    """
    Directs a multi-scene visual storyboard from script components.
    Returns:
      List[Dict[str, Any]] containing fully configured scenes:
        sceneNumber, beat, start, duration, mediaType, visualQuery, googleSearchQuery,
        cameraMotion, transition, textStyleId, captionPresetClass, words[]
    """
    from backend.shared.gemini import _generate_script_with_fallback

    effective_model = resolve_script_model(model)
    target_aspect = aspect_ratio if aspect_ratio in ["9:16", "16:9", "1:1", "4:5", "21:9"] else "9:16"

    target_scenes = max(3, round(target_seconds / 4.8))
    min_scenes = max(3, target_scenes - 1)
    max_scenes = target_scenes + 2

    catalog_data = catalog or {}
    raw_videos = catalog_data.get("stockVideos") or []
    video_summary = "\n".join([
        f"- ID: {v.get('id')} | Title: '{v.get('title')}' | VideoUrl: {v.get('videoUrl')}"
        for v in raw_videos if v.get("videoUrl")
    ]) if raw_videos else f"- Dynamic stock footage retrieval per scene for {target_aspect} via visualQuery."

    prompt = f"""You are an elite Autonomous AI Video Director and Storyboard Artist.
Convert this motivational script into an exact sequential multi-scene storyboard for a {target_seconds}-second video.

TARGET ASPECT RATIO: {target_aspect}
TARGET DURATION: EXACTLY {target_seconds} SECONDS
REQUIRED SCENES: EXACTLY {min_scenes} to {max_scenes} DISTINCT SEQUENTIAL SCENES

SCRIPT PIECES TO DIVIDE:
- Hook (Scene 1): "{hook}"
- Middle Monologue (Scenes 2 to {target_scenes - 1}): "{quote}"
- Final CTA (Scene {target_scenes}): "{cta}"

VISUAL DIRECTIVE:
- Theme: {category or 'Motivation'} | Topic: {topic or 'Focus'} | Visual Theme: {visual_theme or 'Cinematic Atmospheric'}
- Motion Style: {motion_style or 'Dynamic camera movements'}
- Every scene MUST have a unique cinematic visual query tailored specifically to the narrative beat.
- Camera Motions to assign: "push-in", "pan-right", "slow-zoom", "panoramic-drift-left", "orbital-reveal"
- Transitions to assign: "glitch", "match-cut", "zoom", "fade", "whip-pan-left"
- Subtitle lines MUST be short and punchy (strictly 3 to 7 words per scene cut).

AVAILABLE ASSET CATALOG:
{video_summary}

Output MUST be a single raw JSON object matching this exact schema:
{{
  "storyboard": [
    {{
      "sceneNumber": 1,
      "beat": "hook",
      "duration": 2.5,
      "mediaType": "video",
      "mediaName": "Cinematic visual description",
      "textStyleId": "sub-hormozi",
      "captionPresetClass": "font-black tracking-tight text-yellow-400 uppercase drop-shadow-[0_4px_12px_rgba(0,0,0,1)] bg-black/85 px-3 py-1 rounded-md border border-yellow-400/30",
      "captionPresetColor": "#FACC15",
      "transition": "glitch",
      "cameraMotion": "push-in",
      "googleSearchQuery": "atmospheric mountain sunrise vertical 9:16",
      "visualQuery": "atmospheric mountain sunrise cinematic nature",
      "fallbackQueries": ["mountain landscape morning mist", "dramatic sunrise ridge"],
      "negativeTerms": ["green screen", "clipart", "lower third", "subscribe button"],
      "subtitleText": "{hook}"
    }}
  ]
}}
"""

    result, used_model = _generate_script_with_fallback(
        prompt=prompt,
        target_model=effective_model,
        system_instruction="You are a specialized AI Video Director. Return valid JSON only.",
    )

    if not result or not isinstance(result, dict) or not isinstance(result.get("storyboard"), list):
        raise RuntimeError(
            f"Storyboard generation failed: Gemini model '{used_model}' did not return a valid 'storyboard' array."
        )

    raw_scenes = result["storyboard"]
    if not raw_scenes:
        raise RuntimeError(f"Gemini model '{used_model}' returned an empty storyboard array.")

    # ── Normalize Beats, Cadence, and Exclusions ──
    for sc in raw_scenes:
        sc["mediaType"] = "video"
        beat = str(sc.get("beat") or "").lower()
        if beat == "hook" or sc.get("sceneNumber") == 1:
            sc["beat"] = "hook"
            sc["speechRate"] = 1.05
            sc["tone"] = "urgent"
            sc["emotion"] = "Fast, urgent delivery"
        elif beat in ("quote", "wisdom"):
            sc["beat"] = "quote"
            sc["speechRate"] = 0.90
            sc["tone"] = "reverent"
            sc["emotion"] = "Slower, heavier cadence"
        elif beat == "cta":
            sc["beat"] = "cta"
            sc["speechRate"] = 1.00
            sc["tone"] = "decisive"
            sc["emotion"] = "Firm, decisive pace"
        else:
            sc["speechRate"] = float(sc.get("speechRate") or 1.00)
            sc["tone"] = sc.get("tone") or "motivational"
            sc["emotion"] = sc.get("emotion") or "Focused, engaging pace"

        # Prevent clipart buttons on CTA scenes
        has_cta_clipart = any(t in str(sc.get("visualQuery", "")).lower() for t in CTA_EXCLUSION_TERMS)
        if has_cta_clipart:
            clean_theme = topic or category or "cinematic motivational finale"
            sc["mediaName"] = f"Cinematic {category or 'Inspirational'} Finale"
            sc["visualQuery"] = f"cinematic {clean_theme} {target_aspect}"
            sc["googleSearchQuery"] = f"cinematic {clean_theme} {target_aspect}"
            sc["fallbackQueries"] = [
                f"cinematic {clean_theme} dramatic lighting {target_aspect}",
                f"cinematic {clean_theme} epic atmosphere {target_aspect}",
            ]

        primary_query = sc.get("visualQuery") or sc.get("mediaName") or sc.get("subtitleText") or topic
        sc["visualQuery"] = primary_query
        sc["googleSearchQuery"] = sc.get("googleSearchQuery") or f"{primary_query} {target_aspect}"
        sc["fallbackQueries"] = sc.get("fallbackQueries") or []
        sc["aspectRatio"] = target_aspect
        sc["mediaStatus"] = "unresolved"

    # ── Duration Scaling to Match target_seconds Exactly ──
    raw_scene_durations = []
    for sc in raw_scenes:
        txt = (sc.get("subtitleText") or "").strip()
        w_count = max(1, len(txt.split()))
        rate = float(sc.get("speechRate") or 1.0)
        natural_dur = round((w_count / (2.4 * rate)) + 1.2, 1)
        raw_scene_durations.append(max(2.8, natural_dur))

    total_raw_dur = sum(raw_scene_durations)
    scale_factor = (target_seconds / total_raw_dur) if total_raw_dur > 0 else 1.0

    curr_timeline_time = 0.0
    for idx, sc in enumerate(raw_scenes):
        is_last = (idx == len(raw_scenes) - 1)
        raw_dur = raw_scene_durations[idx]
        if is_last:
            final_dur = max(2.5, round(target_seconds - curr_timeline_time, 2))
        else:
            final_dur = max(2.5, round(raw_dur * scale_factor, 2))

        sc["duration"] = final_dur
        sc["start"] = round(curr_timeline_time, 2)
        curr_timeline_time = round(curr_timeline_time + final_dur, 2)

        # Build word-level karaoke timing
        txt = (sc.get("subtitleText") or "").strip()
        words_data = []
        raw_words = [w for w in txt.split() if w.strip()]
        if raw_words:
            word_dur = final_dur / len(raw_words)
            for w_idx, w_str in enumerate(raw_words):
                w_start = round(sc["start"] + (w_idx * word_dur), 2)
                w_end = round(w_start + word_dur, 2)
                is_emphasis = len(w_str) > 4 or w_str.isupper() or any(char in "!?:;" for char in w_str)
                words_data.append({
                    "word": w_str,
                    "start": w_start,
                    "end": w_end,
                    "emphasis": is_emphasis,
                    "highlightColor": "#FACC15" if is_emphasis else None,
                })
        sc["words"] = words_data

    logger.info(f"[Script/Storyboard] Generated {len(raw_scenes)} storyboard scenes ({target_seconds}s total)")
    return raw_scenes

