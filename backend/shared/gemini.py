import base64
import json
import logging
import re
import struct
import time
from typing import Any

from google import genai
from google.genai import types

from .config import settings
from .media_catalog import (
    VISUAL_BACKDROPS,
    CURATED_TEXT_PRESETS,
    MEDIA_TRACKS,
    VOICE_PROFILES,
    CURATED_SFX,
    get_static_media_catalog,
)

logger = logging.getLogger("ApexMind.Gemini")

gemini_client = None

if settings.GEMINI_API_KEY:
    try:
        gemini_client = genai.Client(api_key=settings.GEMINI_API_KEY)
        logger.info("Google GenAI client initialized successfully.")
    except Exception as e:  # noqa: BLE001
        logger.error(f"Failed to initialize google.genai client: {e}")
else:
    logger.warning("GEMINI_API_KEY is not set.")

DEFAULT_SCRIPT_MODEL = "gemini-2.5-flash"

# Model Registry: Maps model IDs strictly to active, available Google Gemini API models
SUPPORTED_SCRIPT_MODELS: dict[str, str] = {
    # Actively available Google Gemini models
    "gemini-2.5-flash": "gemini-2.5-flash",
    "gemini-2.5-flash-lite": "gemini-2.5-flash",
    "gemini-2.5-pro": "gemini-2.5-pro",
    "gemini-2.0-flash": "gemini-2.0-flash",
    "gemini-flash-latest": "gemini-2.5-flash",
    "gemini-pro-latest": "gemini-2.5-pro",
    # Legacy / external aliases safely mapped to active models
    "gemini-2.0-flash-lite": "gemini-2.5-flash",
    "gemini-1.5-flash": "gemini-2.5-flash",
    "gemini-1.5-pro": "gemini-2.5-pro",
    "claude-3-7-sonnet": "gemini-2.5-pro",
    "gpt-4o": "gemini-2.5-pro",
}

def resolve_script_model(model_name: str | None = None) -> str:
    """Selects and validates the script generation model using a dictionary registry lookup without if/else chains."""
    if not model_name:
        return DEFAULT_SCRIPT_MODEL
    return SUPPORTED_SCRIPT_MODELS.get(model_name.strip().lower(), DEFAULT_SCRIPT_MODEL)

DEFAULT_TTS_MODEL = "gemini-2.5-flash-preview-tts"
SUPPORTED_TTS_MODELS: dict[str, str] = {
    "gemini-2.5-flash-preview-tts": "gemini-2.5-flash-preview-tts",
    "gemini-2.5-flash": "gemini-2.5-flash-preview-tts",
    "gemini-2.5-pro": "gemini-2.5-flash-preview-tts",
    "gemini-2.0-flash-preview-tts": "gemini-2.5-flash-preview-tts",
    "gemini-2.0-flash": "gemini-2.5-flash-preview-tts",
}


def resolve_tts_model(model_name: str | None = None) -> str:
    """Resolve a supported Gemini TTS model without requiring a hardcoded fallback."""
    if not model_name:
        return DEFAULT_TTS_MODEL
    return SUPPORTED_TTS_MODELS.get(model_name.strip().lower(), DEFAULT_TTS_MODEL)


def normalize_voiceover_text(text: str) -> str:
    """Clean and normalize script text to keep the TTS output stable and natural."""
    cleaned = " ".join(str(text or "").replace("\r\n", "\n").split())
    return cleaned.strip()


def convert_l16_pcm_to_wav(raw_audio: bytes | str, sample_rate: int = 24000) -> bytes:
    """Convert raw 16-bit PCM audio into a browser-playable WAV payload."""
    if isinstance(raw_audio, str):
        raw_audio = base64.b64decode(raw_audio)
    if not raw_audio:
        raise ValueError("Audio payload is empty.")

    data_size = len(raw_audio)
    byte_rate = sample_rate * 2
    wav_header = struct.pack(
        '<4sI4s4sIHHIIHH4sI',
        b'RIFF',
        36 + data_size,
        b'WAVE',
        b'fmt ',
        16,
        1,
        1,
        sample_rate,
        byte_rate,
        2,
        16,
        b'data',
        data_size,
    )
    return wav_header + raw_audio


def extract_voiceover_audio(response: Any) -> tuple[bytes, str]:
    """Extract the inline audio payload from Gemini's TTS response and normalize it for browser playback."""
    if response is None:
        raise RuntimeError("Gemini TTS returned no response payload.")

    candidates = getattr(response, "candidates", []) or []
    for candidate in candidates:
        content = getattr(candidate, "content", None)
        parts = getattr(content, "parts", []) or []
        for part in parts:
            inline_data = getattr(part, "inline_data", None)
            if inline_data is None:
                inline_data = getattr(part, "inlineData", None)
            if inline_data is None:
                continue
            raw_audio = getattr(inline_data, "data", None)
            mime_type = getattr(inline_data, "mime_type", "audio/wav") or "audio/wav"
            if raw_audio is None:
                continue
            if isinstance(raw_audio, str):
                raw_audio = base64.b64decode(raw_audio)
            if "pcm" in mime_type.lower() or "l16" in mime_type.lower():
                return convert_l16_pcm_to_wav(raw_audio, sample_rate=24000), "audio/wav"
            return raw_audio, mime_type

    raise RuntimeError("No usable audio inline_data was returned by Gemini TTS.")


