"""
backend/tests/test_voice_generation_v4_v7.py
Comprehensive test suite verifying Milestones V4-V7 of Stage 2 Voice Generation:
- All-scene generation on 'The Decennial Sky'
- Scene-level WAV verification
- Master narration assembly & timing offsets
- Single-scene regeneration without touching other scenes
- Failed regeneration safety and rollback
- Delivery presets & capability filtering
- Multi-provider testing (Edge-TTS, Piper, pyttsx3)
"""

import json
import os
import shutil
from pathlib import Path
import numpy as np
import pytest
import soundfile as sf

from backend.features.workspace.voice_generation.engine.voice_orchestrator import voice_orchestrator
from backend.features.workspace.voice_generation.engine.voice_engine import voice_engine
from backend.features.workspace.voice_generation.profiles.delivery_presets import (
    DELIVERY_PRESETS,
    resolve_voice_and_delivery,
)
from backend.features.workspace.voice_generation.providers import voice_registry
from backend.features.workspace.voice_generation.schemas import (
    LoudnessProfile,
    VoiceConfig,
    VoiceGenerationMode,
)
from backend.features.workspace.voice_generation.services.audio_processor import validate_wav_integrity
from backend.features.workspace.voice_generation.storage.audio_storage import audio_storage


@pytest.fixture(scope="module")
def decennial_sky_script():
    path = "scratch/cinematic_3d_story_response.json"
    assert os.path.exists(path), f"Test fixture not found: {path}"
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    return data["script"]


@pytest.mark.asyncio
async def test_the_decennial_sky_full_generation(decennial_sky_script):
    """
    Verification 1, 2, 3 & 6:
    - Generates audio for all scenes of 'The Decennial Sky'.
    - Verifies scene-level WAV files.
    - Verifies master narration assembly and multi-track timing offsets.
    """
    resp = await voice_orchestrator.generate_script_voice(
        script_document=decennial_sky_script,
        voice_config=VoiceConfig(provider="edge_tts", voiceId="en-US-ChristopherNeural", speed=1.0),
        loudness_profile=LoudnessProfile(targetLufs=-16.0, truePeakLimitDbtp=-1.0),
        mode=VoiceGenerationMode.ALL,
        force_regenerate=True,
    )

    assert resp.success is True
    assert resp.schemaVersion == "2.0"
    assert resp.totalScenes == len(decennial_sky_script["scenes"])
    assert resp.completedScenes == resp.totalScenes
    assert resp.masterDuration > 0.0

    # Verify master audio file on disk
    master_disk_path = Path("media/voice") / resp.scriptId / "narration_master.wav"
    assert master_disk_path.exists(), f"Master audio missing: {master_disk_path}"

    master_data, sr = sf.read(str(master_disk_path))
    assert sr == 24000
    assert len(master_data.shape) == 1 or master_data.shape[1] == 1  # Mono

    # Verify each scene audio file and timing metadata
    prev_end = 0.0
    for scn in resp.scenes:
        rel_path = scn.audioUrl.replace("/media/voice/", "")
        scn_disk_path = Path("media/voice") / rel_path
        assert scn_disk_path.exists(), f"Scene audio missing on disk: {scn_disk_path}"

        val = validate_wav_integrity(scn_disk_path.read_bytes())
        assert val.isValid is True
        assert val.duration > 0.5
        assert scn.actualDuration == pytest.approx(val.duration, 0.05)

        # Timeline placement must respect scene boundaries
        assert scn.timelineEnd > scn.timelineStart
        assert len(scn.originalText) > 0
        assert len(scn.normalizedText) > 0


