"""
backend/shared/ai/providers/gemini/voice_generator.py
Voice synthesis engine via Gemini Neural TTS and Edge-TTS fallbacks.
"""

import base64
import logging
import os
import subprocess
import tempfile
import time
import wave
from typing import Any

from google.genai import types

from backend.shared.ai.client import get_gemini_client
from backend.shared.ai.model_registry import resolve_tts_model, get_tts_fallback_models
from backend.shared.ai.rate_tracker import rate_tracker
from .audio_utils import (
    normalize_voiceover_text,
    extract_voiceover_audio,
    calculate_audio_duration,
)

logger = logging.getLogger("ApexMind.AI.Voice")

DEFAULT_TONE_MODULATION: dict[str, Any] = {
    "active": True,
    "hook": {"speechRate": 1.05, "tone": "urgent", "emotion": "Fast, urgent delivery"},
    "quote": {"speechRate": 0.90, "tone": "reverent", "emotion": "Slower, heavier cadence"},
    "cta": {"speechRate": 1.00, "tone": "decisive", "emotion": "Firm, decisive pace"},
}


def generate_gemini_voiceover(
    text: str,
    voice_name: str | None = None,
    model: str | None = None,
    storyboard: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    """Generate voiceover audio using Gemini Neural TTS with resilient Edge-TTS fallback."""
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

    except Exception as e:
        elapsed = time.perf_counter() - start_t
        logger.error(f"Voiceover generation error after {elapsed:.2f}s for voice '{voice_name}': {e}")
        raise RuntimeError(f"Voiceover synthesis failed: {e}")