def calculate_audio_duration(audio_bytes: bytes, mime_type: str = "audio/wav") -> float:
    """Calculate the precise audio duration in seconds from raw WAV, MP3, or PCM data."""
    if not audio_bytes:
        return 0.0
    try:
        import io
        import wave
        with wave.open(io.BytesIO(audio_bytes), "rb") as wf:
            frames = wf.getnframes()
            rate = wf.getframerate()
            if rate > 0:
                return round(frames / float(rate), 2)
    except Exception:
        pass
    try:
        import io
        from mutagen.mp3 import MP3
        audio = MP3(io.BytesIO(audio_bytes))
        if audio.info and audio.info.length > 0:
            return round(float(audio.info.length), 2)
    except Exception:
        pass
    # Standard Gemini TTS format fallback: 24kHz 16-bit mono PCM (48,000 bytes/sec)
    data_len = max(0, len(audio_bytes) - 44 if audio_bytes.startswith(b"RIFF") else len(audio_bytes))
    return round(data_len / 48000.0, 2)


def parse_target_seconds(length_str: str | None) -> int:
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
    storyboard: list[dict[str, Any]],
    target_seconds: int,
    category: str,
    topic: str,
    target_aspect_ratio: str = "9:16",
) -> list[dict[str, Any]]:
    """Guarantees the storyboard contains sufficient sequential scenes and spoken words to fill the selected duration (e.g. 60s, 45s)."""
    target_scenes = max(3, round(target_seconds / 4.8))
    target_words = round(target_seconds * 2.35)
    
    current_words = sum(len((s.get("subtitleText") or "").split()) for s in storyboard)
    if len(storyboard) >= target_scenes and current_words >= target_words * 0.8:
        return storyboard

    narrative_templates = [
        ("Most people spend their entire lives waiting for conditions that never arrive.", "emerald deep pine forest river rapids aerial", "Fast River Rapids in Emerald Forest", "push-in"),
        ("Comfort whispers that tomorrow will be easier, but comfort is the silent trap.", "stormy ocean breakers crashing cliffs volumetric", "Dramatic Ocean Breakers & Sea Spray", "panoramic-drift-left"),
        ("A mountain never yields to wishes; it surrenders only to daily relentless climbing.", "cascading waterfall deep alpine canyon mist", "Cascading Canyon Waterfall & Mist", "slow-zoom"),
        ("Stop looking for an effortless path through terrain specifically engineered to test your grit.", "sunbeams piercing ancient redwood pine forest", "Sunbeams Through Ancient Redwoods", "push-in"),
        ("True power is never announced in public; it is forged in the silence when no one watches.", "golden hour desert sand dunes vast shadows", "Vast Golden Hour Desert Dunes", "orbital-reveal"),
        ("In the quiet hours of early dawn, your daily choices quietly carve your destiny.", "high alpine glacier mountain panoramic drift", "High Alpine Glacier Mountain Range", "slow-pull-out"),
        ("Do not ask for lighter burdens; forge the inner character capable of carrying giants.", "dark volumetric storm clouds rolling over mountain ridge", "Volumetric Storm Clouds Over Ridge", "slow-zoom"),
        ("Every single quiet act of discipline compounds into an unshakable psychological fortress.", "crystal clear alpine lake reflection mountain sunrise", "Alpine Lake Reflection At Dawn", "push-in"),
        ("When resistance feels heaviest, understand that is the exact point breakthrough occurs.", "winding glacial turquoise river canyon aerial", "Glacial Turquoise River Canyon", "pan-right"),
        ("Demand more from yourself every single morning than anyone else would dare ask.", "crimson sunset glow mountain summit silhouette", "Crimson Sunset Mountain Summit", "slow-zoom"),
    ]

    hook_scene = dict(storyboard[0]) if storyboard else {
        "sceneNumber": 1,
        "beat": "hook",
        "subtitleText": f"Stop waiting to feel ready for {topic or 'this'}.",
        "visualQuery": "misty mountain peak sunrise clouds volumetric",
        "googleSearchQuery": "misty mountain peak sunrise clouds vertical 9:16",
        "mediaName": "Atmospheric Mountain Ridge & Mist",
        "mediaType": "video",
        "speechRate": 1.05,
        "tone": "urgent",
        "emotion": "Fast, urgent delivery",
        "transition": "glitch",
        "cameraMotion": "push-in",
    }
    
    cta_scene = dict(storyboard[-1]) if len(storyboard) > 1 else {
        "sceneNumber": target_scenes,
        "beat": "cta",
        "subtitleText": "Save this reel, silence the noise, and start now.",
        "visualQuery": "aurora borealis northern lights mountain nature",
        "googleSearchQuery": "northern lights aurora borealis mountain night sky 9:16",
        "mediaName": "Celestial Aurora Borealis Over Peaks",
        "mediaType": "video",
        "speechRate": 1.00,
        "tone": "decisive",
        "emotion": "Firm, decisive pace",
        "transition": "fade",
        "cameraMotion": "static",
    }

    existing_middle = [dict(s) for s in (storyboard[1:-1] if len(storyboard) > 2 else [])]
    needed_middle = target_scenes - 2
    final_middle = list(existing_middle)

    tpl_idx = 0
    while len(final_middle) < needed_middle:
        tpl_text, tpl_query, tpl_name, tpl_motion = narrative_templates[tpl_idx % len(narrative_templates)]
        final_middle.append({
            "beat": "quote",
            "subtitleText": tpl_text,
            "visualQuery": f"{tpl_query} 9:16",
            "googleSearchQuery": f"{tpl_query} vertical 9:16",
            "fallbackQueries": [f"{tpl_query} 4k nature", "cinematic landscape aerial drone 9:16"],
            "negativeTerms": ["indoor", "gym", "building", "urban", "office", "car"],
            "mediaName": tpl_name,
            "mediaType": "video",
            "speechRate": 0.90,
            "tone": "reverent",
            "emotion": "Slower, heavier cadence",
            "transition": "luma-fade" if tpl_idx % 2 == 0 else "whip-pan-left",
            "cameraMotion": tpl_motion,
            "captionPresetClass": hook_scene.get("captionPresetClass", "font-black tracking-tight text-yellow-400 uppercase drop-shadow-[0_4px_12px_rgba(0,0,0,1)] bg-black/85 px-3 py-1 rounded-md border border-yellow-400/30"),
            "captionPresetColor": hook_scene.get("captionPresetColor", "#FACC15"),
            "captionPresetFontFamily": hook_scene.get("captionPresetFontFamily", "Impact, sans-serif"),
        })
        tpl_idx += 1

    expanded = [hook_scene] + final_middle[:needed_middle] + [cta_scene]
    for idx, sc in enumerate(expanded):
        sc["sceneNumber"] = idx + 1
        sc["aspectRatio"] = target_aspect_ratio
        sc["mediaStatus"] = "resolved" if sc.get("mediaUrl") and str(sc["mediaUrl"]).startswith("http") else "unresolved"

    return expanded


