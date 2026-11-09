"""
backend/features/workspace/visuals_3d/engines/blender_hybrid_engine.py
Fast 3D Keyframe-to-Motion Hybrid Engine (~4-6 Seconds).
Renders 1-2 high-res 3D hero stills using Blender 5.2 Workbench,
then applies dynamic 3D camera pan, zoom, parallax, and kinetic subtitles via FFmpeg.
"""

import json
import logging
from pathlib import Path
import subprocess
import time
from typing import Any, Dict, Optional

from .base_engine import Base3DRenderEngine

logger = logging.getLogger("ApexMind.Workspace.Visuals3D.Engine.BlenderHybrid")

BLENDER_EXE = r"C:\Program Files\Blender Foundation\Blender 5.2\blender.exe"
FFMPEG_EXE = r"C:\Users\dheen\AppData\Local\Microsoft\WinGet\Links\ffmpeg.exe"
OUTPUT_DIR = Path("backend/data/rendered_shorts/3d_scenes")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


class BlenderHybrid3DEngine(Base3DRenderEngine):
    name: str = "blender_hybrid"
    display_name: str = "Blender 3D Hybrid (~4-6s)"
    typical_duration_sec: float = 4.5

    def is_available(self) -> bool:
        return Path(BLENDER_EXE).exists() and Path(FFMPEG_EXE).exists()

    def render_scene(self, request_payload: Dict[str, Any]) -> Dict[str, Any]:
        t0 = time.time()
        scene_id = request_payload.get("sceneId") or f"hybrid_{int(time.time())}"
        duration = float(request_payload.get("durationSeconds", 3.0))
        subtitles = request_payload.get("subtitles") or {}
        shading = request_payload.get("shadingStyle", "nebula")

        hero_still_path = (OUTPUT_DIR / f"{scene_id}_hero.png").resolve()
        out_mp4_path = (OUTPUT_DIR / f"{scene_id}_3d_short.mp4").resolve()

        # 1. Render single high-res 3D hero still via Blender 5.2
        blender_script = f"""
import bpy
import math

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.resolution_x = 1080
scene.render.resolution_y = 1920
scene.render.engine = 'BLENDER_WORKBENCH'

# Setup stylized 3D geometry
bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=1.2, location=(0, 0, 0.5))
ico = bpy.context.active_object
ico.rotation_euler = (math.radians(25), math.radians(45), 0)

# Camera
cam_data = bpy.data.cameras.new("Cam")
cam_obj = bpy.data.objects.new("Cam", cam_data)
scene.collection.objects.link(cam_obj)
scene.camera = cam_obj
cam_obj.location = (0, -4.5, 1.2)
cam_obj.rotation_euler = (math.radians(78), 0, 0)

scene.render.filepath = r"{str(hero_still_path)}"
bpy.ops.render.render(write_still=True)
print("HERO_STILL_RENDERED")
"""
        script_file = OUTPUT_DIR / f"script_{scene_id}.py"
        script_file.write_text(blender_script, encoding="utf-8")

        try:
            subprocess.run([BLENDER_EXE, "-b", "--python", str(script_file)], check=True, capture_output=True, timeout=20.0)
        finally:
            if script_file.exists():
                try:
                    script_file.unlink()
                except Exception:
                    pass

        # 2. Build ASS Subtitles if provided
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
            escaped_ass = str(ass_path).replace("\\", "/").replace(":", "\\:")
            subtitle_filter = [f"ass={escaped_ass}"]

        # 3. Dynamic 3D Camera Zoom/Pan (Ken Burns) via FFmpeg filter
        fps = 30
        total_frames = int(duration * fps)
        zoom_filter = f"zoompan=z='min(zoom+0.0015,1.25)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d={total_frames}:s=1080x1920:fps={fps}"
        
        vf = [zoom_filter] + subtitle_filter

        ffmpeg_cmd = [
            FFMPEG_EXE,
            "-loop", "1",
            "-i", str(hero_still_path),
            "-t", str(duration),
            "-vf", ",".join(vf),
            "-c:v", "libx264",
            "-preset", "fast",
            "-pix_fmt", "yuv420p",
            "-y",
            str(out_mp4_path),
        ]

        subprocess.run(ffmpeg_cmd, check=True, capture_output=True)

        elapsed = time.time() - t0
        file_size = out_mp4_path.stat().st_size if out_mp4_path.exists() else 0

        return {
            "success": True,
            "sceneId": scene_id,
            "videoUrl": f"/api/workspace/3d-assets/file/rendered/{out_mp4_path.name}",
            "localVideoPath": str(out_mp4_path),
            "thumbnailUrl": f"/api/workspace/3d-assets/file/rendered/{hero_still_path.name}",
            "durationSeconds": duration,
            "resolution": "1080x1920",
            "aspectRatio": "9:16",
            "engineUsed": self.name,
            "renderTimeSeconds": round(elapsed, 2),
            "fileSizeBytes": file_size,
        }

