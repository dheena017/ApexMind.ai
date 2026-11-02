import base64
import io
import json
import logging
import re
import struct
import time
import wave
import threading
from typing import Any, Dict, List, Optional

from google import genai
from google.genai import types

from .config import settings

# ==============================================================================
# Defaults, Fixed Values & Model Registries (Placed at Top Below Imports)
# ==============================================================================

# Script Generation Models & Fallbacks
DEFAULT_SCRIPT_MODEL: str = settings.DEFAULT_SCRIPT_MODEL

SUPPORTED_SCRIPT_MODELS: dict[str, str] = {
    # Active Gemini 3.x models (Recommended)
    "gemini-3.8-flash": "gemini-3.8-flash",
    "gemini-3.1-flash-lite": "gemini-3.1-flash-lite",
    "gemini-flash-latest": "gemini-flash-latest",
    # Active Gemini 2.5 / 2.0 models mapped to active 3.8
    "gemini-2.5-flash": "gemini-3.8-flash",
    "gemini-2.0-flash": "gemini-3.8-flash",
    # Aliases safely routed to active equivalents
    "gemini-3.5-flash-lite": "gemini-3.8-flash",
    "gemini-3.1-pro-preview": "gemini-3.8-flash",
    "gemini-4-argon": "gemini-3.8-flash",
    "gemini-2.5-flash-lite": "gemini-3.8-flash",
    "gemini-2.5-pro": "gemini-3.8-flash",
    "gemini-2.0-flash-lite": "gemini-3.1-flash-lite",
    "gemini-1.5-flash": "gemini-1.5-flash",
    "gemini-1.5-pro": "gemini-1.5-pro",
    "gemini-pro-latest": "gemini-3.8-flash",
    "claude-3-7-sonnet": "gemini-3.8-flash",
    "gpt-4o": "gemini-3.8-flash",
}

SCRIPT_FALLBACK_MODELS: list[str] = [
    "gemini-3.8-flash",
    "gemini-3.1-flash-lite",
    "gemini-flash-latest",
    "gemini-1.5-flash",
]

# TTS Voiceover Models & Fallbacks
DEFAULT_TTS_MODEL: str = "gemini-2.5-flash"

SUPPORTED_TTS_MODELS: dict[str, str] = {
    # Active Multimodal Audio Models
    "gemini-2.5-flash": "gemini-2.5-flash",
    "gemini-2.0-flash": "gemini-2.5-flash",
    "gemini-2.0-flash-exp": "gemini-2.5-flash",
    "gemini-3.8-flash-tts": "gemini-2.5-flash",
    "gemini-3.8-flash-lite-tts": "gemini-2.5-flash",
    "gemini-3.1-flash-tts": "gemini-2.5-flash",
    "gemini-2.5-flash-tts": "gemini-2.5-flash",
}

TTS_FALLBACK_MODELS: list[str] = [
    "gemini-2.5-flash",
]

# Fixed System Instructions & Production Directives
SCRIPT_SYSTEM_INSTRUCTION: str = (
    "You are an elite Autonomous AI Video Director, Virality Strategist, and Master Sound Designer "
    "for viral YouTube Shorts, Instagram Reels, and TikTok. Produce high-retention motivational "
    "short video plans with 3 viral hook variations, 100% pure cinematic nature footage queries, "
    "5-layer broadcast sound design with dynamic sidechain ducking. "
    "Strictly output only valid JSON matching the exact schema."
)

DEFAULT_DUCKING_CONFIG: dict[str, Any] = {
    "active": True,
    "voiceActiveVolume": 0.18,
    "pauseSwellVolume": 0.72,
    "attackMs": 150,
    "releaseMs": 300,
}

DEFAULT_TONE_MODULATION: dict[str, Any] = {
    "active": True,
    "hook": {"speechRate": 1.05, "tone": "urgent", "emotion": "Fast, urgent delivery"},
    "quote": {"speechRate": 0.90, "tone": "reverent", "emotion": "Slower, heavier cadence"},
    "cta": {"speechRate": 1.00, "tone": "decisive", "emotion": "Firm, decisive pace"},
}

CTA_EXCLUSION_TERMS: set[str] = {
    "subscribe", "follow", "cta", "button", "bell", "comment", "share", "channel"
}

# ==============================================================================
# Client & Logger Initialization
# ==============================================================================

logger = logging.getLogger("ApexMind.Gemini")

def get_gemini_client() -> genai.Client | None:
    """Dynamically initializes or retrieves the GenAI client with the latest environment key."""
    key = settings.GEMINI_API_KEY
    if not key or not key.strip():
        return None
    try:
        return genai.Client(api_key=key.strip())
    except Exception as err:
        logger.warning(f"Could not initialize GenAI client: {err}")
        return None

gemini_client: genai.Client | None = get_gemini_client()
if gemini_client:
    logger.info("Google GenAI client initialized successfully.")
else:
    logger.warning("GEMINI_API_KEY is not set or client unavailable.")


