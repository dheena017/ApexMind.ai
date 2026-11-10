"""
backend/features/workspace/visuals_3d/engines/blender_full_engine.py
Headless Blender 5.2 Full CGI Frame-by-Frame 3D Animation Renderer.
Renders real 3D keyframe animations (characters walking/slashing/jumping,
cameras orbiting/dolly-zooming, objects falling/bobbing) and stitches via FFmpeg.
"""

import json
import logging
import math
import os
from pathlib import Path
import subprocess
import time
from typing import Any, Dict, Optional

from .base_engine import Base3DRenderEngine

logger = logging.getLogger("ApexMind.Workspace.Visuals3D.Engine.BlenderFull")

BLENDER_EXE = r"C:\Program Files\Blender Foundation\Blender 5.2\blender.exe"
FFMPEG_EXE = r"C:\Users\dheen\AppData\Local\Microsoft\WinGet\Links\ffmpeg.exe"
RENDERS_DIR = Path("backend/data/rendered_shorts/3d_scenes")
RENDERS_DIR.mkdir(parents=True, exist_ok=True)


class BlenderFull3DEngine(Base3DRenderEngine):
    name: str = "blender_full"
    display_name: str = "Blender Full CGI Motion Video"
    typical_duration_sec: float = 18.0

    def is_available(self) -> bool:
        return Path(BLENDER_EXE).exists() and Path(FFMPEG_EXE).exists()

    def _build_blender_animation_script(
        self,
        frames_dir: Path,
        total_frames: int,
        fps: int,
        payload: Dict[str, Any],
    ) -> str:
        """Constructs a procedural Blender 5.2 script with true 3D keyframe animations."""
        query = payload.get("query") or payload.get("prompt") or ""
        scene_prompt = payload.get("scenePrompt3D", "")
        camera_motion = payload.get("cameraMotion", "")
        topic = payload.get("topic", "")
        genre = payload.get("genre", "")

        char_data = payload.get("character") or {}
        char_archetype = char_data.get("archetype", "")
        char_motion = (char_data.get("motion") or "").lower()
        char_color = char_data.get("outfitColorHex") or "#E02424"

        env_data = payload.get("environment") or {}
        env_theme = env_data.get("theme", "")

        objects_data = payload.get("objects") or []
        model_url = payload.get("modelUrl") or char_data.get("modelUrl")

        subs = payload.get("subtitles") or {}
        sub_text = subs.get("text", "") if isinstance(subs, dict) else str(subs)

        corpus = f"{query} {scene_prompt} {sub_text} {topic} {genre}".lower()

        # Deduce Environment Theme if not explicitly provided
        if not env_theme:
            if any(w in corpus for w in ["ocean", "sea", "water", "boat", "ship", "pirate", "blox fruit", "sail", "wave"]):
                env_theme = "ocean_naval"
            elif any(w in corpus for w in ["lava", "magma", "volcano", "obby", "parkour", "inferno", "jump"]):
                env_theme = "lava_obby"
            elif any(w in corpus for w in ["hospital", "corridor", "hallway", "mansion", "indoor", "room", "ghost", "null", "3 am", "3:00"]):
                env_theme = "indoor_creepy"
            elif any(w in corpus for w in ["temple", "dungeon", "pillar", "column", "ancient", "stone", "ruin"]):
                env_theme = "dungeon_temple"
            elif any(w in corpus for w in ["sky gives back", "vortex", "portal", "cloud", "balloon", "card", "envelope", "volze", "celestial"]):
                env_theme = "celestial_sky"
            else:
                env_theme = "city_suburb"

        # Deduce Character Archetype if not explicitly provided
        if not char_archetype:
            if any(w in corpus for w in ["null", "glitch", "ghost", "demon", "creepypasta", "shadow"]):
                char_archetype = "null_glitch"
            elif any(w in corpus for w in ["sword", "katana", "blade", "pirate", "warrior", "blox fruit", "combat"]):
                char_archetype = "warrior_katana"
            elif any(w in corpus for w in ["four", "4 player", "4 avatar", "odd one out", "lineup"]):
                char_archetype = "multi_lineup"
            else:
                char_archetype = "classic_avatar"

        # Deduce Motion if not explicitly provided
        if not char_motion:
            if "slash" in corpus or "attack" in corpus or "sword" in corpus or "katana" in corpus or char_archetype == "warrior_katana":
                char_motion = "attack"
            elif "jump" in corpus or "parkour" in corpus or "obby" in corpus or env_theme == "lava_obby":
                char_motion = "jump"
            elif "hover" in corpus or "float" in corpus or "ghost" in corpus or char_archetype == "null_glitch":
                char_motion = "hover"
            else:
                char_motion = "walk"

        # Deduce Camera Path
        if "orbit" in camera_motion.lower() or "spin" in camera_motion.lower():
            cam_path = "orbit_360"
        elif "close" in camera_motion.lower() or "face" in camera_motion.lower():
            cam_path = "close_up_dolly"
        elif "high" in camera_motion.lower() or "down" in camera_motion.lower() or "birds_eye" in camera_motion.lower():
            cam_path = "overhead_crane"
        else:
            cam_path = "low_angle_hero"

        frames_prefix = os.path.join(str(frames_dir.resolve()), "frame_").replace("\\", "/")

        script = f'''
import bpy
import math
import os
import random

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.resolution_x = 720
scene.render.resolution_y = 1280
scene.render.engine = 'BLENDER_WORKBENCH'

# Stylized studio shading with deep ambient occlusion & cavity ridges
scene.display.shading.light = 'STUDIO'
scene.display.shading.color_type = 'OBJECT'
scene.display.shading.show_shadows = True
scene.display.shading.shadow_intensity = 0.65
scene.display.shading.show_cavity = True
scene.display.shading.cavity_type = 'BOTH'
scene.display.shading.curvature_ridge_factor = 1.8
scene.display.shading.curvature_valley_factor = 1.8

total_frames = {total_frames}
scene.frame_start = 1
scene.frame_end = total_frames
scene.render.fps = {fps}

def col(obj, r, g, b, a=1.0):
    obj.color = (r, g, b, a)

env_theme = "{env_theme}"
char_type = "{char_archetype}"
char_motion = "{char_motion}"
cam_path = "{cam_path}"

# ==============================================================================
# 1. 3D ENVIRONMENT BUILD & ANIMATION
# ==============================================================================
if env_theme == "ocean_naval":
    # Azure Sky
    bpy.ops.mesh.primitive_plane_add(size=90, location=(0, 30, 15))
    sky = bpy.context.active_object
    sky.rotation_euler = (math.radians(90), 0, 0)
    col(sky, 0.35, 0.65, 0.92)

    # Reflective Ocean Surface
    bpy.ops.mesh.primitive_plane_add(size=60, location=(0, 10, -2.0))
    ocean = bpy.context.active_object
    col(ocean, 0.08, 0.38, 0.68)

    # Undulating Animated Waves
    for rx, ry, rz in [(-4.2, 5.0, -1.9), (3.5, 7.5, -1.9), (-2.0, 11.5, -1.9), (4.5, 4.0, -1.9)]:
        bpy.ops.mesh.primitive_cylinder_add(radius=2.4, depth=0.08, location=(rx, ry, rz))
        wave = bpy.context.active_object
        wave.scale = (1.6, 0.45, 1.0)
        col(wave, 0.82, 0.92, 0.98)
        # Wave bobbing animation
        for f, dz in [(1, 0.0), (int(total_frames*0.5), 0.18), (total_frames, 0.0)]:
            wave.location = (rx, ry, rz + dz)
            wave.keyframe_insert(data_path="location", frame=f)

    # Pirate Ship Hull
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 6.0, -1.2))
    hull = bpy.context.active_object
    hull.scale = (3.4, 7.8, 1.6)
    col(hull, 0.32, 0.20, 0.12)

    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 6.0, -0.38))
    deck = bpy.context.active_object
    deck.scale = (3.1, 7.5, 0.1)
    col(deck, 0.58, 0.42, 0.26)

    # Mast & Sail
    bpy.ops.mesh.primitive_cylinder_add(radius=0.14, depth=6.5, location=(0, 7.5, 2.8))
    mast = bpy.context.active_object
    col(mast, 0.25, 0.15, 0.08)

    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 7.35, 3.2))
    sail = bpy.context.active_object
    sail.scale = (3.2, 0.04, 2.2)
    col(sail, 0.94, 0.93, 0.90)

    char_base = (0.0, 3.6, -0.35)

elif env_theme == "lava_obby":
    # Dark Ash Crimson Sky
    bpy.ops.mesh.primitive_plane_add(size=90, location=(0, 30, 15))
    sky = bpy.context.active_object
    sky.rotation_euler = (math.radians(90), 0, 0)
    col(sky, 0.20, 0.04, 0.06)

    # Boiling Lava Sea
    bpy.ops.mesh.primitive_plane_add(size=60, location=(0, 12, -3.0))
    lava = bpy.context.active_object
    col(lava, 1.0, 0.32, 0.04)

    # Floating Neon Obby Stepping Stones
    platforms = [
        (0.0, 2.0, -0.8, (0.0, 0.95, 1.0)),     # Neon Cyan
        (-1.2, 4.5, 0.1, (1.0, 0.15, 0.70)),   # Neon Magenta
        (1.0, 7.2, 0.9, (1.0, 0.92, 0.05)),    # Neon Yellow
        (-0.5, 9.8, 1.8, (0.15, 1.0, 0.40)),   # Neon Green
    ]
    for px, py, pz, pcol in platforms:
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(px, py, pz))
        plat = bpy.context.active_object
        plat.scale = (1.5, 1.5, 0.28)
        col(plat, pcol[0], pcol[1], pcol[2])

    char_base = (-1.2, 4.5, 0.25)

elif env_theme == "indoor_creepy":
    # Haunted Hospital Room
    bpy.ops.mesh.primitive_plane_add(size=40, location=(0, 10, -1.8))
    floor = bpy.context.active_object
    col(floor, 0.22, 0.25, 0.26)

    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 14, 2.5))
    wall = bpy.context.active_object
    wall.scale = (20.0, 0.5, 8.5)
    col(wall, 0.28, 0.36, 0.35)

    # 3:00 AM Digital Clock
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 13.5, 5.0))
    clock_face = bpy.context.active_object
    clock_face.scale = (1.9, 0.05, 0.7)
    col(clock_face, 1.0, 0.05, 0.05)

    char_base = (-0.5, 7.0, -1.8)

elif env_theme == "celestial_sky":
    # Volze Sky Gives Back
    bpy.ops.mesh.primitive_plane_add(size=90, location=(0, 30, 15))
    sky = bpy.context.active_object
    sky.rotation_euler = (math.radians(90), 0, 0)
    col(sky, 0.76, 0.52, 0.75)

    bpy.ops.mesh.primitive_cylinder_add(radius=3.8, depth=0.1, location=(0, 18, 11))
    vortex = bpy.context.active_object
    vortex.rotation_euler = (math.radians(82), 0, 0)
    col(vortex, 0.03, 0.01, 0.05)

    # Falling Cards Tumbling in 3D
    for idx, (card_x, card_y, card_z) in enumerate([(-1.2, 6.0, 4.5), (1.5, 7.5, 5.5), (0.2, 5.0, 3.5)]):
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(card_x, card_y, card_z))
        card = bpy.context.active_object
        card.scale = (0.55, 0.80, 0.03)
        col(card, 0.98, 0.95, 0.92)
        # Tumbling keyframes
        card.location = (card_x, card_y, card_z)
        card.rotation_euler = (0, 0, 0)
        card.keyframe_insert(data_path="location", frame=1)
        card.keyframe_insert(data_path="rotation_euler", frame=1)

        card.location = (card_x, card_y - 0.8, card_z - 2.5)
        card.rotation_euler = (math.radians(65), math.radians(120), math.radians(45))
        card.keyframe_insert(data_path="location", frame=total_frames)
        card.keyframe_insert(data_path="rotation_euler", frame=total_frames)

    char_base = (0.65, 1.6, -1.8)

else:
    # Suburban Street
    bpy.ops.mesh.primitive_plane_add(size=50, location=(0, 10, -1.8))
    road = bpy.context.active_object
    col(road, 0.24, 0.24, 0.26)
    char_base = (0.0, 2.0, -1.8)

# ==============================================================================
# 2. 3D CHARACTER RIG & LIMB ANIMATION
# ==============================================================================
cx, cy, cz = char_base

# Torso
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(cx, cy, cz + 1.25))
torso = bpy.context.active_object
torso.scale = (0.65, 0.35, 0.70)
if char_type == "null_glitch":
    col(torso, 0.02, 0.02, 0.03)
elif char_type == "warrior_katana":
    col(torso, 0.85, 0.15, 0.15)
else:
    col(torso, 0.14, 0.44, 0.86)

# Head
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(cx, cy, cz + 1.95))
head = bpy.context.active_object
head.scale = (0.40, 0.40, 0.40)
if char_type == "null_glitch":
    col(head, 0.02, 0.02, 0.03)
    for eye_x in (-0.11, 0.11):
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(cx + eye_x, cy - 0.22, cz + 1.98))
        eye = bpy.context.active_object
        eye.scale = (0.05, 0.02, 0.06)
        col(eye, 1.0, 0.02, 0.02)
else:
    col(head, 0.98, 0.84, 0.55)

# Legs
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(cx - 0.18, cy, cz + 0.55))
leg_l = bpy.context.active_object
leg_l.scale = (0.28, 0.28, 0.65)
col(leg_l, 0.15, 0.15, 0.18)

bpy.ops.mesh.primitive_cube_add(size=1.0, location=(cx + 0.18, cy, cz + 0.55))
leg_r = bpy.context.active_object
leg_r.scale = (0.28, 0.28, 0.65)
col(leg_r, 0.15, 0.15, 0.18)

# Arms
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(cx - 0.48, cy, cz + 1.3))
arm_l = bpy.context.active_object
arm_l.scale = (0.26, 0.26, 0.62)
col(arm_l, torso.color[0], torso.color[1], torso.color[2])

bpy.ops.mesh.primitive_cube_add(size=1.0, location=(cx + 0.48, cy, cz + 1.3))
arm_r = bpy.context.active_object
arm_r.scale = (0.26, 0.26, 0.62)
col(arm_r, torso.color[0], torso.color[1], torso.color[2])

# Prop / Katana
blade = None
if char_type == "warrior_katana" or "attack" in char_motion:
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(cx + 0.65, cy + 0.6, cz + 1.8))
    blade = bpy.context.active_object
    blade.scale = (0.04, 0.12, 1.6)
    col(blade, 0.15, 0.90, 1.0) # Glowing Cyan Edge

# ── ANIMATE CHARACTER KEYFRAMES ──
if char_motion == "attack" and blade:
    # 3D Sword Slash Sequence
    arm_r.rotation_euler = (math.radians(-65), math.radians(-25), 0)
    blade.rotation_euler = (math.radians(-65), math.radians(-25), 0)
    arm_r.keyframe_insert(data_path="rotation_euler", frame=1)
    blade.keyframe_insert(data_path="rotation_euler", frame=1)

    mid_f = int(total_frames * 0.55)
    arm_r.rotation_euler = (math.radians(48), math.radians(35), 0)
    blade.rotation_euler = (math.radians(48), math.radians(35), 0)
    arm_r.keyframe_insert(data_path="rotation_euler", frame=mid_f)
    blade.keyframe_insert(data_path="rotation_euler", frame=mid_f)

    arm_r.rotation_euler = (math.radians(-15), 0, 0)
    blade.rotation_euler = (math.radians(-15), 0, 0)
    arm_r.keyframe_insert(data_path="rotation_euler", frame=total_frames)
    blade.keyframe_insert(data_path="rotation_euler", frame=total_frames)

elif char_motion == "jump":
    # 3D Parkour Jump Arc
    for f, (dy, dz, lrot) in [
        (1, 0.0, 0.0, 0),
        (int(total_frames*0.45), 1.2, 1.4, 35),
        (total_frames, 2.4, 0.2, -15),
    ]:
        torso.location = (cx, cy + dy, cz + 1.25 + dz)
        head.location = (cx, cy + dy, cz + 1.95 + dz)
        leg_l.location = (cx - 0.18, cy + dy, cz + 0.55 + dz)
        leg_r.location = (cx + 0.18, cy + dy, cz + 0.55 + dz)
        arm_l.location = (cx - 0.48, cy + dy, cz + 1.3 + dz)
        arm_r.location = (cx + 0.48, cy + dy, cz + 1.3 + dz)

        torso.keyframe_insert(data_path="location", frame=f)
        head.keyframe_insert(data_path="location", frame=f)
        leg_l.keyframe_insert(data_path="location", frame=f)
        leg_r.keyframe_insert(data_path="location", frame=f)
        arm_l.keyframe_insert(data_path="location", frame=f)
        arm_r.keyframe_insert(data_path="location", frame=f)

        leg_l.rotation_euler = (math.radians(lrot), 0, 0)
        leg_r.rotation_euler = (math.radians(-lrot), 0, 0)
        leg_l.keyframe_insert(data_path="rotation_euler", frame=f)
        leg_r.keyframe_insert(data_path="rotation_euler", frame=f)

elif char_motion == "hover":
    # Eerie Levitation Sine Float
    for f, dz in [(1, 0.0), (int(total_frames*0.5), 0.35), (total_frames, 0.0)]:
        torso.location = (cx, cy, cz + 1.25 + dz)
        head.location = (cx, cy, cz + 1.95 + dz)
        leg_l.location = (cx - 0.18, cy, cz + 0.55 + dz)
        leg_r.location = (cx + 0.18, cy, cz + 0.55 + dz)
        arm_l.location = (cx - 0.48, cy, cz + 1.3 + dz)
        arm_r.location = (cx + 0.48, cy, cz + 1.3 + dz)

        torso.keyframe_insert(data_path="location", frame=f)
        head.keyframe_insert(data_path="location", frame=f)
        leg_l.keyframe_insert(data_path="location", frame=f)
        leg_r.keyframe_insert(data_path="location", frame=f)
        arm_l.keyframe_insert(data_path="location", frame=f)
        arm_r.keyframe_insert(data_path="location", frame=f)

else:
    # Walk Cycle
    mid_f = int(total_frames * 0.5)
    for f, rot in [(1, -30), (mid_f, 30), (total_frames, -30)]:
        leg_l.rotation_euler = (math.radians(rot), 0, 0)
        leg_l.keyframe_insert(data_path="rotation_euler", frame=f)
        leg_r.rotation_euler = (math.radians(-rot), 0, 0)
        leg_r.keyframe_insert(data_path="rotation_euler", frame=f)
        arm_l.rotation_euler = (math.radians(rot), 0, 0)
        arm_l.keyframe_insert(data_path="rotation_euler", frame=f)
        arm_r.rotation_euler = (math.radians(-rot), 0, 0)
        arm_r.keyframe_insert(data_path="rotation_euler", frame=f)

# ==============================================================================
# 3. 3D CAMERA MOTION CHOREOGRAPHY
# ==============================================================================
cam_data = bpy.data.cameras.new("MotionCam")
cam_data.lens = 24
cam_obj = bpy.data.objects.new("MotionCam", cam_data)
scene.collection.objects.link(cam_obj)
scene.camera = cam_obj

if cam_path == "orbit_360":
    # 360-degree Orbit around subject
    cam_obj.location = (cx - 2.2, cy - 2.2, cz + 1.2)
    cam_obj.rotation_euler = (math.radians(72), 0, math.radians(-28))
    cam_obj.keyframe_insert(data_path="location", frame=1)
    cam_obj.keyframe_insert(data_path="rotation_euler", frame=1)

    cam_obj.location = (cx + 2.2, cy - 2.2, cz + 1.2)
    cam_obj.rotation_euler = (math.radians(72), 0, math.radians(28))
    cam_obj.keyframe_insert(data_path="location", frame=total_frames)
    cam_obj.keyframe_insert(data_path="rotation_euler", frame=total_frames)

elif cam_path == "overhead_crane":
    cam_obj.location = (cx, cy - 3.8, cz + 5.2)
    cam_obj.rotation_euler = (math.radians(45), 0, 0)
    cam_obj.keyframe_insert(data_path="location", frame=1)
    cam_obj.keyframe_insert(data_path="rotation_euler", frame=1)

    cam_obj.location = (cx, cy - 2.0, cz + 2.5)
    cam_obj.rotation_euler = (math.radians(65), 0, 0)
    cam_obj.keyframe_insert(data_path="location", frame=total_frames)
    cam_obj.keyframe_insert(data_path="rotation_euler", frame=total_frames)

elif cam_path == "close_up_dolly":
    cam_obj.location = (cx, cy - 1.8, cz + 1.7)
    cam_obj.rotation_euler = (math.radians(55), 0, 0)
    cam_obj.keyframe_insert(data_path="location", frame=1)

    cam_obj.location = (cx, cy - 1.1, cz + 1.7)
    cam_obj.keyframe_insert(data_path="location", frame=total_frames)

else:
    # Dynamic Low-Angle Hero Push In
    cam_obj.location = (cx - 0.8, cy - 2.4, cz + 0.1)
    cam_obj.rotation_euler = (math.radians(74), 0, math.radians(-12))
    cam_obj.keyframe_insert(data_path="location", frame=1)
    cam_obj.keyframe_insert(data_path="rotation_euler", frame=1)

    cam_obj.location = (cx + 0.5, cy - 1.4, cz + 0.5)
    cam_obj.rotation_euler = (math.radians(78), 0, math.radians(8))
    cam_obj.keyframe_insert(data_path="location", frame=total_frames)
    cam_obj.keyframe_insert(data_path="rotation_euler", frame=total_frames)

scene.render.filepath = r"{frames_prefix}"
scene.render.image_settings.file_format = 'JPEG'
scene.render.image_settings.quality = 90

bpy.ops.render.render(animation=True)
print("ANIMATION_RENDER_COMPLETE")
'''
        return script

    def render_scene(self, request_payload: Dict[str, Any]) -> Dict[str, Any]:
        t0 = time.time()
        scene_id = request_payload.get("sceneId") or f"full_{int(time.time())}"
        duration = float(request_payload.get("durationSeconds", 3.0))
        fps = int(request_payload.get("fps", 24))
        total_frames = int(duration * fps)
        subtitles = request_payload.get("subtitles") or {}

        frames_dir = RENDERS_DIR / f"frames_{scene_id}"
        frames_dir.mkdir(parents=True, exist_ok=True)
        out_mp4 = (RENDERS_DIR / f"{scene_id}_full.mp4").resolve()

        blender_script = self._build_blender_animation_script(frames_dir, total_frames, fps, request_payload)
        script_file = RENDERS_DIR / f"script_{scene_id}.py"
        script_file.write_text(blender_script, encoding="utf-8")

        try:
            subprocess.run([BLENDER_EXE, "-b", "--python", str(script_file)], check=True, capture_output=True, timeout=120.0)

            # ASS subtitles if text provided
            subtitle_filter = []
            sub_text = subtitles.get("text", "").strip() if isinstance(subtitles, dict) else str(subtitles).strip()
            if sub_text:
                ass_path = RENDERS_DIR / f"{scene_id}.ass"
                ass_content = f"""[Script Info]
Title: 3D Scene
ScriptType: v4.00+
PlayResX: 720
PlayResY: 1280

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: ViralYellow,Impact,52,&H0015CCFA,&H000000FF,&H00000000,&H90000000,-1,0,0,0,100,100,2,0,1,4,2,2,30,30,280,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
Dialogue: 0,0:00:00.00,0:00:{duration:05.2f},ViralYellow,,0,0,0,,{{\\fscx120\\fscy120}}{sub_text}{{\\fscx100\\fscy100}}
"""
                ass_path.write_text(ass_content, encoding="utf-8")
                escaped_ass = str(ass_path).replace("\\", "/").replace(":", "\\:")
                subtitle_filter = [f"ass={escaped_ass}"]

            # Stitch JPEG sequence to MP4 via FFmpeg
            ffmpeg_cmd = [
                FFMPEG_EXE,
                "-y",
                "-r", str(fps),
                "-i", f"{str(frames_dir.resolve())}/frame_%04d.jpg",
            ]
            if subtitle_filter:
                ffmpeg_cmd.extend(["-vf", ",".join(subtitle_filter)])
            ffmpeg_cmd.extend([
                "-c:v", "libx264",
                "-preset", "fast",
                "-pix_fmt", "yuv420p",
                str(out_mp4),
            ])
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
            "thumbnailUrl": f"/api/workspace/3d-assets/file/rendered/frames_{scene_id}/frame_0001.jpg",
            "durationSeconds": duration,
            "resolution": "720x1280",
            "aspectRatio": "9:16",
            "engineUsed": self.name,
            "renderTimeSeconds": round(elapsed, 2),
            "fileSizeBytes": out_mp4.stat().st_size if out_mp4.exists() else 0,
        }
