"""
backend/features/workspace/voice_generation/services/audio_assembler.py
Audio assembly and multi-track timeline mapping engine for Stage 2 Voice Generation.
"""

import io
import logging
from typing import Any, Dict, List, Tuple
import numpy as np
import soundfile as sf
from pydantic import BaseModel, Field

from .audio_processor import validate_wav_integrity, process_and_normalize_audio

logger = logging.getLogger("ApexMind.Voice.Assembler")


class AssembledSceneOffset(BaseModel):
    sceneNumber: int
    sceneId: str
    version: int
    audioUrl: str
    originalText: str
    normalizedText: str
    actualDuration: float

    # Storyboard reference timing (from Stage 1)
    storyboardStartTime: float
    storyboardDuration: float
    speechStartOffset: float = 0.0

    # Compact narration track positioning (in narration_master.wav)
    compactMasterStart: float
    compactMasterEnd: float

    # Global video composition timeline placement
    videoTimelineStart: float
    videoTimelineEnd: float

    # Pacing alignment check
    pacingStatus: str = "ok"  # "ok", "warning_exceeds_scene"
    timingDelta: float = 0.0  # actualDuration - storyboardDuration

    wordTimestamps: List[Dict[str, Any]] = Field(default_factory=list)


class AssemblyResult(BaseModel):
    masterWavBytes: bytes
    totalMasterDuration: float
    sampleRate: int = 24000
    channels: int = 1
    sceneOffsets: List[AssembledSceneOffset]
    pacingWarnings: List[str] = Field(default_factory=list)


def assemble_master_narration(
    scene_items: List[Dict[str, Any]],
    inter_scene_padding_ms: int = 120,
    target_lufs: float = -16.0,
    true_peak_dbtp: float = -1.0,
    sample_rate: int = 24000,
) -> AssemblyResult:
    """
    Concatenates individual scene audio buffers in storyboard order with boundary padding,
    generating accurate compact master track offsets and global video timeline mapping.
    """
    if not scene_items:
        raise ValueError("Cannot assemble master track: no scene audio provided.")

    # Sort strictly by sceneNumber
    sorted_scenes = sorted(scene_items, key=lambda s: s.get("sceneNumber", 0))

    pad_samples_count = int((inter_scene_padding_ms / 1000.0) * sample_rate)
    silence_pad = np.zeros(pad_samples_count, dtype=np.float32)

    master_audio_segments: List[np.ndarray] = []
    offsets: List[AssembledSceneOffset] = []
    pacing_warnings: List[str] = []

    current_compact_time = 0.0

    for i, s in enumerate(sorted_scenes):
        raw_wav = s["wavBytes"]
        val = validate_wav_integrity(raw_wav, min_duration=0.2)
        if not val.isValid:
            raise ValueError(f"Scene {s.get('sceneNumber')} audio failed validation: {val.error}")

        with io.BytesIO(raw_wav) as bio:
            scene_data, sr = sf.read(bio)

        # Ensure float32 mono
        if len(scene_data.shape) > 1:
            scene_data = np.mean(scene_data, axis=1)
        scene_data = scene_data.astype(np.float32)

        actual_dur = float(len(scene_data)) / float(sample_rate)

        # Boundary padding (except before the first scene)
        if i > 0 and pad_samples_count > 0:
            master_audio_segments.append(silence_pad)
            current_compact_time += (inter_scene_padding_ms / 1000.0)

        compact_start = round(current_compact_time, 3)
        master_audio_segments.append(scene_data)
        current_compact_time += actual_dur
        compact_end = round(current_compact_time, 3)

        # Storyboard visual timeline references
        sb_start = float(s.get("storyboardStartTime", 0.0))
        sb_dur = float(s.get("storyboardDuration", actual_dur))
        speech_offset = float(s.get("speechStartOffset", 0.0))

        # Global video composition timeline
        video_start = round(sb_start + speech_offset, 3)
        video_end = round(video_start + actual_dur, 3)

        timing_delta = round(actual_dur - sb_dur, 3)
        pacing_status = "ok"
        if actual_dur > (sb_dur + 0.35):
            pacing_status = "warning_exceeds_scene"
            warning_msg = (
                f"Scene {s.get('sceneNumber')} ({s.get('sceneId')}) speech duration ({actual_dur:.2f}s) "
                f"exceeds storyboard visual duration ({sb_dur:.2f}s) by {timing_delta:.2f}s."
            )
            pacing_warnings.append(warning_msg)
            logger.warning(f"[Assembler] {warning_msg}")

        offsets.append(
            AssembledSceneOffset(
                sceneNumber=s.get("sceneNumber", i + 1),
                sceneId=s.get("sceneId", f"scene_{i+1:02d}"),
                version=s.get("version", 1),
                audioUrl=s.get("audioUrl", ""),
                originalText=s.get("originalText", ""),
                normalizedText=s.get("normalizedText", ""),
                actualDuration=round(actual_dur, 3),
                storyboardStartTime=round(sb_start, 3),
                storyboardDuration=round(sb_dur, 3),
                speechStartOffset=round(speech_offset, 3),
                compactMasterStart=compact_start,
                compactMasterEnd=compact_end,
                videoTimelineStart=video_start,
                videoTimelineEnd=video_end,
                pacingStatus=pacing_status,
                timingDelta=timing_delta,
                wordTimestamps=s.get("wordTimestamps", []),
            )
        )

    # Concatenate all audio segments into full master track
    full_master_array = np.concatenate(master_audio_segments)
    raw_master_bio = io.BytesIO()
    sf.write(raw_master_bio, full_master_array, sample_rate, format="WAV", subtype="PCM_16")
    raw_master_bytes = raw_master_bio.getvalue()

    # Normalize full master track to target LUFS and true peak limit
    norm_master_bytes, master_val = process_and_normalize_audio(
        raw_master_bytes,
        target_lufs=target_lufs,
        true_peak_dbtp=true_peak_dbtp,
        output_sample_rate=sample_rate,
    )

    logger.info(
        f"[Assembler] Assembled master narration: {len(offsets)} scenes | "
        f"totalDur={master_val.duration:.2f}s | warnings={len(pacing_warnings)}"
    )

    return AssemblyResult(
        masterWavBytes=norm_master_bytes,
        totalMasterDuration=master_val.duration,
        sampleRate=sample_rate,
        channels=1,
        sceneOffsets=offsets,
        pacingWarnings=pacing_warnings,
    )

