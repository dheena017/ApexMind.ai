"""
backend/tests/test_visual_production_p6.py

Unit and integration test suite for Stage 3 Milestone P6:
3-Category Quality Gate & Scene Approval Lifecycle.
"""

import pytest
import shutil
import tempfile
from pathlib import Path

from backend.features.workspace.visual_production.quality.quality_gate import QualityGate
from backend.features.workspace.visual_production.engine.approval_manager import ApprovalManager
from backend.features.workspace.visual_production.media.media_engine import media_engine
from backend.features.workspace.visual_production.storage.visual_storage import VisualStorageManager
from backend.features.workspace.visual_production.schemas import (
    AssetLicenseProvenance,
    LicenseType,
    SceneVisualStatus,
)


@pytest.fixture
def temp_quality_and_approval():
    """Provides isolated storage and approval manager for testing."""
    temp_dir = tempfile.mkdtemp(prefix="test_p6_qg_")
    storage = VisualStorageManager(base_media_dir=temp_dir)
    appr_mgr = ApprovalManager()
    appr_mgr.storage = storage
    qg = QualityGate()
    yield qg, appr_mgr, storage, Path(temp_dir)
    shutil.rmtree(temp_dir, ignore_errors=True)


def test_quality_gate_category1_and_category2(temp_quality_and_approval):
    """Verify Category 1 (technical) and Category 2 (aesthetic) evaluation on real MP4."""
    qg, appr_mgr, storage, temp_dir = temp_quality_and_approval
    test_mp4 = temp_dir / "test_eval.mp4"
    target_dur = 2.0

    # Generate test video clip
    media_engine._generate_synthetic_media_plate(
        out_path=test_mp4,
        target_duration=target_dur,
        width=1080,
        height=1920,
        query="Autumn Town Square",
    )

    provenance = AssetLicenseProvenance(
        provider="pexels",
        licenseType=LicenseType.PEXELS,
        commercialUseAllowed=True,
        attributionRequired=False,
        sourceUrl="https://pexels.com/video/1",
        verifiedAt="2026-11-07T12:00:00Z",
    )

    result = qg.evaluate_scene_visuals(
        video_path=test_mp4,
        target_duration=target_dur,
        aspect_ratio="9:16",
        provenance=provenance,
    )

    assert result.passed is True
    assert result.overallScore >= 0.85
    assert result.category1Technical.passed is True
    assert result.category1Technical.width == 1080
    assert result.category1Technical.height == 1920
    assert result.category1Technical.durationDriftSeconds <= 0.10
    assert result.category2Aesthetic.passed is True
    assert result.category2Aesthetic.aspectRatioAdherence is True
    assert result.category3Compliance.passed is True


def test_quality_gate_category3_compliance_rejection(temp_quality_and_approval):
    """Verify Category 3 rejects assets that prohibit commercial use."""
    qg, appr_mgr, storage, temp_dir = temp_quality_and_approval
    test_mp4 = temp_dir / "test_noncommercial.mp4"
    test_mp4.write_bytes(b"NON_COMMERCIAL_TEST")

    non_comm_provenance = AssetLicenseProvenance(
        provider="sketchy_source",
        licenseType=LicenseType.CUSTOM,
        commercialUseAllowed=False,  # Prohibited!
        attributionRequired=True,
        sourceUrl="https://example.com/restricted.mp4",
        verifiedAt="2026-11-07T12:00:00Z",
    )

    result = qg.evaluate_scene_visuals(
        video_path=test_mp4,
        target_duration=2.0,
        aspect_ratio="9:16",
        provenance=non_comm_provenance,
    )

    assert result.passed is False
    assert result.category3Compliance.passed is False
    assert any("Commercial usage prohibited" in f for f in result.failures)


def test_approval_lifecycle_and_master_compilation(temp_quality_and_approval):
    """Verify scene approval state transitions and master video compilation on full approval."""
    qg, appr_mgr, storage, temp_dir = temp_quality_and_approval
    script_id = "scr_approval_test_01"

    # Create 2 approved scenes with real video bytes
    s_dir = storage.get_script_dir(script_id)
    s1_path = s_dir / "scn_01_v1.mp4"
    s2_path = s_dir / "scn_02_v1.mp4"

    media_engine._generate_synthetic_media_plate(s1_path, target_duration=1.0, width=1080, height=1920, query="Scene 1")
    media_engine._generate_synthetic_media_plate(s2_path, target_duration=1.0, width=1080, height=1920, query="Scene 2")

    # Initial manifest with 2 scenes in preview_ready
    manifest = {
        "scriptId": script_id,
        "scenes": {
            "scn_01": {"sceneNumber": 1, "activeVersion": 1, "status": "preview_ready"},
            "scn_02": {"sceneNumber": 2, "activeVersion": 1, "status": "preview_ready"},
        },
    }
    storage.save_manifest(script_id, manifest)

    # 1. Approve scene 1 -> master not yet compiled
    res1 = appr_mgr.approve_scene(script_id, "scn_01", approved=True)
    assert res1["status"] == "approved"
    assert res1["masterPreviewUrl"] is None

    # 2. Reject scene 2 with feedback
    res2 = appr_mgr.approve_scene(script_id, "scn_02", approved=False, rejection_reason="Subject lighting too harsh")
    assert res2["status"] == "rejected"
    assert res2["rejectionReason"] == "Subject lighting too harsh"
    assert res2["masterPreviewUrl"] is None

    # 3. Now user approves scene 2 -> triggers master preview compilation!
    res2_app = appr_mgr.approve_scene(script_id, "scn_02", approved=True)
    assert res2_app["status"] == "approved"
    assert res2_app["masterPreviewUrl"] == f"/media/visuals/{script_id}/visual_master.mp4"

    # Verify master video exists on disk
    master_file = storage.get_script_dir(script_id) / "visual_master.mp4"
    assert master_file.exists()
    assert master_file.stat().st_size > 1000
