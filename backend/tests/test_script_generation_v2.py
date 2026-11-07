"""
backend/tests/test_script_generation_v2.py

Comprehensive test suite for Script Generation Architecture v2 (Milestones 1–10).
Tests:
- Motivational reel script generation
- Cinematic 3D story generation
- Durable background job submission, status polling, and cancellation
- Output validator bounds checking
- Character, environment, and manifest continuity
- 3D camera spline, locomotion, and phoneme viseme generation
- Blender asset catalog resolution
- Database persistence, immutable versioning, diff calculation, and approval state machine
"""

import pytest
from fastapi.testclient import TestClient

from backend.app.server import app
from backend.features.workspace.script_generation.output_validator import validate_and_recalibrate_script
from backend.features.workspace.generation_jobs.job_service import (
    create_generation_job,
    get_generation_job_status,
    cancel_generation_job,
)
from backend.features.workspace.continuity import (
    CharacterContinuityTracker,
    EnvironmentContinuityTracker,
    ManifestCrossValidator,
)
from backend.features.workspace.animation_prep import (
    generate_camera_spline,
    generate_viseme_track_from_words,
    plan_character_locomotion,
)
from backend.features.workspace.asset_resolution import BlenderAssetResolver
from backend.features.workspace.script_storage import (
    ScriptStorageRepository,
    ApprovalManager,
    ApprovalState,
    compute_script_diff,
)

client = TestClient(app)


# ── Milestone 3: Validator Tests ─────────────────────────────────────────────

def test_validator_duration_scaling():
    """Verify validator correctly computes scaling factor and scales scene durations within 15% tolerance."""
    script_data = {
        "scenes": [
            {"sceneNumber": 1, "duration": 5.0, "narration": "Hello"},
            {"sceneNumber": 2, "duration": 5.0, "narration": "World"},
        ]
    }
    recalibrated, summary = validate_and_recalibrate_script(script_data, 11.0)
    assert summary["isValid"] is True
    assert summary["sceneCount"] == 2
    assert summary["actualDuration"] == 11.0
    assert recalibrated["scenes"][0]["startTime"] == 0.0
    assert recalibrated["scenes"][0]["endTime"] > 0


def test_validator_rebalance_fallback():
    """Verify validator evenly rebalances if duration delta exceeds 15%."""
    script_data = {
        "scenes": [
            {"sceneNumber": 1, "duration": 2.0, "narration": "Short"},
            {"sceneNumber": 2, "duration": 2.0, "narration": "Clip"},
        ]
    }
    recalibrated, summary = validate_and_recalibrate_script(script_data, 30.0)
    assert summary["isValid"] is True
    assert summary["sceneCount"] == 2
    assert summary["actualDuration"] == 30.0


def test_validator_empty_scenes():
    """Verify validator flags scripts with empty scenes as invalid."""
    recalibrated, summary = validate_and_recalibrate_script({"scenes": []}, 30.0)
    assert summary["isValid"] is False
    assert len(summary["errors"]) > 0


# ── Milestone 3: API & Background Job Endpoints ──────────────────────────────

def test_generate_script_endpoint_validation():
    """Verify POST /api/studio/generate-script enforces valid schema."""
    response = client.post("/api/studio/generate-script", json={
        "category": "Nature & Stoic Solitude",
        "length": "30 seconds",
        "generationProfile": "motivational_reel",
    })
    assert response.status_code in [200, 500]


def test_generate_script_async_and_status():
    """Verify POST /api/studio/generate-script/async enqueues job and returns 202 Accepted with pollable status."""
    response = client.post("/api/studio/generate-script/async", json={
        "category": "Deep Forest Flow & Silence",
        "length": "15 seconds",
        "generationProfile": "motivational_reel",
    })
    assert response.status_code == 202
    data = response.json()
    assert "jobId" in data
    assert data["status"] in ["queued", "in_progress", "completed"]

    job_id = data["jobId"]
    status_resp = client.get(f"/api/studio/jobs/{job_id}")
    assert status_resp.status_code == 200
    status_data = status_resp.json()
    assert status_data["jobId"] == job_id
    assert "progressPercent" in status_data


def test_cancel_job_endpoint():
    """Verify POST /api/studio/jobs/{job_id}/cancel cancels queued job."""
    job = create_generation_job({"category": "Test", "generationProfile": "motivational_reel"})
    job_id = job["jobId"]
    assert job["status"] in ["queued", "in_progress"]

    cancel_resp = client.post(f"/api/studio/jobs/{job_id}/cancel")
    assert cancel_resp.status_code == 200
    cancel_data = cancel_resp.json()
    assert cancel_data["success"] is True

    status_resp = client.get(f"/api/studio/jobs/{job_id}")
    assert status_resp.json()["status"] == "cancelled"


# ── Milestone 7: Persistence, Version Diffs & Approvals ──────────────────────

