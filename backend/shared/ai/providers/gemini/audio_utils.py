"""
backend/shared/ai/providers/gemini/audio_utils.py
Audio encoding, duration calculation, and PCM-to-WAV conversion utilities for Gemini TTS.
"""

import base64
import io
import struct
import wave
from typing import Any


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

