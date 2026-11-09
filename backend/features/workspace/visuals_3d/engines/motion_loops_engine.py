"""
backend/features/workspace/visuals_3d/engines/motion_loops_engine.py
Ultra-Fast 3D CGI Motion Loop Engine (~2-3 Seconds).
Crops high-definition 3D video loops to vertical 9:16, trims duration,
burns kinetic subtitles, and outputs broadcast MP4 via native FFmpeg.
"""

import json
import logging
import os
from pathlib import Path
import subprocess
import time
from typing import Any, Dict, Optional

from .base_engine import Base3DRenderEngine
try:
    from ..providers.pixabay_3d import Pixabay3DProvider
except Exception:
    try:
        from providers.pixabay_3d import Pixabay3DProvider
    except Exception:
        from backend.features.workspace.visuals_3d.providers.pixabay_3d import Pixabay3DProvider


logger = logging.getLogger("ApexMind.Workspace.Visuals3D.Engine.MotionLoop")

FFMPEG_EXE = r"C:\Users\dheen\AppData\Local\Microsoft\WinGet\Links\ffmpeg.exe"
OUTPUT_DIR = Path("backend/data/rendered_shorts/3d_scenes")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
CACHE_DIR = Path("backend/data/cache/media")
CACHE_DIR.mkdir(parents=True, exist_ok=True)


class MotionLoops3DEngine(Base3DRenderEngine):
    name: str = "motion_loop"
    display_name: str = "3D Motion Loop Engine (~2-3s)"
    typical_duration_sec: float = 2.5

    def __init__(self):
        self.provider = Pixabay3DProvider()

    def is_available(self) -> bool:
        return Path(FFMPEG_EXE).exists() and self.provider.is_configured()

    def render_scene(self, request_payload: Dict[str, Any]) -> Dict[str, Any]:
        t0 = time.time()
        query = request_payload.get("query", "space celestial 3d")
        duration = float(request_payload.get("durationSeconds", 3.0))
        scene_id = request_payload.get("sceneId") or f"loop_{int(time.time())}"
        subtitles = request_payload.get("subtitles") or {}
        audio_url = request_payload.get("audioTrackUrl")

        # 1. Query live Pixabay 3D API
        hits = self.provider.search(query=query, page=1, page_size=5)
        if not hits:
            # Fallback query if specific term returned empty
            hits = self.provider.search(query="3d animation loop", page=1, page_size=5)

        if not hits:
            raise RuntimeError(f"Could not resolve 3D motion loop for query '{query}'")

        chosen_hit = hits[0]
        remote_video_url = chosen_hit["assetUrl"]

        # 2. Cache raw video file
        raw_cache_path = CACHE_DIR / f"{chosen_hit['id']}.mp4"
        if not raw_cache_path.exists():
            import urllib.request
            req = urllib.request.Request(remote_video_url, headers={"User-Agent": "ApexMindStudio/1.0"})
            with urllib.request.urlopen(req, timeout=12.0) as resp, open(raw_cache_path, "wb") as f:
                f.write(resp.read())

        # 3. Create ASS subtitles if text provided
        ass_path = None
        subtitle_filter = []
        subtitle_text = subtitles.get("text", "").strip() if isinstance(subtitles, dict) else ""
        if subtitle_text:
            ass_path = OUTPUT_DIR / f"{scene_id}.ass"
            ass_content = f"""[Script Info]
Title: 3D Scene
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: ViralYellow,Impact,76,&H0015CCFA,&H000000FF,&H00000000,&H90000000,-1,0,0,0,100,100,2,0,1,5,3,2,40,40,420,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
Dialogue: 0,0:00:00.00,0:00:{duration:05.2f},ViralYellow,,0,0,0,,{{\\fscx120\\fscy120}}{subtitle_text}{{\\fscx100\\fscy100}}
"""
            ass_path.write_text(ass_content, encoding="utf-8")
            # Escape path for FFmpeg ass filter
            escaped_ass = str(ass_path).replace("\\", "/").replace(":", "\\:")
            subtitle_filter = [f"ass={escaped_ass}"]

        # 4. Transcode to vertical 9:16 with FFmpeg
        out_mp4_path = OUTPUT_DIR / f"{scene_id}_9x16.mp4"
        vf_filters = [
            "scale=1080:1920:force_original_aspect_ratio=increase",
            "crop=1080:1920",
            "setsar=1",
        ] + subtitle_filter

        ffmpeg_cmd = [
            FFMPEG_EXE,
            "-ss", "00:00:00",
            "-t", str(duration),
            "-i", str(raw_cache_path),
            "-vf", ",".join(vf_filters),
            "-r", "30",
            "-c:v", "libx264",
            "-preset", "veryfast",
            "-pix_fmt", "yuv420p",
            "-c:a", "aac",
            "-y",
            str(out_mp4_path),
        ]

        subprocess.run(ffmpeg_cmd, check=True, capture_output=True)

        # 5. Extract preview frame
        preview_frame_path = OUTPUT_DIR / f"{scene_id}_thumb.jpg"
        subprocess.run([
            FFMPEG_EXE,
            "-ss", "00:00:01",
            "-i", str(out_mp4_path),
            "-frames:v", "1",
            "-q:v", "2",
            "-y",
            str(preview_frame_path),
        ], capture_output=True)

        elapsed = time.time() - t0
        file_size = out_mp4_path.stat().st_size if out_mp4_path.exists() else 0

        return {
            "success": True,
            "sceneId": scene_id,
            "videoUrl": f"/api/workspace/3d-assets/file/rendered/{out_mp4_path.name}",
            "localVideoPath": str(out_mp4_path),
            "thumbnailUrl": f"/api/workspace/3d-assets/file/rendered/{preview_frame_path.name}",
            "durationSeconds": duration,
            "resolution": "1080x1920",
            "aspectRatio": "9:16",
            "engineUsed": self.name,
            "renderTimeSeconds": round(elapsed, 2),
            "fileSizeBytes": file_size,
        }
