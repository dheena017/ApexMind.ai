"""
backend/tests/test_visual_production_p2.py

Unit and integration test suite for Stage 3 Milestone P2:
Orchestration, 3-Tier Mode Routing & Scene Analyzer.
"""

import pytest
import shutil
import tempfile
from pathlib import Path

from backend.features.workspace.visual_production.schemas import (
    ProductionMode,
    SceneVisualStatus,
    VisualProductionRequest,
)
from backend.features.workspace.visual_production.engine.scene_analyzer import (
    analyze_scene_complexity,
    resolve_production_path,
)
from backend.features.workspace.visual_production.engine.visual_orchestrator import VisualOrchestrator
from backend.features.workspace.visual_production.storage.visual_storage import VisualStorageManager


@pytest.fixture
def temp_orchestrator():
    """Provides a VisualOrchestrator connected to an isolated temporary storage."""
    temp_dir = tempfile.mkdtemp(prefix="test_orch_p2_")
    orch = VisualOrchestrator()
    orch.storage = VisualStorageManager(base_media_dir=temp_dir)
    yield orch, Path(temp_dir)
    shutil.rmtree(temp_dir, ignore_errors=True)


def test_scene_complexity_analysis():
    """Verify scene complexity scoring and recommendation logic."""
    # 1. 3D recommendation: Characters + dynamic camera
    scene_3d = {
        "sceneNumber": 1,
        "characters": [{"name": "Cooper"}, {"name": "Maya"}],
        "camera": {"movement": "orbit"},
        "visualDescription": "Futuristic laboratory interior with neon illumination",
    }
    res_3d = analyze_scene_complexity(scene_3d)
    assert res_3d.characterCount == 2
    assert res_3d.hasDynamicCamera is True
    assert res_3d.recommendedPath == ProductionMode.THREE_D

    # 2. Hybrid recommendation: Character in natural landscape
    scene_hybrid = {
        "sceneNumber": 2,
        "characters": ["Cooper"],
        "camera": {"movement": "static"},
        "visualDescription": "Panoramic shot of foggy mountains and rocky autumn cliffs",
    }
    res_hybrid = analyze_scene_complexity(scene_hybrid)
    assert res_hybrid.characterCount == 1
    assert res_hybrid.isNatureOrLandscape is True
    assert res_hybrid.recommendedPath == ProductionMode.HYBRID

    # 3. Media recommendation: No characters, pure landscape
    scene_media = {
        "sceneNumber": 3,
        "characters": [],
        "camera": {"movement": "static"},
        "visualDescription": "Sun rising over misty forest valley with dramatic horizon",
    }
    res_media = analyze_scene_complexity(scene_media)
    assert res_media.characterCount == 0
    assert res_media.isNatureOrLandscape is True
    assert res_media.recommendedPath == ProductionMode.MEDIA


def test_three_tier_mode_resolution():
    """Verify 3-tier resolution: Scene Override > Project Mode > Automatic Classification."""
    sample_scene = {
        "characters": ["Cooper"],
        "camera": {"movement": "orbit"},
        "visualDescription": "Futuristic lab",
    }  # Content-based classification would be THREE_D

    # Tier 1: Per-scene override takes absolute precedence
    path, _ = resolve_production_path(
        project_mode=ProductionMode.MEDIA,
        scene_mode_override=ProductionMode.HYBRID,
        scene_data=sample_scene,
    )
    assert path == ProductionMode.HYBRID

    # Tier 2: Project mode applies when no scene override
    path, _ = resolve_production_path(
        project_mode=ProductionMode.MEDIA,
        scene_mode_override=None,
        scene_data=sample_scene,
    )
    assert path == ProductionMode.MEDIA

    # Tier 3: Automatic content classification triggers when mode is AUTOMATIC
    path, analysis = resolve_production_path(
        project_mode=ProductionMode.AUTOMATIC,
        scene_mode_override=None,
        scene_data=sample_scene,
    )
    assert path == ProductionMode.THREE_D
    assert analysis.characterCount == 1