class GeminiRateTracker:
    """Thread-safe real-time rate limit and RPM / RPD tracker for Gemini AI requests."""

    def __init__(self):
        self._lock = threading.Lock()
        self._requests: list[float] = []
        self._daily_requests: list[float] = []
        self._tokens_minute: list[tuple[float, int]] = []
        self._total_requests_all_time: int = 0
        self._last_request_time: float | None = None
        self._last_model_used: str = DEFAULT_SCRIPT_MODEL

    def record_request(self, model_name: str = DEFAULT_SCRIPT_MODEL, tokens: int = 0):
        now = time.time()
        with self._lock:
            self._requests.append(now)
            self._daily_requests.append(now)
            if tokens > 0:
                self._tokens_minute.append((now, tokens))
            self._total_requests_all_time += 1
            self._last_request_time = now
            self._last_model_used = model_name
            self._cleanup(now)

    def _cleanup(self, now: float):
        one_min_ago = now - 60.0
        one_day_ago = now - 86400.0
        self._requests = [t for t in self._requests if t > one_min_ago]
        self._daily_requests = [t for t in self._daily_requests if t > one_day_ago]
        self._tokens_minute = [(t, c) for t, c in self._tokens_minute if t > one_min_ago]

    def get_telemetry(self) -> dict[str, Any]:
        now = time.time()
        with self._lock:
            self._cleanup(now)
            current_rpm = len(self._requests)
            current_rpd = len(self._daily_requests)
            current_tpm = sum(c for _, c in self._tokens_minute)
            limit_rpm = 5
            limit_rpd = 20
            limit_tpm = 250_000

            seconds_to_reset = 0
            if self._requests:
                oldest_in_window = min(self._requests)
                seconds_to_reset = max(0, int(60 - (now - oldest_in_window)))

            percent_used = int((current_rpm / limit_rpm) * 100) if limit_rpm > 0 else 0
            if percent_used >= 100:
                status_level = "exceeded"
            elif percent_used >= 80:
                status_level = "critical"
            elif percent_used >= 60:
                status_level = "warning"
            else:
                status_level = "healthy"

            return {
                "activeModel": self._last_model_used or DEFAULT_SCRIPT_MODEL,
                "currentRpm": current_rpm,
                "limitRpm": limit_rpm,
                "currentRpd": current_rpd,
                "limitRpd": limit_rpd,
                "currentTpm": current_tpm,
                "limitTpm": limit_tpm,
                "usagePercentRpm": percent_used,
                "statusLevel": status_level,
                "secondsToWindowReset": seconds_to_reset,
                "effectiveRps": round(limit_rpm / 60.0, 3),
                "totalRequests": self._total_requests_all_time,
                "tier": "Free Tier (5 RPM Cap)",
                "models": [
                    {
                        "name": "Gemini 3.8 Flash",
                        "category": "Text & Scripts",
                        "rpmLimit": 5,
                        "rpdLimit": 20,
                        "tpmLimit": "250K",
                        "rps": "0.083 req/s",
                        "status": "Active",
                        "description": "Default primary engine for script creation and reasoning",
                    },
                    {
                        "name": "Gemini 3.8 Flash TTS",
                        "category": "Voiceover Audio",
                        "rpmLimit": 3,
                        "rpdLimit": 10,
                        "tpmLimit": "10K",
                        "rps": "0.050 req/s",
                        "status": "Active",
                        "description": "Expressive multi-speaker speech synthesis engine",
                    },
                    {
                        "name": "Gemini 3.5 Flash Lite",
                        "category": "High-Throughput",
                        "rpmLimit": 15,
                        "rpdLimit": 500,
                        "tpmLimit": "250K",
                        "rps": "0.250 req/s",
                        "status": "Standby",
                        "description": "Ultra-fast lightweight fallback for fast generations",
                    },
                    {
                        "name": "Antigravity Agent",
                        "category": "Autonomous Agents",
                        "rpmLimit": 60,
                        "rpdLimit": 100,
                        "tpmLimit": "100K",
                        "rps": "1.000 req/s",
                        "status": "Standby",
                        "description": "Sandboxed autonomous agent execution environment",
                    },
                ],
            }


rate_tracker = GeminiRateTracker()


def resolve_script_model(model_name: str | None = None) -> str:
    """Select and validate script generation model using registry lookup."""
    if not model_name:
        return DEFAULT_SCRIPT_MODEL
    return SUPPORTED_SCRIPT_MODELS.get(model_name.strip().lower(), DEFAULT_SCRIPT_MODEL)


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

    # 1. Interactions API format (e.g., gemini-3.8-flash-tts via client.interactions.create)
    output_audio = getattr(response, "output_audio", None)
    if output_audio is not None:
        raw_audio = getattr(output_audio, "data", None)
        mime_type = getattr(output_audio, "mime_type", "audio/wav") or "audio/wav"
        if raw_audio is not None:
            if isinstance(raw_audio, str):
                raw_audio = base64.b64decode(raw_audio)
            return raw_audio, mime_type

    # 2. GenerateContent format (response.candidates[].content.parts[].inline_data)
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
        with wave.open(io.BytesIO(audio_bytes), "rb") as wf:
            frames = wf.getnframes()
            rate = wf.getframerate()
            if rate > 0:
                return round(frames / float(rate), 2)
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
) -> tuple[dict[str, Any] | None, str]:
    """Execute Gemini generate_content across configured fallback models with JSON extraction."""
    client = get_gemini_client()
    if not client:
        return None, "GEMINI_API_KEY is not configured in environment."

    # Deduplicated list of models starting with caller target_model
    models_to_try: list[str] = [target_model]
    for alt in SCRIPT_FALLBACK_MODELS:
        if alt not in models_to_try:
            models_to_try.append(alt)

    response = None
    last_err: Exception | None = None
    used_model: str = target_model

    for attempt_model in models_to_try:
        try:
            gen_config: dict[str, Any] = {
                "system_instruction": system_instruction,
                "temperature": 0.6,
                "response_mime_type": "application/json",
            }
            # Attempt to disable thinking budget to eliminate reasoning latency on models that support it
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
                # If thinking_config was rejected, retry on same model without it
                if "thinking" in err_str and "thinking_config" in gen_config:
                    gen_config.pop("thinking_config", None)
                    response = client.models.generate_content(
                        model=attempt_model,
                        contents=prompt,
                        config=types.GenerateContentConfig(**gen_config),
                    )
                # If transient 503 / temporary demand spike, pause 1.5s and retry once
                elif "503" in err_str or "unavailable" in err_str or "high demand" in err_str:
                    logger.warning(f"[Studio/Script] Model '{attempt_model}' experienced temporary demand spike, retrying in 1.5s...")
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
            logger.warning(f"[Studio/Script] Model '{attempt_model}' unavailable ({e}), trying next model...")
            time.sleep(0.5)

    if response is None:
        logger.warning(f"[Studio/Script] All Gemini online models exhausted or quota-limited: {last_err}")
        return None, f"exhausted: {last_err}"

    raw = response.text or "{}"
    if "```json" in raw:
        raw = raw.split("```json")[1].split("```")[0].strip()
    elif "```" in raw:
        raw = raw.split("```")[1].split("```")[0].strip()

    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError as decode_err:
        logger.error(f"Failed to parse Gemini response as JSON: {raw[:300]}")
        raise ValueError(f"Invalid JSON returned by Gemini: {decode_err}")

    return parsed, used_model


