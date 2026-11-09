"""
backend/features/workspace/visuals_3d/engines/blender_full_engine.py
Headless Blender 5.2 CPU Workbench Frame-by-Frame Renderer.
Renders consecutive PNG frames and stitches via FFmpeg.
"""

import json
import logging
from pathlib import Path
import subprocess
import time
from typing import Any, Dict

from .base_engine import Base3DRenderEngine

logger = logging.getLogger("ApexMind.Workspace.Visuals3D.Engine.BlenderFull")

BLENDER_EXE = r"C:\Program Files\Blender Foundation\Blender 5.2\blender.exe"
FFMPEG_EXE = r"C:\Users\dheen\AppData\Local\Microsoft\WinGet\Links\ffmpeg.exe"
RENDERS_DIR = Path("backend/data/rendered_shorts/3d_scenes")
RENDERS_DIR.mkdir(parents=True, exist_ok=True)


class BlenderFull3DEngine(Base3DRenderEngine):
    name: str = "blender_full"
    display_name: str = "Blender Full CGI Sequence"
    typical_duration_sec: float = 60.0

    def is_available(self) -> bool:
        return Path(BLENDER_EXE).exists() and Path(FFMPEG_EXE).exists()

    def render_scene(self, request_payload: Dict[str, Any]) -> Dict[str, Any]:
        t0 = time.time()
        scene_id = request_payload.get("sceneId") or f"full_{int(time.time())}"
        duration = float(request_payload.get("durationSeconds", 3.0))
        fps = int(request_payload.get("fps", 30))
        total_frames = int(duration * fps)

        frames_dir = RENDERS_DIR / f"frames_{scene_id}"
        frames_dir.mkdir(parents=True, exist_ok=True)
        out_mp4 = (RENDERS_DIR / f"{scene_id}_full.mp4").resolve()

        blender_script = f"""
import bpy, math

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.resolution_x = 720
scene.render.resolution_y = 1280
scene.render.engine = 'BLENDER_WORKBENCH'
scene.frame_start = 1
scene.frame_end = {total_frames}

bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=1.0)
ico = bpy.context.active_object

# Camera
cam_data = bpy.data.cameras.new("Cam")
cam_obj = bpy.data.objects.new("Cam", cam_data)
scene.collection.objects.link(cam_obj)
scene.camera = cam_obj
cam_obj.location = (0, -4.0, 1.0)
cam_obj.rotation_euler = (math.radians(78), 0, 0)

# Animate rotation
ico.rotation_euler = (0, 0, 0)
ico.keyframe_insert(data_path="rotation_euler", frame=1)
ico.rotation_euler = (0, math.radians(360), 0)
ico.keyframe_insert(data_path="rotation_euler", frame={total_frames})

scene.render.filepath = r"{str(frames_dir.resolve())}/frame_"
bpy.ops.render.render(animation=True)
"""
        script_file = RENDERS_DIR / f"script_{scene_id}.py"
        script_file.write_text(blender_script, encoding="utf-8")

        try:
            subprocess.run([BLENDER_EXE, "-b", "--python", str(script_file)], check=True, capture_output=True, timeout=120.0)

            # Stitch PNG sequence to MP4 via FFmpeg
            ffmpeg_cmd = [
                FFMPEG_EXE,
                "-r", str(fps),
                "-i", f"{str(frames_dir.resolve())}/frame_%04d.png",
                "-c:v", "libx264",
                "-preset", "fast",
                "-pix_fmt", "yuv420p",
                "-y",
                str(out_mp4),
            ]
            subprocess.run(ffmpeg_cmd, check=True, capture_output=True)

        finally:
            if script_file.exists():
                try: script_file.unlink()
                except Exception: pass

        elapsed = time.time() - t0
        return {
            "success": True,
            "sceneId": scene_id,
            "videoUrl": f"/api/workspace/3d-assets/file/rendered/{out_mp4.name}",
            "localVideoPath": str(out_mp4),
            "thumbnailUrl": f"/api/workspace/3d-assets/file/rendered/frames_{scene_id}/frame_0001.png",
            "durationSeconds": duration,
            "resolution": "720x1280",
            "aspectRatio": "9:16",
            "engineUsed": self.name,
            "renderTimeSeconds": round(elapsed, 2),
            "fileSizeBytes": out_mp4.stat().st_size if out_mp4.exists() else 0,
        }

