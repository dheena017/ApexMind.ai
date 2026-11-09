"""
backend/features/workspace/script_ai/providers/gemini.py
Gemini AI Script & Storyboard Provider.
Generates multi-scene storyboard script with viral hooks, narration, audio design, and scene timing.
Zero mock data: all content is generated dynamically via Google Gemini GenAI.
"""

import json
import logging
import re
import time
from typing import Any, Dict, List, Optional

from google.genai import types

from backend.shared.ai_models import (
    DEFAULT_SCRIPT_MODEL,
    get_script_fallback_models,
    is_unwanted_model,
    resolve_script_model,
)
from backend.shared.gemini import get_gemini_client, rate_tracker
from .base import BaseScriptProvider

logger = logging.getLogger("ApexMind.Workspace.ScriptAI.Gemini")

# ==============================================================================
# Script Generation System Instructions & Production Directives
# ==============================================================================

SCRIPT_SYSTEM_INSTRUCTION: str = (
    "You are an elite Autonomous AI Video Director, Virality Strategist, and Master Sound Designer "
    "for viral YouTube Shorts, Instagram Reels, and Facebook Reels. Produce high-retention motivational "
    "and inspirational short video plans with 3 viral hook variations, diverse cinematic footage queries "
    "tailored to the theme (nature, urban, technology, fitness, space, luxury, architecture, lifestyle, abstract), "
    "and 5-layer broadcast sound design with dynamic sidechain ducking. "
    "Strictly output only valid JSON matching the exact schema."
)

DEFAULT_DUCKING_CONFIG: Dict[str, Any] = {
    "active": True,
    "voiceActiveVolume": 0.18,
    "pauseSwellVolume": 0.72,
    "attackMs": 150,
    "releaseMs": 300,
}

CTA_EXCLUSION_TERMS: set[str] = {
    "subscribe", "follow", "cta", "button", "bell", "comment", "share", "channel"
}


def parse_target_seconds(length_str: Optional[str]) -> int:
    """Parse target duration in seconds from user selection (e.g. '60 seconds', '60s', '45s', '15s')."""
    if not length_str:
        return 30
    s = str(length_str).lower().strip()
    match = re.search(r"(\d+)", s)
    if match:
        val = int(match.group(1))
        if "min" in s:
            return val * 60
        return val
    return 30


def expand_storyboard_to_target_duration(
    storyboard: List[Dict[str, Any]],
    target_seconds: int,
    category: str,
    topic: str,
    target_aspect_ratio: str = "9:16",
) -> List[Dict[str, Any]]:
    """
    Dynamically aligns the storyboard scenes to fill the user's selected duration (e.g. 60s, 45s, 30s)
    using 100% pure AI-generated content with zero hardcoded static templates.
    """
    if not storyboard:
        return []

    num_scenes = len(storyboard)
    avg_dur = max(2.5, round(target_seconds / max(1, num_scenes), 2))
    running_start = 0.0

    result = []
    for idx, sc in enumerate(storyboard):
        sc_copy = dict(sc)
        is_last = idx == num_scenes - 1
        dur = round(target_seconds - running_start, 2) if is_last else avg_dur
        dur = max(1.5, dur)

        sc_copy["sceneNumber"] = idx + 1
        sc_copy["start"] = round(running_start, 2)
        sc_copy["duration"] = dur
        sc_copy["aspectRatio"] = target_aspect_ratio
        sc_copy["mediaStatus"] = (
            "resolved" if sc_copy.get("mediaUrl") and str(sc_copy["mediaUrl"]).startswith("http") else "unresolved"
        )
        running_start += dur
        result.append(sc_copy)

    return result