def _build_emergency_theme_script(
    category: str,
    topic: str,
    target_aspect_ratio: str = "9:16",
    target_seconds: int = 30,
) -> dict[str, Any]:
    """Generates an intelligent, high-retention viral blueprint when online Gemini API is unavailable or quota limited."""
    theme_key = f"{category} {topic}".lower()
    
    if any(k in theme_key for k in ["stoic", "discipline", "mindset", "marcus", "philosophy", "grit", "warrior"]):
        title = f"The Stoic Rule of Unshakable Focus | {category}"
        hook = "Stop waiting for motivation to strike."
        quote_p1 = "Marcus Aurelius wrote that the obstacle in the path becomes the path."
        quote_p2 = "Discipline is not an emotion you wait for in the morning."
        quote_p3 = "It is an unyielding contract you honor with yourself in total silence."
        quote_p4 = "Master your impulses today, before they master your destiny."
        cta = "Control your mind or someone else will. Execute today."
        hooks = [
            {"id": "hook_1", "angle": "Brutal Truth", "text": "Stop waiting for motivation to strike.", "viralityScore": 98, "spokenDuration": 2.2},
            {"id": "hook_2", "angle": "Curiosity Gap", "text": "The quiet rule Marcus Aurelius never broke.", "viralityScore": 94, "spokenDuration": 2.5},
            {"id": "hook_3", "angle": "Identity Challenge", "text": "Can you master pure silence for 24 hours?", "viralityScore": 91, "spokenDuration": 2.3},
        ]
        visuals = [
            ("misty alpine mountain peak sunrise volumetric rays 4k", "Atmospheric Mountain Ridge & Mist"),
            ("cascading waterfall deep pine forest rocky rapids 4k", "Majestic Forest Waterfall Rapids"),
            ("dramatic ocean storm waves crashing rocky cliff 4k", "Dramatic Ocean Storm Waves"),
            ("ancient dense pine forest sun rays morning fog 4k", "Misty Evergreen Forest Canopy"),
            ("starry night sky milky way over mountain ridge timelapse 4k", "Celestial Night Sky Horizon"),
            ("dramatic golden hour sunset mountain summit glowing ridge 4k", "Cinematic Golden Hour Mountain Sunset"),
        ]
    elif any(k in theme_key for k in ["fitness", "body", "workout", "gym", "health", "iron", "muscle"]):
        title = f"The Law of Iron Discipline | {category}"
        hook = "Your body can stand almost anything."
        quote_p1 = "It's your mind you have to convince."
        quote_p2 = "The pain you feel today will be the strength you feel tomorrow."
        quote_p3 = "Consistency in the shadows creates greatness in the light."
        quote_p4 = "Every single rep builds the armor you wear into battle."
        cta = "Show up when you don't feel like it. Start now."
        hooks = [
            {"id": "hook_1", "angle": "Direct Challenge", "text": "Your body can stand almost anything.", "viralityScore": 97, "spokenDuration": 2.1},
            {"id": "hook_2", "angle": "Brutal Truth", "text": "Excuses will cost you your entire future.", "viralityScore": 95, "spokenDuration": 2.3},
            {"id": "hook_3", "angle": "Curiosity Gap", "text": "The one habit that separates winners from dreamers.", "viralityScore": 92, "spokenDuration": 2.6},
        ]
        visuals = [
            ("dramatic ocean waves crashing cliff sunset 4k", "Powerful Ocean Breakers"),
            ("rushing mountain river rapids deep gorge 4k", "Relentless Mountain Torrent"),
            ("volumetric storm clouds rolling over mountain peak 4k", "Storm Clouds Ridge"),
            ("ancient pine trees wind storm resilience 4k", "Enduring Forest Ridge"),
            ("sunrise cresting over snow peak horizon 4k", "Apex Dawn Summit"),
            ("golden hour dusk horizon glowing mountain summit 4k", "Golden Hour Horizon Peak"),
        ]
    else:
        title = f"The Unstoppable Mindset Blueprint | {category}"
        hook = "The version of you that wins never made excuses."
        quote_p1 = "Greatness is not an accident of talent or luck."
        quote_p2 = "It is the relentless daily repetition of difficult choices."
        quote_p3 = "Silence the doubt by taking massive, immediate action."
        quote_p4 = "Your future is shaped by the decisions you make right now."
        cta = "Stop doubting your potential. Step forward today."
        hooks = [
            {"id": "hook_1", "angle": "Negative Bias", "text": "The version of you that wins never made excuses.", "viralityScore": 96, "spokenDuration": 2.4},
            {"id": "hook_2", "angle": "Curiosity Gap", "text": "Why 99% of people quit right before the breakthrough.", "viralityScore": 93, "spokenDuration": 2.5},
            {"id": "hook_3", "angle": "Identity Challenge", "text": "Are you willing to sacrifice who you are for who you can become?", "viralityScore": 91, "spokenDuration": 2.7},
        ]
        visuals = [
            ("misty mountain peak sunrise clouds volumetric 4k", "Atmospheric Mountain Ridge"),
            ("cascading waterfall deep pine forest 4k", "Majestic Forest Waterfall"),
            ("dramatic storm waves rocky coast 4k", "Dramatic Ocean Storm Waves"),
            ("dense forest sunlight piercing mist 4k", "Sunlight Piercing Deep Forest"),
            ("aurora borealis northern lights over mountains 4k", "Celestial Aurora Borealis"),
            ("dramatic golden hour sunset mountain summit 4k", "Cinematic Golden Hour Sunset"),
        ]

    quote_parts = [quote_p1, quote_p2, quote_p3, quote_p4]
    full_quote = " ".join(quote_parts)

    scene_count = max(4, min(8, round(target_seconds / 4.8)))
    beats = ["hook"] + ["escalation"] * max(1, scene_count - 3) + ["quote"] + ["cta"]
    while len(beats) < scene_count:
        beats.insert(-1, "quote")
    beats = beats[:scene_count]

    dur_per_scene = round(target_seconds / scene_count, 2)
    scenes = []
    current_time = 0.0

    sub_texts = [hook]
    num_mid = scene_count - 2
    if num_mid == 1:
        sub_texts.append(full_quote)
    elif num_mid == 2:
        sub_texts.append(f"{quote_p1} {quote_p2}")
        sub_texts.append(f"{quote_p3} {quote_p4}")
    elif num_mid == 3:
        sub_texts.append(quote_p1)
        sub_texts.append(f"{quote_p2} {quote_p3}")
        sub_texts.append(quote_p4)
    else:
        for i in range(num_mid):
            sub_texts.append(quote_parts[i % len(quote_parts)])
    sub_texts.append(cta)

    for i in range(scene_count):
        is_last = (i == scene_count - 1)
        sc_dur = round(target_seconds - current_time, 2) if is_last else dur_per_scene
        sc_dur = max(2.5, sc_dur)
        beat = beats[i]
        vis_q, vis_name = visuals[i % len(visuals)]
        aspect_tag = f"vertical {target_aspect_ratio}" if target_aspect_ratio == "9:16" else f"cinematic {target_aspect_ratio}"
        
        scenes.append({
            "sceneNumber": i + 1,
            "beat": beat,
            "start": round(current_time, 2),
            "duration": sc_dur,
            "mediaType": "video",
            "mediaId": "",
            "mediaUrl": "",
            "mediaName": vis_name,
            "textStyleId": "sub-hormozi" if beat == "hook" else ("sub-mrbeast" if beat == "escalation" else ("quote-stoic-roman" if beat == "quote" else "cta-save-reel")),
            "textStyleName": "Hormozi Viral Yellow" if beat == "hook" else "MrBeast Pop Bold",
            "captionPresetClass": "font-black tracking-tight text-yellow-400 uppercase drop-shadow-[0_4px_12px_rgba(0,0,0,1)] bg-black/85 px-3 py-1 rounded-md border border-yellow-400/30" if beat == "hook" else "font-black tracking-tighter text-sky-400 uppercase drop-shadow-[0_4px_16px_rgba(0,0,0,1)]",
            "captionPresetColor": "#FACC15" if beat == "hook" else "#38BDF8",
            "captionPresetFontFamily": "Impact, sans-serif" if beat == "hook" else "Anton, sans-serif",
            "transition": "glitch" if i == 0 else ("match-cut" if i == 1 else ("zoom" if i == 2 else "fade")),
            "cameraMotion": "push-in" if beat == "hook" else ("pan-right" if beat == "escalation" else ("slow-zoom" if beat == "quote" else "static")),
            "sfx": "Fast Cinematic Whoosh" if i == 0 else (None if not is_last else "Cash Register Cha-Ching"),
            "sfxUrl": "https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3" if i == 0 else (None if not is_last else "https://assets.mixkit.co/active_storage/sfx/2432/2432-preview.mp3"),
            "googleSearchQuery": f"{vis_q} {aspect_tag}",
            "visualQuery": f"{vis_q} nature",
            "fallbackQueries": [
                f"mountain landscape sunrise {aspect_tag}",
                f"storm waves ocean rocks {aspect_tag}",
            ],
            "negativeTerms": ["indoor", "gym", "city", "people", "talking", "cartoon"],
            "subtitleText": sub_texts[i],
        })
        current_time += sc_dur

    return {
        "title": title,
        "hook": hook,
        "quote": full_quote,
        "cta": cta,
        "aspectRatio": target_aspect_ratio,
        "recommendedVoice": "Fenrir",
        "musicTrack": "track-phonk-titan",
        "captionStyle": "Hormozi Viral Yellow",
        "tags": ["#Shorts", "#StoicMindset", "#Discipline", "#Philosophy", "#ApexMind"],
        "hooks": hooks,
        "soundDesign": {
            "soundtrackTrackId": "track-phonk-titan",
            "soundtrackTitle": "Titan Momentum Phonk",
            "genre": "phonk",
            "bpm": 140,
            "ducking": DEFAULT_DUCKING_CONFIG.copy(),
            "sfxEvents": [
                {"time": 0.0, "sfxId": "sfx-impact-subdrop", "label": "Opening Hook Boom"},
                {"time": 2.5, "sfxId": "sfx-whoosh-fast", "label": "Scene Transition Swish"},
                {"time": max(0.0, target_seconds - 3.0), "sfxId": "sfx-notif-cash", "label": "Closing CTA Ding"},
            ],
        },
        "storyboard": scenes,
    }