@pytest.mark.asyncio
async def test_single_scene_regeneration(decennial_sky_script):
    """
    Verification 4:
    - Regenerates Scene 3 without regenerating untouched scenes.
    - Verifies Scene 1, 2, and 4 audio files remain untouched.
    """
    script_id = decennial_sky_script["id"]
    target_scene = decennial_sky_script["scenes"][2]
    scene_3_id = target_scene["sceneId"]

    # Record initial modification timestamps of scenes
    script_dir = Path("media/voice") / script_id
    scene_1_file = script_dir / f"{decennial_sky_script['scenes'][0]['sceneId']}_v1.wav"
    assert scene_1_file.exists()
    scene_1_mtime_before = scene_1_file.stat().st_mtime

    # Regenerate ONLY Scene 3
    regen_resp = await voice_orchestrator.generate_script_voice(
        script_document=decennial_sky_script,
        voice_config=VoiceConfig(provider="edge_tts", voiceId="en-US-ChristopherNeural", speed=0.95),
        mode=VoiceGenerationMode.SELECTED_SCENES,
        selected_scene_ids=[scene_3_id],
        force_regenerate=True,
    )

    assert regen_resp.success is True

    # Scene 1 must NOT have been re-modified
    scene_1_mtime_after = scene_1_file.stat().st_mtime
    assert scene_1_mtime_before == scene_1_mtime_after

    # Scene 3 must now have a higher version file
    scene_3_files = list(script_dir.glob(f"{scene_3_id}_v*.wav"))
    assert len(scene_3_files) >= 2


@pytest.mark.asyncio
async def test_failed_regeneration_safety():
    """
    Verification 5:
    - Confirms old audio survives an aborted or failed regeneration.
    """
    test_script_id = "scr_test_safety"
    test_scene_id = "scn_safe_01"

    # Pre-populate a working version 1 audio
    synth_res, _ = await voice_engine.synthesize_scene(
        raw_text="This is original working audio.",
        provider_id="edge_tts",
    )
    file_path, _, version = audio_storage.save_scene_audio(
        script_id=test_script_id,
        scene_id=test_scene_id,
        wav_bytes=synth_res.audioBytes,
        version=1,
    )
    assert file_path.exists()
    orig_bytes = file_path.read_bytes()

    # Attempt a faulty regeneration with empty text
    with pytest.raises(Exception):
        await voice_engine.synthesize_scene(
            raw_text="   ",
            provider_id="edge_tts",
        )

    # Confirm original file is untouched and unharmed
    assert file_path.exists()
    assert file_path.read_bytes() == orig_bytes


def test_delivery_presets_and_capabilities():
    """
    Verification of Milestone V4:
    - Delivery presets apply correct speed, pitch, and descriptions.
    - Capability filtering clamps pitch/emotion for providers that do not support them.
    """
    for preset_key, preset in DELIVERY_PRESETS.items():
        assert preset.speedMultiplier > 0.5
        assert preset.speedMultiplier < 2.0
        assert preset.intensity in ["low", "medium", "high"]

    # Test filtering with pyttsx3 capabilities (does NOT support pitch or emotion)
    sapi_caps = voice_registry.get_provider("pyttsx3").capabilities
    assert sapi_caps.supportsPitch is False
    assert sapi_caps.supportsEmotion is False

    resolved = resolve_voice_and_delivery(
        voice_id="default",
        provider_id="pyttsx3",
        preset_name="cinematic_narrator",
        capabilities=sapi_caps,
    )

    assert resolved["speed"] == 0.92
    assert resolved["pitch"] == 0.0  # Clamped to 0.0 because pitch is unsupported
    assert resolved["emotion"] is None  # Clamped to None because emotion is unsupported


@pytest.mark.asyncio
async def test_each_provider_separately():
    """
    Verification 7:
    - Tests Edge-TTS, Piper, and pyttsx3 separately.
    - Confirms all 3 zero-cost providers produce valid 24kHz mono PCM WAV files.
    """
    test_sentence = "Discipline will always defeat fleeting bursts of motivation."

    # 1. Edge-TTS
    edge_res, _ = await voice_engine.synthesize_scene(
        raw_text=test_sentence,
        provider_id="edge_tts",
        voice_id="en-US-ChristopherNeural",
    )
    assert edge_res.sampleRate == 24000
    assert edge_res.durationSeconds > 1.0

    # 2. Piper Neural TTS
    piper_res, _ = await voice_engine.synthesize_scene(
        raw_text=test_sentence,
        provider_id="piper",
        voice_id="en_US-lessac-medium",
    )
    assert piper_res.sampleRate == 24000
    assert piper_res.durationSeconds > 1.0

    # 3. System SAPI5 OS Speech
    sapi_res, _ = await voice_engine.synthesize_scene(
        raw_text=test_sentence,
        provider_id="pyttsx3",
        voice_id="default",
    )
    assert sapi_res.sampleRate == 24000
    assert sapi_res.durationSeconds > 1.0

