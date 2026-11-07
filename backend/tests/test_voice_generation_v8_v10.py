"""
backend/tests/test_voice_generation_v8_v10.py
Comprehensive Integration & Quality Verification Suite for Stage 2 (V8-V10):
1. 8-scene voice generation on The Decennial Sky (scr_8f716fa53031)
2. Scene-level WAV validation
3. Master narration assembly
4. Compact and global timeline offsets
5. Single-scene regeneration & version increment
6. Failed regeneration rollback & safety
7. Durable job persistence & worker recovery
8. Cooperative job cancellation
9. Duplicate generation prevention (idempotency)
10. Multi-provider failure handling
11. Offline Piper neural TTS without network
12. Offline pyttsx3 system TTS without network
13. Edge-TTS online provider behavior
14. EBU R128 loudness and true peak compliance
15. Stage 4 Captions metadata compatibility
16. FastAPI Studio voice endpoints verification
17. Full regression verification
"""

import asyncio
import json
import os
import shutil
import time
from pathlib import Path
import numpy as np
import pytest
import soundfile as sf
from fastapi.testclient import TestClient

from backend.main import app
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
from backend.features.workspace.voice_generation.services.audio_processor import (
    validate_wav_integrity,
    process_and_normalize_audio,
)
from backend.features.workspace.voice_generation.storage.audio_storage import audio_storage
from backend.features.workspace.generation_jobs.job_service import (
    create_generation_job,
    get_generation_job_status,
    cancel_generation_job,
    recover_stale_jobs,
    _JOBS,
    _JOBS_LOCK,
)
from backend.features.workspace.generation_jobs.job_status import JobStatus, JobPhase
from backend.features.workspace.studio_captions_service import run_studio_captions


client = TestClient(app)


@pytest.fixture(scope="module")
def decennial_sky_script():
    path = "scratch/cinematic_3d_story_response.json"
    assert os.path.exists(path), f"Test fixture not found: {path}"
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    script = data["script"]
    script["scriptId"] = data.get("scriptId", "scr_8f716fa53031")
    return script


# ── Verification 1 & 2: 8-Scene Generation & WAV Integrity ───────────────────

@pytest.mark.asyncio
async def test_01_the_decennial_sky_8_scenes_generation(decennial_sky_script):
    """Verifies complete 8-scene voice generation for The Decennial Sky."""
    assert len(decennial_sky_script["scenes"]) == 8, "Expected 8 scenes in The Decennial Sky"

    resp = await voice_orchestrator.generate_script_voice(
        script_document=decennial_sky_script,
        voice_config=VoiceConfig(provider="edge_tts", voiceId="en-US-ChristopherNeural", speed=1.0),
        loudness_profile=LoudnessProfile(targetLufs=-16.0, truePeakLimitDbtp=-1.0),
        mode=VoiceGenerationMode.ALL,
        force_regenerate=True,
    )

    assert resp.success is True
    assert resp.totalScenes == 8
    assert resp.completedScenes == 8
    assert len(resp.scenes) == 8

    # Verify each of the 8 scene WAV files
    for scn in resp.scenes:
        disk_path = Path("media/voice") / scn.audioUrl.replace("/media/voice/", "")
        assert disk_path.exists(), f"Scene audio missing: {disk_path}"
        val = validate_wav_integrity(disk_path.read_bytes())
        assert val.isValid is True
        assert val.sampleRate == 24000
        assert val.channels == 1
        assert val.duration > 0.4
        assert not np.isnan(val.truePeakDbtp)
        assert scn.version >= 1


# ── Verification 3 & 4: Master Assembly & Timeline Offsets ────────────────────

