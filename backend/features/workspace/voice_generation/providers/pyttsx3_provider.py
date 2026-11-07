"""
backend/features/workspace/voice_generation/providers/pyttsx3_provider.py
Guaranteed 100% offline local speech provider using operating system SAPI5 / AVFoundation.
"""

import asyncio
import io
import logging
import os
import subprocess
import tempfile
from typing import Any, Dict, List, Optional
import soundfile as sf

from .base import BaseVoiceProvider, ProviderCapabilities, SynthesisResult, VoiceDescriptor

logger = logging.getLogger("ApexMind.Voice.Pyttsx3")


class Pyttsx3VoiceProvider(BaseVoiceProvider):
    _CAPABILITIES = ProviderCapabilities(
        supportsPitch=False,
        supportsSpeed=True,
        supportsEmotion=False,
        supportsWordTimestamps=False,
        isOffline=True,
        licenseCategory="os_builtin",
    )

    @property
    def provider_id(self) -> str:
        return "pyttsx3"

    @property
    def name(self) -> str:
        return "System OS Speech (100% Offline)"

    @property
    def capabilities(self) -> ProviderCapabilities:
        return self._CAPABILITIES

    def is_available(self) -> bool:
        try:
            import pyttsx3
            return True
        except ImportError:
            return False

    def list_voices(self) -> List[VoiceDescriptor]:
        try:
            import pyttsx3
            engine = pyttsx3.init()
            installed = engine.getProperty("voices") or []
            results = []
            for v in installed:
                v_id = str(v.id)
                v_name = str(v.name or v_id)
                gender = "female" if "zira" in v_name.lower() or "eva" in v_name.lower() else "male"
                results.append(
                    VoiceDescriptor(
                        voiceId=v_id,
                        name=f"{v_name} (System)",
                        gender=gender,
                        language="en-US",
                        provider=self.provider_id,
                        sampleRate=22050,
                        capabilities=self._CAPABILITIES,
                    )
                )
            return results or [
                VoiceDescriptor(
                    voiceId="default",
                    name="Default System Voice",
                    gender="male",
                    language="en-US",
                    provider=self.provider_id,
                    sampleRate=22050,
                    capabilities=self._CAPABILITIES,
                )
            ]
        except Exception as e:
            logger.warning(f"[Pyttsx3] Could not enumerate OS voices: {e}")
            return []

    async def synthesize(
        self,
        text: str,
        voice_id: str,
        speed: float = 1.0,
        pitch: float = 0.0,
        settings: Optional[Dict[str, Any]] = None,
    ) -> SynthesisResult:
        clean_text = text.strip()
        if not clean_text:
            raise ValueError("Cannot synthesize empty text.")

        def _synthesize_sync():
            import pyttsx3
            engine = pyttsx3.init()

            # Set speed (default rate ~200 wpm)
            base_rate = engine.getProperty("rate") or 200
            engine.setProperty("rate", int(base_rate * speed))

            # Set voice if recognized
            if voice_id and voice_id != "default":
                try:
                    engine.setProperty("voice", voice_id)
                except Exception:
                    pass

            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tf:
                raw_path = tf.name

            try:
                engine.save_to_file(clean_text, raw_path)
                engine.runAndWait()

                # Resample and convert to 24000 Hz 16-bit mono PCM WAV via ffmpeg
                proc = subprocess.run(
                    [
                        "ffmpeg", "-y",
                        "-i", raw_path,
                        "-ar", "24000",
                        "-ac", "1",
                        "-f", "wav",
                        "pipe:1",
                    ],
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    check=True,
                )
                wav_bytes = proc.stdout
                return wav_bytes
            finally:
                if os.path.exists(raw_path):
                    try:
                        os.remove(raw_path)
                    except Exception:
                        pass

        wav_bytes = await asyncio.to_thread(_synthesize_sync)

        with io.BytesIO(wav_bytes) as bio:
            audio_data, sr = sf.read(bio)
            duration = float(len(audio_data)) / float(sr)

        logger.info(f"[Pyttsx3] Synthesized offline | chars={len(clean_text)} dur={duration:.2f}s")

        return SynthesisResult(
            audioBytes=wav_bytes,
            format="wav",
            sampleRate=24000,
            channels=1,
            durationSeconds=round(duration, 3),
            wordTimestamps=[],
        )

