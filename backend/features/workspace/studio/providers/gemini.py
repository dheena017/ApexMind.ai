"""
backend/features/workspace/script_ai/providers/gemini.py
Gemini AI Script & Storyboard Provider.
Generates multi-scene storyboard script with viral hooks, narration, audio design, and scene timing.
Zero mock data: all content is generated dynamically via Google Gemini GenAI.
"""

from datetime import datetime, timezone
import json
import logging
import re
import time
from typing import Any, Dict, List, Optional
import warnings

warnings.filterwarnings("ignore", category=UserWarning, module="google.genai")
warnings.filterwarnings("ignore", message=".*automatic function calling.*")
warnings.filterwarnings("ignore", message=".*AFC.*")

from google.genai import types

from backend.shared.ai_models import (
    DEFAULT_SCRIPT_MODEL,
    get_script_fallback_models,
    is_unwanted_model,
    resolve_script_model,
)
from backend.shared.gemini import get_gemini_client, rate_tracker
from backend.features.workspace.video import sanitize_faceless_query
from backend.features.workspace.studio.genre_registry import get_genre_definition
from .base import BaseScriptProvider

logger = logging.getLogger("ApexMind.Workspace.ScriptAI.Gemini")

# ==============================================================================
# Script Generation System Instructions & Production Directives
# ==============================================================================