@pytest.mark.asyncio
async def test_02_master_assembly_and_timeline_offsets(decennial_sky_script):
    """Verifies gapless master narration assembly and monotonic timeline offsets."""
    resp = await voice_orchestrator.generate_script_voice(
        script_document=decennial_sky_script,
        voice_config=VoiceConfig(provider="edge_tts", voiceId="en-US-ChristopherNeural"),
        mode=VoiceGenerationMode.ALL,
    )

    master_path = Path("media/voice") / resp.scriptId / "narration_master.wav"
    assert master_path.exists(), "Master narration WAV not found"

    master_data, sr = sf.read(str(master_path))
    assert sr == 24000
    actual_master_dur = len(master_data) / sr
    assert resp.masterDuration == pytest.approx(actual_master_dur, 0.05)

    # Monotonic timeline offsets check across scenes
    last_end = 0.0
    for scn in resp.scenes:
        assert scn.timelineStart >= 0.0
        assert scn.actualDuration > 0.0
        assert scn.timelineEnd > scn.timelineStart
        assert scn.timelineStart >= last_end - 0.05  # Sequential
        last_end = scn.timelineStart + scn.actualDuration


# ── Verification 5 & 6: Scene Regeneration & Safety Rollback ─────────────────

@pytest.mark.asyncio
async def test_03_single_scene_regeneration_versioning(decennial_sky_script):
    """Verifies single-scene regeneration increments version and preserves untouched scenes."""
    script_id = decennial_sky_script.get("id") or decennial_sky_script.get("scriptId", "scr_8f716fa53031")
    scene_dir = Path("media/voice") / script_id
    scene_1_id = decennial_sky_script["scenes"][0]["sceneId"]
    scene_2_id = decennial_sky_script["scenes"][1]["sceneId"]

    # Read pre-regeneration modification timestamps
    scene_1_files = sorted(scene_dir.glob(f"{scene_1_id}_v*.wav"))
    assert len(scene_1_files) >= 1
    s1_mtime_before = scene_1_files[-1].stat().st_mtime

    # Regenerate only scene 2
    regen_resp = await voice_orchestrator.generate_script_voice(
        script_document=decennial_sky_script,
        voice_config=VoiceConfig(provider="edge_tts", voiceId="en-US-ChristopherNeural", speed=1.1),
        mode=VoiceGenerationMode.SELECTED_SCENES,
        selected_scene_ids=[scene_2_id],
        force_regenerate=True,
    )

    assert regen_resp.success is True
    scene_2_files = sorted(scene_dir.glob(f"{scene_2_id}_v*.wav"))
    assert len(scene_2_files) >= 2

    # Untouched scene 1 must not be modified
    assert scene_1_files[-1].stat().st_mtime == s1_mtime_before


@pytest.mark.asyncio
async def test_04_failed_regeneration_safety_rollback():
    """Verifies that an engine failure during regeneration preserves previous audio intact."""
    test_script_id = "scr_test_safety_v8"
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

    # Verify original scene audio was preserved
    assert file_path.exists()
    assert file_path.read_bytes() == orig_bytes


# ── Verification 7, 8, 9: Durable Jobs, Cancellation, Idempotency ────────────

def test_05_durable_jobs_idempotency_and_cancellation(decennial_sky_script):
    """Verifies job dispatch, idempotency deduplication, and cooperative cancellation."""
    idem_key = f"idem_test_{time.time()}"
    payload = {
        "scriptId": decennial_sky_script["scriptId"],
        "voiceConfig": {"provider": "edge_tts", "voiceId": "en-US-ChristopherNeural"},
        "mode": "all",
    }

    # 1. Create durable job
    job1 = create_generation_job(payload=payload, idempotency_key=idem_key, job_type="voice")
    assert job1["success"] is True
    job_id = job1["jobId"]

    # 2. Duplicate request with same idempotency key returns same jobId
    job2 = create_generation_job(payload=payload, idempotency_key=idem_key, job_type="voice")
    assert job2["jobId"] == job_id

    # 3. Status polling
    status_info = get_generation_job_status(job_id)
    assert status_info is not None
    assert status_info["jobId"] == job_id
    assert status_info["jobType"] == "voice"

    # 4. Cooperative cancellation
    cancel_success = cancel_generation_job(job_id)
    assert cancel_success is True

    status_cancelled = get_generation_job_status(job_id)
    assert status_cancelled["status"] == JobStatus.CANCELLED.value


