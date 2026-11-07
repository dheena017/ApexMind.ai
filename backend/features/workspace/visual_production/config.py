"""
backend/features/workspace/visual_production/config.py

Runtime environment configuration and executable path discovery
for Stage 3: Visual Production.
"""

import os
import shutil
from pathlib import Path
from typing import Optional


class VisualProductionConfig:
    """Central configuration for Visual Production pipelines."""

    def __init__(self):
        # ── Executable Path Discovery ──────────────────────────────────────────
        self.blender_path: Optional[str] = self._discover_blender()
        self.ffmpeg_path: str = os.environ.get("FFMPEG_PATH") or shutil.which("ffmpeg") or "ffmpeg"
        self.ffprobe_path: str = os.environ.get("FFPROBE_PATH") or shutil.which("ffprobe") or "ffprobe"

        # ── Concurrency & Resource Guardrails ──────────────────────────────────
        # Windows 16GB host limit: Single serialized render queue to prevent OOM
        self.max_concurrent_blender_workers: int = int(os.environ.get("MAX_BLENDER_WORKERS", "1"))
        self.max_concurrent_media_workers: int = int(os.environ.get("MAX_MEDIA_WORKERS", "4"))
        self.blender_timeout_seconds: int = int(os.environ.get("BLENDER_TIMEOUT_SECONDS", "300"))
        self.media_download_timeout_seconds: int = int(os.environ.get("MEDIA_DOWNLOAD_TIMEOUT_SECONDS", "30"))

        # ── Output Specs & Tolerances ──────────────────────────────────────────
        self.default_aspect_ratio: str = "9:16"
        self.default_width_9_16: int = 1080
        self.default_height_9_16: int = 1920
        self.default_width_16_9: int = 1920
        self.default_height_16_9: int = 1080
        self.default_fps: float = 30.0
        self.cinematic_fps: float = 60.0
        self.max_duration_drift_seconds: float = 0.10
        self.min_passing_quality_score: float = 0.70

        # ── Storage Directories ────────────────────────────────────────────────
        self.media_root: Path = Path(os.environ.get("MEDIA_DIR", "media")).resolve()
        self.visuals_dir: Path = (self.media_root / "visuals").resolve()
        self.visuals_dir.mkdir(parents=True, exist_ok=True)
        self.temp_render_dir: Path = (self.media_root / "cache" / "renders").resolve()
        self.temp_render_dir.mkdir(parents=True, exist_ok=True)

    def _discover_blender(self) -> Optional[str]:
        """Finds Blender 5.2+ or installed LTS executable on the host."""
        env_path = os.environ.get("BLENDER_PATH")
        if env_path and Path(env_path).is_file():
            return env_path

        # Standard Windows installation candidates
        candidates = [
            r"C:\Program Files\Blender Foundation\Blender 5.2\blender.exe",
            r"C:\Program Files\Blender Foundation\Blender 5.1\blender.exe",
            r"C:\Program Files\Blender Foundation\Blender 5.0\blender.exe",
            r"C:\Program Files\Blender Foundation\Blender 4.3\blender.exe",
            r"C:\Program Files\Blender Foundation\Blender 4.2\blender.exe",
        ]
        for c in candidates:
            if Path(c).is_file():
                return c

        which_blender = shutil.which("blender")
        if which_blender:
            return which_blender

        return None

    def get_resolution(self, aspect_ratio: str = "9:16") -> tuple[int, int]:
        """Returns (width, height) for the requested aspect ratio."""
        if aspect_ratio == "16:9":
            return (self.default_width_16_9, self.default_height_16_9)
        return (self.default_width_9_16, self.default_height_9_16)


# Singleton instance
visual_config = VisualProductionConfig()

