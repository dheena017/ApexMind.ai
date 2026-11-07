"""
backend/tests/test_visual_production_p1.py

Unit test suite for Stage 3 Milestone P1:
Contracts, Schemas, Configuration & Storage Engine.
"""

import shutil
import tempfile
from pathlib import Path
import pytest

from backend.features.workspace.visual_production.schemas import (
    ProductionMode,
    SceneVisualStatus,
    VisualQualityTier,
    LicenseType,
    AssetLicenseProvenance,
    TechnicalQualityMetrics,
    AestheticQualityMetrics,
    ComplianceMetrics,
    QualityGateResult,
    SceneVisualOutput,
    VisualProductionRequest,
    VisualProductionResponse,
    SceneRegenerateRequest,
    SceneApprovalRequest,
)
from backend.features.workspace.visual_production.config import visual_config, VisualProductionConfig
from backend.features.workspace.visual_production.storage.visual_storage import VisualStorageManager


@pytest.fixture
def temp_storage():
    """Provides a temporary VisualStorageManager instance with cleanup."""
    temp_dir = tempfile.mkdtemp(prefix="test_visual_storage_")
    storage = VisualStorageManager(base_media_dir=temp_dir)
    yield storage, Path(temp_dir)
    shutil.rmtree(temp_dir, ignore_errors=True)


def test_production_modes_and_statuses():
    """Verify production modes, quality tiers, and status enumerations."""
    assert ProductionMode.MEDIA == "media"
    assert ProductionMode.THREE_D == "three_d"
    assert ProductionMode.HYBRID == "hybrid"
    assert ProductionMode.AUTOMATIC == "automatic"

    assert SceneVisualStatus.DRAFT == "draft"
    assert SceneVisualStatus.PREVIEW_READY == "preview_ready"
    assert SceneVisualStatus.APPROVED == "approved"
    assert SceneVisualStatus.REJECTED == "rejected"
    assert SceneVisualStatus.FAILED == "failed"

    assert VisualQualityTier.CINEMATIC == "cinematic"
    assert LicenseType.CC0 == "CC0"
    assert LicenseType.PEXELS == "Pexels"


def test_asset_provenance_contract():
    """Verify license provenance schema serialization and constraints."""
    provenance = AssetLicenseProvenance(
        provider="pexels",
        licenseType=LicenseType.PEXELS,
        commercialUseAllowed=True,
        attributionRequired=False,
        sourceUrl="https://images.pexels.com/videos/12345.mp4",
        assetId="px_12345",
        sha256="abc123456789deadbeef",
        verifiedAt="2026-11-07T12:00:00Z",
    )
    assert provenance.provider == "pexels"
    assert provenance.commercialUseAllowed is True
    assert provenance.licenseType == LicenseType.PEXELS


def test_quality_gate_result_contract():
    """Verify 3-category Quality Gate metrics modeling."""
    tech = TechnicalQualityMetrics(
        resolution="1080x1920",
        width=1080,
        height=1920,
        fps=30.0,
        targetDuration=4.5,
        actualDuration=4.52,
        durationDriftSeconds=0.02,
        codec="h264",
        passed=True,
    )
    aesthetic = AestheticQualityMetrics(
        aspectRatioAdherence=True,
        framingScore=0.92,
        motionDynamicsScore=0.88,
        characterContinuityScore=1.0,
        visualAestheticScore=0.90,
        passed=True,
    )
    compliance = ComplianceMetrics(
        commercialLicensingPassed=True,
        watermarkDetected=False,
        safetyContentPassed=True,
        passed=True,
    )
    qg = QualityGateResult(
        passed=True,
        overallScore=0.93,
        tier=VisualQualityTier.CINEMATIC,
        category1Technical=tech,
        category2Aesthetic=aesthetic,
        category3Compliance=compliance,
        failures=[],
        warnings=["Slight motion blur on background edge"],
    )
    assert qg.passed is True
    assert qg.category1Technical.durationDriftSeconds == 0.02
    assert qg.category2Aesthetic.characterContinuityScore == 1.0
    assert qg.category3Compliance.commercialLicensingPassed is True