SCRIPT_SYSTEM_INSTRUCTION: str = (
    "You are an elite Autonomous AI Video Director, Virality Strategist, and Master Sound Designer "
    "for viral YouTube Shorts, Instagram Reels, and Facebook Reels. Produce high-retention motivational "
    "and inspirational faceless short video plans with 3 viral hook variations, diverse cinematic footage queries "
    "tailored to the theme (nature, urban, technology, fitness, space, luxury, architecture, lifestyle, abstract), "
    "and 5-layer broadcast sound design with dynamic sidechain ducking. "
    "STRICT FACELESS VIDEO RULE: All generated videos MUST BE 100% FACELESS. Under no circumstances should any scene "
    "feature or request close-up human faces, visible facial expressions, portraits, talking heads, front-facing people, "
    "or selfies. All visual queries must specify aesthetic faceless B-roll, landscapes, architecture, abstract visuals, "
    "objects, textures, or anonymous silhouettes viewed strictly from behind without any visible face. "
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

    models_to_try = models_to_try[:3]

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
            if hasattr(types, "AutomaticFunctionCallingConfig"):
                try:
                    gen_config["automatic_function_calling"] = types.AutomaticFunctionCallingConfig(disable=True)
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

        genre_id = kwargs.get("genre") or "motivation"
        genre_def = get_genre_definition(genre_id)
        effective_voice = voice_name or genre_def.default_voice
        effective_audio_mood = audio_mood or genre_def.default_audio_mood

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

        prompt = f"""You are an elite Autonomous AI Video Director, Virality Strategist, and Master Sound Designer for viral YouTube Shorts, Instagram Reels, and TikTok.
Produce an inspiring, punchy, retention-optimized video plan in the '{genre_def.label}' genre ({genre_def.id}) with full script, 3 viral hook variations, 5-layer sound design, and a multi-scene video storyboard with word-level karaoke timing.
{user_prompt_section}
{duration_enforcement_section}

{genre_def.virality_guidelines}

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
4. MANDATORY FACELESS DIRECTIVE (ABSOLUTE REQUIREMENT):
   - ZERO HUMAN FACES: Under NO circumstances should any scene feature close-up human faces, visible facial expressions, portraits, front-facing people looking at the camera, talking heads, or selfies!
   - Every scene's "visualQuery" and "googleSearchQuery" MUST focus entirely on faceless visual metaphors:
     * Dramatic nature: mountain ridges, stormy ocean waves, lightning clouds, waterfalls, deep pine forests, star timelapses.
     * Cinematic cityscapes: glowing night skylines, rain on neon pavements, drone aerial sweeps, traffic light streaks.
     * Objects & details: hourglass sand falling, stopwatch ticking, chess moves, luxury car driving away, weights lifted (hands/silhouettes only), vintage compass, burning flame.
     * Anonymous silhouettes: figure viewed strictly from behind walking toward mountains/city, silhouette against sunset (NO visible face).
   - "negativeTerms" for EVERY scene MUST explicitly list:
     ["face", "human face", "portrait", "close up face", "talking head", "selfie", "smiling face", "person looking at camera", "facial"].
5. 5-LAYER BROADCAST SOUND DESIGN & SIDECHAIN DUCKING.
6. SCRIPT-STORYBOARD CC PARITY & CLEAN CTA OVERLAY.

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
                system_instruction=genre_def.system_instruction,
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
                        f"cinematic {clean_theme} dramatic nature lighting {target_aspect_ratio}",
                        f"cinematic {clean_theme} epic atmosphere {target_aspect_ratio}",
                    ]

                raw_primary = sc.get("visualQuery") or sc.get("mediaName") or sc.get("subtitleText") or topic
                if genre_def.id in ("roblox_story", "odd_one_out"):
                    primary_query = str(raw_primary).strip()
                    google_q = sc.get("googleSearchQuery") or f"{primary_query} {target_aspect_ratio}"
                    sanitized_fallbacks = sc.get("fallbackQueries") or [f"{primary_query} 3d model"]
                else:
                    primary_query = sanitize_faceless_query(raw_primary, fallback_theme=f"cinematic {category or 'nature'} landscape")
                    raw_google = sc.get("googleSearchQuery") or f"{primary_query} vertical {target_aspect_ratio}"
                    google_q = sanitize_faceless_query(raw_google, fallback_theme=f"cinematic {category or 'nature'} landscape {target_aspect_ratio}")
                    raw_fallbacks = sc.get("fallbackQueries") or []
                    sanitized_fallbacks = [
                        sanitize_faceless_query(fb, fallback_theme=f"cinematic {category or 'nature'} b-roll")
                        for fb in raw_fallbacks
                    ]

                sc["visualQuery"] = primary_query
                sc["googleSearchQuery"] = google_q
                sc["fallbackQueries"] = sanitized_fallbacks
                sc["aspectRatio"] = target_aspect_ratio
                sc["mediaStatus"] = "resolved" if sc.get("mediaUrl") and str(sc["mediaUrl"]).startswith("http") else "unresolved"

                # Enforce mandatory faceless negative terms for non-gaming genres
                existing_neg = sc.get("negativeTerms") or []
                if genre_def.id == "motivation":
                    mandatory_neg = ["face", "human face", "portrait", "close up face", "talking head", "selfie", "smiling face"]
                    sc["negativeTerms"] = list(dict.fromkeys(mandatory_neg + existing_neg))
                else:
                    sc["negativeTerms"] = existing_neg

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

            result["genre"] = genre_def.id
            result["genreLabel"] = genre_def.label
            result["suggested3DProvider"] = genre_def.recommended_3d_providers[0]
            result["userPrompt"] = user_prompt or topic or ""
            if not result.get("recommendedVoice"):
                result["recommendedVoice"] = effective_voice

            logger.info(
                f"<-- [API COMING] Gemini AI Generate Content | Model: '{target_model}' | Duration: {elapsed:.2f}s | "
                f"Title: '{result.get('title')}' | Scenes: {len(storyboard)}"
            )
            return result
        except Exception as e:
            elapsed = time.perf_counter() - start_t
            logger.error(f"[ScriptAI/Gemini] Generation error after {elapsed:.2f}s: {e}")
            raise RuntimeError(f"Gemini script generation failed: {e}")

    # ==========================================================================
    # MODULAR STAGE 1 SMALL API PROVIDER METHODS
    # ==========================================================================

    def generate_script_content(
        self,
        category: str,
        topic: str,
        tone: str = "aggressive",
        target_duration_seconds: int = 30,
        user_prompt: Optional[str] = None,
        model: Optional[str] = None,
        genre: Optional[str] = "motivation",
        **kwargs,
    ) -> Dict[str, Any]:
        """Generates viral hooks, main monologue, closing CTA, and assembled fullScript."""
        target_model = resolve_script_model(model or DEFAULT_SCRIPT_MODEL)
        genre_def = get_genre_definition(genre)
        target_words = max(20, round(target_duration_seconds * genre_def.speech_rate))
        min_words = round(target_duration_seconds * (genre_def.speech_rate - 0.3))
        max_words = round(target_duration_seconds * (genre_def.speech_rate + 0.3))

        user_dir = ""
        if user_prompt and user_prompt.strip():
            user_dir = f"""
USER SPECIFIC CREATIVE DIRECTION (TOP PRIORITY):
"{user_prompt.strip()}"
"""

        prompt = f"""
You are a viral YouTube Shorts and TikTok scriptwriter specializing in the '{genre_def.label}' genre ({genre_def.id}).
Write a complete short video script for:
CATEGORY: {category}
TOPIC: {topic}
TONE: {tone or 'high-retention'}
TARGET DURATION: {target_duration_seconds} seconds
TARGET WORD COUNT: Exactly {min_words} to {max_words} spoken words across the full speech.
{user_dir}

{genre_def.virality_guidelines}

REQUIREMENTS:
1. "hookOptions": Provide exactly 3 pattern-interrupt opening lines (first 2-3 seconds, 4 to 8 words) with distinct virality angles matching {genre_def.label}.
2. "selectedHook": Select the single most viral hook from the options.
3. "monologue": Write a profound, gripping narrative body ({min_words - 15} to {max_words - 12} words) maintaining escalating emotional tension. Include sound cues like [glitch sound], [ticking clock] or [subdrop] where appropriate.
4. "cta": A sharp 1-sentence closing call-to-action tailored to {genre_def.label}.

Output MUST be a single raw JSON object matching this exact schema:
{{
  "hookOptions": [
    {{ "id": "hook_1", "angle": "Angle 1", "text": "...", "viralityScore": 96 }},
    {{ "id": "hook_2", "angle": "Angle 2", "text": "...", "viralityScore": 92 }},
    {{ "id": "hook_3", "angle": "Angle 3", "text": "...", "viralityScore": 89 }}
  ],
  "selectedHook": "...",
  "monologue": "...",
  "cta": "..."
}}
"""
        parsed, used_model = _generate_script_with_fallback(
            prompt=prompt,
            target_model=target_model,
            system_instruction=genre_def.system_instruction,
        )

        if not parsed or not isinstance(parsed, dict):
            # Fallback dynamic generator by genre
            if genre_def.id == "roblox_story":
                selected_hook = f"Never buy the $1 house in Brookhaven."
                monologue = f"Yesterday I spawned into a private server. At 3:00 AM, the lights turned red and my character froze. [glitch sound] In the chat, an unknown account typed my real name. I tried to reset my character, but the button was gone. [whispering] That's when I realized: someone else was controlling my avatar."
                cta = "Comment your username if you would have survived this server!"
                hook_opts = [
                    {"id": "hook_1", "angle": "The Forbidden Warning", "text": selected_hook, "viralityScore": 97},
                    {"id": "hook_2", "angle": "The 3AM Glitch", "text": "I found an abandoned server in Brookhaven...", "viralityScore": 94},
                ]
            elif genre_def.id == "odd_one_out":
                selected_hook = f"Only 1% of people can find the odd one out in 5 seconds!"
                monologue = f"Level 1: Look at these four avatars. [ticking clock 3s] 3... 2... 1... Time's up! [victory ding] Avatar number 3 has a reversed hat! Now Level 2, Hard Mode: [intense heartbeat] Spot the missing shadow before the timer expires. 3... 2... 1..."
                cta = "Comment your score: did you pass Level 2? Subscribe for daily tests!"
                hook_opts = [
                    {"id": "hook_1", "angle": "The 1% IQ Test", "text": selected_hook, "viralityScore": 98},
                    {"id": "hook_2", "angle": "5-Second Challenge", "text": "99% of people fail this eyes test before the buzzer!", "viralityScore": 93},
                ]
            else:
                selected_hook = f"While you were sleeping, someone took your future."
                monologue = f"Comfort is the silent killer of your potential. In {category.lower()}, every single day counts. When you struggle to rise at dawn, remind yourself why you started. Silence is your weapon."
                cta = "Wake up earlier tomorrow. Save this for daily discipline."
                hook_opts = [
                    {"id": "hook_1", "angle": "Brutal Truth", "text": selected_hook, "viralityScore": 95},
                    {"id": "hook_2", "angle": "Curiosity Gap", "text": f"The one rule of {topic or category} nobody tells you.", "viralityScore": 91},
                ]
        else:
            selected_hook = str(parsed.get("selectedHook") or (parsed.get("hookOptions") or [{}])[0].get("text") or "Stop waiting for motivation.").strip()
            monologue = str(parsed.get("monologue") or parsed.get("quote") or "").strip()
            cta = str(parsed.get("cta") or "Save this video and stay focused.").strip()
            hook_opts = parsed.get("hookOptions") or [
                {"id": "hook_1", "angle": "Primary Hook", "text": selected_hook, "viralityScore": 95}
            ]

        full_script = f"{selected_hook} {monologue} {cta}".strip()
        words_count = len(full_script.split())

        return {
            "success": True,
            "hookOptions": hook_opts,
            "selectedHook": selected_hook,
            "monologue": monologue,
            "cta": cta,
            "fullScript": full_script,
            "totalWords": words_count,
            "generatedAt": datetime.now(timezone.utc).isoformat(),
        }

    def generate_script_subtitles(
        self,
        full_script: str,
        target_duration_seconds: int = 30,
        caption_style_preset: str = "sub-hormozi",
        aspect_ratio: str = "9:16",
        model: Optional[str] = None,
        **kwargs,
    ) -> Dict[str, Any]:
        """Slices fullScript into 3-6 word mobile safe-zone subtitle lines with timestamps."""
        words = [w.strip() for w in full_script.split() if w.strip()]
        if not words:
            return {"success": True, "totalDurationSeconds": 0.0, "subtitles": []}

        # Algorithmically partition into punchy 3-5 word chunks
        chunk_size = 4
        chunks = []
        for i in range(0, len(words), chunk_size):
            chunks.append(words[i : i + chunk_size])

        num_chunks = len(chunks)
        dur_per_chunk = max(1.2, round(target_duration_seconds / max(1, num_chunks), 2))
        running_time = 0.0

        subtitles = []
        for idx, chunk in enumerate(chunks):
            is_last = idx == num_chunks - 1
            line_dur = round(target_duration_seconds - running_time, 2) if is_last else dur_per_chunk
            line_dur = max(1.0, line_dur)
            end_time = round(running_time + line_dur, 2)
            text_str = " ".join(chunk)

            # Highlight significant words
            highlights = [w.strip(".,!?:;\"'") for w in chunk if len(w) > 4 or w.isupper() or any(p in w for p in "!?")]
            if not highlights and chunk:
                highlights = [chunk[-1].strip(".,!?:;\"'")]

            subtitles.append({
                "lineIndex": idx + 1,
                "text": text_str,
                "startTime": round(running_time, 2),
                "endTime": end_time,
                "duration": line_dur,
                "highlightWords": highlights[:2],
            })
            running_time = end_time

        return {
            "success": True,
            "totalDurationSeconds": float(target_duration_seconds),
            "subtitles": subtitles,
        }

    def generate_video_scenes(
        self,
        subtitles: list,
        visual_theme: str = "Cinematic Dark Architecture",
        motion_style: str = "slow push in",
        aspect_ratio: str = "9:16",
        user_visual_prompt: Optional[str] = None,
        model: Optional[str] = None,
        genre: Optional[str] = "motivation",
        suggested_3d_provider: Optional[str] = None,
        render_3d_engine: Optional[str] = None,
        **kwargs,
    ) -> Dict[str, Any]:
        """Generates 3D and stock video scene directives, asset queries, and camera choreography for each subtitle cut."""
        target_model = resolve_script_model(model or DEFAULT_SCRIPT_MODEL)
        scenes_data = []

        # Consolidate micro-subtitles into 4-8 cinematic visual scene beats (3.0s - 5.0s each)
        visual_beats: list[dict[str, Any]] = []
        cur_beat_text: list[str] = []
        cur_beat_dur = 0.0
        cur_beat_start = 0.0

        for idx, s in enumerate(subtitles):
            if not cur_beat_text:
                cur_beat_start = float(s.get("startTime", 0.0))
            cur_beat_text.append(str(s.get("text", "")).strip())
            cur_beat_dur += float(s.get("duration", 2.0))
            if cur_beat_dur >= 3.2 or idx == len(subtitles) - 1 or len(visual_beats) >= 7:
                visual_beats.append({
                    "beatIndex": len(visual_beats) + 1,
                    "startTime": cur_beat_start,
                    "duration": round(cur_beat_dur, 2),
                    "text": " ".join(cur_beat_text).strip(),
                })
                cur_beat_text = []
                cur_beat_dur = 0.0

        if not visual_beats:
            visual_beats = [{"beatIndex": 1, "startTime": 0.0, "duration": 4.0, "text": "Hook visual intro"}]

        sub_prompts = "\n".join([
            f"Scene {b['beatIndex']} ({b['duration']}s): \"{b['text']}\""
            for b in visual_beats
        ])

        user_dir = f'USER STORY / SCENE DIRECTION: "{user_visual_prompt}"\n' if user_visual_prompt else ""

        genre_id = (genre or "motivation").lower()
        if genre_id == "roblox_story":
            genre_visual_mandate = """
GENRE: ROBLOX 3D STORYTELLING & CREEPYPASTA
VISUAL STYLE: 3D Roblox blocky game graphics, Brookhaven 3D maps, Brookhaven hospital, Blox Fruits swords, Roblox obbies, glitched Roblox avatars with glowing auras, dramatic 3D third-person game cameras.
CATALOG SEARCH QUERY: Focus queries on Roblox 3D items, avatars, and places (e.g. "roblox avatar glitched dark blade", "brookhaven empty hospital 3d", "roblox obby lava obstacle 3d").
ZERO human stock faces. Everything must be 3D Roblox game aesthetic.
"""
        elif genre_id == "odd_one_out":
            genre_visual_mandate = """
GENRE: FIND THE ODD ONE OUT (GAMIFIED 3D PERCEPTION TEST)
VISUAL STYLE: Clean gamified visual challenges, 4 Roblox avatars or 3D items displayed side-by-side or in a 2x2 grid, with a visible 5-second ticking countdown timer bar, and a sudden freeze-frame highlight reveal on the buzzer pointing to the glitched / fake item.
CATALOG SEARCH QUERY: Focus queries on 3D lineup items (e.g. "roblox 4 avatar lineup spot difference", "brookhaven house 2x2 grid visual test", "roblox valkyrie helmets spot fake").
"""
        else:
            genre_visual_mandate = """
GENRE: MOTIVATION & STOIC MINDSET
VISUAL STYLE: Faceless 3D CGI, stoic Greek/Roman marble busts & statues, foggy mountain peaks with 2.5D multi-plane camera parallax, silhouetted men looking at skyscrapers, luxury minimalist architecture.
CATALOG SEARCH QUERY: Focus queries on photorealistic CC0 statues, stone busts, and dramatic landscapes (e.g. "marcus aurelius marble statue bust 3d", "foggy mountain peak parallax 3d", "dark stoic statue volumetric fog").
STRICT FACELESS MANDATE: ZERO human faces or smiling portraits.
"""

        prompt = f"""
You are an expert cinematic director planning high-retention 3D and vertical video scenes.
THEME: {visual_theme}
MOTION: {motion_style}
ASPECT RATIO: {aspect_ratio}
3D ENGINE: {render_3d_engine or 'blender_hybrid'}
3D ASSET PROVIDER: {suggested_3d_provider or 'roblox_creator_store'}
{user_dir}
{genre_visual_mandate}

SCENE SUBTITLES TO MATCH:
{sub_prompts}

For EACH scene above, output a rich 3D scene visual query and 3D camera build direction matching the exact narration.
Output MUST be a single raw JSON object matching this schema:
{{
  "scenes": [
    {{
      "sceneNumber": 1,
      "searchQuery": "roblox avatar standing outside dark brookhaven hospital window 3d",
      "visual3DQuery": "roblox avatar brookhaven hospital 3d",
      "scenePrompt3D": "3D Blender parallax camera slowly pushes in towards dark hospital window where a glitching avatar with glowing red eyes is standing",
      "fallbackQueries": ["roblox dark street lamp rain 3d", "abandoned roblox room 3d"],
      "negativeTerms": ["face", "human face", "portrait", "talking head"],
      "cameraMotion": "slow push in 3d parallax",
      "transition": "glitch"
    }}
  ]
}}
"""
        parsed, _ = _generate_script_with_fallback(
            prompt=prompt,
            target_model=target_model,
            system_instruction="Strictly output valid JSON matching the 3D scene schema.",
        )

        ai_scenes = parsed.get("scenes", []) if (parsed and isinstance(parsed, dict)) else []
        ai_scene_map = {s.get("sceneNumber"): s for s in ai_scenes}

        for b_idx, beat in enumerate(visual_beats):
            sc_num = beat["beatIndex"]
            ai_sc = ai_scene_map.get(sc_num) or (ai_scenes[b_idx] if b_idx < len(ai_scenes) else {})

            if genre_id == "roblox_story":
                default_theme = "roblox 3d game environment dark mystery"
            elif genre_id == "odd_one_out":
                default_theme = "4 roblox avatars lineup 5s countdown timer test 3d"
            else:
                default_theme = f"cinematic {visual_theme.lower()} landscape"

            raw_query = ai_sc.get("searchQuery") or ai_sc.get("visual3DQuery") or f"{default_theme} {beat.get('text', '')}"
            clean_query = sanitize_faceless_query(raw_query, fallback_theme=default_theme)
            
            raw_fallbacks = ai_sc.get("fallbackQueries") or [f"atmospheric {default_theme} b-roll"]
            clean_fallbacks = [sanitize_faceless_query(q, fallback_theme=default_theme) for q in raw_fallbacks]

            scenes_data.append({
                "sceneNumber": sc_num,
                "startTime": float(beat.get("startTime", 0.0)),
                "duration": float(beat.get("duration", 3.5)),
                "mediaType": "3d_visual",
                "subtitleText": beat.get("text", ""),
                "searchQuery": clean_query,
                "visualQuery": ai_sc.get("visual3DQuery") or clean_query,
                "scenePrompt3D": ai_sc.get("scenePrompt3D") or f"3D camera motion '{ai_sc.get('cameraMotion') or motion_style}' framing {clean_query}",
                "render3DEngine": render_3d_engine or "blender_hybrid",
                "suggested3DProvider": suggested_3d_provider or ("roblox_creator_store" if genre_id in ("roblox_story", "odd_one_out") else "poly_haven"),
                "fallbackQueries": clean_fallbacks,
                "negativeTerms": ai_sc.get("negativeTerms") or ["face", "human face", "portrait", "talking head"],
                "cameraMotion": ai_sc.get("cameraMotion") or motion_style,
                "transition": ai_sc.get("transition") or ("glitch" if b_idx == 0 else "cut"),
                "mediaStatus": "unresolved",
            })

        return {
            "success": True,
            "mode": "video",
            "scenes": scenes_data,
        }

    def generate_image_scenes(
        self,
        subtitles: list,
        art_style: str = "hyperrealistic cinematic photography",
        color_palette: str = "moody dark teal and orange",
        aspect_ratio: str = "9:16",
        user_visual_prompt: Optional[str] = None,
        model: Optional[str] = None,
        **kwargs,
    ) -> Dict[str, Any]:
        """Generates frame-by-frame AI image diffusion prompts and Ken Burns motion directions."""
        target_model = resolve_script_model(model or DEFAULT_SCRIPT_MODEL)
        frames_data = []

        sub_prompts = "\n".join([
            f"Frame {s.get('lineIndex') or idx+1} ({s.get('duration')}s): \"{s.get('text')}\""
            for idx, s in enumerate(subtitles)
        ])

        user_dir = f'USER ART DIRECTION: "{user_visual_prompt}"\n' if user_visual_prompt else ""

        prompt = f"""
You are an AI Art Director generating Midjourney/Imagen diffusion prompts for each scene cut.
ART STYLE: {art_style}
COLOR PALETTE: {color_palette}
ASPECT RATIO: {aspect_ratio}
{user_dir}
STRICT RULE: Focus on aesthetic atmosphere, textures, statues, solitary anonymous silhouettes from behind. No smiling portraits or front-facing people.

FRAMES TO VISUALIZE:
{sub_prompts}

Output MUST be a single raw JSON object matching this schema:
{{
  "frames": [
    {{
      "frameNumber": 1,
      "imagePrompt": "Cinematic 8k portrait of an ancient marble statue covered in rain droplets, deep shadows, rim lighting, 35mm lens, 9:16",
      "negativePrompt": "blurry, low quality, cartoon, deformed, bright colors",
      "cameraShot": "medium close-up",
      "lightingStyle": "dramatic chiaroscuro rim light",
      "kenBurnsMotion": "slow pan down",
      "transition": "fade"
    }}
  ]
}}
"""
        parsed, _ = _generate_script_with_fallback(
            prompt=prompt,
            target_model=target_model,
            system_instruction="Strictly output valid JSON matching the image frame schema.",
        )

        ai_frames = parsed.get("frames", []) if (parsed and isinstance(parsed, dict)) else []
        ai_frame_map = {f.get("frameNumber"): f for f in ai_frames}

        for idx, sub in enumerate(subtitles):
            fr_num = sub.get("lineIndex") or idx + 1
            ai_fr = ai_frame_map.get(fr_num, {})

            frames_data.append({
                "frameNumber": fr_num,
                "startTime": float(sub.get("startTime", 0.0)),
                "duration": float(sub.get("duration", 2.0)),
                "mediaType": "image",
                "subtitleText": sub.get("text", ""),
                "imagePrompt": ai_fr.get("imagePrompt") or f"Cinematic 8k shot representing {sub.get('text', '')}, {art_style}, {color_palette}, {aspect_ratio}",
                "negativePrompt": ai_fr.get("negativePrompt") or "blurry, low quality, cartoon, face close up, selfie",
                "cameraShot": ai_fr.get("cameraShot") or "medium shot",
                "lightingStyle": ai_fr.get("lightingStyle") or "dramatic moody lighting",
                "kenBurnsMotion": ai_fr.get("kenBurnsMotion") or ("zoom in slow" if idx % 2 == 0 else "slow pan down"),
                "transition": ai_fr.get("transition") or "fade",
                "mediaStatus": "unresolved",
            })

        return {
            "success": True,
            "mode": "image",
            "frames": frames_data,
        }

    def plan_sound_design(
        self,
        category: str,
        tone: str = "aggressive",
        audio_mood: str = "Dark Phonk / Intense",
        target_duration_seconds: int = 30,
        scene_timestamps: Optional[list] = None,
        model: Optional[str] = None,
        **kwargs,
    ) -> Dict[str, Any]:
        """Plans soundtrack criteria, SFX triggers, and dynamic ducking."""
        is_aggressive = any(t in str(tone).lower() for t in ["aggress", "raw", "phonk", "hard", "intense", "grit"])
        
        genre = "Drift Phonk" if is_aggressive else "Cinematic Ambient"
        bpm = 132 if is_aggressive else 95
        energy = "high" if is_aggressive else "medium"
        mood_desc = "Dark, relentless bassline with distorted 808s driving focus" if is_aggressive else "Deep atmospheric strings and contemplative piano"

        timestamps = scene_timestamps or [0.0, 1.8, 3.6, 5.4, 7.2]
        sfx_events = []
        for idx, ts in enumerate(timestamps):
            if idx == 0:
                sfx_events.append({
                    "timeOffset": round(float(ts), 2),
                    "type": "subdrop",
                    "label": "Opening Hook Impact",
                    "volume": 0.90,
                    "reason": "Accentuates opening pattern-interrupt hook",
                })
            elif idx == 1 or idx % 2 == 1:
                sfx_events.append({
                    "timeOffset": round(float(ts), 2),
                    "type": "whoosh",
                    "label": f"Scene {idx+1} Transition",
                    "volume": 0.65,
                    "reason": "Smooth cinematic whoosh sweep across cut",
                })
            elif idx == len(timestamps) - 2:
                sfx_events.append({
                    "timeOffset": round(float(ts), 2),
                    "type": "riser",
                    "label": "Climactic Tension Riser",
                    "volume": 0.75,
                    "reason": "Builds tension before the final wisdom delivery",
                })

        ducking = {
            "active": True,
            "voiceActiveVolume": 0.16 if is_aggressive else 0.22,
            "pauseSwellVolume": 0.75 if is_aggressive else 0.65,
            "attackMs": 130 if is_aggressive else 180,
            "releaseMs": 260 if is_aggressive else 340,
            "profile": "aggressive-sidechain" if is_aggressive else "smooth-swell",
        }

        return {
            "success": True,
            "soundtrack": {
                "genre": genre,
                "bpm": bpm,
                "energyLevel": energy,
                "moodDescription": mood_desc,
                "searchKeywords": [genre.lower(), f"{genre.lower()} instrumental", f"dark {category.lower()}"],
            },
            "sfxEvents": sfx_events,
            "ducking": ducking,
        }

    def generate_video_metadata(
        self,
        category: str,
        topic: str,
        full_script: str,
        model: Optional[str] = None,
        **kwargs,
    ) -> Dict[str, Any]:
        """Generates viral titles, social descriptions, hashtags, and tags."""
        target_model = resolve_script_model(model or DEFAULT_SCRIPT_MODEL)

        prompt = f"""
You are a viral social media strategist optimizing a short video for YouTube Shorts, Instagram Reels, and TikTok.
CATEGORY: {category}
TOPIC: {topic}
FULL SPOKEN SCRIPT:
"{full_script[:400]}"

Generate:
1. "titles": Exactly 3 clickable, high-retention titles (under 60 characters).
2. "description": An engaging 2-3 sentence YouTube/Instagram description summarizing the message with a strong hook.
3. "hashtags": 5-8 relevant trending hashtags including #Shorts.
4. "tags": 6-10 search optimization keyword tags.
5. "categoryNiche": The specific niche taxonomy.

Output MUST be a single raw JSON object:
{{
  "titles": ["Title 1", "Title 2", "Title 3"],
  "description": "...",
  "hashtags": ["#Shorts", "#Motivation", "#Discipline"],
  "tags": ["morning routine", "grit", "focus"],
  "categoryNiche": "Self-Improvement & Philosophy"
}}
"""
        parsed, _ = _generate_script_with_fallback(
            prompt=prompt,
            target_model=target_model,
            system_instruction="Strictly output valid JSON matching the metadata schema.",
        )

        clean_topic = topic or category or "Discipline"
        fallback_titles = [
            f"Why {clean_topic} Changes Everything",
            f"The Unspoken Rule of {clean_topic}",
            f"While They Slept, You Conquered | {clean_topic}",
        ]

        if parsed and isinstance(parsed, dict) and parsed.get("titles"):
            titles = parsed.get("titles")
            desc = parsed.get("description") or f"Master your mindset. #Shorts #{category.replace(' ', '')}"
            hashtags = parsed.get("hashtags") or ["#Shorts", "#Motivation", "#Discipline"]
            tags = parsed.get("tags") or ["motivation", "discipline", "mindset"]
            niche = parsed.get("categoryNiche") or "Self-Improvement & Philosophy"
        else:
            titles = fallback_titles
            desc = f"Stop waiting for motivation. Master your mindset and conquer your day.\n\n#Shorts #Motivation #Discipline"
            hashtags = ["#Shorts", "#Motivation", "#Discipline", "#Mindset", "#Stoicism"]
            tags = ["motivation", "discipline", "mindset", "stoic", "focus"]
            niche = "Self-Improvement & Philosophy"

        return {
            "success": True,
            "titles": titles,
            "description": desc,
            "hashtags": hashtags,
            "tags": tags,
            "categoryNiche": niche,
        }
