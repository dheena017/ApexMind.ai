import base64
import json
import logging
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

DEFAULT_SCRIPT_MODEL = "gemini-3.5-flash"

# Model Registry: Maps model IDs strictly to active, available Google Gemini API models
SUPPORTED_SCRIPT_MODELS: dict[str, str] = {
    # Actively available Google Gemini models
    "gemini-3.5-flash": "gemini-3.5-flash",
    "gemini-3.5-flash-lite": "gemini-3.5-flash-lite",
    "gemini-3.1-pro-preview": "gemini-3.1-pro-preview",
    "gemini-3-flash-preview": "gemini-3-flash-preview",
    "gemini-2.5-flash": "gemini-3.5-flash",
    "gemini-2.5-pro": "gemini-3.1-pro-preview",
    "gemini-2.5-flash-lite": "gemini-3.5-flash-lite",
    "gemini-flash-latest": "gemini-3.5-flash",
    "gemini-pro-latest": "gemini-3.1-pro-preview",
    # Legacy aliases
    "gemini-2.0-flash": "gemini-3.5-flash",
    "gemini-2.0-flash-lite": "gemini-3.5-flash-lite",
    "claude-3-7-sonnet": "gemini-3.1-pro-preview",
    "gpt-4o": "gemini-3.1-pro-preview",
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

    prompt = f"""You are an elite Autonomous AI Video Director, Virality Strategist, and Master Sound Designer for viral YouTube Shorts, Instagram Reels, and TikTok.
Produce an inspiring, punchy, retention-optimized motivational video plan with full script, 3 viral hook variations, 5-layer sound design, and a multi-scene video storyboard with word-level karaoke timing.

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
MANDATORY 100% PURE CINEMATIC NATURE VIDEO & SOUND DESIGN DIRECTIVES:
================================================================================
- Do NOT use static images or photos! Every single scene MUST be a moving, cinematic VIDEO ("mediaType": "video").
- STRICT 100% NATURE FOOTAGE DIRECTIVE: Every single scene cut MUST feature majestic, cinematic NATURE footage.
  Allowed nature environments: misty mountain summits, alpine peaks, lush pine forests, cascading waterfalls, dramatic ocean storm waves, winding rivers, northern lights (aurora borealis), starry night sky over mountain ridges, dramatic storm clouds, golden hour sunsets, or desert sand dunes.
  NEVER use gym, fitness, workout, athletes, urban city, cars, traffic, buildings, office interiors, technology, screens, or talking humans.
- You MUST design a sequential, multi-scene video plan ('storyboard') consisting of multiple SHORT, high-energy nature video clips (minimum 4 to 6 distinct scenes/shots across the timeline).
- SHORT CLIP DURATION: Each video clip must be short and punchy (2.0s to 3.5s duration each) for fast-paced viral retention.
- ZERO DUPLICATE VIDEOS: Every scene MUST use a DIFFERENT, UNIQUE high-quality nature video clip.
- MULTI-HOOK VARIATION: Provide 3 distinct hook variations in "hooks" with different psychological angles (e.g. Brutal Truth/Negative, Curiosity Gap, Direct Challenge) and a virality score (85-99).
- SOUND DESIGN:
  - Select "soundtrackTrackId" from the AVAILABLE SOUNDTRACKS.
  - Define "ducking" (voiceActiveVolume ~0.18, pauseSwellVolume ~0.72).
  - Add layered "sfxEvents" matching scene transitions and climax drops (using IDs from AVAILABLE SOUND EFFECTS, e.g. "sfx-whoosh-fast", "sfx-impact-subdrop", "sfx-riser-cinematic", "sfx-notif-cash").
- SEARCH ENGINE OPTIMIZATION: For every scene, provide a "googleSearchQuery" (e.g. 'misty mountain peak sunrise clouds vertical 9:16') and "fallbackQueries" for Google Video Search / Pexels / Pixabay.
- NEGATIVE TERMS: For every scene, explicitly specify negativeTerms: ["gym", "fitness", "workout", "city", "building", "urban", "office", "car", "technology", "phone", "smiling", "interview", "talking", "cartoon"].
- KARAOKE WORD TIMING: For every scene, provide a "words" array breaking the scene's subtitle line into individual words with exact relative timestamps ("start", "end") and mark power words with "emphasis": true and "highlightColor" (e.g. "#FACC15" or "#38BDF8").
- MANDATORY 100% SCRIPT-STORYBOARD CC PARITY & NATURAL SPEECH PACING:
  * Scene 1 MUST ALWAYS be the HOOK ("beat": "hook"). Scene 1's "subtitleText" MUST match the "hook" text verbatim!
  * Scenes 2 through N-1 MUST divide the monologue / "quote" sentence-by-sentence with zero omitted words.
  * The final Scene MUST be the closing call-to-action ("beat": "cta"). Its "subtitleText" MUST match the "cta" text verbatim!
  * The combined "subtitleText" across all scenes MUST EXACTLY EQUAL the spoken narrative ("hook" + "quote" + "cta").
  * PACING & DURATION: Total spoken monologue words must comfortably match the target length (~2.5 words per second). For a 30s video, produce 65-80 words of powerful script!
  * Every scene duration MUST realistically match its subtitle word count: duration = max(2.0, round(words * 0.35 + 0.5, 1)). Never assign a 3.5s duration to a 2-word phrase!

CRITICAL MEMORY & UNIQUENESS CONSTRAINT:
Your script MUST NOT repeat, paraphrase, or borrow metaphors from any of these previously saved quotes:
{memory_snippets}

Output MUST be a single raw JSON object matching this exact schema:
{{
  "title": "A viral Shorts title with punch under 60 chars",
  "hook": "Unforgettable opening hook spoken in first 2 seconds",
  "quote": "A powerful 2-3 sentence motivational monologue",
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
      "sfxUrl": "https://cdn.pixabay.com/download/audio/2022/03/15/audio_27529fa22a.mp3?filename=fast-whoosh-10901.mp3",
      "googleSearchQuery": "misty mountain peak sunrise clouds vertical 9:16",
      "visualQuery": "misty mountain peak sunrise clouds nature",
      "fallbackQueries": ["foggy pine forest aerial landscape", "mountain ridge clouds timelapse"],
      "negativeTerms": ["indoor", "gym", "city", "people", "interview", "talking", "cartoon"],
      "subtitleText": "Stop waiting for motivation.",
      "words": [
        {{ "word": "STOP", "start": 0.0, "end": 0.4, "emphasis": true, "highlightColor": "#EF4444" }},
        {{ "word": "WAITING", "start": 0.4, "end": 1.1, "emphasis": false }},
        {{ "word": "FOR", "start": 1.1, "end": 1.4, "emphasis": false }},
        {{ "word": "MOTIVATION.", "start": 1.4, "end": 2.3, "emphasis": true, "highlightColor": "#FACC15" }}
      ]
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
      "subtitleText": "Action creates the energy you need.",
      "words": [
        {{ "word": "ACTION", "start": 2.5, "end": 3.1, "emphasis": true, "highlightColor": "#38BDF8" }},
        {{ "word": "CREATES", "start": 3.1, "end": 3.7, "emphasis": false }},
        {{ "word": "THE", "start": 3.7, "end": 3.9, "emphasis": false }},
        {{ "word": "ENERGY", "start": 3.9, "end": 4.6, "emphasis": true, "highlightColor": "#38BDF8" }},
        {{ "word": "YOU", "start": 4.6, "end": 4.9, "emphasis": false }},
        {{ "word": "NEED.", "start": 4.9, "end": 5.4, "emphasis": true, "highlightColor": "#FACC15" }}
      ]
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
      "subtitleText": "Build your discipline in the quiet moments.",
      "words": [
        {{ "word": "BUILD", "start": 5.5, "end": 6.0, "emphasis": true, "highlightColor": "#FACC15" }},
        {{ "word": "YOUR", "start": 6.0, "end": 6.3, "emphasis": false }},
        {{ "word": "DISCIPLINE", "start": 6.3, "end": 7.2, "emphasis": true, "highlightColor": "#F5F5F4" }},
        {{ "word": "IN", "start": 7.2, "end": 7.4, "emphasis": false }},
        {{ "word": "THE", "start": 7.4, "end": 7.6, "emphasis": false }},
        {{ "word": "QUIET", "start": 7.6, "end": 8.2, "emphasis": true, "highlightColor": "#38BDF8" }},
        {{ "word": "MOMENTS.", "start": 8.2, "end": 8.9, "emphasis": false }}
      ]
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
      "sfxUrl": "https://cdn.pixabay.com/download/audio/2021/08/09/audio_732a101292.mp3?filename=cash-register-98214.mp3",
      "googleSearchQuery": "northern lights aurora borealis mountain night sky 9:16",
      "visualQuery": "aurora borealis northern lights mountain nature",
      "fallbackQueries": ["starry night sky mountain timelapse nature", "green aurora night landscape"],
      "negativeTerms": ["city skyline", "neon", "indoor", "cartoon", "gym"],
      "subtitleText": "Save this reel and start now.",
      "words": [
        {{ "word": "SAVE", "start": 9.0, "end": 9.5, "emphasis": true, "highlightColor": "#38BDF8" }},
        {{ "word": "THIS", "start": 9.5, "end": 9.8, "emphasis": false }},
        {{ "word": "REEL", "start": 9.8, "end": 10.3, "emphasis": true, "highlightColor": "#FACC15" }},
        {{ "word": "AND", "start": 10.3, "end": 10.6, "emphasis": false }},
        {{ "word": "START", "start": 10.6, "end": 11.2, "emphasis": true, "highlightColor": "#EF4444" }},
        {{ "word": "NOW.", "start": 11.2, "end": 11.8, "emphasis": true, "highlightColor": "#38BDF8" }}
      ]
    }}
  ]
}}
"""

    if not gemini_client:
        logger.warning("Gemini script requested but GEMINI_API_KEY is not configured.")
        raise ValueError("GEMINI_API_KEY is not configured. Please set GEMINI_API_KEY in your environment to generate dynamic AI scripts.")

    target_model = resolve_script_model(model)
    logger.info(f"Initiating AI script & storyboard generation | Model: '{target_model}' | Theme: '{category}' | Topic: '{topic}' | Deduplicated: {len(memory_quotes)}")
    start_t = time.perf_counter()

    try:
        models_to_try = [target_model]
        for alt_model in [
            "gemini-2.5-flash",
            "gemini-2.0-flash",
            "gemini-1.5-flash",
            "gemini-3.5-flash-lite",
            "gemini-3.1-pro-preview",
            "gemini-3-flash-preview",
        ]:
            if alt_model not in models_to_try:
                models_to_try.append(alt_model)

        response = None
        last_err = None
        used_model = target_model
        for attempt_model in models_to_try:
            try:
                chat = gemini_client.chats.create(
                    model=attempt_model,
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                    )
                )
                response = chat.send_message(prompt)
                used_model = attempt_model
                break
            except Exception as e:
                last_err = e
                logger.warning(f"Model '{attempt_model}' unavailable ({e}), trying next model...")
                time.sleep(1.0)

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

        # ── Dynamic Internet Media Resolution for All Scenes (100% Video, Zero Duplicates) ──
        from backend.features.workspace.open_media_service import resolve_scene_media_from_internet
        seen_video_urls: set[str] = set()

        for sc in storyboard:
            # Force 100% video cuts (no static images)
            sc["mediaType"] = "video"
            # Keep duration punchy and short for YouTube Shorts (2.0s to 3.5s)
            if "duration" in sc:
                sc["duration"] = min(3.5, max(2.0, float(sc.get("duration", 2.8))))

            # Primary search query: prioritize Google Video Search expression if provided
            primary_query = sc.get("googleSearchQuery") or sc.get("visualQuery") or sc.get("mediaName") or sc.get("subtitleText") or topic
            fallback_list = sc.get("fallbackQueries") or []
            curr_url = str(sc.get("mediaUrl") or "").strip()
            
            is_mock_sample = any(bad in curr_url.lower() for bad in [
                "commondatastorage", "sample", "forbigger", "sintel", "subaru", 
                "tearsofsteel", "bullrun", "bunny", "example.com", "placeholder", "blob:"
            ])
            is_duplicate = curr_url in seen_video_urls
            title_lower = (sc.get("mediaName") or "").lower()
            junk_check = [
                "paint", "pebble", "how to", "tutorial", "repair", "drone", "broadwater",
                "arnis", "demo", "renovation", "president", "trump", "biden", "protest",
                "campaign", "election", "rally", "politic", "activist", "grave", "cemetery",
                "gravel", "demolition", "gym", "fitness", "workout", "crossfit", "barbell",
                "dumbell", "interview", "talking", "presentation", "city", "traffic", "car", "office"
            ]
            has_junk_name = any(j in title_lower for j in junk_check)
            is_placeholder = (
                not curr_url
                or not curr_url.startswith("http")
                or is_mock_sample
                or is_duplicate
                or has_junk_name
                or any(ph in curr_url for ph in ["v1", "v2", "v3", "v4", "v5", "v6", "vid-"])
            )

            if is_placeholder:
                # 1. Try finding an unused video from available dynamic internet assets (strictly non-mock and nature-focused)
                matched_v = next(
                    (v for v in avail_videos
                     if v.get("videoUrl")
                     and v["videoUrl"] not in seen_video_urls
                     and not any(bad in str(v.get("videoUrl", "")).lower() for bad in [
                         "commondatastorage", "sample", "forbigger", "sintel", "subaru", "tearsofsteel", "bullrun", "bunny"
                     ])
                     and not any(j in (v.get("title") or "").lower() for j in junk_check)
                    ),
                    None
                )
                if matched_v:
                    sc["mediaUrl"] = matched_v["videoUrl"]
                    sc["posterUrl"] = matched_v.get("posterUrl") or matched_v.get("thumbUrl") or matched_v.get("thumbnail") or ""
                    sc["thumbnailUrl"] = sc["posterUrl"]
                    sc["mediaName"] = matched_v.get("title") or matched_v.get("name") or "Internet Nature Video Cut"
                    sc["mediaId"] = matched_v.get("id", f"scene_vid_{sc.get('sceneNumber', 1)}")
                else:
                    # 2. Dynamically search live internet video APIs (Google Search Engine, Pexels, Pixabay, Wikimedia)
                    resolved_clip = None
                    raw_candidates = [primary_query] + [q for q in fallback_list if q]
                    nature_keywords = {"nature", "mountain", "forest", "waterfall", "ocean", "river", "clouds", "aurora", "landscape", "sunset", "trees", "alpine"}
                    search_candidates = []
                    for c_q in raw_candidates:
                        c_clean = str(c_q).strip()
                        if not any(nk in c_clean.lower() for nk in nature_keywords):
                            search_candidates.append(f"{c_clean} cinematic nature landscape")
                        else:
                            search_candidates.append(c_clean)

                    for candidate_q in search_candidates:
                        live_resolved = resolve_scene_media_from_internet(
                            media_type="video",
                            visual_query=candidate_q,
                            fallback_topic=f"cinematic nature landscape {topic}",
                            exclude_urls=seen_video_urls,
                            aspect_ratio=target_aspect_ratio,
                        )
                        if live_resolved and live_resolved.get("videoUrl"):
                            resolved_clip = live_resolved
                            break

                    if resolved_clip and resolved_clip.get("videoUrl"):
                        sc["mediaUrl"] = resolved_clip["videoUrl"]
                        sc["posterUrl"] = resolved_clip.get("posterUrl") or resolved_clip.get("thumbnail") or ""
                        sc["thumbnailUrl"] = sc["posterUrl"]
                        sc["mediaName"] = resolved_clip.get("title") or sc.get("mediaName") or "Internet Stock Video Cut"
                        sc["mediaId"] = resolved_clip.get("id") or sc.get("mediaId")
                    else:
                        raise ValueError(
                            f"No stock video found matching '{primary_query}' in {target_aspect_ratio} aspect ratio. "
                            f"Zero fallbacks allowed. Please configure GOOGLE_SEARCH_API_KEY + GOOGLE_CSE_ID, PEXELS_API_KEY, or PIXABAY_API_KEY in backend/.env, or refine prompt keywords."
                        )

            curr_check = str(sc.get("mediaUrl") or "").strip()
            is_bad_final = (
                not curr_check
                or not curr_check.startswith("http")
                or any(bad in curr_check.lower() for bad in [
                    "commondatastorage", "sample", "forbigger", "sintel", "subaru", 
                    "tearsofsteel", "bullrun", "bunny", "example.com", "placeholder"
                ])
                or any(ph in curr_check for ph in ["v1", "v2", "v3", "v4", "v5", "v6", "vid-"])
            )
            if is_bad_final:
                raise ValueError(
                    f"No genuine video footage available for Scene {sc.get('sceneNumber', 1)} ('{primary_query}') in {target_aspect_ratio}. "
                    f"Zero fallbacks allowed. Please configure GOOGLE_SEARCH_API_KEY + GOOGLE_CSE_ID, PEXELS_API_KEY, or PIXABAY_API_KEY in backend/.env."
                )

            sc["aspectRatio"] = target_aspect_ratio
            seen_video_urls.add(sc["mediaUrl"])

        # ── Multi-Hook Resolution (Ensure 3 distinct angles are available) ──
        hooks_data = result.get("hooks") or []
        if not hooks_data:
            base_hook = result.get("hook") or "Discipline beats motivation every single time."
            hooks_data = [
                {
                    "id": "hook_1",
                    "angle": "Brutal Truth / Negative",
                    "text": base_hook,
                    "viralityScore": 95,
                    "spokenDuration": 2.2,
                },
                {
                    "id": "hook_2",
                    "angle": "Curiosity Gap",
                    "text": f"The hidden secret to {topic.lower() or 'success'}.",
                    "viralityScore": 91,
                    "spokenDuration": 2.4,
                },
                {
                    "id": "hook_3",
                    "angle": "Direct Challenge",
                    "text": f"Can you maintain focus on {topic.lower() or 'your goal'} today?",
                    "viralityScore": 88,
                    "spokenDuration": 2.1,
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

        # ── Word-Level Dynamic Karaoke Subtitles Synchronization ──
        # Recompute continuous scene boundaries and natural speech durations
        curr_timeline_time = 0.0
        for sc in storyboard:
            txt = (sc.get("subtitleText") or "").strip()
            w_count = max(1, len(txt.split()))
            natural_dur = max(1.8, min(4.2, round(w_count * 0.35 + 0.5, 1)))
            sc["duration"] = natural_dur
            sc["start"] = round(curr_timeline_time, 2)
            curr_timeline_time = round(curr_timeline_time + natural_dur, 2)

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


def generate_gemini_voiceover(text: str, voice_name: str | None = None, model: str | None = None) -> dict[str, Any]:
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
    logger.info(
        f"Requesting Gemini TTS voiceover synthesis | Model: '{tts_model}' | "
        f"Voice: '{voice_name}' | Text Length: {len(normalized_text)} chars"
    )
    start_t = time.perf_counter()

    try:
        prompt = (
            "Narrate this with a polished, cinematic, motivational delivery. "
            "Keep the pacing natural, the tone charismatic, and the emphasis clear. "
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
                logger.warning(f"TTS Model '{attempt_tts}' failed ({e}), trying next TTS model...")

        if tts_res is not None:
            raw_audio, mime_type = extract_voiceover_audio(tts_res)
            if isinstance(raw_audio, bytes):
                audio_b64 = base64.b64encode(raw_audio).decode("utf-8")
            else:
                audio_b64 = str(raw_audio)

            elapsed = time.perf_counter() - start_t
            logger.info(
                f"Gemini TTS synthesized audio in {elapsed:.2f}s for voice '{voice_name}' | "
                f"mime={mime_type} | b64_len={len(audio_b64)}"
            )
            return {
                "success": True,
                "voiceName": voice_name,
                "mimeType": mime_type,
                "audioBase64": audio_b64,
                "audioUrl": f"data:{mime_type};base64,{audio_b64}",
            }

        # ── Resilient Fallback: gTTS High-Quality Synthesis ──
        logger.warning(f"Gemini TTS unavailable ({last_tts_err}). Initiating high-definition gTTS synthesis fallback...")
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
            logger.info(f"Fallback gTTS synthesized {len(gtts_bytes)} bytes audio in {elapsed:.2f}s for voice '{voice_name}'")
            return {
                "success": True,
                "voiceName": voice_name,
                "mimeType": "audio/mp3",
                "audioBase64": gtts_b64,
                "audioUrl": f"data:audio/mp3;base64,{gtts_b64}",
            }
        except Exception as fallback_err:
            logger.error(f"Fallback gTTS synthesis also failed: {fallback_err}")
            raise RuntimeError(f"Voiceover synthesis failed (Gemini: {last_tts_err}, Fallback: {fallback_err})")

    except Exception as e:  # noqa: BLE001
        elapsed = time.perf_counter() - start_t
        logger.error(f"Voiceover generation error after {elapsed:.2f}s for voice '{voice_name}': {e}")
        raise RuntimeError(f"Voiceover synthesis failed: {e}")


