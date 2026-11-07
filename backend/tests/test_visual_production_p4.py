"""
backend/tests/test_visual_production_p4.py

Unit and integration test suite for Stage 3 Milestone P4:
Path B: 3D Blender Procedural Production Engine.
"""

import pytest
import shutil
import tempfile
from pathlib import Path

from backend.features.workspace.visual_production.three_d.blender_executor import blender_executor
from backend.features.workspace.visual_production.three_d.generators.three_d_engine import ThreeDEngine
from backend.features.workspace.visual_production.schemas import LicenseType


@pytest.fixture
def temp_three_d_engine():
    """Provides a ThreeDEngine with isolated temporary render directory."""
    temp_dir = tempfile.mkdtemp(prefix="test_3d_p4_")
    engine = ThreeDEngine()
    engine.render_dir = Path(temp_dir)
    yield engine, Path(temp_dir)
    shutil.rmtree(temp_dir, ignore_errors=True)


def test_blender_executor_availability():
    """Verify Blender 5.2 executable discovery on host."""
    assert blender_executor.is_available() is True
    assert blender_executor.blender_path is not None
    assert Path(blender_executor.blender_path).exists()


def test_produce_scene_3d_procedural_render(temp_three_d_engine):
    """Verify headless Blender render execution with procedural staging and camera animation."""
    engine, temp_dir = temp_three_d_engine
    script_id = "scr_8f716fa53031"
    scene_id = "scn_01_3d"
    scene_data = {
        "visualDescription": "Futuristic neon laboratory with reflective floor",
        "characters": [{"name": "Cooper"}],
        "camera": {"movement": "push_in"},
    }
    target_dur = 1.0  # Fast 1.0 second test (30 frames)

    video_bytes, thumb_bytes, provenance = engine.produce_scene_3d(
        script_id=script_id,
        scene_id=scene_id,
        scene_data=scene_data,
        target_duration=target_dur,
        aspect_ratio="9:16",
    )

    assert len(video_bytes) > 2000
    assert len(thumb_bytes) > 200
    assert provenance.provider == "procedural_blender"
    assert provenance.licenseType == LicenseType.PROCEDURAL
    assert provenance.commercialUseAllowed is True
    assert len(provenance.sha256) == 64


def test_three_d_engine_fallback_graceful(temp_three_d_engine):
    """Verify graceful fallback plate generation if Blender is unreachable."""
    engine, temp_dir = temp_three_d_engine
    out_path = temp_dir / "fallback_test.mp4"
    bytes_out = engine._generate_fallback_3d_plate(
        out_path=out_path,
        target_duration=1.5,
        width=1080,
        height=1920,
        camera_movement="orbit",
    )
    assert len(bytes_out) > 500
    assert out_path.exists()

