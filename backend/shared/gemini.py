import base64
import json
import logging
import struct
import time
from typing import Any

from google import genai
from google.genai import types

from .config import settings

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
    "gemini-2.5-pro": "gemini-2.5-pro",
    "gemini-2.5-flash-lite": "gemini-2.5-flash-lite",
    "gemini-flash-latest": "gemini-flash-latest",
    "gemini-pro-latest": "gemini-pro-latest",
    # Deprecated/legacy alias fallbacks to prevent 404
    "gemini-2.0-flash": "gemini-2.5-flash",
    "gemini-2.0-flash-lite": "gemini-2.5-flash-lite",
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
) -> dict[str, Any]:
    """Generates viral motivational quote scripts via Gemini with memory deduplication."""
    memory_snippets = "\n".join([
        f"- [Title: {q.get('title')}] Quote: {q.get('quote')}"
        for q in memory_quotes[-15:]
    ]) if memory_quotes else "No previous quotes recorded yet."

    selected_context = []
    for label, value in [
        ("TONE", tone),
        ("TARGET LENGTH", length),
        ("AUDIO MOOD", audio_mood),
        ("BACKGROUND STYLE", background_style),
        ("TEXT STYLE", text_style),
        ("VIDEO STYLE", video_style),
        ("VOICE", voice_name),
        ("ASPECT RATIO", aspect_ratio),
        ("MUSIC TRACK", music_track),
        ("CAPTION STYLE", caption_style),
        ("VISUAL THEME", visual_theme),
        ("MOTION STYLE", motion_style),
        ("OUTPUT FORMAT", output_format),
    ]:
        if value and str(value).strip():
            selected_context.append(f"{label}: {value}")

    if creative_context:
        for key, value in creative_context.items():
            if value is not None and str(value).strip():
                selected_context.append(f"{key.upper()}: {value}")

    context_block = "\n".join(selected_context) if selected_context else "No specific creative preferences were selected. Let the strongest concept emerge naturally from the prompt."
    if creative_context:
        context_block = (
            f"{context_block}\n\nFULL LIVE CREATIVE CONTEXT JSON:\n"
            f"{json.dumps(creative_context, ensure_ascii=False, indent=2)}"
        )

    prompt = f"""You are an elite YouTube Shorts motivational writer and virality strategist.
Produce an inspiring, punchy, retention-optimized motivational quote script.

THEME: {category or 'Stoic Discipline & Relentless Focus'}
TOPIC: {topic or 'Winning quiet battles, silence over excuses, compounding grit'}

CURRENT CREATIVE CONTEXT (LIVE WORKSPACE STATE):
{context_block}

INSTRUCTIONS:
- The FULL LIVE CREATIVE CONTEXT is the primary source of truth. Treat every non-empty value in the workspace state as intentional user/editor selection and prioritize it above generic defaults.
- Use the selected values to decide the final audio, background, text, motion, pacing, transitions, subtitle timing, text animation, hook placement, CTA timing, emphasis points, and format combination.
- If the workspace includes a voice, music, backdrop, caption style, overlay, aspect ratio, motion, or scene structure, reflect that in the generated output instead of inventing generic alternatives.
- Prioritize shot pacing, transition style, subtitle motion, text animation, camera movement, and scene structure when deciding the final short-form video treatment.
- Place the strongest emotional hook within the first 1-3 seconds, escalate the message in the middle, and land the CTA in the final 2-4 seconds.
- Emphasize the key emotional or truth statement with clear visual emphasis and subtitle hierarchy.
- Do NOT invent placeholder values, do NOT ignore selected creative settings, and do NOT fall back to vague hardcoded defaults when the workspace provides real guidance.
- If some settings are missing, fill only the missing pieces automatically from the strongest creative logic; never replace existing selected values with generic defaults.
- Optimize for retention, clarity, and emotional impact for short-form vertical video.

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
  "visualTheme": "Best visual theme matching the message",
  "recommendedVoice": "Best voice matching the tone",
  "audioMood": "Best audio mood for the concept",
  "backgroundStyle": "Best background treatment for the scene",
  "textStyle": "Best on-screen typography treatment",
  "videoStyle": "Best video composition and pacing style",
  "aspectRatio": "Best aspect ratio",
  "musicTrack": "Best soundtrack style",
  "captionStyle": "Best caption style",
  "motionStyle": "Best motion and transition style",
  "outputFormat": "Best output format",
  "shotPacing": "How the video should pace the cuts and retention beats",
  "transitionStyle": "What transition or match-cut language should drive the edits",
  "subtitleMotion": "How the subtitles should move or appear on screen",
  "textAnimation": "How key text should animate or reveal itself",
  "cameraMovement": "How the camera should move or frame the scene",
  "sceneStructure": {{
    "hookPlacement": "Where the hook lands in the first seconds",
    "ctaTiming": "Where the closing CTA lands in timing",
    "emphasisPoints": ["Primary emotional or truth statement", "Second emphasis beat", "Final payoff line"],
    "shotPlan": "Short description of the 3-beat hook/escalation/resolution structure",
    "subtitlePriority": "How subtitles should prioritize the strongest words"
  }},
  "tags": ["motivation", "discipline", "mindset", "shorts", "stoic"],
  "hashtags": ["#Shorts", "#Motivation", "#Grit"],
  "subtitles": [
    {{"text": "Opening hook phrase", "start": 0.0, "duration": 2.2}},
    {{"text": "First quote sentence", "start": 2.2, "duration": 5.5}},
    {{"text": "Second quote sentence", "start": 7.7, "duration": 6.0}},
    {{"text": "Final call to action", "start": 13.7, "duration": 3.0}}
  ]
}}
"""

    if not gemini_client:
        logger.warning("Gemini script requested but GEMINI_API_KEY is not configured.")
        raise ValueError("GEMINI_API_KEY is not configured. Please set GEMINI_API_KEY in your environment to generate dynamic AI scripts.")

    # Proper model selection via dictionary registry lookup (no if/else chain)
    target_model = resolve_script_model(model)

    logger.info(f"Initiating AI script generation | Model: '{target_model}' | Theme: '{category}' | Topic: '{topic}' | Prior Quotes Deduplicated: {len(memory_quotes)}")
    start_t = time.perf_counter()

    try:
        # As recommended by Google GenAI SDK: use Chat.send_message for AFC and content generation
        chat = gemini_client.chats.create(
            model=target_model,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
            )
        )
        response = chat.send_message(prompt)
        raw = response.text or "{}"
        if "```json" in raw:
            raw = raw.split("```json")[1].split("```")[0].strip()
        elif "```" in raw:
            raw = raw.split("```")[1].split("```")[0].strip()
        result = json.loads(raw)
        elapsed = time.perf_counter() - start_t
        logger.info(f"AI Model '{target_model}' generated script in {elapsed:.2f}s | Title: '{result.get('title')}' | Hook: '{result.get('hook')}'")
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


