"""
backend/features/workspace/visuals_3d/engines/webgl_engine.py
In-Browser 60 FPS WebGL Canvas Stream Processor.
Normalizes recorded WebM streams from frontend Three.js viewport into MP4 video clips.
"""

import logging
from pathlib import Path
import subprocess
import time
from typing import Any, Dict

from .base_engine import Base3DRenderEngine

logger = logging.getLogger("ApexMind.Workspace.Visuals3D.Engine.WebGL")

FFMPEG_EXE = r"C:\Users\dheen\AppData\Local\Microsoft\WinGet\Links\ffmpeg.exe"
OUTPUT_DIR = Path("backend/data/rendered_shorts/3d_scenes")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


class WebGLEngine(Base3DRenderEngine):
    name: str = "webgl"
    display_name: str = "WebGL 60 FPS (In-Browser GPU)"
    typical_duration_sec: float = 0.5

    def is_available(self) -> bool:
        return Path(FFMPEG_EXE).exists()

    def render_scene(self, request_payload: Dict[str, Any]) -> Dict[str, Any]:
        # Handled primarily client-side; server acts as normalizer
        clip_id = request_payload.get("clipId") or f"webgl_{int(time.time())}"
        return {
            "success": True,
            "clipId": clip_id,
            "engineUsed": self.name,
            "message": "WebGL canvas recorder ready for client stream",
        }

    def convert_webm_to_mp4(self, input_webm_path: Path, output_mp4_path: Path) -> bool:
        """Converts raw browser webm recording to broadcast MP4 container."""
        try:
            cmd = [
                FFMPEG_EXE,
                "-i", str(input_webm_path),
                "-c:v", "libx264",
                "-preset", "veryfast",
                "-pix_fmt", "yuv420p",
                "-c:a", "aac",
                "-y",
                str(output_mp4_path),
            ]
            subprocess.run(cmd, check=True, capture_output=True)
            return output_mp4_path.exists()
        except Exception as e:
            logger.error(f"[WebGL/FFmpeg] Transcoding error: {e}")
            return False

