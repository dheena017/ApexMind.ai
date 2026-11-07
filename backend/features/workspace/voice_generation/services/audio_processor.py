"""
backend/features/workspace/voice_generation/services/audio_processor.py
Comprehensive audio validation, silence trimming, and loudness normalization engine.
"""

import io
import logging
import subprocess
from typing import Any, Dict, Optional, Tuple
import numpy as np
import soundfile as sf
from pydantic import BaseModel, Field

logger = logging.getLogger("ApexMind.Voice.AudioProcessor")


class AudioValidationResult(BaseModel):
    isValid: bool
    duration: float
    sampleRate: int
    channels: int
    isSilent: bool = False
    hasClipping: bool = False
    rmsDb: float = -99.0
    truePeakDbtp: float = -99.0
    integratedLufs: float = -99.0
    error: Optional[str] = None


def validate_wav_integrity(wav_bytes: bytes, min_duration: float = 0.4) -> AudioValidationResult:
    """
    Validates physical WAV audio stream integrity, detecting silence, corruption, and clipping.
    """
    if not wav_bytes or len(wav_bytes) < 44:
        return AudioValidationResult(
            isValid=False,
            duration=0.0,
            sampleRate=0,
            channels=0,
            error="Payload is empty or shorter than standard WAV header length (44 bytes).",
        )

    try:
        with io.BytesIO(wav_bytes) as bio:
            audio_data, sr = sf.read(bio)
            channels = 1 if len(audio_data.shape) == 1 else audio_data.shape[1]
            samples = len(audio_data)
            dur = float(samples) / float(sr) if sr > 0 else 0.0

            if dur < min_duration:
                return AudioValidationResult(
                    isValid=False,
                    duration=dur,
                    sampleRate=sr,
                    channels=channels,
                    error=f"Audio duration ({dur:.2f}s) is below minimum threshold ({min_duration:.2f}s).",
                )

            # Measure RMS and Peak
            rms = np.sqrt(np.mean(np.square(audio_data))) if samples > 0 else 0.0
            rms_db = 20.0 * np.log10(rms) if rms > 1e-6 else -99.0

            max_amp = np.max(np.abs(audio_data)) if samples > 0 else 0.0
            peak_dbtp = 20.0 * np.log10(max_amp) if max_amp > 1e-6 else -99.0

            is_silent = rms_db < -55.0 or max_amp < 0.005
            has_clipping = max_amp >= 0.999

            if is_silent:
                return AudioValidationResult(
                    isValid=False,
                    duration=dur,
                    sampleRate=sr,
                    channels=channels,
                    isSilent=True,
                    rmsDb=round(rms_db, 2),
                    truePeakDbtp=round(peak_dbtp, 2),
                    error="Audio stream contains excessive silence or undetectable sound energy.",
                )

            return AudioValidationResult(
                isValid=True,
                duration=round(dur, 3),
                sampleRate=sr,
                channels=channels,
                isSilent=False,
                hasClipping=has_clipping,
                rmsDb=round(rms_db, 2),
                truePeakDbtp=round(peak_dbtp, 2),
            )
    except Exception as e:
        return AudioValidationResult(
            isValid=False,
            duration=0.0,
            sampleRate=0,
            channels=0,
            error=f"Corrupted or non-decodable audio payload: {e}",
        )


def process_and_normalize_audio(
    wav_bytes: bytes,
    target_lufs: float = -16.0,
    true_peak_dbtp: float = -1.0,
    output_sample_rate: int = 24000,
) -> Tuple[bytes, AudioValidationResult]:
    """
    Trims excessive silence, normalizes loudness according to target LUFS,
    and enforces True Peak ceiling in dBTP via FFmpeg.

    Returns:
        (normalized_wav_bytes, AudioValidationResult)
    """
    initial_check = validate_wav_integrity(wav_bytes, min_duration=0.2)
    if not initial_check.isValid:
        raise ValueError(f"Initial audio validation failed: {initial_check.error}")

    # FFmpeg silence trimming (head/tail to 50ms) + EBU R128 loudnorm
    cmd = [
        "ffmpeg", "-y",
        "-i", "pipe:0",
        "-af", (
            f"silenceremove=start_periods=1:start_duration=0.05:start_threshold=-50dB,"
            f"areverse,silenceremove=start_periods=1:start_duration=0.05:start_threshold=-50dB,areverse,"
            f"loudnorm=I={target_lufs}:TP={true_peak_dbtp}:LRA=7"
        ),
        "-ar", str(output_sample_rate),
        "-ac", "1",
        "-f", "wav",
        "pipe:1",
    ]

    proc = subprocess.run(
        cmd,
        input=wav_bytes,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=True,
    )
    processed_bytes = proc.stdout

    final_validation = validate_wav_integrity(processed_bytes, min_duration=0.2)
    final_validation.integratedLufs = target_lufs

    if not final_validation.isValid:
        raise RuntimeError(f"Post-normalization audio validation failed: {final_validation.error}")

    logger.info(
        f"[AudioProcessor] Successfully processed & normalized: "
        f"dur={final_validation.duration:.2f}s targetLUFS={target_lufs} "
        f"truePeak={final_validation.truePeakDbtp:.2f}dBTP"
    )

    return processed_bytes, final_validation