@pytest.mark.anyio
async def test_batch_storyboard_visual_generation(temp_orchestrator):
    """Verify batch visual production across scenes with voice timeline alignment."""
    orch, temp_dir = temp_orchestrator
    script_id = "scr_8f716fa53031"

    req = VisualProductionRequest(
        scriptId=script_id,
        projectMode=ProductionMode.MEDIA,
        aspectRatio="9:16",
        autoRoute=True,
    )

    progress_events = []

    def on_prog(curr, total, msg):
        progress_events.append((curr, total, msg))

    resp = await orch.generate_storyboard_visuals(req, on_progress=on_prog)

    assert resp.success is True
    assert resp.scriptId == script_id
    assert resp.totalScenes == 8
    assert len(resp.scenes) == 8
    assert len(progress_events) == 8

    # Verify voice audio timeline alignment
    # Timeline should be monotonic: start(i) == end(i-1)
    prev_end = 0.0
    for scn in resp.scenes:
        assert scn.timelineStart == prev_end
        assert scn.timelineEnd > scn.timelineStart
        assert scn.version == 1
        assert scn.status == SceneVisualStatus.PREVIEW_READY
        assert scn.quality is not None
        assert scn.quality.passed is True
        assert Path(scn.videoPath).exists()
        assert Path(scn.thumbnailPath).exists()
        prev_end = scn.timelineEnd

    # Master timeline should equal total duration
    assert prev_end > 20.0


@pytest.mark.anyio
async def test_scene_selective_regeneration_and_versioning(temp_orchestrator):
    """Verify single scene regeneration increments version from v1 to v2."""
    orch, temp_dir = temp_orchestrator
    script_id = "scr_8f716fa53031"

    # 1. Initial generation
    req = VisualProductionRequest(scriptId=script_id, projectMode=ProductionMode.MEDIA)
    init_resp = await orch.generate_storyboard_visuals(req)
    s1 = init_resp.scenes[0]
    scene_id = s1.sceneId
    assert s1.version == 1

    # 2. Regenerate scene 1 with 3D override
    regen_out = await orch.regenerate_scene_visuals(
        script_id=script_id,
        scene_id=scene_id,
        mode_override=ProductionMode.THREE_D,
        prompt_override="Dramatic low-angle push in with golden fog",
    )
    assert regen_out.version == 2
    assert regen_out.modeUsed == ProductionMode.THREE_D
    assert Path(regen_out.videoPath).name == f"{scene_id}_v2.mp4"
    assert Path(regen_out.thumbnailPath).name == f"{scene_id}_v2_thumb.jpg"

    # Verify both v1 and v2 files are preserved on disk
    s_dir = orch.storage.get_script_dir(script_id)
    assert (s_dir / f"{scene_id}_v1.mp4").exists()
    assert (s_dir / f"{scene_id}_v2.mp4").exists()


def test_scene_approval_workflow(temp_orchestrator):
    """Verify scene preview approval and rejection state transitions."""
    orch, temp_dir = temp_orchestrator
    script_id = "scr_8f716fa53031"
    scene_id = "scn_01_f066b2"

    # 1. Approve scene
    app_res = orch.approve_scene(script_id, scene_id, approved=True)
    assert app_res["status"] == "approved"
    manifest = orch.storage.load_manifest(script_id)
    assert manifest["scenes"][scene_id]["status"] == "approved"

    # 2. Reject scene with feedback
    rej_res = orch.approve_scene(
        script_id, scene_id, approved=False, rejection_reason="Camera motion too fast"
    )
    assert rej_res["status"] == "rejected"
    assert rej_res["rejectionReason"] == "Camera motion too fast"
    manifest2 = orch.storage.load_manifest(script_id)
    assert manifest2["scenes"][scene_id]["status"] == "rejected"
    assert manifest2["scenes"][scene_id]["rejectionReason"] == "Camera motion too fast"
