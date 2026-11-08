import base64
import io
import json
import logging
import re
import struct
import time
import wave
import threading
from typing import Any

from google import genai
from google.genai import types

from .ai_models import (
    DEFAULT_SCRIPT_MODEL,
    get_cached_models,
    get_script_fallback_models,
    get_tts_fallback_models,
    is_unwanted_model,
    resolve_script_model as resolve_available_script_model,
    resolve_tts_model as resolve_available_tts_model,
)
from .config import settings

# ==============================================================================
# Generation Defaults & Fixed Values
# ==============================================================================

# Fixed System Instructions & Production Directives
SCRIPT_SYSTEM_INSTRUCTION: str = (
    "You are an elite Autonomous AI Video Director, Virality Strategist, and Master Sound Designer "
    "for viral YouTube Shorts, Instagram Reels, and Facebook Reels. Produce high-retention motivational "
    "and inspirational short video plans with 3 viral hook variations, diverse cinematic footage queries "
    "tailored to the theme (nature, urban, technology, fitness, space, luxury, architecture, lifestyle, abstract), "
    "and 5-layer broadcast sound design with dynamic sidechain ducking. "
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
            limit_rpm = None
            limit_rpd = None
            limit_tpm = None

            seconds_to_reset = 0
            if self._requests:
                oldest_in_window = min(self._requests)
                seconds_to_reset = max(0, int(60 - (now - oldest_in_window)))

            percent_used = None
            status_level = "unknown"
            script_models, tts_models = get_cached_models()

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
                "effectiveRps": None,
                "totalRequests": self._total_requests_all_time,
                "tier": "Quota limits are managed by Google AI Studio",
                "models": [
                    {
                        "name": model["name"],
                        "id": model["id"],
                        "category": category,
                        "status": "Available",
                    }
                    for category, models in (("Script generation", script_models), ("Voice generation", tts_models))
                    for model in models
                ],
            }


rate_tracker = GeminiRateTracker()


def resolve_script_model(model_name: str | None = None) -> str:
    """Select and validate a script model against the dynamically discovered list."""
    return resolve_available_script_model(model_name)


