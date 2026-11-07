"""
backend/features/workspace/voice_generation/providers/edge_tts_provider.py
Zero-cost online high-fidelity neural speech provider using Microsoft Edge TTS.
"""

import asyncio
import io
import logging
import subprocess
import tempfile
import time
from typing import Any, Dict, List, Optional
import soundfile as sf

from .base import BaseVoiceProvider, ProviderCapabilities, SynthesisResult, VoiceDescriptor

logger = logging.getLogger("ApexMind.Voice.EdgeTTS")


class EdgeTTSVoiceProvider(BaseVoiceProvider):
    _CAPABILITIES = ProviderCapabilities(
        supportsPitch=True,
        supportsSpeed=True,
        supportsEmotion=True,
        supportsWordTimestamps=True,
        isOffline=False,
        licenseCategory="microsoft_edge_speech",
    )

    _VOICE_CATALOG = [
        ("en-US-ChristopherNeural", "Christopher (Deep Cinematic Male)", "male", "en-US"),
        ("en-US-EricNeural", "Eric (Confident Storyteller)", "male", "en-US"),
        ("en-US-GuyNeural", "Guy (Conversational & Natural)", "male", "en-US"),
        ("en-US-AvaNeural", "Ava (Warm & Clear Female)", "female", "en-US"),
        ("en-US-JennyNeural", "Jenny (Expressive & Engaging Female)", "female", "en-US"),
        ("en-US-AriaNeural", "Aria (Dynamic & Energetic Female)", "female", "en-US"),
        ("en-GB-RyanNeural", "Ryan (British Cinematic Male)", "male", "en-GB"),
        ("en-GB-SoniaNeural", "Sonia (British Articulate Female)", "female", "en-GB"),
    ]

    @property
    def provider_id(self) -> str:
        return "edge_tts"

    @property
    def name(self) -> str:
        return "Edge-TTS (Online Zero-Cost)"

    @property
    def capabilities(self) -> ProviderCapabilities:
        return self._CAPABILITIES

    def is_available(self) -> bool:
        try:
            import edge_tts
            return True
        except ImportError:
            return False

    def list_voices(self) -> List[VoiceDescriptor]:
        return [
            VoiceDescriptor(
                voiceId=vid,
                name=vname,
                gender=vgender,
                language=vlang,
                provider=self.provider_id,
                sampleRate=24000,
                capabilities=self._CAPABILITIES,
            )
            for vid, vname, vgender, vlang in self._VOICE_CATALOG
        ]

    async def synthesize(
        self,
        text: str,
        voice_id: str,
        speed: float = 1.0,
        pitch: float = 0.0,
        settings: Optional[Dict[str, Any]] = None,
    ) -> SynthesisResult:
        import edge_tts

        clean_text = text.strip()
        if not clean_text:
            raise ValueError("Cannot synthesize empty text.")

        target_voice = voice_id if any(vid == voice_id for vid, *_ in self._VOICE_CATALOG) else "en-US-ChristopherNeural"

        # Format speed e.g. +10% or -5%
        speed_pct = int(round((speed - 1.0) * 100))
        speed_str = f"+{speed_pct}%" if speed_pct >= 0 else f"{speed_pct}%"

        pitch_hz = int(round(pitch))
        pitch_str = f"+{pitch_hz}Hz" if pitch_hz >= 0 else f"{pitch_hz}Hz"

        communicate = edge_tts.Communicate(
            text=clean_text,
            voice=target_voice,
            rate=speed_str,
            pitch=pitch_str,
        )

        mp3_chunks = bytearray()
        word_timestamps: List[Dict[str, Any]] = []

        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                mp3_chunks.extend(chunk["data"])
            elif chunk["type"] == "WordBoundary":
                # offset in 100-nanosecond units
                start_sec = chunk["offset"] / 10_000_000.0
                dur_sec = chunk["duration"] / 10_000_000.0
                word_timestamps.append({
                    "word": chunk["text"],
                    "start": round(start_sec, 3),
                    "end": round(start_sec + dur_sec, 3),
                })

        if not mp3_chunks:
            raise RuntimeError(f"Edge-TTS produced 0 audio bytes for voice '{target_voice}'.")

        # Convert MP3 bytes to standard 24kHz 16-bit mono PCM WAV using ffmpeg
        proc = subprocess.run(
            [
                "ffmpeg", "-y",
                "-i", "pipe:0",
                "-ar", "24000",
                "-ac", "1",
                "-f", "wav",
                "pipe:1",
            ],
            input=bytes(mp3_chunks),
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            check=True,
        )
        wav_bytes = proc.stdout

        # Read properties
        with io.BytesIO(wav_bytes) as bio:
            audio_data, sr = sf.read(bio)
            duration = float(len(audio_data)) / float(sr)

        logger.info(f"[EdgeTTS] Synthesized '{target_voice}' | chars={len(clean_text)} dur={duration:.2f}s words={len(word_timestamps)}")

        return SynthesisResult(
            audioBytes=wav_bytes,
            format="wav",
            sampleRate=24000,
            channels=1,
            durationSeconds=round(duration, 3),
            wordTimestamps=word_timestamps,
        )