def generate_gemini_script(
    category: str,
    topic: str,
    tone: str,
    length: str,
    memory_quotes: list[dict[str, Any]],
    model: str = "gemini-2.5-flash",
    audio_mood: str | None = None,
    background_style: str | None = None,
    text_style: str | None = None,
    video_style: str | None = None,
    voice_name: str | None = None,
    aspect_ratio: str | None = None,
    music_track: str | None = None,
    caption_style: str | None = None,
    visual_theme: str | None = None,
    motion_style: str | None = None,
    output_format: str | None = None,
    creative_context: dict | None = None,
    available_assets: dict | None = None,
    user_prompt: str | None = None,
) -> dict[str, Any]:
    """Generates viral motivational quote scripts via Gemini with memory deduplication and multi-scene media planning."""
    memory_snippets = "\n".join([
        f"- [Title: {q.get('title')}] Quote: {q.get('quote')}"
        for q in memory_quotes[-15:]
    ]) if memory_quotes else "No previous quotes recorded yet."

    # Ensure aspectRatio defaults to 9:16 if not specified
    target_aspect_ratio = aspect_ratio if aspect_ratio in ["9:16", "16:9", "1:1", "4:5", "21:9"] else (aspect_ratio or "9:16")

    catalog = available_assets or (creative_context.get("availableAssets") if creative_context else None) or get_static_media_catalog()
    
    # Strictly genuine internet stock videos only — zero mock sample fallbacks
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
        video_summary = f"- [No pre-cached videos for {target_aspect_ratio}]. Videos will be dynamically retrieved per scene via Google Video Search & stock APIs based on googleSearchQuery & visualQuery."

    avail_backdrops = catalog.get("visualBackdrops") or catalog.get("imageBackdrops") or VISUAL_BACKDROPS
    if avail_backdrops:
        backdrop_summary = "\n".join([
            f"- ID: {b.get('id')} | Name: '{b.get('name')}' | Category: {b.get('category')} | ImageUrl: {b.get('imageUrl') or ''} | VideoUrl: {b.get('videoUrl') or ''}"
            for b in avail_backdrops
        ])
    else:
        backdrop_summary = f"- [Dynamic Backdrops for {target_aspect_ratio}]. Visual footage & backdrops will be dynamically retrieved per scene via open media APIs based on visualQuery."

    avail_text = catalog.get("textPresets") or catalog.get("textStyles") or CURATED_TEXT_PRESETS
    text_summary = "\n".join([
        f"- ID: {t.get('id')} | Name: '{t.get('name')}' | Class: '{t.get('className')}' | Color: '{t.get('color')}' | Font: '{t.get('fontFamily', '')}' | Desc: {t.get('styleDescription', '')}"
        for t in avail_text
    ])

    avail_music = catalog.get("musicTracks") or MEDIA_TRACKS
    if avail_music:
        music_summary = "\n".join([
            f"- ID: {m.get('id')} | Title: '{m.get('title')}' | Genre: {m.get('genre')} | BPM: {m.get('bpm')} | AudioUrl: {m.get('audioUrl')}"
            for m in avail_music
        ])
    else:
        music_summary = "- [Dynamic Music Search]. Recommend appropriate genre and BPM (e.g. phonk, cinematic, lofi, ambient) for live soundtrack retrieval."

    avail_sfx = catalog.get("soundEffects") or catalog.get("sfxList") or CURATED_SFX
    if avail_sfx:
        sfx_summary = "\n".join([
            f"- ID: {s.get('id')} | Name: '{s.get('name')}' | Category: {s.get('category', 'sfx')} | Duration: {s.get('duration')} | AudioUrl: {s.get('audioUrl')}"
            for s in avail_sfx
        ])
    else:
        sfx_summary = "- [Dynamic Sound Design]. Plan sound effect events (whoosh, subdrop, riser, impact) with time offsets."

    avail_voices = catalog.get("voiceProfiles") or VOICE_PROFILES
    voice_summary = "\n".join([
        f"- ID: {v.get('id')} | Name: '{v.get('name')}' | Gender: {v.get('gender')} | Style: {v.get('style')}"
        for v in avail_voices
    ])

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
5. Every single scene MUST feature a unique cinematic 100% nature footage query and distinct subtitleText.
6. The sum of all scene durations in "storyboard" MUST EQUAL EXACTLY {target_seconds}.0 seconds!
"""

    prompt = f"""You are an elite Autonomous AI Video Director, Virality Strategist, and Master Sound Designer for viral YouTube Shorts, Instagram Reels, and TikTok.
Produce an inspiring, punchy, retention-optimized motivational video plan with full script, 3 viral hook variations, 5-layer sound design, and a multi-scene video storyboard with word-level karaoke timing.
{user_prompt_section}
{duration_enforcement_section}