def _generate_script_with_fallback(
    prompt: str,
    target_model: str,
    system_instruction: str,
) -> tuple[Optional[Dict[str, Any]], str]:
    """Execute Gemini generate_content across configured fallback models with JSON extraction."""
    client = get_gemini_client()
    if not client:
        return None, "GEMINI_API_KEY is not configured in environment."

    models_to_try: List[str] = []
    if target_model and not is_unwanted_model(target_model):
        models_to_try.append(target_model)
    else:
        resolved = resolve_script_model(target_model)
        if resolved and not is_unwanted_model(resolved):
            models_to_try.append(resolved)

    for alt in get_script_fallback_models(target_model):
        if alt not in models_to_try and not is_unwanted_model(alt):
            models_to_try.append(alt)

    if not models_to_try:
        models_to_try = [resolve_script_model()]

    response = None
    last_err: Optional[Exception] = None
    used_model: str = models_to_try[0] if models_to_try else target_model

    for attempt_model in models_to_try:
        try:
            gen_config: Dict[str, Any] = {
                "system_instruction": system_instruction,
                "temperature": 0.6,
                "response_mime_type": "application/json",
            }
            if hasattr(types, "ThinkingConfig"):
                try:
                    gen_config["thinking_config"] = types.ThinkingConfig(thinking_budget=0)
                except Exception:
                    pass

            try:
                response = client.models.generate_content(
                    model=attempt_model,
                    contents=prompt,
                    config=types.GenerateContentConfig(**gen_config),
                )
            except Exception as inner_err:
                err_str = str(inner_err).lower()
                if "thinking" in err_str and "thinking_config" in gen_config:
                    gen_config.pop("thinking_config", None)
                    response = client.models.generate_content(
                        model=attempt_model,
                        contents=prompt,
                        config=types.GenerateContentConfig(**gen_config),
                    )
                elif "503" in err_str or "unavailable" in err_str or "high demand" in err_str:
                    logger.warning(f"[ScriptAI/Gemini] Model '{attempt_model}' experienced demand spike, retrying in 1.5s...")
                    time.sleep(1.5)
                    response = client.models.generate_content(
                        model=attempt_model,
                        contents=prompt,
                        config=types.GenerateContentConfig(**gen_config),
                    )
                else:
                    raise inner_err

            used_model = attempt_model
            rate_tracker.record_request(attempt_model)
            break
        except Exception as e:
            last_err = e
            logger.warning(f"[ScriptAI/Gemini] Model '{attempt_model}' unavailable ({e}), trying next model...")
            time.sleep(0.5)

    if response is None:
        logger.warning(f"[ScriptAI/Gemini] All Gemini models exhausted or quota-limited: {last_err}")
        return None, f"exhausted: {last_err}"

    raw = response.text or "{}"
    if "```json" in raw:
        raw = raw.split("```json")[1].split("```")[0].strip()
    elif "```" in raw:
        raw = raw.split("```")[1].split("```")[0].strip()

    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError as decode_err:
        logger.error(f"[ScriptAI/Gemini] Failed to parse response as JSON: {raw[:300]}")
        raise ValueError(f"Invalid JSON returned by Gemini: {decode_err}")

    return parsed, used_model