def resolve_tts_model(model_name: str | None = None) -> str:
    """Resolve a supported Gemini TTS model without requiring a hardcoded fallback."""
    return resolve_available_tts_model(model_name)


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

    # 1. Interactions API format for supported TTS models.
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
    models_to_try: list[str] = []
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
    last_err: Exception | None = None
    used_model: str = models_to_try[0] if models_to_try else target_model

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
    """Generates viral motivational quote scripts via the modular backend.shared.script package."""
    from backend.shared.script import generate_full_script

    return generate_full_script(
        category=category,
        topic=topic,
        tone=tone,
        length=length,
        memory_quotes=memory_quotes,
        model=model,
        audio_mood=audio_mood,
        background_style=background_style,
        text_style=text_style,
        video_style=video_style,
        voice_name=voice_name,
        aspect_ratio=aspect_ratio,
        music_track=music_track,
        caption_style=caption_style,
        visual_theme=visual_theme,
        motion_style=motion_style,
        output_format=output_format,
        creative_context=creative_context,
        available_assets=available_assets,
        user_prompt=user_prompt,
    )


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
            for m in get_tts_fallback_models(tts_model):
                if m not in unique_tts_models:
                    unique_tts_models.append(m)

            for attempt_tts in unique_tts_models:
                # 1. Try the Interactions API first for supported TTS models.
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

                # 2. Try models.generate_content as a fallback for TTS models without Interactions API support.
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
                "aoede": "en-US-JennyNeural",
                "leda": "en-US-AriaNeural",
                "orus": "en-US-GuyNeural",
                "enceladus": "en-US-DavisNeural",
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

        raise RuntimeError(
            "Speech synthesis failed: Gemini TTS and the Edge-TTS fallback are unavailable. "
            f"Gemini error: {last_tts_err or 'no usable speech model response'}"
        )

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
    """Generate YouTube metadata with Gemini; fail explicitly if AI generation fails."""
    target_model = resolve_script_model(model)
    clean_cat = (category or "").strip()
    clean_topic = (topic or "").strip()
    clean_hook = (hook or "").strip()
    clean_quote = (quote or "").strip()
    clean_cta = (cta or "").strip()
    clean_title = (title or "").strip()

    if not any((clean_topic, clean_title, clean_hook, clean_quote)):
        raise ValueError("Provide a video title or script before generating metadata.")

    prompt = f"""You are an elite short-form video virality strategist for YouTube Shorts, Instagram Reels, and Facebook Reels.
Generate title variations, an engaging description, and categorized hashtags using only the supplied video details. Do not invent people, quotes, events, or factual claims.

CATEGORY/THEME: {clean_cat or 'Not provided'}
TOPIC: {clean_topic or 'Not provided'}
CURRENT TITLE: {clean_title or 'Not provided'}
OPENING HOOK: {clean_hook or 'Not provided'}
CORE MONOLOGUE: {clean_quote or 'Not provided'}
CALL TO ACTION: {clean_cta or 'Not provided'}

CRITICAL MANDATE:
1. TITLES: Generate exactly 5 high-CTR titles (under 60 characters) with different psychological angles:
   - Curiosity Gap
   - Brutal Truth
   - Direct Challenge
   - Stoic Principle
   - Action Question
2. DESCRIPTION: Write a description grounded in the supplied details. Do not add a CTA or key takeaway that was not provided or supported by them. Include the AI disclosure statement ("🤖 AI Disclosure: This video and audio were created with AI (ApexMind AI Studio).").
3. HASHTAGS: Suggest relevant, categorized hashtags based on the provided video. Do not use generic or unrelated tags to fill a category.

Output strictly a single raw JSON object matching:
{{
  "titles": [
    {{ "title": "Title string under 60 chars", "angle": "Angle Name", "viralityScore": 96 }}
  ],
  "description": "Formatted description string including AI disclosure statement",
  "hashtags": {{
    "trending": ["#Shorts", "#ViralShorts", "#AI", "#AIGenerated"],
    "niche": ["#Stoicism", "#Discipline", "#ApexMindAI"],
    "growth": ["#Motivation", "#Mindset", "#AIVideo"],
    "ai": ["#AI", "#AIGenerated", "#AICreation", "#ApexMindAI"]
  }}
}}
"""

    try:
        raw_res, used_model = _generate_script_with_fallback(
            prompt=prompt,
            target_model=target_model,
            system_instruction="You are a specialized viral YouTube metadata optimizer. Respond strictly in valid JSON.",
        )
        if not isinstance(raw_res, dict):
            raise RuntimeError(f"Gemini did not return metadata: {used_model}")

        raw_titles = raw_res.get("titles")
        if not isinstance(raw_titles, list):
            raise ValueError("Gemini returned metadata without a title list.")
        titles = []
        for item in raw_titles:
            if not isinstance(item, dict) or not isinstance(item.get("title"), str):
                continue
            score = item.get("viralityScore", 0)
            try:
                score = max(0, min(100, int(score)))
            except (TypeError, ValueError):
                score = 0
            titles.append({
                "title": item["title"].strip(),
                "angle": item.get("angle", "") if isinstance(item.get("angle"), str) else "",
                "viralityScore": score,
            })
        titles = [item for item in titles if item["title"]]
        if not titles:
            raise ValueError("Gemini returned no usable title ideas.")

        description = raw_res.get("description")
        if not isinstance(description, str) or not description.strip():
            raise ValueError("Gemini returned no usable description.")
        if "created with ai" not in description.lower() and "ai disclosure" not in description.lower():
            description = f"{description.strip()}\n\n🤖 AI Disclosure: This video and audio were created with AI (ApexMind AI Studio)."

        raw_tags = raw_res.get("hashtags")
        if not isinstance(raw_tags, dict):
            raise ValueError("Gemini returned no categorized hashtags.")

        def clean_tags(key: str) -> list[str]:
            values = raw_tags.get(key, [])
            if not isinstance(values, list):
                return []
            return list(dict.fromkeys(
                value.strip() for value in values
                if isinstance(value, str) and value.strip()
            ))

        hashtags = {
            "trending": clean_tags("trending"),
            "niche": clean_tags("niche"),
            "growth": clean_tags("growth"),
            "ai": clean_tags("ai"),
        }
        all_tags = list(dict.fromkeys(
            tag for group in hashtags.values() for tag in group
        ))

        return {
            "titles": titles,
            "description": description,
            "hashtags": hashtags,
            "allHashtags": all_tags,
        }
    except Exception:
        logger.exception("[Studio/Metadata] Gemini metadata generation failed.")
        raise