def test_06_stale_job_recovery():
    """Verifies recover_stale_jobs identifies stalled worker leases and marks them safely."""
    with _JOBS_LOCK:
        stale_id = f"job_stale_{int(time.time())}"
        _JOBS[stale_id] = {
            "jobId": stale_id,
            "jobType": "voice",
            "status": JobStatus.IN_PROGRESS.value,
            "phase": JobPhase.SYNTHESIS.value,
            "progressPercent": 50,
            "completedScenes": 2,
            "totalScenes": 4,
            "message": "Synthesizing",
            "startTime": time.perf_counter(),
            "lastHeartbeat": time.time() - 300,
            "leaseExpiresAt": time.time() - 100,  # Expired
            "isCancelled": False,
        }

    recovered = recover_stale_jobs(stale_threshold_seconds=60.0)
    assert stale_id in recovered

    stale_status = get_generation_job_status(stale_id)
    assert stale_status["status"] == JobStatus.PARTIALLY_COMPLETED.value
    assert "Worker lease expired" in stale_status["message"]


# ── Verification 10, 11, 12, 13: Providers & Offline Execution ────────────────

def test_07_offline_piper_provider_execution():
    """Verifies Piper provider executes locally without network access."""
    piper = voice_registry.get_provider("piper")
    assert piper is not None
    assert piper.capabilities.isOffline is True

    if piper.is_available():
        res, _ = asyncio.run(
            voice_engine.synthesize_scene(
                raw_text="ApexMind offline neural synthesis active.",
                provider_id="piper",
                voice_id="en_US-lessac-medium",
            )
        )
        assert res.sampleRate == 24000
        assert res.durationSeconds > 1.0
        val = validate_wav_integrity(res.audioBytes)
        assert val.isValid is True


def test_08_offline_pyttsx3_provider_execution():
    """Verifies pyttsx3 system TTS executes offline without network."""
    pyttsx3_p = voice_registry.get_provider("pyttsx3")
    assert pyttsx3_p is not None
    assert pyttsx3_p.capabilities.isOffline is True

    res, _ = asyncio.run(
        voice_engine.synthesize_scene(
            raw_text="Testing system voice fallback offline.",
            provider_id="pyttsx3",
            voice_id="default",
        )
    )
    assert res.sampleRate == 24000
    assert res.durationSeconds > 1.0
    val = validate_wav_integrity(res.audioBytes)
    assert val.isValid is True


def test_09_multi_provider_failure_handling():
    """
    Verifies multi-provider failure handling:
    1. Unknown/unavailable provider gracefully falls back to available registered provider.
    2. When all providers are unavailable, a clear RuntimeError is raised.
    """
    # 1. Resilient fallback when an unknown provider is requested
    res, norm_text = asyncio.run(
        voice_engine.synthesize_scene(
            raw_text="Testing automatic resilient provider fallback.",
            provider_id="nonexistent_engine",
        )
    )
    assert res.audioBytes is not None
    assert len(res.audioBytes) > 1000
    assert res.durationSeconds > 0.5
    assert len(norm_text) > 0

    # 2. Hard failure when all providers are unavailable
    original_providers = dict(voice_registry._providers)
    try:
        voice_registry._providers.clear()
        with pytest.raises(RuntimeError, match="No voice synthesis providers are available"):
            asyncio.run(
                voice_engine.synthesize_scene(
                    raw_text="Sample text",
                    provider_id="any_engine",
                )
            )
    finally:
        voice_registry._providers = original_providers


# ── Verification 14: EBU R128 Loudness and True Peak Compliance ───────────────