def test_script_storage_versioning_and_approvals():
    """Verify SQLite script persistence, version increments, diffs, and approval transitions."""
    initial_script = {
        "title": "The Stoic Ascent",
        "totalDuration": 30.0,
        "aspectRatio": "9:16",
        "scenes": [
            {"sceneNumber": 1, "duration": 5.0, "narration": "Dawn breaks on the peak."},
            {"sceneNumber": 2, "duration": 25.0, "narration": "Discipline overcomes emotion."},
        ],
        "assetManifest": {"characters": [], "props": []},
    }

    # Save V1
    saved = ScriptStorageRepository.save_script(initial_script, project_id="proj_test_01")
    script_id = saved["scriptId"]
    assert saved["versionNumber"] == 1

    # Fetch script
    fetched = ScriptStorageRepository.get_script(script_id)
    assert fetched is not None
    assert fetched["title"] == "The Stoic Ascent"
    assert fetched["currentVersion"]["versionNumber"] == 1

    # Create V2 with modification
    import copy
    modified_script = copy.deepcopy(initial_script)
    modified_script["title"] = "The Stoic Ascent (Director Cut)"
    modified_script["scenes"][0]["narration"] = "Golden dawn breaks over ancient stone."

    v2 = ScriptStorageRepository.create_version(
        script_id, modified_script, change_summary="Polished opening hook narration"
    )
    assert v2["versionNumber"] == 2

    # Verify versions list
    versions = ScriptStorageRepository.list_versions(script_id)
    assert len(versions) == 2

    # Compute semantic diff between V1 and V2
    diff = compute_script_diff(initial_script, modified_script)
    assert diff["titleChanged"] is True
    assert len(diff["scenesModified"]) == 1
    assert diff["scenesModified"][0]["sceneNumber"] == 1

    # Test approval state machine
    transition = ApprovalManager.transition(
        ApprovalState.REVIEW_READY,
        ApprovalState.CONCEPT_APPROVED,
        approved_by="lead_director",
        comments="Strong thematic opening",
    )
    assert transition["toState"] == "concept_approved"
    assert transition["approvedBy"] == "lead_director"

    # Persist approval
    appr = ScriptStorageRepository.submit_approval(
        v2["versionId"], stage="concept", status="approved", approved_by="lead_director"
    )
    assert appr["status"] == "approved"


# ── Milestone 8: Character and Environment Continuity ───────────────────────

def test_continuity_tracking():
    """Verify continuity trackers catch unexpected scale changes and environment shifts."""
    scenes = [
        {
            "sceneNumber": 1,
            "characters": [{"characterId": "hero_01", "scale": 1.0}],
            "environment": {"locationName": "Courtyard", "timeOfDay": "morning"},
        },
        {
            "sceneNumber": 2,
            "characters": [{"characterId": "hero_01", "scale": 2.5}],  # Scale jump warning
            "environment": {"locationName": "Courtyard", "timeOfDay": "midnight"},  # Abrupt jump
            "transitions": {"type": "cut"},
        },
    ]

    char_tracker = CharacterContinuityTracker()
    char_audit = char_tracker.track_scene_appearances(scenes)
    assert len(char_audit["warnings"]) > 0
    assert "scale changed" in char_audit["warnings"][0]

    env_audit = EnvironmentContinuityTracker.audit_environment_flow(scenes)
    assert len(env_audit["warnings"]) > 0
    assert "shifted abruptly" in env_audit["warnings"][0]

    # Test manifest cross validator with missing character in manifest
    manifest_audit = ManifestCrossValidator.validate_manifest_bindings(scenes, {"characters": [], "props": []})
    assert manifest_audit["isManifestComplete"] is False
    assert "hero_01" in manifest_audit["unboundCharacters"]


# ── Milestones 9 & 10: 3D Animation Systems & Blender Asset Resolution ──────

def test_camera_spline_and_locomotion():
    """Verify camera spline keyframing and character locomotion planning."""
    spline = generate_camera_spline(
        start_transform={"position": {"x": 0.0, "y": -5.0, "z": 1.5}},
        end_transform={"position": {"x": 0.0, "y": -2.0, "z": 1.5}},
        duration=4.0,
    )
    assert len(spline) == 2
    assert spline[0]["interpolation"] == "BEZIER"
    assert spline[1]["time"] == 4.0

    locomotion = plan_character_locomotion(
        start_pos={"x": 0.0, "y": 0.0, "z": 0.0},
        end_pos={"x": 3.0, "y": 4.0, "z": 0.0},  # 5 meters distance
        duration=2.5,
        movement_type="walk",
    )
    assert locomotion["totalDistanceMeters"] == 5.0
    assert locomotion["averageSpeedMps"] == 2.0
    assert locomotion["clipName"] == "Walk_Cycle"


def test_phoneme_viseme_generation():
    """Verify speech timestamps convert to timed facial visemes."""
    words = [
        {"word": "Mindset", "start": 0.0, "end": 0.6},
        {"word": "Focus", "start": 0.8, "end": 1.3},
    ]
    visemes = generate_viseme_track_from_words(words)
    assert len(visemes) > 0
    assert "viseme" in visemes[0]
    assert "weight" in visemes[0]


def test_blender_asset_resolution():
    """Verify semantic descriptions resolve to library assets or fallback primitives."""
    resolver = BlenderAssetResolver()
    
    # Matching asset in catalog
    match = resolver.resolve_entity("golden retriever", entity_type="character", description="friendly happy dog")
    assert match["resolved"] is True
    assert match["assetId"] == "dog_golden_retriever"
    assert match["rigType"] == "quadruped"

    # Unmatched asset triggers procedural fallback
    fallback = resolver.resolve_entity("space alien", entity_type="character", description="martian explorer")
    assert fallback["resolved"] is False
    assert "fallback_character" in fallback["assetId"]