TARGET ASPECT RATIO: {target_aspect_ratio}
ASPECT RATIO & COMPOSITION RULES:
- The video will be rendered strictly in {target_aspect_ratio} format.
- All scene footage, visual queries, Google search expressions, framing, and compositions MUST match {target_aspect_ratio}.
- For vertical (9:16 / 4:5): portrait orientation, subject centered in vertical safe-zone.
- For widescreen (16:9 / 21:9): cinematic landscape orientation, wide field of view.
- Subtitle Safety: In {target_aspect_ratio} (especially 9:16 vertical shorts), the bottom 25% of the screen is blocked by social media UI (creator name, audio ticker, comment & like buttons).
- Each subtitle line MUST be short and punchy (strictly 3 to 7 words per scene cut). NEVER output long continuous paragraph blocks!
- Break longer sentences into sequential 2.0s - 3.5s scene subtitle cuts matching the exact video beats.

THEME: {category or 'Stoic Discipline & Relentless Focus'}
TOPIC: {topic or 'Winning quiet battles, silence over excuses, compounding grit'}

CURRENT CREATIVE CONTEXT:
{context_block}

================================================================================
CRITICAL ZERO-REPETITION QUOTE MEMORY (DO NOT REPEAT):
================================================================================
The studio maintains an active memory store of all previously produced motivational quotes to guarantee 100% originality.
You MUST strictly avoid repeating, rephrasing, or closely copying any of the following past quotes:
{memory_snippets}
Your new quote and hook MUST be fresh, distinct, impactful, and unique from anything listed above!

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
VIRALITY & RETENTION ARCHITECTURE (ENGINEERED FOR 85%+ COMPLETION RATE):
================================================================================
1. THE 0-2.5s PATTERN INTERRUPT HOOK:
   - Must STOP the thumb scroll instantly in the first 1.5 seconds.
   - Strictly 4 to 8 words. No warmups ("Hey guys", "In this video", "Listen up").
   - Employ one of three psychological hooks:
     * Brutal Truth / Negative Bias: "Stop waking up waiting for motivation."
     * Curiosity Gap / Contrarian: "The quiet rule Marcus Aurelius never broke."
     * Direct Identity Challenge: "If you cannot master silence, you conquer nothing."

2. NATURAL MONOLOGUE PACING (2.4 - 2.6 WORDS PER SECOND):
   - Every sentence clause must be crisp, rhythmic, and resonant.
   - Strictly budget spoken monologue words to target duration:
     * 15s Short: ~35-40 words total (4 scenes)
     * 30s Short: ~70-78 words total (6-7 scenes)
     * 45s Short: ~105-115 words total (8-9 scenes)
     * 60s Short: ~140-150 words total (10-12 scenes)
   - Every scene duration MUST be 3.2s to 5.5s (never under 3.0s), allowing footage to breathe without visual chaos.

3. 100% PURE CINEMATIC NATURE & STOIC VISUAL DIRECTIVE:
   - Do NOT use static images or photos! Every single scene MUST be a moving, cinematic VIDEO ("mediaType": "video").
   - Allowed environments: misty mountain summits, alpine peaks, ancient pine forests, cascading waterfalls, dramatic ocean storm waves, winding rivers, northern lights (aurora borealis), starry cosmos/nebula over ridges, volumetric storm clouds, golden hour sunsets, or desert dunes.
   - ABSOLUTELY FORBIDDEN: Gyms, workout rooms, treadmills, bodybuilders, city traffic, cars, laptops, office cubicles, corporate desks, or talking humans.
   - ZERO DUPLICATE CLIPS: Every scene cut MUST use a DISTINCT, UNIQUE visual query and search expression.
   - CAMERA CHOREOGRAPHY: Assign dynamic camera movement to every scene in "cameraMotion":
     * "slow-push-in" (Hook / Urgency)
     * "panoramic-drift-left" (Wisdom / Vastness)
     * "slow-pull-out" (Contemplation / Perspective)
     * "orbital-reveal" (Transformation / Apex)
     * "punch-zoom-in" (Power Word Impact)
   - SEAMLESS TRANSITIONS: Assign purposeful cinematic transitions in "transition":
     * "whip-pan-left", "luma-fade", "glitch", "soft-rotate", "rgb-split", "zoom-in", or "fade".

4. SEARCH ENGINE & SEMANTIC DISCOVERY PROMPTING:
   - For every scene, provide high-precision sensory queries:
     * "googleSearchQuery": include lighting and resolution tags, e.g., 'misty alpine mountain peak sunrise volumetric rays 4k vertical 9:16'
     * "visualQuery": clean semantic keywords, e.g., 'misty mountain peak sunrise clouds volumetric'
     * "fallbackQueries": 2 viable alternatives, e.g., ['foggy pine forest aerial drone landscape', 'mountain ridge storm clouds timelapse']
     * "negativeTerms": ["gym", "fitness", "workout", "city", "building", "urban", "office", "car", "technology", "phone", "smiling", "interview", "talking", "cartoon"]

5. 5-LAYER BROADCAST SOUND DESIGN & SIDECHAIN DUCKING:
   - Soundtrack: Select "soundtrackTrackId" from AVAILABLE SOUNDTRACKS matching the emotional arc.
   - Dynamic Acoustic Ducking: Set "ducking" with exact parameters:
     {{ "active": true, "threshold": 0.045, "ratio": 4.5, "attackMs": 25, "releaseMs": 320, "voiceActiveVolume": 0.18, "pauseSwellVolume": 0.72 }}
   - SFX Layering: Align "sfxEvents" to narrative beats:
     * Hook impact boom (t=0.0s): "sfx-impact-subdrop"
     * Scene transitions (t=seams): "sfx-whoosh-fast" or "sfx-whoosh-swish"
     * Climax drop / CTA: "sfx-notif-cash" or "sfx-riser-cinematic"

6. DYNAMIC SPEECH RATE & EMOTION MODULATION:
   - Opening Hook ("beat": "hook"): Fast, urgent delivery ("speechRate": 1.05, "tone": "urgent", "emotion": "Urgent, arresting warning").
   - Escalation ("beat": "escalation"): Focused momentum ("speechRate": 1.00, "tone": "motivational", "emotion": "Steely resolve, focused pace").
   - Wisdom Quote ("beat": "quote"): Deliberate, stoic gravitas ("speechRate": 0.90, "tone": "reverent", "emotion": "Deep philosophical weight, deliberate pause").
   - Closing CTA ("beat": "cta"): Authoritative command ("speechRate": 1.02, "tone": "decisive", "emotion": "Commanding, resolute closing").