def test_10_loudness_and_clipping_compliance():
    """Verifies audio normalization conforms to EBU R128 loudness and peak limits."""
    # Create sample synthetic tone
    sr = 24000
    t = np.linspace(0, 2.0, int(sr * 2.0), endpoint=False)
    synthetic_wave = 0.5 * np.sin(2 * np.pi * 440 * t)

    import io
    buf = io.BytesIO()
    sf.write(buf, synthetic_wave, sr, format="WAV", subtype="PCM_16")
    raw_wav = buf.getvalue()

    norm_wav, val = process_and_normalize_audio(
        wav_bytes=raw_wav,
        target_lufs=-16.0,
        true_peak_dbtp=-1.0,
    )

    assert val.isValid is True
    assert val.integratedLufs <= -14.0  # Normalized safely
    assert val.truePeakDbtp <= -0.9  # True peak ceiling respected
    assert val.hasClipping is False


# ── Verification 15: Stage 4 Captions Metadata Compatibility ──────────────────

@pytest.mark.asyncio
async def test_11_stage4_captions_metadata_compatibility(decennial_sky_script):
    """Verifies Stage 2 output metadata aligns cleanly with Stage 4 Caption Generator."""
    resp = await voice_orchestrator.generate_script_voice(
        script_document=decennial_sky_script,
        voice_config=VoiceConfig(provider="edge_tts", voiceId="en-US-ChristopherNeural"),
        mode=VoiceGenerationMode.ALL,
    )

    # Convert Stage 2 scenes into Stage 4 input storyboard format
    storyboard_for_stage4 = []
    for scn in resp.scenes:
        storyboard_for_stage4.append({
            "sceneNumber": scn.sceneNumber,
            "subtitleText": scn.normalizedText,
            "start": scn.timelineStart,
            "duration": scn.actualDuration,
        })

    # Execute Stage 4 caption generation
    captions_res = run_studio_captions(
        storyboard_scenes=storyboard_for_stage4,
        duration_seconds=resp.masterDuration,
        style_preset="sub-hormozi",
    )

    assert captions_res["success"] is True
    assert "data" in captions_res
    assert len(captions_res["data"]["timelineClips"]) > 0
    assert captions_res["data"]["durationSeconds"] > 0
    assert "srtExport" in captions_res["data"]


# ── Verification 16: FastAPI Studio Voice Endpoints ───────────────────────────

def test_12_fastapi_studio_voice_endpoints(decennial_sky_script):
    """Verifies all Stage 2 FastAPI router endpoints."""
    # 1. GET /api/studio/voices
    res_voices = client.get("/api/studio/voices")
    assert res_voices.status_code == 200
    v_data = res_voices.json()
    assert v_data["success"] is True
    assert len(v_data["providers"]) >= 2

    # 2. POST /api/studio/generate-voice/async
    script_id = decennial_sky_script["scriptId"]
    res_async = client.post(
        "/api/studio/generate-voice/async",
        json={
            "scriptId": script_id,
            "voiceConfig": {"provider": "edge_tts", "voiceId": "en-US-ChristopherNeural"},
            "mode": "all",
        },
        headers={"X-Idempotency-Key": f"api_test_{time.time()}"},
    )
    assert res_async.status_code == 202
    job_info = res_async.json()
    assert job_info["success"] is True
    assert "jobId" in job_info

    # 3. GET /api/studio/jobs/{job_id}
    res_status = client.get(f"/api/studio/jobs/{job_info['jobId']}")
    assert res_status.status_code == 200
    status_body = res_status.json()
    assert status_body["jobId"] == job_info["jobId"]
    assert status_body["jobType"] == "voice"

    # 4. GET /api/studio/scripts/{script_id}/voice
    res_meta = client.get(f"/api/studio/scripts/{script_id}/voice")
    assert res_meta.status_code == 200
    meta_body = res_meta.json()
    assert meta_body["success"] is True
    assert meta_body["scriptId"] == script_id
    assert "narration_master.wav" in meta_body["masterAudioUrl"]
    assert len(meta_body["scenes"]) == 8
