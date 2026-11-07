"""
backend/tests/test_visual_production_p5.py

Unit and integration test suite for Stage 3 Milestone P5:
Path C: Hybrid Compositing Production Engine.
"""

import pytest
import shutil
import tempfile
from pathlib import Path

from backend.features.workspace.visual_production.hybrid.hybrid_engine import HybridEngine
from backend.features.workspace.visual_production.schemas import LicenseType


@pytest.fixture
def temp_hybrid_engine():
    """Provides a HybridEngine with isolated temporary directory."""
    temp_dir = tempfile.mkdtemp(prefix="test_hybrid_p5_")
    engine = HybridEngine()
    engine.hybrid_dir = Path(temp_dir)
    yield engine, Path(temp_dir)
    shutil.rmtree(temp_dir, ignore_errors=True)


def test_produce_scene_hybrid_compositing(temp_hybrid_engine):
    """Verify hybrid compositing of background plate and foreground 3D layer."""
    engine, temp_dir = temp_hybrid_engine
    script_id = "scr_8f716fa53031"
    scene_id = "scn_02_hybrid"
    scene_data = {
        "visualDescription": "Foggy mountain landscape with golden autumn cliffs",
        "characters": [{"name": "Cooper"}],
        "camera": {"movement": "push_in"},
    }
    target_dur = 1.0  # 1-second test

    video_bytes, thumb_bytes, provenance = engine.produce_scene_hybrid(
        script_id=script_id,
        scene_id=scene_id,
        scene_data=scene_data,
        target_duration=target_dur,
        aspect_ratio="9:16",
    )

    assert len(video_bytes) > 2000
    assert len(thumb_bytes) > 200
    assert provenance.provider == "hybrid_composite"
    assert provenance.licenseType == LicenseType.CUSTOM
    assert provenance.commercialUseAllowed is True
    assert len(provenance.sha256) == 64

