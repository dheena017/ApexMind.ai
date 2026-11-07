"""
backend/features/workspace/voice_generation/engine/voice_engine.py
Unified voice synthesis engine coordinating text preparation, provider routing, and audio cleaning.
"""

import logging
from typing import Any, Dict, Optional, Tuple

from ..providers import voice_registry, SynthesisResult
from ..services.text_preprocessor import preprocess_speech_text
from ..services.audio_processor import process_and_normalize_audio

logger = logging.getLogger("ApexMind.Voice.Engine")


class VoiceEngine:
    async def synthesize_scene(
        self,
        raw_text: str,
        voice_id: str = "en-US-ChristopherNeural",
        provider_id: Optional[str] = None,
        speed: float = 1.0,
        pitch: float = 0.0,
        target_lufs: float = -16.0,
        true_peak_dbtp: float = -1.0,
        settings: Optional[Dict[str, Any]] = None,
    ) -> Tuple[SynthesisResult, str]:
        """
        Synthesizes and normalizes an individual narration segment.

        Returns:
            (SynthesisResult, normalized_text)
        """
        # 1. Text Preprocessing
        normalized_text = preprocess_speech_text(raw_text)
        if not normalized_text:
            raise ValueError("Narration text is empty after preprocessing.")

        # 2. Resolve Provider with resilient fallbacks
        provider = voice_registry.get_provider(provider_id)
        if not provider or not provider.is_available():
            # Fallback to any available provider in the registry
            for p in voice_registry.list_providers():
                if p.is_available():
                    provider = p
                    logger.warning(f"[VoiceEngine] Provider '{provider_id}' unavailable, falling back to '{p.provider_id}'")
                    break

        if not provider or not provider.is_available():
            raise RuntimeError("No voice synthesis providers are available on the system.")

        logger.info(
            f"[VoiceEngine] Synthesizing via '{provider.provider_id}' | "
            f"voice='{voice_id}' speed={speed}x"
        )

        try:
            raw_result = await provider.synthesize(
                text=normalized_text,
                voice_id=voice_id,
                speed=speed,
                pitch=pitch,
                settings=settings,
            )
        except Exception as e:
            logger.warning(f"[VoiceEngine] Synthesis on '{provider.provider_id}' failed ({e}), attempting offline fallback...")
            # Fallback to pyttsx3 if edge_tts or piper failed
            offline_p = voice_registry.get_provider("pyttsx3")
            if offline_p and offline_p.is_available() and offline_p != provider:
                raw_result = await offline_p.synthesize(
                    text=normalized_text,
                    voice_id="default",
                    speed=speed,
                    pitch=pitch,
                )
            else:
                raise e

        # 3. Audio Validation & Loudness Normalization
        norm_bytes, validation = process_and_normalize_audio(
            raw_result.audioBytes,
            target_lufs=target_lufs,
            true_peak_dbtp=true_peak_dbtp,
        )

        final_result = SynthesisResult(
            audioBytes=norm_bytes,
            format="wav",
            sampleRate=validation.sampleRate,
            channels=validation.channels,
            durationSeconds=validation.duration,
            wordTimestamps=raw_result.wordTimestamps,
        )

        return final_result, normalized_text


# Global engine instance
voice_engine = VoiceEngine()