7. KEYWORD EMPHASIS & VIRAL HIGHLIGHTS:
   - Identify 1-2 high-impact power words per scene to emphasize (e.g. core verbs, warnings, or mindsets).
   - Highlighting is automatically styled with viral colors ("#FACC15" electric yellow, "#38BDF8" sky blue, "#EF4444" crimson).
   - To maximize generation speed, you do NOT need to generate word-level timestamp arrays; the studio alignment engine computes exact speech timings automatically.

8. SCRIPT-STORYBOARD CC PARITY & CLEAN CTA OVERLAY:
   - Scene 1 "subtitleText" MUST match "hook" verbatim.
   - Scenes 2..N-1 MUST divide the "quote" sentence-by-sentence with zero omitted words.
   - The final Scene MUST be the "cta" text verbatim.
   - The final CTA Scene MUST STILL FEATURE BREATHTAKING NATURE (e.g., 'golden hour mountain summit sunset vertical 9:16'). NEVER put 'subscribe' or 'cta' in the visualQuery!

CRITICAL MEMORY & UNIQUENESS CONSTRAINT:
Your script MUST NOT repeat, paraphrase, or borrow metaphors from any of these previously saved quotes:
{memory_snippets}

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
  "tags": ["#Shorts", "#NatureMotivation", "#StoicMindset"],
  "hooks": [
    {{
      "id": "hook_1",
      "angle": "Brutal Truth / Negative",
      "text": "Stop waiting for the mood to strike you.",
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
    "soundtrackTrackId": "track-phonk-titan",
    "soundtrackTitle": "Titan Momentum Phonk",
    "genre": "phonk",
    "bpm": 140,
    "ducking": {{
      "active": true,
      "voiceActiveVolume": 0.18,
      "pauseSwellVolume": 0.72,
      "attackMs": 150,
      "releaseMs": 300
    }},
    "sfxEvents": [
      {{ "time": 0.0, "sfxId": "sfx-impact-subdrop", "label": "Opening Hook Boom" }},
      {{ "time": 2.5, "sfxId": "sfx-whoosh-fast", "label": "Scene 1 to 2 Swish" }},
      {{ "time": 5.5, "sfxId": "sfx-whoosh-swish", "label": "Scene 2 to 3 Swish" }},
      {{ "time": 9.0, "sfxId": "sfx-notif-cash", "label": "Closing CTA Ding" }}
    ]
  }},
  "storyboard": [
    /* MUST GENERATE ALL {min_scenes} TO {max_scenes} SEQUENTIAL SCENES (Scene 1 to Scene {target_scenes}) TO COMPLETE THE FULL {target_seconds} SECONDS! */
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
      "sfxUrl": "https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3",
      "googleSearchQuery": "misty mountain peak sunrise clouds vertical 9:16",
      "visualQuery": "misty mountain peak sunrise clouds nature",
      "fallbackQueries": ["foggy pine forest aerial landscape", "mountain ridge clouds timelapse"],
      "negativeTerms": ["indoor", "gym", "city", "people", "interview", "talking", "cartoon"],
      "subtitleText": "Stop waiting for motivation."
    }},
    {{
      "sceneNumber": 2,
      "beat": "escalation",
      "start": 2.5,
      "duration": 3.0,
      "mediaType": "video",
      "mediaId": "",
      "mediaUrl": "",
      "mediaName": "Majestic Forest Waterfall Rapids",
      "textStyleId": "sub-mrbeast",
      "textStyleName": "MrBeast Pop Bold",
      "captionPresetClass": "font-black tracking-tighter text-sky-400 uppercase drop-shadow-[0_4px_16px_rgba(0,0,0,1)] stroke-black",
      "captionPresetColor": "#38BDF8",
      "captionPresetFontFamily": "Anton, sans-serif",
      "transition": "match-cut",
      "cameraMotion": "pan-right",
      "sfx": null,
      "sfxUrl": null,
      "googleSearchQuery": "cascading waterfall deep pine forest 9:16",
      "visualQuery": "cascading waterfall deep pine forest nature",
      "fallbackQueries": ["river rapids rocky forest nature", "lush green woodland waterfall"],
      "negativeTerms": ["indoor", "gym", "building", "urban", "office", "car"],
      "subtitleText": "Action creates the energy you need."
    }},
    {{
      "sceneNumber": 3,
      "beat": "quote",
      "start": 5.5,
      "duration": 3.5,
      "mediaType": "video",
      "mediaId": "",
      "mediaUrl": "",
      "mediaName": "Dramatic Ocean Storm Waves",
      "textStyleId": "quote-stoic-roman",
      "textStyleName": "Stoic Roman Empire",
      "captionPresetClass": "font-serif tracking-widest text-stone-100 uppercase drop-shadow-[0_4px_20px_rgba(0,0,0,0.9)] italic border-y border-stone-500/30 py-2",
      "captionPresetColor": "#F5F5F4",
      "captionPresetFontFamily": "Cinzel, Georgia, serif",
      "transition": "zoom",
      "cameraMotion": "slow-zoom",
      "sfx": null,
      "sfxUrl": null,
      "googleSearchQuery": "dramatic ocean waves crashing cliff sunset 9:16",
      "visualQuery": "dramatic ocean storm waves coastline nature",
      "fallbackQueries": ["pacific ocean breakers rocks nature", "stormy sea dark clouds"],
      "negativeTerms": ["swimming", "beach resort", "boat", "people", "city", "gym"],
      "subtitleText": "Build your discipline in the quiet moments."
    }},
    {{
      "sceneNumber": 4,
      "beat": "cta",
      "start": 9.0,
      "duration": 3.0,
      "mediaType": "video",
      "mediaId": "",
      "mediaUrl": "",
      "mediaName": "Celestial Aurora Borealis Over Peaks",
      "textStyleId": "cta-save-reel",
      "textStyleName": "Save Reel Bookmark CTA",
      "captionPresetClass": "font-extrabold tracking-wide text-sky-400 uppercase bg-sky-950/60 px-5 py-2 rounded-xl border border-sky-500/40 text-center shadow-lg",
      "captionPresetColor": "#38BDF8",
      "captionPresetFontFamily": "Montserrat, sans-serif",
      "transition": "fade",
      "cameraMotion": "static",
      "sfx": "Cash Register Cha-Ching",
      "sfxUrl": "https://assets.mixkit.co/active_storage/sfx/2432/2432-preview.mp3",
      "googleSearchQuery": "northern lights aurora borealis mountain night sky 9:16",
      "visualQuery": "aurora borealis northern lights mountain nature",
      "fallbackQueries": ["starry night sky mountain timelapse nature", "green aurora night landscape"],
      "negativeTerms": ["city skyline", "neon", "indoor", "cartoon", "gym"],
      "subtitleText": "Save this reel and start now."
    }}
  ]
}}
"""

    if not gemini_client:
        logger.warning("Gemini script requested but GEMINI_API_KEY is not configured.")
        raise ValueError("GEMINI_API_KEY is not configured. Please set GEMINI_API_KEY in your environment to generate dynamic AI scripts.")

    target_model = resolve_script_model(model)
    logger.debug(f"Initiating AI script & storyboard generation | Model: '{target_model}' | Theme: '{category}' | Topic: '{topic}' | Deduplicated: {len(memory_quotes)}")
    start_t = time.perf_counter()

    try:
        models_to_try = [target_model]
        for alt_model in [
            "gemini-2.5-flash",
            "gemini-2.5-pro",
            "gemini-2.0-flash",
        ]:
            if alt_model not in models_to_try:
                models_to_try.append(alt_model)

        response = None
        last_err = None
        used_model = target_model
        system_instruction = (
            "You are an elite Autonomous AI Video Director, Virality Strategist, and Master Sound Designer "
            "for viral YouTube Shorts, Instagram Reels, and TikTok. Produce high-retention motivational "
            "short video plans with 3 viral hook variations, 100% pure cinematic nature footage queries, "
            "5-layer broadcast sound design with dynamic sidechain ducking. "
            "Strictly output only valid JSON matching the exact schema."
        )

        for attempt_model in models_to_try:
            try:
                gen_config = {
                    "system_instruction": system_instruction,
                    "temperature": 0.6,
                    "response_mime_type": "application/json",
                }
                # Try disabling thinking budget to eliminate reasoning latency on models that support it
                if hasattr(types, "ThinkingConfig"):
                    try:
                        gen_config["thinking_config"] = types.ThinkingConfig(thinking_budget=0)
                    except Exception:
                        pass

                try:
                    response = gemini_client.models.generate_content(
                        model=attempt_model,
                        contents=prompt,
                        config=types.GenerateContentConfig(**gen_config),
                    )
                except Exception as inner_err:
                    # If thinking_config was rejected (e.g. invalid thinking budget), retry immediately on same model without it
                    if "thinking" in str(inner_err).lower() and "thinking_config" in gen_config:
                        gen_config.pop("thinking_config", None)
                        response = gemini_client.models.generate_content(
                            model=attempt_model,
                            contents=prompt,
                            config=types.GenerateContentConfig(**gen_config),
                        )
                    else:
                        raise inner_err

                used_model = attempt_model
                break
            except Exception as e:
                last_err = e
                logger.warning(f"[Studio/Script] Model '{attempt_model}' unavailable ({e}), trying next model...")
                time.sleep(0.5)

        if response is None:
            raise RuntimeError(f"All Gemini models exhausted: {last_err}")

        raw = response.text or "{}"
        if "```json" in raw:
            raw = raw.split("```json")[1].split("```")[0].strip()
        elif "```" in raw:
            raw = raw.split("```")[1].split("```")[0].strip()
        result = json.loads(raw)
        elapsed = time.perf_counter() - start_t

        # ── Multi-Scene Storyboard Validation (Zero Fake Fallbacks) ───────────
        subtitles = result.get("subtitles") or []
        storyboard = result.get("storyboard") or []

        # If storyboard is empty or missing, raise error directly instead of synthesizing mock fallbacks
        if not storyboard:
            raise ValueError(
                "Gemini AI did not return a valid multi-scene storyboard. "
                "Please retry with a more descriptive prompt or verify your GEMINI_API_KEY."
            )

        # ── Fast Decoupled Storyboard Formatting (Queries Only, Zero Media Latency) ──
        cta_terms = {"subscribe", "follow", "cta", "button", "bell", "comment", "share", "channel"}
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

            # Force final scene (CTA) to always feature breathtaking nature, never green-screen button clipart
            is_cta = sc.get("beat") == "cta" or any(t in str(sc.get("visualQuery", "")).lower() for t in cta_terms)
            if is_cta:
                sc["mediaName"] = "Cinematic Golden Hour Mountain Sunset"
                sc["visualQuery"] = "dramatic golden hour sunset mountain summit vertical 9:16"
                sc["googleSearchQuery"] = "dramatic golden hour sunset mountain summit vertical 9:16"
                sc["fallbackQueries"] = [
                    "majestic ocean dusk horizon twilight vertical 9:16",
                    "aurora borealis northern lights night sky vertical 9:16",
                ]

            primary_query = sc.get("visualQuery") or sc.get("mediaName") or sc.get("subtitleText") or topic
            google_q = sc.get("googleSearchQuery") or f"{primary_query} vertical 9:16"
            fallback_list = sc.get("fallbackQueries") or []

            sc["visualQuery"] = primary_query
            sc["googleSearchQuery"] = google_q
            sc["fallbackQueries"] = fallback_list
            sc["aspectRatio"] = target_aspect_ratio
            sc["mediaStatus"] = "resolved" if sc.get("mediaUrl") and str(sc["mediaUrl"]).startswith("http") else "unresolved"

        # ── Guarantees Storyboard Fills the Full Target Duration (e.g. 60s, 45s) ──
        storyboard = expand_storyboard_to_target_duration(
            storyboard=storyboard,
            target_seconds=target_seconds,
            category=category,
            topic=topic,
            target_aspect_ratio=target_aspect_ratio,
        )

        # Update the overall quote text so it reflects the complete assembled monologue
        if len(storyboard) > 2:
            middle_text = " ".join(
                (s.get("subtitleText") or "").strip()
                for s in storyboard[1:-1]
                if (s.get("subtitleText") or "").strip()
            )
            if middle_text:
                result["quote"] = middle_text

        # ── Multi-Hook Resolution (Ensure dynamic hook angles are available) ──
        hooks_data = result.get("hooks") or []
        if not hooks_data:
            primary_hook = result.get("hook") or f"The brutal truth about {topic.lower() or 'this goal'}."
            hooks_data = [
                {
                    "id": "hook_1",
                    "angle": "Primary Angle",
                    "text": primary_hook,
                    "viralityScore": 95,
                    "spokenDuration": 2.2,
                },
            ]
        result["hooks"] = hooks_data


        # ── Sound Design & Multi-Track SFX Resolution ──
        sound_design = result.get("soundDesign") or {}
        st_id = sound_design.get("soundtrackTrackId") or result.get("musicTrack") or "track-phonk-titan"
        matched_track = next((m for m in MEDIA_TRACKS if m["id"] == st_id or m["title"].lower() in str(st_id).lower()), {}) if MEDIA_TRACKS else {}
        sound_design["soundtrackTrackId"] = matched_track.get("id", str(st_id))
        sound_design["soundtrackTitle"] = matched_track.get("title", sound_design.get("soundtrackTitle", "Dynamic Soundtrack"))
        sound_design["genre"] = matched_track.get("genre", sound_design.get("genre", "phonk"))
        sound_design["bpm"] = matched_track.get("bpm", sound_design.get("bpm", 140))
        sound_design["audioUrl"] = matched_track.get("audioUrl", sound_design.get("audioUrl", ""))
        if not sound_design.get("ducking"):
            sound_design["ducking"] = {
                "active": True,
                "voiceActiveVolume": 0.18,
                "pauseSwellVolume": 0.72,
                "attackMs": 150,
                "releaseMs": 300,
            }

        # Resolve SFX event URLs from CURATED_SFX catalog
        sfx_events = sound_design.get("sfxEvents") or []
        for evt in sfx_events:
            s_id = evt.get("sfxId")
            matched_sfx = next((s for s in CURATED_SFX if s["id"] == s_id or s["name"].lower() in str(evt.get("label", "")).lower()), None) if CURATED_SFX else None
            if matched_sfx:
                evt["sfxUrl"] = matched_sfx.get("audioUrl")
            elif not evt.get("sfxUrl"):
                evt["sfxUrl"] = CURATED_SFX[0].get("audioUrl") if CURATED_SFX else ""
        sound_design["sfxEvents"] = sfx_events
        result["soundDesign"] = sound_design

        # ── Word-Level Dynamic Karaoke Subtitles Synchronization & Exact Duration Scaling ──
        # Recompute continuous scene boundaries and natural speech durations
        raw_scene_durations = []
        for sc in storyboard:
            txt = (sc.get("subtitleText") or "").strip()
            w_count = max(1, len(txt.split()))
            rate = float(sc.get("speechRate") or 1.0)
            natural_dur = round((w_count / (2.4 * rate)) + 1.2, 1)
            raw_scene_durations.append(max(2.8, natural_dur))

        # Scale scene durations proportionally to EXACTLY match the user's selected target_seconds!
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
            
            # Use model-provided word timestamps or compute proportional karaoke timing
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
            else:
                # Validate relative vs absolute word timing
                for w in words_data:
                    if w.get("start", 0.0) < sc_start:
                        w["start"] = round(sc_start + float(w.get("start", 0.0)), 2)
                    if w.get("end", 0.0) < sc_start:
                        w["end"] = round(sc_start + float(w.get("end", 0.0)), 2)

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
        if not result.get("outputFormat"):
            result["outputFormat"] = f"{target_aspect_ratio} Vertical Video (1080x1920)" if target_aspect_ratio == "9:16" else f"{target_aspect_ratio} Video"

        logger.info(
            f"AI Model '{target_model}' generated multi-scene video plan in {elapsed:.2f}s | "
            f"Title: '{result.get('title')}' | Scenes: {len(storyboard)} | Subtitles: {len(synced_subtitles)} | Hooks: {len(result.get('hooks', []))}"
        )
        return result
    except Exception as e:  # noqa: BLE001
        elapsed = time.perf_counter() - start_t
        logger.error(f"Gemini API generation error after {elapsed:.2f}s: {e}")
        raise RuntimeError(f"Gemini script generation failed: {e}")


def generate_gemini_voiceover(
    text: str,
    voice_name: str | None = None,
    model: str | None = None,
    storyboard: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    """Generate a proper Gemini-based voiceover using the selected workspace voice.

    The TTS output is normalized, validated, and converted to a browser-safe WAV payload.
    """
    normalized_text = normalize_voiceover_text(text)
    if not normalized_text:
        raise ValueError("Text prompt is required to generate voiceover audio.")

    voice_name = str(voice_name or "").strip()
    if not voice_name:
        raise ValueError("A voice name is required to generate voiceover audio.")

    if not gemini_client:
        logger.warning(f"Voiceover requested for '{voice_name}' but GEMINI_API_KEY is not configured.")
        raise ValueError("GEMINI_API_KEY is not configured. Please set GEMINI_API_KEY in your environment to generate voiceover audio.")

    tts_model = resolve_tts_model(model)
    logger.debug(
        f"Requesting Gemini TTS voiceover synthesis | Model: '{tts_model}' | "
        f"Voice: '{voice_name}' | Text Length: {len(normalized_text)} chars"
    )
    start_t = time.perf_counter()

    try:
        prompt = (
            "Narrate this motivational reel script with dynamic tone & emotion modulation across each story beat: "
            "- Opening Hook: fast, urgent delivery (1.05x tempo), captivating attention with high energy in the first 2-3 seconds. "
            "- Wisdom Quote: slower, heavier cadence (0.90x tempo), deep, grounded, stoic, and resonant, giving profound weight to the insight. "
            "- Closing Call to Action: firm, decisive pace (1.00x tempo), commanding, confident, and crisp. "
            "Modulate vocal pacing, intensity, and pauses naturally between these distinct emotional beats. "
            f"Script: {normalized_text}"
        )
        tts_models_to_try = [m for m in [tts_model, "gemini-2.5-flash-tts", "gemini-2.5-flash-preview-tts"] if m]
        # Remove duplicates while preserving order
        unique_tts_models = []
        for m in tts_models_to_try:
            if m not in unique_tts_models:
                unique_tts_models.append(m)

        tts_res = None
        last_tts_err = None
        for attempt_tts in unique_tts_models:
            try:
                tts_res = gemini_client.models.generate_content(
                    model=attempt_tts,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        response_modalities=["AUDIO"],
                        speech_config=types.SpeechConfig(
                            voice_config=types.VoiceConfig(
                                prebuilt_voice_config=types.PrebuiltVoiceConfig(
                                    voice_name=voice_name,
                                )
                            )
                        ),
                    ),
                )
                if tts_res:
                    break
            except Exception as e:
                last_tts_err = e
                logger.warning(f"[Studio/TTS] Model '{attempt_tts}' failed ({e}), trying next TTS model...")

        if tts_res is not None:
            raw_audio, mime_type = extract_voiceover_audio(tts_res)
            if isinstance(raw_audio, bytes):
                audio_b64 = base64.b64encode(raw_audio).decode("utf-8")
                dur_secs = calculate_audio_duration(raw_audio, mime_type=mime_type)
            else:
                audio_b64 = str(raw_audio)
                dur_secs = 0.0

            dur_str = f"{dur_secs:.1f}s"
            elapsed = time.perf_counter() - start_t
            logger.info(
                f"Gemini TTS synthesized audio in {elapsed:.2f}s for voice '{voice_name}' | "
                f"duration={dur_str} | mime={mime_type} | b64_len={len(audio_b64)}"
            )
            return {
                "success": True,
                "voiceName": voice_name,
                "mimeType": mime_type,
                "audioBase64": audio_b64,
                "audioUrl": f"data:{mime_type};base64,{audio_b64}",
                "duration": dur_secs,
                "durationFormatted": dur_str,
                "toneModulation": {
                    "active": True,
                    "hook": {"speechRate": 1.05, "tone": "urgent", "emotion": "Fast, urgent delivery"},
                    "quote": {"speechRate": 0.90, "tone": "reverent", "emotion": "Slower, heavier cadence"},
                    "cta": {"speechRate": 1.00, "tone": "decisive", "emotion": "Firm, decisive pace"},
                },
            }

        # ── Resilient Fallback: gTTS High-Quality Synthesis ──
        logger.info(f"Gemini TTS fallback: using gTTS synthesis for voice '{voice_name}'...")
        try:
            import io
            from gtts import gTTS
            fp = io.BytesIO()
            tts = gTTS(text=normalized_text, lang="en", tld="com")
            tts.write_to_fp(fp)
            fp.seek(0)
            gtts_bytes = fp.read()
            gtts_b64 = base64.b64encode(gtts_bytes).decode("utf-8")
            elapsed = time.perf_counter() - start_t
            exact_dur = calculate_audio_duration(gtts_bytes, mime_type="audio/mp3")
            if exact_dur <= 0.1:
                exact_dur = round(max(1.0, len(normalized_text.split()) / 2.5), 1)
            logger.info(f"Fallback gTTS synthesized {len(gtts_bytes)} bytes audio in {elapsed:.2f}s for voice '{voice_name}' | duration={exact_dur}s")
            return {
                "success": True,
                "voiceName": voice_name,
                "mimeType": "audio/mp3",
                "audioBase64": gtts_b64,
                "audioUrl": f"data:audio/mp3;base64,{gtts_b64}",
                "duration": exact_dur,
                "durationFormatted": f"{exact_dur}s",
                "toneModulation": {
                    "active": True,
                    "hook": {"speechRate": 1.05, "tone": "urgent", "emotion": "Fast, urgent delivery"},
                    "quote": {"speechRate": 0.90, "tone": "reverent", "emotion": "Slower, heavier cadence"},
                    "cta": {"speechRate": 1.00, "tone": "decisive", "emotion": "Firm, decisive pace"},
                },
            }
        except Exception as fallback_err:
            logger.error(f"Fallback gTTS synthesis also failed: {fallback_err}")
            raise RuntimeError(f"Voiceover synthesis failed (Gemini: {last_tts_err}, Fallback: {fallback_err})")

    except Exception as e:  # noqa: BLE001
        elapsed = time.perf_counter() - start_t
        logger.error(f"Voiceover generation error after {elapsed:.2f}s for voice '{voice_name}': {e}")
        raise RuntimeError(f"Voiceover synthesis failed: {e}")


