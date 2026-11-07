"""
backend/features/workspace/voice_generation/providers/piper_provider.py
Primary offline neural TTS provider using Piper ONNX neural voices.
"""

import asyncio
import io
import logging
import os
import shutil
import subprocess
import tempfile
from pathlib import Path
from typing import Any, Dict, List, Optional
import soundfile as sf

from .base import BaseVoiceProvider, ProviderCapabilities, SynthesisResult, VoiceDescriptor

logger = logging.getLogger("ApexMind.Voice.Piper")


class PiperVoiceProvider(BaseVoiceProvider):
    _CAPABILITIES = ProviderCapabilities(
        supportsPitch=False,
        supportsSpeed=True,
        supportsEmotion=False,
        supportsWordTimestamps=False,
        isOffline=True,
        licenseCategory="mit_and_open_models",
    )

    def __init__(self, models_dir: Optional[str] = None):
        self.models_dir = Path(models_dir or os.environ.get("PIPER_MODELS_DIR", "models/piper"))
        self.models_dir.mkdir(parents=True, exist_ok=True)

    @property
    def provider_id(self) -> str:
        return "piper"

    @property
    def name(self) -> str:
        return "Piper Neural TTS (Offline ONNX)"

    @property
    def capabilities(self) -> ProviderCapabilities:
        return self._CAPABILITIES

    def is_available(self) -> bool:
        # Check if piper_tts python package is importable or piper executable is on PATH
        try:
            import piper
            return True
        except ImportError:
            return shutil.which("piper") is not None

    def list_voices(self) -> List[VoiceDescriptor]:
        # Enumerate onnx models in models_dir or return known catalog
        voices = []
        if self.models_dir.exists():
            for onnx_file in self.models_dir.glob("*.onnx"):
                voice_name = onnx_file.stem
                gender = "female" if any(k in voice_name.lower() for k in ["lessac", "amy", "jenny"]) else "male"
                voices.append(
                    VoiceDescriptor(
                        voiceId=voice_name,
                        name=f"Piper {voice_name.replace('_', ' ').title()}",
                        gender=gender,
                        language="en-US",
                        provider=self.provider_id,
                        sampleRate=22050,
                        capabilities=self._CAPABILITIES,
                    )
                )
        if not voices:
            # Provide standard default catalog entry
            voices.append(
                VoiceDescriptor(
                    voiceId="en_US-lessac-medium",
                    name="Piper Lessac (English US Medium)",
                    gender="female",
                    language="en-US",
                    provider=self.provider_id,
                    sampleRate=22050,
                    capabilities=self._CAPABILITIES,
                )
            )
        return voices

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

        model_path = self.models_dir / f"{voice_id}.onnx"
        if not model_path.exists():
            # Check if any onnx exists in directory
            any_onnx = list(self.models_dir.glob("*.onnx"))
            if any_onnx:
                model_path = any_onnx[0]
            else:
                raise FileNotFoundError(
                    f"Piper voice model '{voice_id}.onnx' not found in '{self.models_dir}'. "
                    f"Please place the ONNX model and JSON config in {self.models_dir}."
                )

        def _synthesize_piper():
            from piper import PiperVoice
            import numpy as np

            voice = PiperVoice.load(str(model_path))
            chunks = []
            for chunk in voice.synthesize(clean_text):
                chunks.append(chunk.audio_float_array)

            if not chunks:
                raise RuntimeError(f"Piper produced 0 audio chunks for voice '{voice_id}'.")

            full_audio = np.concatenate(chunks)
            in_bio = io.BytesIO()
            sf.write(in_bio, full_audio, voice.config.sample_rate, format="WAV", subtype="PCM_16")
            raw_wav = in_bio.getvalue()

            # Resample and normalize to standard 24000 Hz 16-bit mono PCM WAV
            convert_proc = subprocess.run(
                [
                    "ffmpeg", "-y",
                    "-i", "pipe:0",
                    "-ar", "24000",
                    "-ac", "1",
                    "-f", "wav",
                    "pipe:1",
                ],
                input=raw_wav,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                check=True,
            )
            return convert_proc.stdout

        wav_bytes = await asyncio.to_thread(_synthesize_piper)

        with io.BytesIO(wav_bytes) as bio:
            audio_data, sr = sf.read(bio)
            duration = float(len(audio_data)) / float(sr)

        logger.info(f"[Piper] Synthesized offline | voice={voice_id} chars={len(clean_text)} dur={duration:.2f}s")

        return SynthesisResult(
            audioBytes=wav_bytes,
            format="wav",
            sampleRate=24000,
            channels=1,
            durationSeconds=round(duration, 3),
            wordTimestamps=[],
        )

