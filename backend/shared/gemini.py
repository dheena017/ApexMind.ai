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
    CURATED_STOCK_VIDEOS,
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

    catalog = available_assets or (creative_context.get("availableAssets") if creative_context else None) or get_static_media_catalog()
    
    avail_videos = catalog.get("stockVideos") or catalog.get("videoClips") or CURATED_STOCK_VIDEOS
    video_summary = "\n".join([
        f"- ID: {v.get('id')} | Title: '{v.get('title')}' | Category: {v.get('category')} | VideoUrl: {v.get('videoUrl')}"
        for v in avail_videos[:10]
    ])

    avail_backdrops = catalog.get("visualBackdrops") or catalog.get("imageBackdrops") or VISUAL_BACKDROPS
    backdrop_summary = "\n".join([
        f"- ID: {b.get('id')} | Name: '{b.get('name')}' | Category: {b.get('category')} | ImageUrl: {b.get('imageUrl') or ''} | VideoUrl: {b.get('videoUrl') or ''}"
        for b in avail_backdrops[:12]
    ])

    avail_text = catalog.get("textPresets") or catalog.get("textStyles") or CURATED_TEXT_PRESETS
    text_summary = "\n".join([
        f"- ID: {t.get('id')} | Name: '{t.get('name')}' | Class: '{t.get('className')}' | Color: '{t.get('color')}' | Font: '{t.get('fontFamily', '')}' | Desc: {t.get('styleDescription', '')}"
        for t in avail_text[:12]
    ])

    avail_music = catalog.get("musicTracks") or MEDIA_TRACKS
    music_summary = "\n".join([
        f"- ID: {m.get('id')} | Title: '{m.get('title')}' | Genre: {m.get('genre')} | BPM: {m.get('bpm')} | AudioUrl: {m.get('audioUrl')}"
        for m in avail_music[:8]
    ])

    avail_sfx = catalog.get("soundEffects") or catalog.get("sfxList") or CURATED_SFX
    sfx_summary = "\n".join([
        f"- ID: {s.get('id')} | Name: '{s.get('name')}' | Duration: {s.get('duration')} | AudioUrl: {s.get('audioUrl')}"
        for s in avail_sfx[:6]
    ])

    avail_voices = catalog.get("voiceProfiles") or VOICE_PROFILES
    voice_summary = "\n".join([
        f"- ID: {v.get('id')} | Name: '{v.get('name')}' | Gender: {v.get('gender')} | Style: {v.get('style')}"
        for v in avail_voices[:6]
    ])

    # Ensure aspectRatio defaults to 9:16 if not specified
    target_aspect_ratio = aspect_ratio if aspect_ratio in ["9:16", "16:9", "1:1", "4:5", "21:9"] else (aspect_ratio or "9:16")

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

    prompt = f"""You are an elite YouTube Shorts motivational director, writer, and virality strategist.
Produce an inspiring, punchy, retention-optimized motivational video plan with full script and multi-scene storyboard.

TARGET ASPECT RATIO: {target_aspect_ratio}
ASPECT RATIO & SUBTITLE SAFE ZONE RULES:
- The video will be rendered in {target_aspect_ratio} format.
- Subtitle Safety: In {target_aspect_ratio} (especially 9:16 vertical shorts), the bottom 25% of the screen is blocked by social media UI (creator name, audio ticker, comment & like buttons).
- Therefore, each subtitle line MUST be short and punchy (strictly 3 to 7 words per scene cut). NEVER output long continuous paragraph blocks in one subtitle cut!
- Break longer sentences into sequential 2.0s - 4.0s scene subtitle cuts matching the exact video beats so subtitles are clearly readable in the vertical safe zone and NEVER get hidden or clipped.

THEME: {category or 'Stoic Discipline & Relentless Focus'}
TOPIC: {topic or 'Winning quiet battles, silence over excuses, compounding grit'}

CURRENT CREATIVE CONTEXT:
{context_block}

================================================================================
WEBSITE MEDIA & STYLE ASSET CATALOG (SELECT FROM THESE REAL WEBSITE ASSETS):
================================================================================

1. AVAILABLE STOCK VIDEOS (FOR VIDEO SCENES):
{video_summary}

2. AVAILABLE SCENIC IMAGE BACKDROPS (FOR IMAGE SCENES):
{backdrop_summary}

3. AVAILABLE TEXT STYLES & TYPOGRAPHY PRESETS:
{text_summary}

4. AVAILABLE SOUNDTRACKS:
{music_summary}

5. AVAILABLE SOUND EFFECTS (SFX):
{sfx_summary}

6. AVAILABLE VOICE PROFILES:
{voice_summary}

================================================================================
MANDATORY 100% PURE VIDEO DIRECTIVE (NO STATIC IMAGES & NO DUPLICATE VIDEOS):
================================================================================
- Do NOT use static images or photos! Every single scene MUST be a moving, cinematic VIDEO ("mediaType": "video").
- You MUST design a sequential, multi-scene video plan ('storyboard') consisting of multiple SHORT, high-energy video clips (minimum 4-6 distinct scenes/shots across the timeline).
- SHORT CLIP DURATION: Each video clip must be short and punchy (2.0s to 4.0s duration each) for fast-paced viral YouTube Shorts retention.
- ZERO DUPLICATE VIDEOS: Every scene MUST use a DIFFERENT, UNIQUE high-quality video clip. Never repeat the same video clip or video URL across the video!
- For EACH scene in the 'storyboard':
  1. "sceneNumber": 1, 2, 3...
  2. "beat": "hook" | "escalation" | "quote" | "climax" | "cta"
  3. "start": start time in seconds (float, e.g. 0.0)
  4. "duration": short duration in seconds (float, between 2.0 and 4.0)
  5. "mediaType": "video" (ALWAYS "video", NEVER "image")
  6. "mediaId": unique ID from AVAILABLE STOCK VIDEOS
  7. "mediaUrl": exact videoUrl of that video
  8. "mediaName": exact name/title of that video
  9. "textStyleId": exact ID from AVAILABLE TEXT STYLES (e.g. "sub-hormozi", "sub-mrbeast", "quote-stoic-roman", "cta-save-reel")
  10. "textStyleName": exact name of the text style
  11. "captionPresetClass": CSS classes of that text style
  12. "captionPresetColor": color of that text style
  13. "captionPresetFontFamily": font family of that text style
  14. "transition": "glitch" | "match-cut" | "zoom" | "fade" | "slide"
  15. "cameraMotion": "push-in" | "slow-zoom" | "pan-right" | "handheld" | "static"
  16. "sfx": optional SFX name (e.g. "Fast Cinematic Whoosh" or "Cinematic Sub Bass Drop")
  17. "sfxUrl": audioUrl of the SFX
  18. "subtitleText": the spoken line or subtitle for this scene beat
  19. "visualQuery": 2 to 4 word targeted visual search term to fetch real internet footage (e.g. "rain tokyo neon street", "heavy gym deadlift", "running athlete sprint", "deep nebula stars")
- Choose "recommendedVoice" from the AVAILABLE VOICE PROFILES.
- Choose "musicTrack" from the AVAILABLE SOUNDTRACKS.

CRITICAL MEMORY & UNIQUENESS CONSTRAINT:
Your script MUST NOT repeat, paraphrase, or borrow metaphors from any of these previously saved quotes:
{memory_snippets}

Output MUST be a single raw JSON object with exactly these keys:
{{
  "title": "A viral Shorts title with punch under 60 chars",
  "hook": "Unforgettable 3 to 5 word opening line spoken in first 2 seconds",
  "quote": "A powerful 2-3 sentence motivational monologue",
  "cta": "A sharp 1-sentence closing call-to-action",
  "speechStyle": "Short description of vocal cadence (e.g. Calm, grounded, stoic)",
  "visualTheme": "Best visual theme ID or name matching the message",
  "recommendedVoice": "Best voice matching the tone from the catalog",
  "audioMood": "Best audio mood for the concept",
  "backgroundStyle": "Best background treatment for the scene",
  "textStyle": "Best on-screen typography treatment from the catalog",
  "videoStyle": "Best video composition and pacing style",
  "aspectRatio": "9:16",
  "musicTrack": "Best soundtrack title or ID from catalog",
  "captionStyle": "Best caption style",
  "motionStyle": "Best motion and transition style",
  "outputFormat": "9:16 Vertical Video (1080x1920)",
  "shotPacing": "Pacing description matched to soundtrack BPM",
  "transitionStyle": "What transition or match-cut language drives the edits",
  "subtitleMotion": "How the subtitles should move or appear on screen",
  "textAnimation": "How key text should animate or reveal itself",
  "cameraMovement": "How the camera moves across cuts",
  "sceneStructure": {{
    "hookPlacement": "Where the hook lands in the first 1-3 seconds",
    "ctaTiming": "Where the closing CTA lands in timing",
    "emphasisPoints": ["Primary emotional statement", "Second escalation beat", "Final payoff line"],
    "shotPlan": "Description of the multi-clip hook/escalation/resolution structure",
    "subtitlePriority": "How subtitles prioritize the strongest words"
  }},
  "tags": ["motivation", "discipline", "mindset", "shorts", "stoic"],
  "hashtags": ["#Shorts", "#Motivation", "#Grit"],
  "subtitles": [
    {{"text": "Opening hook phrase", "start": 0.0, "duration": 2.5, "textStyleId": "sub-hormozi", "captionPresetClass": "font-black tracking-tight text-yellow-400 uppercase drop-shadow-[0_4px_12px_rgba(0,0,0,1)] bg-black/85 px-3 py-1 rounded-md border border-yellow-400/30", "captionPresetColor": "#FACC15"}},
    {{"text": "First quote sentence", "start": 2.5, "duration": 4.5, "textStyleId": "sub-mrbeast", "captionPresetClass": "font-black tracking-tighter text-sky-400 uppercase drop-shadow-[0_4px_16px_rgba(0,0,0,1)] stroke-black", "captionPresetColor": "#38BDF8"}},
    {{"text": "Second quote sentence", "start": 7.0, "duration": 5.0, "textStyleId": "quote-stoic-roman", "captionPresetClass": "font-serif tracking-widest text-stone-100 uppercase drop-shadow-[0_4px_20px_rgba(0,0,0,0.9)] italic border-y border-stone-500/30 py-2", "captionPresetColor": "#F5F5F4"}},
    {{"text": "Final call to action", "start": 12.0, "duration": 3.0, "textStyleId": "cta-save-reel", "captionPresetClass": "font-extrabold tracking-wide text-sky-400 uppercase bg-sky-950/60 px-5 py-2 rounded-xl border border-sky-500/40 text-center shadow-lg", "captionPresetColor": "#38BDF8"}}
  ],
  "storyboard": [
    {{
      "sceneNumber": 1,
      "beat": "hook",
      "start": 0.0,
      "duration": 2.5,
      "mediaType": "video",
      "mediaId": "vid-storm",
      "mediaUrl": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
      "mediaName": "Atmospheric Storm & Clouds",
      "textStyleId": "sub-hormozi",
      "textStyleName": "Hormozi Viral Yellow",
      "captionPresetClass": "font-black tracking-tight text-yellow-400 uppercase drop-shadow-[0_4px_12px_rgba(0,0,0,1)] bg-black/85 px-3 py-1 rounded-md border border-yellow-400/30",
      "captionPresetColor": "#FACC15",
      "captionPresetFontFamily": "Impact, sans-serif",
      "transition": "glitch",
      "cameraMotion": "push-in",
      "sfx": "Fast Cinematic Whoosh",
      "sfxUrl": "https://cdn.pixabay.com/download/audio/2022/03/15/audio_27529fa22a.mp3?filename=fast-whoosh-10901.mp3",
      "subtitleText": "Opening hook phrase"
    }},
    {{
      "sceneNumber": 2,
      "beat": "escalation",
      "start": 2.5,
      "duration": 3.0,
      "mediaType": "video",
      "mediaId": "vid-matrix",
      "mediaUrl": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4",
      "mediaName": "Neon Cyber Matrix Stream",
      "textStyleId": "sub-mrbeast",
      "textStyleName": "MrBeast Pop Bold",
      "captionPresetClass": "font-black tracking-tighter text-sky-400 uppercase drop-shadow-[0_4px_16px_rgba(0,0,0,1)] stroke-black",
      "captionPresetColor": "#38BDF8",
      "captionPresetFontFamily": "Anton, sans-serif",
      "transition": "match-cut",
      "cameraMotion": "pan-right",
      "sfx": null,
      "sfxUrl": null,
      "visualQuery": "neon stream digital cyberpunk",
      "subtitleText": "First quote sentence"
    }},
    {{
      "sceneNumber": 3,
      "beat": "quote",
      "start": 5.5,
      "duration": 3.5,
      "mediaType": "video",
      "mediaId": "vid-gym",
      "mediaUrl": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
      "mediaName": "Raw Iron Gym Power",
      "textStyleId": "quote-stoic-roman",
      "textStyleName": "Stoic Roman Empire",
      "captionPresetClass": "font-serif tracking-widest text-stone-100 uppercase drop-shadow-[0_4px_20px_rgba(0,0,0,0.9)] italic border-y border-stone-500/30 py-2",
      "captionPresetColor": "#F5F5F4",
      "captionPresetFontFamily": "Cinzel, Georgia, serif",
      "transition": "zoom",
      "cameraMotion": "slow-zoom",
      "sfx": null,
      "sfxUrl": null,
      "visualQuery": "gym power deadlift focus",
      "subtitleText": "Second quote sentence"
    }},
    {{
      "sceneNumber": 4,
      "beat": "cta",
      "start": 9.0,
      "duration": 3.0,
      "mediaType": "video",
      "mediaId": "vid-galaxy",
      "mediaUrl": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4",
      "mediaName": "Cosmic Stars Acceleration",
      "textStyleId": "cta-save-reel",
      "textStyleName": "Save Reel Bookmark CTA",
      "captionPresetClass": "font-extrabold tracking-wide text-sky-400 uppercase bg-sky-950/60 px-5 py-2 rounded-xl border border-sky-500/40 text-center shadow-lg",
      "captionPresetColor": "#38BDF8",
      "captionPresetFontFamily": "Montserrat, sans-serif",
      "transition": "fade",
      "cameraMotion": "static",
      "sfx": "Cash Register Cha-Ching",
      "sfxUrl": "https://cdn.pixabay.com/download/audio/2021/08/09/audio_732a101292.mp3?filename=cash-register-98214.mp3",
      "visualQuery": "deep galaxy stars speed",
      "subtitleText": "Final call to action"
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
        for alt_model in ["gemini-3.5-flash-lite", "gemini-3.1-pro-preview", "gemini-3-flash-preview"]:
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

        # ── Resilient Storyboard Normalization ────────────────────────────────
        subtitles = result.get("subtitles") or []
        storyboard = result.get("storyboard") or []

        # If storyboard is empty or missing, synthesize an intelligent multi-scene plan
        if not storyboard and subtitles:
            logger.info("Synthesizing multi-scene storyboard fallback from subtitles and catalog...")
            sample_videos = avail_videos or CURATED_STOCK_VIDEOS
            sample_backdrops = avail_backdrops or VISUAL_BACKDROPS
            sample_texts = avail_text or CURATED_TEXT_PRESETS

            storyboard = []
            seen_fallback_urls = set()
            for idx, sub in enumerate(subtitles):
                # Always video - no static images
                v_item = None
                for candidate in (sample_videos or []):
                    c_url = candidate.get("videoUrl")
                    if c_url and c_url not in seen_fallback_urls:
                        v_item = candidate
                        seen_fallback_urls.add(c_url)
                        break

                if not v_item and sample_videos:
                    v_item = sample_videos[idx % len(sample_videos)]

                media_id = v_item.get("id") if v_item else f"vid-cut-{idx+1}"
                media_url = v_item.get("videoUrl") if v_item else ""
                media_name = v_item.get("title") or v_item.get("name") if v_item else f"Scene {idx+1} Video Cut"

                t_item = sample_texts[idx % len(sample_texts)]
                beat_name = "hook" if idx == 0 else ("cta" if idx == len(subtitles) - 1 else ("climax" if idx == len(subtitles) - 2 else "quote"))
                sfx_item = avail_sfx[0] if (idx == 0 and avail_sfx) else None
                clip_dur = min(4.0, max(2.0, float(sub.get("duration", 3.0))))

                storyboard.append({
                    "sceneNumber": idx + 1,
                    "beat": beat_name,
                    "start": float(sub.get("start", idx * 3.0)),
                    "duration": clip_dur,
                    "mediaType": "video",
                    "mediaId": str(media_id),
                    "mediaUrl": str(media_url),
                    "mediaName": str(media_name),
                    "textStyleId": t_item.get("id"),
                    "textStyleName": t_item.get("name"),
                    "captionPresetClass": t_item.get("className"),
                    "captionPresetColor": t_item.get("color"),
                    "captionPresetFontFamily": t_item.get("fontFamily"),
                    "transition": "glitch" if idx == 0 else "match-cut",
                    "cameraMotion": "push-in" if idx % 2 == 0 else "slow-zoom",
                    "sfx": sfx_item.get("name") if sfx_item else None,
                    "sfxUrl": sfx_item.get("audioUrl") if sfx_item else None,
                    "subtitleText": sub.get("text", ""),
                })

        # ── Dynamic Internet Media Resolution for All Scenes (100% Video, Zero Duplicates) ──
        from backend.features.workspace.open_media_service import resolve_scene_media_from_internet
        seen_video_urls: set[str] = set()

        for sc in storyboard:
            # Force 100% video cuts (no static images)
            sc["mediaType"] = "video"
            # Keep duration punchy and short for YouTube Shorts (2.0s to 4.0s)
            if "duration" in sc:
                sc["duration"] = min(4.0, max(2.0, float(sc.get("duration", 3.0))))

            v_query = sc.get("visualQuery") or sc.get("mediaName") or sc.get("subtitleText") or topic
            curr_url = str(sc.get("mediaUrl") or "")

            is_duplicate = curr_url in seen_video_urls
            is_placeholder = (
                not curr_url
                or is_duplicate
                or any(ph in curr_url for ph in ["ForBiggerBlazes", "ForBiggerEscapes", "v1", "v2", "v3", "v4", "v5", "v6", "vid-"])
            )

            if is_placeholder:
                # 1. Try finding an unused video from available dynamic internet assets
                matched_v = next(
                    (v for v in avail_videos if v.get("videoUrl") and v["videoUrl"] not in seen_video_urls and "commondatastorage" not in v.get("videoUrl", "")),
                    None
                )
                if matched_v:
                    sc["mediaUrl"] = matched_v["videoUrl"]
                    sc["mediaName"] = matched_v.get("title") or matched_v.get("name") or "Internet Video Cut"
                    sc["mediaId"] = matched_v["id"]
                else:
                    # 2. Dynamically search live internet video APIs for this specific scene query, excluding all seen URLs
                    live_resolved = resolve_scene_media_from_internet(
                        media_type="video",
                        visual_query=v_query,
                        fallback_topic=f"{topic} {category}",
                        exclude_urls=seen_video_urls,
                    )
                    if live_resolved and live_resolved.get("videoUrl"):
                        sc["mediaUrl"] = live_resolved["videoUrl"]
                        sc["mediaName"] = live_resolved.get("title") or sc.get("mediaName") or "Internet Stock Video Cut"
                        sc["mediaId"] = live_resolved.get("id") or sc.get("mediaId")

            if sc.get("mediaUrl"):
                seen_video_urls.add(sc["mediaUrl"])

        result["storyboard"] = storyboard
        result["subtitles"] = subtitles
        result["aspectRatio"] = target_aspect_ratio
        if not result.get("outputFormat"):
            result["outputFormat"] = f"{target_aspect_ratio} Vertical Video (1080x1920)" if target_aspect_ratio == "9:16" else f"{target_aspect_ratio} Video"

        logger.info(
            f"AI Model '{target_model}' generated multi-scene video plan in {elapsed:.2f}s | "
            f"Title: '{result.get('title')}' | Scenes: {len(storyboard)} | Subtitles: {len(subtitles)}"
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
        tts_res = gemini_client.models.generate_content(
            model=tts_model,
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
    except Exception as e:  # noqa: BLE001
        elapsed = time.perf_counter() - start_t
        logger.error(f"Gemini TTS generation failed after {elapsed:.2f}s for voice '{voice_name}': {e}")
        raise RuntimeError(f"Voiceover synthesis failed: {e}")