def generate_gemini_script(
    category: str,
    topic: str,
    tone: str,
    length: str,
    memory_quotes: list[dict[str, Any]],
    model: str = DEFAULT_SCRIPT_MODEL,
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
    """Generates viral motivational quote scripts via Gemini with creative multi-scene media planning."""
    memory_snippets = "\n".join([
        f"- [Title: {q.get('title')}] Quote: {q.get('quote')}"
        for q in memory_quotes[-15:]
    ]) if memory_quotes else "No previous quotes recorded yet."

    # Ensure aspectRatio defaults to 9:16 if not specified
    target_aspect_ratio = aspect_ratio if aspect_ratio in ["9:16", "16:9", "1:1", "4:5", "21:9"] else (aspect_ratio or "9:16")

    catalog = available_assets or (creative_context.get("availableAssets") if creative_context else None) or {}
    
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

    avail_voices = catalog.get("voiceProfiles") or [
        {"id": "Kore", "name": "Kore", "gender": "Female", "style": "Clear, Inspiring, Authoritative"},
        {"id": "Fenrir", "name": "Fenrir", "gender": "Male", "style": "Deep, Powerful, Stoic Leader"},
        {"id": "Puck", "name": "Puck", "gender": "Male", "style": "Energetic, High-Octane Motivational"},
        {"id": "Zephyr", "name": "Zephyr", "gender": "Female", "style": "Smooth, Calming Wisdom and Meditation"},
        {"id": "Charon", "name": "Charon", "gender": "Male", "style": "Grit and Relentless Focus"},
    ]
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

    target_model = resolve_script_model(model)
    logger.info(f"--> [API SENT]   Gemini AI Generate Content | Model: '{target_model}' | Theme: '{category}' | Topic: '{topic}'")
    start_t = time.perf_counter()

    try:
        result = None
        used_model = target_model
        try:
            result, used_model = _generate_script_with_fallback(
                prompt=prompt,
                target_model=target_model,
                system_instruction=SCRIPT_SYSTEM_INSTRUCTION,
            )
        except Exception as api_fetch_err:
            logger.warning(f"[Studio/Script] Online Gemini script attempt failed: {api_fetch_err}")
            result = None
            used_model = str(api_fetch_err)

        if result is None:
            logger.warning(
                f"[Studio/Script] Online Gemini API unavailable or quota/billing restricted ({used_model}). "
                f"Activating ApexMind High-Impact Viral Blueprint Engine for theme '{category}'..."
            )
            result = _build_emergency_theme_script(
                category=category,
                topic=topic,
                target_aspect_ratio=target_aspect_ratio,
                target_seconds=target_seconds,
            )
            used_model = "apexmind-viral-engine"

        elapsed = time.perf_counter() - start_t

        # ── Multi-Scene Storyboard Validation (Zero Fake Fallbacks) ───────────
        subtitles = result.get("subtitles") or []
        storyboard = result.get("storyboard") or []

        # If storyboard is empty, rebuild with emergency theme generator
        if not storyboard:
            logger.warning("[Studio/Script] Storyboard missing from response. Re-generating via emergency theme blueprint...")
            result = _build_emergency_theme_script(
                category=category,
                topic=topic,
                target_aspect_ratio=target_aspect_ratio,
                target_seconds=target_seconds,
            )
            storyboard = result.get("storyboard") or []

        # ── Fast Decoupled Storyboard Formatting (Queries Only, Zero Media Latency) ──
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
            is_cta = sc.get("beat") == "cta" or any(t in str(sc.get("visualQuery", "")).lower() for t in CTA_EXCLUSION_TERMS)
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
        avail_tracks = catalog.get("musicTracks") or []
        matched_track = next(
            (m for m in avail_tracks if m.get("id") == st_id or m.get("title", "").lower() in str(st_id).lower()),
            {}
        ) if avail_tracks else {}

        sound_design["soundtrackTrackId"] = matched_track.get("id", str(st_id))
        sound_design["soundtrackTitle"] = matched_track.get("title", sound_design.get("soundtrackTitle", "Dynamic Soundtrack"))
        sound_design["genre"] = matched_track.get("genre", sound_design.get("genre", "phonk"))
        sound_design["bpm"] = matched_track.get("bpm", sound_design.get("bpm", 140))
        sound_design["audioUrl"] = matched_track.get("audioUrl", sound_design.get("audioUrl", ""))
        if not sound_design.get("ducking"):
            sound_design["ducking"] = DEFAULT_DUCKING_CONFIG.copy()

        # Resolve SFX event URLs dynamically from available sound effects
        sfx_events = sound_design.get("sfxEvents") or []
        avail_sfx_list = catalog.get("soundEffects") or []
        for evt in sfx_events:
            s_id = evt.get("sfxId")
            matched_sfx = next(
                (s for s in avail_sfx_list if s.get("id") == s_id or s.get("name", "").lower() in str(evt.get("label", "")).lower()),
                None
            ) if avail_sfx_list else None
            if matched_sfx:
                evt["sfxUrl"] = matched_sfx.get("audioUrl")
            elif not evt.get("sfxUrl"):
                evt["sfxUrl"] = avail_sfx_list[0].get("audioUrl") if avail_sfx_list else ""
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
        if not result.get("hashtags"):
            result["hashtags"] = result.get("tags") or ["#Shorts", "#Motivation", "#Discipline", "#Mindset", "#StoicMindset", "#ApexMind"]
        if not result.get("tags"):
            result["tags"] = result.get("hashtags")
        if not result.get("description"):
            h_line = result.get("hook", "")
            q_line = result.get("quote", "")
            c_line = result.get("cta", "")
            t_line = " ".join(result.get("hashtags", []))
            result["description"] = f"⚡ {h_line}\n\n📜 {q_line}\n\nKey Takeaways:\n• Discipline is an unyielding contract with yourself.\n• The obstacle in front of you becomes your path forward.\n• Silence and execution beat loud excuses.\n\n🎯 {c_line}\n\n{t_line}\n\nProduced with ApexMind AI Studio."
        if not result.get("titleIdeas"):
            orig_t = result.get("title") or "The Stoic Discipline Code"
            result["titleIdeas"] = [
                {"title": orig_t, "angle": "Curiosity Gap", "viralityScore": 98},
                {"title": f"Stop Waiting for Motivation ({category})", "angle": "Brutal Truth", "viralityScore": 95},
                {"title": "The Rule Marcus Aurelius Never Broke", "angle": "Stoic Insight", "viralityScore": 93},
                {"title": "Why 99% Fail Before 6:00 AM", "angle": "Direct Challenge", "viralityScore": 91},
            ]
        if not result.get("outputFormat"):
            result["outputFormat"] = f"{target_aspect_ratio} Vertical Video (1080x1920)" if target_aspect_ratio == "9:16" else f"{target_aspect_ratio} Video"

        logger.info(
            f"<-- [API COMING] Gemini AI Generate Content | Model: '{target_model}' | Duration: {elapsed:.2f}s | "
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

    tts_model = resolve_tts_model(model)
    logger.info(
        f"--> [API SENT]   Gemini AI Neural TTS | Model: '{tts_model}' | "
        f"Voice: '{voice_name}' | Text Length: {len(normalized_text)} chars"
    )
    start_t = time.perf_counter()

    try:
        client = get_gemini_client()
        tts_res = None
        last_tts_err = None

        if client:
            prompt = (
                "Narrate this motivational reel script with dynamic tone & emotion modulation across each story beat: "
                "- Opening Hook: fast, urgent delivery (1.05x tempo), captivating attention with high energy in the first 2-3 seconds. "
                "- Wisdom Quote: slower, heavier cadence (0.90x tempo), deep, grounded, stoic, and resonant, giving profound weight to the insight. "
                "- Closing Call to Action: firm, decisive pace (1.00x tempo), commanding, confident, and crisp. "
                "Modulate vocal pacing, intensity, and pauses naturally between these distinct emotional beats. "
                f"Script: {normalized_text}"
            )
            unique_tts_models = [tts_model]
            for m in TTS_FALLBACK_MODELS:
                if m not in unique_tts_models:
                    unique_tts_models.append(m)

            for attempt_tts in unique_tts_models:
                # 1. Try modern Interactions API (native for gemini-3.8-flash-tts / gemini-3.8-flash-lite-tts)
                if hasattr(client, "interactions") and "tts" in attempt_tts.lower():
                    try:
                        tts_res = client.interactions.create(
                            model=attempt_tts,
                            input=[{
                                "type": "user_input",
                                "content": [{
                                    "type": "text",
                                    "text": normalized_text,
                                    "annotations": [{
                                        "type": "speech_metadata",
                                        "style": "clear, authoritative, engaging motivational delivery",
                                    }],
                                }],
                            }],
                            response_format={"type": "audio"},
                            generation_config={
                                "speech_config": [
                                    {"voice": voice_name},
                                ]
                            },
                        )
                        if tts_res and getattr(tts_res, "output_audio", None):
                            break
                    except Exception as e:
                        last_tts_err = e
                        logger.warning(f"[Studio/TTS] Interactions API model '{attempt_tts}' failed ({e}), trying next option...")

                # 2. Try models.generate_content (for multimodal audio models like gemini-2.0-flash)
                try:
                    tts_res = client.models.generate_content(
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
            rate_tracker.record_request(attempt_tts)
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
                f"<-- [API COMING] Gemini AI Neural TTS | Model: '{attempt_tts}' | Duration: {elapsed:.2f}s | "
                f"Voice: '{voice_name}' | Audio Duration: {dur_str} | mime={mime_type}"
            )
            return {
                "success": True,
                "voiceName": voice_name,
                "mimeType": mime_type,
                "audioBase64": audio_b64,
                "audioUrl": f"data:{mime_type};base64,{audio_b64}",
                "duration": dur_secs,
                "durationFormatted": dur_str,
                "toneModulation": DEFAULT_TONE_MODULATION,
            }

        # Fallback 1: Edge-TTS Engine
        try:
            import edge_tts
            import asyncio
            voice_map = {
                "fenrir": "en-US-ChristopherNeural",
                "charon": "en-US-BrianNeural",
                "puck": "en-US-EricNeural",
                "kore": "en-US-AvaNeural",
                "zephyr": "en-US-EmmaNeural",
            }
            v_code = voice_map.get(voice_name.lower(), "en-US-ChristopherNeural")

            async def _run_edge():
                comm = edge_tts.Communicate(normalized_text, v_code)
                out = bytearray()
                async for chunk in comm.stream():
                    if chunk["type"] == "audio":
                        out.extend(chunk["data"])
                return bytes(out)

            edge_audio = asyncio.run(_run_edge())
            if edge_audio and len(edge_audio) > 500:
                import tempfile
                import subprocess
                import os
                
                wav_payload = None
                dur_secs = 0.0
                try:
                    with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as f_in, tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f_out:
                        in_path, out_path = f_in.name, f_out.name
                        f_in.write(edge_audio)
                    subprocess.run(["ffmpeg", "-y", "-i", in_path, "-ar", "24000", "-ac", "1", out_path], capture_output=True)
                    with open(out_path, "rb") as wf_f:
                        wav_payload = wf_f.read()
                    with wave.open(out_path, "rb") as wf:
                        dur_secs = round(wf.getnframes() / float(wf.getframerate()), 2)
                    try:
                        os.remove(in_path)
                        os.remove(out_path)
                    except Exception:
                        pass
                except Exception as conv_err:
                    logger.debug(f"[Studio/TTS] WAV conversion error: {conv_err}")

                final_audio = wav_payload if wav_payload and len(wav_payload) > 1000 else edge_audio
                final_mime = "audio/wav" if wav_payload and len(wav_payload) > 1000 else "audio/mp3"
                if dur_secs <= 0.0:
                    dur_secs = max(4.0, round(len(normalized_text.split()) / 2.3, 1))

                audio_b64 = base64.b64encode(final_audio).decode("utf-8")
                dur_str = f"{dur_secs:.1f}s"
                logger.info(f"<-- [API COMING] Edge-TTS Voiceover fallback ready | Voice: '{voice_name}' | Duration: {dur_str} | mime={final_mime}")
                return {
                    "success": True,
                    "voiceName": voice_name,
                    "mimeType": final_mime,
                    "audioBase64": audio_b64,
                    "audioUrl": f"data:{final_mime};base64,{audio_b64}",
                    "duration": dur_secs,
                    "durationFormatted": dur_str,
                    "toneModulation": DEFAULT_TONE_MODULATION,
                }
        except Exception as edge_err:
            logger.warning(f"[Studio/TTS] Edge-TTS voiceover fallback unavailable: {edge_err}")

        # Fallback 2: Resonant Harmonic Tone WAV Generator
        try:
            import math
            sample_rate = 24000
            estimated_secs = max(5.0, round(len(normalized_text.split()) / 2.3, 1))
            total_samples = int(sample_rate * estimated_secs)
            audio_frames = bytearray()
            for s_idx in range(total_samples):
                t = s_idx / sample_rate
                val = 0.22 * math.sin(2 * math.pi * 110 * t) + 0.12 * math.sin(2 * math.pi * 165 * t)
                fade = min(1.0, t / 0.4) * min(1.0, (estimated_secs - t) / 0.4)
                sample_int = int(val * fade * 32767)
                audio_frames.extend(struct.pack('<h', max(-32768, min(32767, sample_int))))

            wav_bytes = convert_l16_pcm_to_wav(bytes(audio_frames), sample_rate=sample_rate)
            audio_b64 = base64.b64encode(wav_bytes).decode("utf-8")
            logger.info(f"<-- [API COMING] Resonant Audio Bed fallback ready | Duration: {estimated_secs:.1f}s")
            return {
                "success": True,
                "voiceName": voice_name,
                "mimeType": "audio/wav",
                "audioBase64": audio_b64,
                "audioUrl": f"data:audio/wav;base64,{audio_b64}",
                "duration": estimated_secs,
                "durationFormatted": f"{estimated_secs:.1f}s",
                "toneModulation": DEFAULT_TONE_MODULATION,
            }
        except Exception as synth_err:
            logger.error(f"[Studio/TTS] Audio Bed generation error: {synth_err}")
            raise RuntimeError(f"Voiceover synthesis failed: {last_tts_err or synth_err}")

    except Exception as e:  # noqa: BLE001
        elapsed = time.perf_counter() - start_t
        logger.error(f"Voiceover generation error after {elapsed:.2f}s for voice '{voice_name}': {e}")
        raise RuntimeError(f"Voiceover synthesis failed: {e}")




def generate_gemini_metadata(
    category: str,
    topic: str,
    title: str = "",
    hook: str = "",
    quote: str = "",
    cta: str = "",
    model: str | None = None,
) -> dict[str, Any]:
    """Generates viral titles, rich YouTube description, and categorized hashtags via Gemini AI with resilient heuristic fallback."""
    import re
    target_model = resolve_script_model(model)
    clean_cat = (category or "Stoic Mindset & Discipline").strip()
    clean_topic = (topic or "Daily discipline, focus, and mental toughness").strip()
    clean_hook = (hook or "").strip()
    clean_quote = (quote or "").strip()
    clean_cta = (cta or "Subscribe for daily discipline.").strip()

    def _build_fallback_metadata() -> dict[str, Any]:
        core_kw = re.sub(r'[^a-zA-Z0-9s]', ' ', clean_topic).split()
        top_kws = [w.capitalize() for w in core_kw if len(w) > 3][:3]
        topic_title = " ".join(top_kws) or "Unshakable Focus"

        cat_tag = re.sub(r'[^a-zA-Z0-9]', '', clean_cat.title())
        topic_tag = re.sub(r'[^a-zA-Z0-9]', '', top_kws[0]) if top_kws else "Mindset"

        fallback_titles = [
            {"title": f"The Stoic Code: {topic_title}", "angle": "Stoic Principle", "viralityScore": 98},
            {"title": f"Stop Waiting for Motivation ({topic_title})", "angle": "Brutal Truth", "viralityScore": 95},
            {"title": f"The Rule Marcus Aurelius Never Broke", "angle": "Curiosity Gap", "viralityScore": 94},
            {"title": f"Can You Master Pure Focus for 24 Hours?", "angle": "Direct Challenge", "viralityScore": 91},
            {"title": f"Why 99% Fail at {topic_title}", "angle": "Action Question", "viralityScore": 89},
        ]

        trending_tags = ["#Shorts", "#YouTubeShorts", "#ViralShorts", "#ShortsFeed"]
        niche_tags = [
            f"#{cat_tag}" if cat_tag else "#StoicMindset",
            f"#{topic_tag}" if topic_tag else "#Discipline",
            "#MarcusAurelius",
            "#MentalToughness",
            "#InnerStrength",
            "#DailyGrit",
        ]
        growth_tags = ["#Motivation", "#SelfImprovement", "#Discipline", "#Mindset", "#Success"]
        all_unique = list(dict.fromkeys(trending_tags + niche_tags + growth_tags))

        fallback_desc = (
            f"⚡ {clean_hook or 'Transform your mindset and conquer the quiet battles within.'}\n\n"
            f"📜 {clean_quote or 'Discipline is the unyielding contract you honor with yourself in total silence.'}\n\n"
            f"Key Takeaways:\n"
            f"• Action creates momentum, not waiting for motivation.\n"
            f"• The obstacle in front of you becomes your path forward.\n"
            f"• Silence and compounding execution beat loud excuses.\n\n"
            f"🎯 {clean_cta}\n\n"
            f"{' '.join(all_unique[:8])}\n\n"
            f"Produced with ApexMind AI Studio."
        )

        return {
            "titles": fallback_titles,
            "description": fallback_desc,
            "hashtags": {
                "trending": trending_tags,
                "niche": niche_tags,
                "growth": growth_tags,
            },
            "allHashtags": all_unique,
        }

    prompt = f"""You are an elite YouTube Shorts & TikTok Virality Strategist.
Generate high-CTR title variations, an engaging description, and categorized hashtags for this motivational Short:

CATEGORY/THEME: {clean_cat}
TOPIC: {clean_topic}
CURRENT TITLE: {title or 'Untitled'}
OPENING HOOK: {clean_hook or 'Stop waiting for motivation to strike.'}
CORE MONOLOGUE: {clean_quote or 'Discipline is the bridge between goals and accomplishment.'}
CALL TO ACTION: {clean_cta}

CRITICAL MANDATE:
1. TITLES: Generate exactly 5 high-CTR titles (under 60 characters) with different psychological angles:
   - Curiosity Gap
   - Brutal Truth
   - Direct Challenge
   - Stoic Principle
   - Action Question
2. DESCRIPTION: Write a formatted YouTube Shorts description with hook summary, quote insight, key takeaways bullet points, CTA, and hashtags.
3. HASHTAGS: Provide 3 categorized lists:
   - trending (4-5 general Shorts tags)
   - niche (5-6 tags specific to {clean_cat} and {clean_topic})
   - growth (4-5 motivation/mindset tags)

Output strictly a single raw JSON object matching:
{{
  "titles": [
    {{ "title": "Title string under 60 chars", "angle": "Angle Name", "viralityScore": 96 }}
  ],
  "description": "Formatted description string",
  "hashtags": {{
    "trending": ["#Shorts", "#ViralShorts"],
    "niche": ["#Stoicism", "#Discipline"],
    "growth": ["#Motivation", "#Mindset"]
  }}
}}
"""

    try:
        raw_res, used_model = _generate_script_with_fallback(
            prompt=prompt,
            target_model=target_model,
            system_instruction="You are a specialized viral YouTube metadata optimizer. Respond strictly in valid JSON.",
        )
        if raw_res and isinstance(raw_res, dict) and raw_res.get("titles"):
            titles = raw_res.get("titles", [])
            desc = raw_res.get("description", "")
            tags_obj = raw_res.get("hashtags", {})
            trending = tags_obj.get("trending", [])
            niche = tags_obj.get("niche", [])
            growth = tags_obj.get("growth", [])
            all_tags = list(dict.fromkeys(trending + niche + growth))
            return {
                "titles": titles,
                "description": desc,
                "hashtags": {
                    "trending": trending,
                    "niche": niche,
                    "growth": growth,
                },
                "allHashtags": all_tags,
            }
    except Exception as e:
        logger.warning(f"[Studio/Metadata] Online metadata generation fallback: {e}")

    return _build_fallback_metadata()
