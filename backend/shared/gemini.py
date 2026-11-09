"""
backend/shared/gemini.py
Shared Google GenAI client and Neural Text-to-Speech (TTS) voiceover engine.
"""

import base64
import io
import logging
import os
import struct
import time
import wave
import threading
from typing import Any

from google import genai
from google.genai import types

from .ai_models import (
    get_tts_fallback_models,
    resolve_tts_model as resolve_available_tts_model,
)
from .config import settings

logger = logging.getLogger("ApexMind.Gemini")

DEFAULT_TONE_MODULATION: dict[str, Any] = {
    "active": True,
    "hook": {"speechRate": 1.05, "tone": "urgent", "emotion": "Fast, urgent delivery"},
    "quote": {"speechRate": 0.90, "tone": "reverent", "emotion": "Slower, heavier cadence"},
    "cta": {"speechRate": 1.00, "tone": "decisive", "emotion": "Firm, decisive pace"},
}


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

    def record_request(self, model_name: str = "gemini", tokens: int = 0):
        now = time.time()
        with self._lock:
            self._requests.append(now)
            self._daily_requests.append(now)
            if tokens > 0:
                self._tokens_minute.append((now, tokens))
            self._total_requests_all_time += 1
            self._last_request_time = now

    def get_stats(self) -> dict[str, Any]:
        now = time.time()
        one_min_ago = now - 60.0
        one_day_ago = now - 86400.0

        with self._lock:
            self._requests = [t for t in self._requests if t > one_min_ago]
            self._daily_requests = [t for t in self._daily_requests if t > one_day_ago]
            self._tokens_minute = [item for item in self._tokens_minute if item[0] > one_min_ago]

            rpm = len(self._requests)
            rpd = len(self._daily_requests)
            tpm = sum(tokens for _, tokens in self._tokens_minute)
            last_sec_ago = round(now - self._last_request_time, 1) if self._last_request_time else None

        from .ai_models import get_cached_models
        script_models, tts_models = get_cached_models()

        return {
            "requestsPerMinute": rpm,
            "requestsPerDay": rpd,
            "tokensPerMinute": tpm,
            "totalRequests": self._total_requests_all_time,
            "secondsSinceLastRequest": last_sec_ago,
            "isConfigured": bool(settings.GEMINI_API_KEY),
            "availableModelsCount": len(script_models) + len(tts_models),
            "scriptModelsCount": len(script_models),
            "ttsModelsCount": len(tts_models),
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

    output_audio = getattr(response, "output_audio", None)
    if output_audio is not None:
        raw_audio = getattr(output_audio, "data", None)
        mime_type = getattr(output_audio, "mime_type", "audio/wav") or "audio/wav"
        if raw_audio is not None:
            if isinstance(raw_audio, str):
                raw_audio = base64.b64decode(raw_audio)
            return raw_audio, mime_type

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
    data_len = max(0, len(audio_bytes) - 44 if audio_bytes.startswith(b"RIFF") else len(audio_bytes))
    return round(data_len / 48000.0, 2)


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
