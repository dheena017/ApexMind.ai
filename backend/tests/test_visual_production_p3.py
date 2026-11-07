"""
backend/tests/test_visual_production_p3.py

Unit test suite for Stage 3 Milestone P3:
Path A: Stock & Curated Media Production Engine.
"""

import pytest
import shutil
import subprocess
import tempfile
from pathlib import Path

from backend.features.workspace.visual_production.media.media_engine import MediaEngine
from backend.features.workspace.visual_production.config import visual_config
from backend.features.workspace.visual_production.schemas import LicenseType


@pytest.fixture
def temp_media_engine():
    """Provides a MediaEngine instance with isolated cache directory."""
    temp_dir = tempfile.mkdtemp(prefix="test_media_p3_")
    engine = MediaEngine()
    engine.cache_dir = Path(temp_dir)
    yield engine, Path(temp_dir)
    shutil.rmtree(temp_dir, ignore_errors=True)


def test_synthetic_plate_generation(temp_media_engine):
    """Verify synthetic cinematic plate generation via FFmpeg."""
    engine, temp_dir = temp_media_engine
    out_path = temp_dir / "test_synthetic.mp4"
    target_dur = 3.5

    engine._generate_synthetic_media_plate(
        out_path=out_path,
        target_duration=target_dur,
        width=1080,
        height=1920,
        query="Autumn Town Square with golden leaves",
    )

    assert out_path.exists()
    assert out_path.stat().st_size > 1000

    # Probe duration and resolution using FFprobe
    ffprobe_bin = visual_config.ffprobe_path
    cmd = [
        ffprobe_bin,
        "-v", "error",
        "-select_streams", "v:0",
        "-show_entries", "stream=width,height,duration",
        "-of", "default=noprint_wrappers=1:nokey=1",
        str(out_path),
    ]
    res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    assert res.returncode == 0
    lines = res.stdout.decode().strip().split("\n")
    w = int(lines[0].strip())
    h = int(lines[1].strip())
    assert w == 1080
    assert h == 1920


def test_poster_thumbnail_extraction(temp_media_engine):
    """Verify poster JPEG extraction from an MP4 video."""
    engine, temp_dir = temp_media_engine
    vid_path = temp_dir / "test_video.mp4"
    thumb_path = temp_dir / "test_thumb.jpg"

    engine._generate_synthetic_media_plate(
        out_path=vid_path,
        target_duration=2.0,
        width=1080,
        height=1920,
        query="Forest lake",
    )

    engine._extract_poster_thumbnail(vid_path, thumb_path, time_offset=0.5)
    assert thumb_path.exists()
    assert thumb_path.stat().st_size > 500


def test_resolve_and_produce_scene_media_end_to_end(temp_media_engine):
    """Verify full Path A resolution, adaptation, and license provenance."""
    engine, temp_dir = temp_media_engine
    script_id = "scr_8f716fa53031"
    scene_id = "scn_01"
    scene_data = {
        "visualDescription": "A low-angle shot of autumn leaves floating in the wind",
        "narration": "Every ten years the sky changes color.",
    }
    target_duration = 4.0

    video_bytes, thumb_bytes, provenance = engine.resolve_and_produce_scene_media(
        script_id=script_id,
        scene_id=scene_id,
        scene_data=scene_data,
        target_duration=target_duration,
        aspect_ratio="9:16",
    )

    assert len(video_bytes) > 2000
    assert len(thumb_bytes) > 200
    assert provenance.provider in {"pexels", "pixabay", "wikimedia", "procedural_synthetic"}
    assert provenance.commercialUseAllowed is True
    assert len(provenance.sha256) == 64