class GeminiScriptProvider(BaseScriptProvider):
    name = "gemini"
    display_name = "Google Gemini Script Engine"

    def is_configured(self) -> bool:
        client = get_gemini_client()
        return client is not None

    def generate_script(
        self,
        category: str,
        topic: str,
        tone: str = "",
        length: str = "",
        model: Optional[str] = None,
        audio_mood: Optional[str] = None,
        background_style: Optional[str] = None,
        text_style: Optional[str] = None,
        video_style: Optional[str] = None,
        voice_name: Optional[str] = None,
        aspect_ratio: Optional[str] = "9:16",
        music_track: Optional[str] = None,
        caption_style: Optional[str] = None,
        visual_theme: Optional[str] = None,
        motion_style: Optional[str] = None,
        output_format: Optional[str] = None,
        creative_context: Optional[Dict[str, Any]] = None,
        available_assets: Optional[Dict[str, Any]] = None,
        user_prompt: Optional[str] = None,
        **kwargs,
    ) -> Dict[str, Any]:
        """Generates viral motivational quote scripts via Gemini with creative multi-scene media planning."""
        target_aspect_ratio = aspect_ratio if aspect_ratio in ["9:16", "16:9", "1:1", "4:5", "21:9"] else (aspect_ratio or "9:16")
        catalog = available_assets or (creative_context.get("availableAssets") if creative_context else None) or {}

        raw_stock = catalog.get("stockVideos") or catalog.get("videoClips") or []
        avail_videos = [
            v for v in raw_stock
            if v.get("videoUrl")
            and not any(bad in str(v.get("videoUrl", "")).lower() for bad in [
                "commondatastorage", "sample", "forbigger", "sintel", "subaru", 
                "tearsofsteel", "bullrun", "bunny", "placeholder"
            ])
        ]
        if avail_videos:
            video_summary = "\n".join([
                f"- ID: {v.get('id')} | Title: '{v.get('title')}' | Category: {v.get('category')} | VideoUrl: {v.get('videoUrl')}"
                for v in avail_videos
            ])
        else:
            video_summary = f"- [Dynamic Video Retrieval for {target_aspect_ratio}]. Videos will be dynamically retrieved per scene via Google Video Search & stock APIs based on googleSearchQuery & visualQuery."

        avail_backdrops = catalog.get("visualBackdrops") or catalog.get("imageBackdrops") or []
        if avail_backdrops:
            backdrop_summary = "\n".join([
                f"- ID: {b.get('id')} | Name: '{b.get('name')}' | Category: {b.get('category')} | ImageUrl: {b.get('imageUrl') or ''} | VideoUrl: {b.get('videoUrl') or ''}"
                for b in avail_backdrops
            ])
        else:
            backdrop_summary = f"- [Dynamic Backdrops for {target_aspect_ratio}]. Visual footage & backdrops will be dynamically retrieved per scene via open media APIs based on visualQuery."

        avail_text = catalog.get("textPresets") or catalog.get("textStyles") or []
        text_summary = "\n".join([
            f"- ID: {t.get('id')} | Name: '{t.get('name')}' | Class: '{t.get('className')}' | Color: '{t.get('color')}' | Font: '{t.get('fontFamily', '')}' | Desc: {t.get('styleDescription', '')}"
            for t in avail_text
        ])

        avail_music = catalog.get("musicTracks") or []
        if avail_music:
            music_summary = "\n".join([
                f"- ID: {m.get('id')} | Title: '{m.get('title')}' | Genre: {m.get('genre')} | BPM: {m.get('bpm')} | AudioUrl: {m.get('audioUrl')}"
                for m in avail_music
            ])
        else:
            music_summary = "- [Dynamic Music Search]. Recommend appropriate genre and BPM (e.g. phonk, cinematic, lofi, ambient) for live soundtrack retrieval."

        avail_sfx = catalog.get("soundEffects") or catalog.get("sfxList") or []
        if avail_sfx:
            sfx_summary = "\n".join([
                f"- ID: {s.get('id')} | Name: '{s.get('name')}' | Category: {s.get('category', 'sfx')} | Duration: {s.get('duration')} | AudioUrl: {s.get('audioUrl')}"
                for s in avail_sfx
            ])
        else:
            sfx_summary = "- [Dynamic Sound Design]. Plan sound effect events (whoosh, subdrop, riser, impact) with time offsets."

        avail_voices = catalog.get("voiceProfiles") or []
        if avail_voices:
            voice_summary = "\n".join([
                f"- ID: {v.get('id')} | Name: '{v.get('name')}' | Gender: {v.get('gender')} | Style: {v.get('style')}"
                for v in avail_voices
            ])
        else:
            voice_summary = "- [Dynamic Voice Selection]. Recommend an optimal voice matching the script tone and narrative style (e.g. Fenrir, Nova, Kore, Puck)."

        selected_context = []
        for label, value in [
            ("TONE", tone),
            ("TARGET LENGTH", length),
            ("AUDIO MOOD", audio_mood),
            ("BACKGROUND STYLE", background_style),
            ("TEXT STYLE", text_style),
            ("VIDEO STYLE", video_style),
            ("VOICE", voice_name),
            ("ASPECT RATIO", target_aspect_ratio),
            ("MUSIC TRACK", music_track),
            ("CAPTION STYLE", caption_style),
            ("VISUAL THEME", visual_theme),
            ("MOTION STYLE", motion_style),
            ("OUTPUT FORMAT", output_format or f"{target_aspect_ratio} Video"),
        ]:
            if value and str(value).strip():
                selected_context.append(f"{label}: {value}")

        if creative_context:
            for key, value in creative_context.items():
                if key != "availableAssets" and value is not None and str(value).strip():
                    selected_context.append(f"{key.upper()}: {value}")

        context_block = "\n".join(selected_context) if selected_context else "No specific creative preferences were selected. Let the strongest concept emerge naturally from the prompt."

        user_prompt_clean = (user_prompt or "").strip()
        user_prompt_section = ""
        if user_prompt_clean:
            user_prompt_section = f"""
================================================================================
USER'S SPECIFIC CREATIVE DIRECTION & PROMPT (ABSOLUTE HIGHEST PRIORITY):
================================================================================
THE USER HAS EXPLICITLY DIRECTED:
"{user_prompt_clean}"

CRITICAL MANDATE: You MUST give absolute top priority to the user's specific prompt, narrative ideas, talking points, metaphors, character tone, and creative vision. Weave their exact instructions into the script, opening hook, and scene visual metaphors while maintaining viral retention standards!
"""

        target_seconds = parse_target_seconds(length)
        target_scenes = max(3, round(target_seconds / 4.8))
        min_scenes = max(3, target_scenes - 1)
        max_scenes = target_scenes + 2
        target_words = round(target_seconds * 2.45)
        min_words = round(target_seconds * 2.25)
        max_words = round(target_seconds * 2.65)

        duration_enforcement_section = f"""
================================================================================
CRITICAL TARGET DURATION & SCENE COUNT ENFORCEMENT (ABSOLUTE REQUIREMENT):
================================================================================
TARGET DURATION: EXACTLY {target_seconds} SECONDS (User explicitly selected '{length or f"{target_seconds}s"}')
REQUIRED SCENE COUNT: EXACTLY {min_scenes} to {max_scenes} DISTINCT SEQUENTIAL SCENES IN "storyboard".
REQUIRED SPOKEN WORD COUNT: EXACTLY {min_words} to {max_words} WORDS TOTAL ACROSS MONOLOGUE.

STRICT ENFORCEMENT RULES FOR THIS {target_seconds}-SECOND VIDEO:
1. DO NOT GENERATE ONLY 4 SCENES! A 4-scene video only lasts 15-20 seconds and violates the user's explicit {target_seconds}s choice.
2. For this {target_seconds}-second video, you MUST generate ALL {min_scenes} to {max_scenes} sequential scenes in the "storyboard" array (Scene 1 to Scene {target_scenes}).
3. The spoken monologue in "quote" MUST have genuine philosophical depth and substance ({min_words} to {max_words} total words) so that when read aloud at normal cadence, it fills the complete {target_seconds} seconds!
4. Story Arc Structure across the {min_scenes}-{max_scenes} scenes:
   - Scene 1: Pattern Interrupt Hook (3-4s, 6-9 words)
   - Scene 2 to Scene {target_scenes - 1}: Multi-Part Wisdom Monologue with escalating tension, real-world stoic metaphors, and philosophical depth (approx. 4.0s - 5.5s and 10-14 words per scene).
   - Final Scene {target_scenes}: Decisive Closing Call to Action (4-5s, 8-12 words).
5. Every single scene MUST feature a unique cinematic visual query tailored specifically to the theme/topic (urban, nature, technology, fitness, lifestyle, space, cars, luxury, or abstract) and distinct subtitleText.
6. The sum of all scene durations in "storyboard" MUST EQUAL EXACTLY {target_seconds}.0 seconds!
"""

        prompt = f"""You are an elite Autonomous AI Video Director, Virality Strategist, and Master Sound Designer for viral YouTube Shorts, Instagram Reels, and Facebook Reels.
Produce an inspiring, punchy, retention-optimized motivational video plan with full script, 3 viral hook variations, 5-layer sound design, and a multi-scene video storyboard with word-level karaoke timing.
{user_prompt_section}
{duration_enforcement_section}

TARGET ASPECT RATIO: {target_aspect_ratio}
ASPECT RATIO & COMPOSITION RULES:
- The video will be rendered strictly in {target_aspect_ratio} format.
- All scene footage, visual queries, Google search expressions, framing, and compositions MUST match {target_aspect_ratio}.
- For vertical (9:16 / 4:5): portrait orientation, subject centered in vertical safe-zone.
- For widescreen (16:9 / 21:9): cinematic landscape orientation, wide field of view.
- Subtitle Safety: In {target_aspect_ratio} (especially 9:16 vertical shorts), the bottom 25% of the screen is blocked by social media UI.
- Each subtitle line MUST be short and punchy (strictly 3 to 7 words per scene cut). NEVER output long continuous paragraph blocks!
- Break longer sentences into sequential 2.0s - 3.5s scene subtitle cuts matching the exact video beats.

THEME: {category or 'Stoic Discipline & Relentless Focus'}
TOPIC: {topic or 'Winning quiet battles, silence over excuses, compounding grit'}

CURRENT CREATIVE CONTEXT:
{context_block}

================================================================================
WEBSITE MEDIA & STYLE ASSET CATALOG (CHOOSE FREELY FROM THESE COMPLETE ASSETS):
================================================================================

1. AVAILABLE STOCK VIDEOS (FOR VIDEO SCENES):
{video_summary}

2. AVAILABLE SCENIC IMAGE BACKDROPS:
{backdrop_summary}

3. AVAILABLE TEXT STYLES & TYPOGRAPHY PRESETS:
{text_summary}

4. AVAILABLE SOUNDTRACKS:
{music_summary}

5. AVAILABLE SOUND EFFECTS (SFX & FOLEY):
{sfx_summary}

6. AVAILABLE VOICE PROFILES:
{voice_summary}

================================================================================
VIRALITY & RETENTION ARCHITECTURE:
================================================================================
1. THE 0-2.5s PATTERN INTERRUPT HOOK:
   - Must STOP the thumb scroll instantly in the first 1.5 seconds (4 to 8 words).
2. NATURAL MONOLOGUE PACING (2.4 - 2.6 WORDS PER SECOND).
3. DYNAMIC VISUAL DIRECTIVE (ALL KINDS OF CINEMATIC FOOTAGE):
   - Every scene MUST be a moving, cinematic VIDEO ("mediaType": "video").
   - ZERO DUPLICATE CLIPS across scene cuts.
4. 5-LAYER BROADCAST SOUND DESIGN & SIDECHAIN DUCKING.
5. SCRIPT-STORYBOARD CC PARITY & CLEAN CTA OVERLAY.

Output MUST be a single raw JSON object matching this exact schema:
{{
  "title": "A viral Shorts title with punch under 60 chars",
  "hook": "Unforgettable opening hook spoken in first 2-3 seconds",
  "quote": "A rich, profound motivational monologue containing approx {target_words - 18} spoken words divided across scenes 2..{target_scenes - 1}",
  "cta": "A sharp 1-sentence closing call-to-action",
  "aspectRatio": "{target_aspect_ratio}",
  "recommendedVoice": "Best voice matching the tone from the catalog",
  "musicTrack": "Best soundtrack title or ID from catalog",
  "captionStyle": "Best caption style",
  "tags": ["#Shorts", "#Motivation", "#Discipline"],
  "hooks": [
    {{
      "id": "hook_1",
      "angle": "Brutal Truth / Negative",
      "text": "Stop waiting for motivation.",
      "viralityScore": 96,
      "spokenDuration": 2.2
    }},
    {{
      "id": "hook_2",
      "angle": "Curiosity Gap",
      "text": "The one rule Marcus Aurelius never broke.",
      "viralityScore": 92,
      "spokenDuration": 2.4
    }},
    {{
      "id": "hook_3",
      "angle": "Direct Challenge",
      "text": "Can you handle 24 hours of pure focus?",
      "viralityScore": 89,
      "spokenDuration": 2.1
    }}
  ],
  "soundDesign": {{
    "soundtrackTrackId": "recommended-track-id",
    "soundtrackTitle": "Recommended Soundtrack Title",
    "genre": "cinematic",
    "bpm": 120,
    "ducking": {{
      "active": true,
      "voiceActiveVolume": 0.18,
      "pauseSwellVolume": 0.72,
      "attackMs": 150,
      "releaseMs": 300
    }},
    "sfxEvents": [
      {{ "time": 0.0, "sfxId": "sfx-impact", "label": "Opening Hook Boom" }},
      {{ "time": 2.5, "sfxId": "sfx-whoosh", "label": "Scene Transition" }}
    ]
  }},
  "storyboard": [
    {{
      "sceneNumber": 1,
      "beat": "hook",
      "start": 0.0,
      "duration": 2.5,
      "mediaType": "video",
      "mediaId": "",
      "mediaUrl": "",
      "mediaName": "Atmospheric Mountain Ridge & Mist",
      "textStyleId": "sub-hormozi",
      "textStyleName": "Hormozi Viral Yellow",
      "captionPresetClass": "font-black tracking-tight text-yellow-400 uppercase drop-shadow-[0_4px_12px_rgba(0,0,0,1)] bg-black/85 px-3 py-1 rounded-md border border-yellow-400/30",
      "captionPresetColor": "#FACC15",
      "captionPresetFontFamily": "Impact, sans-serif",
      "transition": "glitch",
      "cameraMotion": "push-in",
      "sfx": "Fast Cinematic Whoosh",
      "sfxUrl": null,
      "googleSearchQuery": "misty mountain peak sunrise clouds vertical 9:16",
      "visualQuery": "misty mountain peak sunrise clouds nature",
      "fallbackQueries": ["foggy pine forest aerial landscape", "mountain ridge clouds timelapse"],
      "negativeTerms": ["indoor", "gym", "city", "people", "talking", "cartoon"],
      "subtitleText": "Stop waiting for motivation."
    }}
  ]
}}
"""

        target_model = resolve_script_model(model or DEFAULT_SCRIPT_MODEL)
        logger.info(f"--> [API SENT]   Gemini AI Generate Content | Model: '{target_model}' | Theme: '{category}' | Topic: '{topic}'")
        start_t = time.perf_counter()

        try:
            result, used_model = _generate_script_with_fallback(
                prompt=prompt,
                target_model=target_model,
                system_instruction=SCRIPT_SYSTEM_INSTRUCTION,
            )

            if result is None or not isinstance(result, dict):
                logger.error(f"[ScriptAI/Gemini] Online generation failed: {used_model}")
                raise RuntimeError(
                    f"Gemini script generation failed: All online models were unavailable or quota-limited ({used_model}). "
                    "Please verify your GEMINI_API_KEY and model quota."
                )

            elapsed = time.perf_counter() - start_t
            storyboard = result.get("storyboard") or []

            if not storyboard:
                raise RuntimeError(f"Gemini model '{used_model}' generated a response without a valid 'storyboard' scene array.")

            if not result.get("title") or not str(result.get("title")).strip():
                raise RuntimeError(f"Gemini model '{used_model}' generated a response without a valid 'title'.")

            for sc in storyboard:
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

                has_cta_clipart = any(t in str(sc.get("visualQuery", "")).lower() for t in CTA_EXCLUSION_TERMS)
                if has_cta_clipart:
                    clean_theme = topic or category or "cinematic motivational finale"
                    sc["mediaName"] = f"Cinematic {category or 'Inspirational'} Finale"
                    sc["visualQuery"] = f"cinematic {clean_theme} {target_aspect_ratio}"
                    sc["googleSearchQuery"] = f"cinematic {clean_theme} {target_aspect_ratio}"
                    sc["fallbackQueries"] = [
                        f"cinematic {clean_theme} dramatic lighting {target_aspect_ratio}",
                        f"cinematic {clean_theme} epic atmosphere {target_aspect_ratio}",
                    ]

                primary_query = sc.get("visualQuery") or sc.get("mediaName") or sc.get("subtitleText") or topic
                google_q = sc.get("googleSearchQuery") or f"{primary_query} vertical 9:16"
                fallback_list = sc.get("fallbackQueries") or []

                sc["visualQuery"] = primary_query
                sc["googleSearchQuery"] = google_q
                sc["fallbackQueries"] = fallback_list
                sc["aspectRatio"] = target_aspect_ratio
                sc["mediaStatus"] = "resolved" if sc.get("mediaUrl") and str(sc["mediaUrl"]).startswith("http") else "unresolved"

            storyboard = expand_storyboard_to_target_duration(
                storyboard=storyboard,
                target_seconds=target_seconds,
                category=category,
                topic=topic,
                target_aspect_ratio=target_aspect_ratio,
            )

            if len(storyboard) > 2:
                middle_text = " ".join(
                    (s.get("subtitleText") or "").strip()
                    for s in storyboard[1:-1]
                    if (s.get("subtitleText") or "").strip()
                )
                if middle_text:
                    result["quote"] = middle_text

            hooks_data = result.get("hooks") or []
            if not hooks_data and result.get("hook"):
                hooks_data = [
                    {
                        "id": "hook_1",
                        "angle": "Opening Hook",
                        "text": result.get("hook"),
                        "viralityScore": 90,
                        "spokenDuration": 2.5,
                    },
                ]
            result["hooks"] = hooks_data

            sound_design = result.get("soundDesign") or {}
            st_id = sound_design.get("soundtrackTrackId") or result.get("musicTrack") or music_track or ""
            avail_tracks = catalog.get("musicTracks") or []
            matched_track = next(
                (m for m in avail_tracks if m.get("id") == st_id or m.get("title", "").lower() in str(st_id).lower()),
                {}
            ) if (avail_tracks and st_id) else {}

            sound_design["soundtrackTrackId"] = matched_track.get("id", str(st_id)) if st_id else ""
            sound_design["soundtrackTitle"] = matched_track.get("title", sound_design.get("soundtrackTitle", ""))
            sound_design["genre"] = matched_track.get("genre", sound_design.get("genre", audio_mood or ""))
            sound_design["bpm"] = matched_track.get("bpm", sound_design.get("bpm", 0))
            sound_design["audioUrl"] = matched_track.get("audioUrl", sound_design.get("audioUrl", ""))
            if not sound_design.get("ducking"):
                sound_design["ducking"] = DEFAULT_DUCKING_CONFIG.copy()

            sfx_events = sound_design.get("sfxEvents") or []
            avail_sfx_list = catalog.get("soundEffects") or []
            for evt in sfx_events:
                s_id = evt.get("sfxId")
                matched_sfx = next(
                    (s for s in avail_sfx_list if s.get("id") == s_id or s.get("name", "").lower() in str(evt.get("label", "")).lower()),
                    None
                ) if (avail_sfx_list and s_id) else None
                if matched_sfx:
                    evt["sfxUrl"] = matched_sfx.get("audioUrl")
                elif not evt.get("sfxUrl"):
                    evt["sfxUrl"] = ""
            sound_design["sfxEvents"] = sfx_events
            result["soundDesign"] = sound_design

            raw_scene_durations = []
            for sc in storyboard:
                txt = (sc.get("subtitleText") or "").strip()
                w_count = max(1, len(txt.split()))
                rate = float(sc.get("speechRate") or 1.0)
                natural_dur = round((w_count / (2.4 * rate)) + 1.2, 1)
                raw_scene_durations.append(max(2.8, natural_dur))

            total_raw_dur = sum(raw_scene_durations)
            scale_factor = (target_seconds / total_raw_dur) if total_raw_dur > 0 else 1.0

            curr_timeline_time = 0.0
            for idx, sc in enumerate(storyboard):
                is_last = (idx == len(storyboard) - 1)
                raw_dur = raw_scene_durations[idx]
                if is_last:
                    final_dur = max(2.5, round(target_seconds - curr_timeline_time, 2))
                else:
                    final_dur = max(2.5, round(raw_dur * scale_factor, 2))
                sc["duration"] = final_dur
                sc["start"] = round(curr_timeline_time, 2)
                curr_timeline_time = round(curr_timeline_time + final_dur, 2)

            synced_subtitles = []
            for sc in storyboard:
                txt = sc.get("subtitleText") or ""
                sc_start = float(sc.get("start", 0.0))
                sc_dur = float(sc.get("duration", 2.8))

                words_data = sc.get("words")
                if not words_data or not isinstance(words_data, list):
                    raw_words = [w for w in txt.split() if w.strip()]
                    words_data = []
                    if raw_words:
                        word_duration = sc_dur / len(raw_words)
                        for w_idx, w_str in enumerate(raw_words):
                            w_start = round(sc_start + (w_idx * word_duration), 2)
                            w_end = round(w_start + word_duration, 2)
                            is_emphasis = len(w_str) > 4 or w_str.isupper() or any(char in "!?:;" for char in w_str)
                            words_data.append({
                                "word": w_str,
                                "start": w_start,
                                "end": w_end,
                                "emphasis": is_emphasis,
                                "highlightColor": "#FACC15" if is_emphasis else None,
                            })
                sc["words"] = words_data

                synced_subtitles.append({
                    "text": txt,
                    "start": sc_start,
                    "duration": sc_dur,
                    "textStyleId": sc.get("textStyleId"),
                    "captionPresetClass": sc.get("captionPresetClass"),
                    "captionPresetColor": sc.get("captionPresetColor"),
                    "words": words_data,
                })

            result["storyboard"] = storyboard
            result["subtitles"] = synced_subtitles
            result["aspectRatio"] = target_aspect_ratio
            result["targetDurationSeconds"] = target_seconds
            result["durationSeconds"] = target_seconds
            result["estimatedDuration"] = f"{target_seconds}s"
            if not result.get("hashtags"):
                result["hashtags"] = result.get("tags") or []
            if not result.get("tags"):
                result["tags"] = result.get("hashtags") or []
            if not result.get("description"):
                h_line = result.get("hook", "")
                q_line = result.get("quote", "")
                c_line = result.get("cta", "")
                t_line = " ".join(result.get("hashtags", []))
                parts = [p for p in [h_line, q_line, c_line, t_line] if p]
                result["description"] = "\n\n".join(parts)
            if not result.get("titleIdeas") and result.get("title"):
                result["titleIdeas"] = [
                    {"title": result["title"], "angle": "Primary Title", "viralityScore": 95}
                ]
            if not result.get("outputFormat"):
                result["outputFormat"] = f"{target_aspect_ratio} Vertical Video (1080x1920)" if target_aspect_ratio == "9:16" else f"{target_aspect_ratio} Video"

            logger.info(
                f"<-- [API COMING] Gemini AI Generate Content | Model: '{target_model}' | Duration: {elapsed:.2f}s | "
                f"Title: '{result.get('title')}' | Scenes: {len(storyboard)}"
            )
            return result
        except Exception as e:
            elapsed = time.perf_counter() - start_t
            logger.error(f"[ScriptAI/Gemini] Generation error after {elapsed:.2f}s: {e}")
            raise RuntimeError(f"Gemini script generation failed: {e}")