def test_scene_visual_output_and_responses():
    """Verify SceneVisualOutput and top-level response contracts."""
    scene_out = SceneVisualOutput(
        sceneId="scn_01_a1b2c3",
        sceneNumber=1,
        status=SceneVisualStatus.PREVIEW_READY,
        modeRequested=ProductionMode.MEDIA,
        modeUsed=ProductionMode.MEDIA,
        version=1,
        videoPath="/media/visuals/scr_123/scn_01_v1.mp4",
        videoUrl="/media/visuals/scr_123/scn_01_v1.mp4",
        duration=3.5,
        timelineStart=0.0,
        timelineEnd=3.5,
        updatedAt="2026-11-07T12:00:00Z",
    )
    resp = VisualProductionResponse(
        scriptId="scr_123",
        projectMode=ProductionMode.MEDIA,
        scenes=[scene_out],
        totalScenes=1,
        approvedCount=0,
        pendingApprovalCount=1,
        overallQualityScore=0.91,
        generatedAt="2026-11-07T12:00:00Z",
    )
    assert resp.success is True
    assert resp.totalScenes == 1
    assert resp.scenes[0].sceneId == "scn_01_a1b2c3"


def test_visual_config_discovery():
    """Verify host discovery and configuration settings."""
    cfg = visual_config
    assert cfg.default_aspect_ratio == "9:16"
    assert cfg.max_concurrent_blender_workers == 1
    assert cfg.max_concurrent_media_workers >= 1
    assert cfg.max_duration_drift_seconds == 0.10
    assert cfg.get_resolution("9:16") == (1080, 1920)
    assert cfg.get_resolution("16:9") == (1920, 1080)
    # Check Blender path discovery on host
    assert cfg.blender_path is not None
    assert "blender.exe" in cfg.blender_path.lower()


def test_visual_storage_lifecycle(temp_storage):
    """Verify versioning, atomic writes, manifest sidecars, and rollback."""
    storage, temp_dir = temp_storage
    script_id = "scr_test_visual_001"
    scene_id = "scn_01"

    # 1. Version 1 save
    dummy_video_v1 = b"FAKE_MP4_BYTES_V1"
    path1, url1, v1 = storage.save_scene_video(script_id, scene_id, dummy_video_v1)
    assert v1 == 1
    assert path1.exists()
    assert path1.name == "scn_01_v1.mp4"
    assert url1 == f"/media/visuals/{script_id}/scn_01_v1.mp4"

    # 2. Thumbnail save
    dummy_thumb = b"FAKE_JPEG_BYTES"
    t_path, t_url, t_v = storage.save_scene_thumbnail(script_id, scene_id, dummy_thumb, version=1)
    assert t_v == 1
    assert t_path.name == "scn_01_v1_thumb.jpg"

    # 3. Next version computation
    next_v = storage.get_next_scene_version(script_id, scene_id)
    assert next_v == 2

    # 4. Version 2 save
    dummy_video_v2 = b"FAKE_MP4_BYTES_V2"
    path2, url2, v2 = storage.save_scene_video(script_id, scene_id, dummy_video_v2)
    assert v2 == 2
    assert path2.name == "scn_01_v2.mp4"
    assert storage.get_active_scene_version(script_id, scene_id) == 2

    # 5. Manifest sidecar load/save
    manifest = storage.load_manifest(script_id)
    assert manifest["scriptId"] == script_id
    manifest["scenes"][scene_id] = {"status": "preview_ready", "activeVersion": 2}
    storage.save_manifest(script_id, manifest)

    reloaded = storage.load_manifest(script_id)
    assert reloaded["scenes"][scene_id]["activeVersion"] == 2

    # 6. Failed regeneration rollback
    storage.save_scene_video(script_id, scene_id, b"BROKEN_BYTES", version=3)
    assert (storage.get_script_dir(script_id) / "scn_01_v3.mp4").exists()
    storage.rollback_failed_regeneration(script_id, scene_id, failed_version=3)
    assert not (storage.get_script_dir(script_id) / "scn_01_v3.mp4").exists()
    # Confirm v2 is still intact
    assert path2.exists()

    # 7. Master preview promotion
    m_path, m_url, m_v = storage.save_master_preview(script_id, b"MASTER_PREVIEW_BYTES")
    assert m_v == 1
    assert m_path.name == "visual_master.mp4"
    assert (storage.get_script_dir(script_id) / "visual_master_v1.mp4").exists()

