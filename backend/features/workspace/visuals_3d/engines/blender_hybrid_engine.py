"""
backend/features/workspace/visuals_3d/engines/blender_hybrid_engine.py
Dynamic 3D Prompt-Driven World & Asset Synthesizer Engine (~4-6 Seconds).
Renders 1-2 high-res 3D hero stills using Blender 5.2 Workbench,
dynamically generating the environment, props, characters, and camera angles
matching the user's creative prompt and AI storyboard directives.
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

    def _build_blender_script(
        self,
        hero_still_path: Path,
        scene_id: str,
        payload_or_query: Any,
        scene_num: int = 1,
    ) -> str:
        """
        Dynamically constructs a procedural 3D Blender script based on user prompt,
        scene query, subtitles, and camera directives.
        """
        if isinstance(payload_or_query, dict):
            payload = payload_or_query
        else:
            payload = {"query": str(payload_or_query or ""), "sceneNumber": scene_num}

        query = payload.get("query", "")
        scene_prompt = payload.get("scenePrompt3D", "")
        camera_motion = payload.get("cameraMotion", "")
        topic = payload.get("topic", "")
        genre = payload.get("genre", "")
        subs = payload.get("subtitles") or {}
        sub_text = subs.get("text", "") if isinstance(subs, dict) else str(subs)
        sc_num = int(payload.get("sceneNumber", scene_num))

        # Semantic corpus analysis
        corpus = f"{query} {scene_prompt} {sub_text} {topic} {genre}".lower()

        # 1. Detect Environment Theme
        if any(w in corpus for w in ["ocean", "sea", "water", "boat", "ship", "pirate", "blox fruit", "sail", "wave", "island", "beach", "marine"]):
            theme = "ocean_naval"
        elif any(w in corpus for w in ["lava", "magma", "volcano", "obby", "parkour", "inferno", "jump", "hazard", "red hot"]):
            theme = "lava_obby"
        elif any(w in corpus for w in ["hospital", "corridor", "hallway", "mansion", "indoor", "room", "bed", "ghost", "null", "3 am", "3:00", "creepypasta", "haunted", "asylum", "basement", "door"]):
            theme = "indoor_creepy"
        elif any(w in corpus for w in ["temple", "dungeon", "pillar", "column", "ancient", "stone", "ruin", "statue", "cave", "crypt"]):
            theme = "dungeon_temple"
        elif any(w in corpus for w in ["sky gives back", "vortex", "portal", "cloud", "balloon", "card", "envelope", "ring", "rift", "giving back", "volze", "celestial"]):
            theme = "celestial_sky"
        else:
            theme = "city_suburb"

        # 2. Detect Character Archetype
        if any(w in corpus for w in ["null", "glitch", "ghost", "demon", "creepypasta", "shadow", "entity"]):
            char_archetype = "null_glitch"
        elif any(w in corpus for w in ["sword", "katana", "blade", "pirate", "warrior", "blox fruit", "combat", "fight"]):
            char_archetype = "warrior_katana"
        elif any(w in corpus for w in ["four", "4 player", "4 avatar", "odd one out", "lineup", "crowd", "friends"]):
            char_archetype = "multi_lineup"
        elif any(w in corpus for w in ["boonie", "explorer", "adventurer", "safari"]):
            char_archetype = "explorer"
        else:
            char_archetype = "classic_avatar"

        # 3. Detect Camera Framing
        if "close" in camera_motion.lower() or "face" in scene_prompt.lower() or sc_num % 3 == 2:
            shot_type = "close_up"
        elif "high" in camera_motion.lower() or "down" in camera_motion.lower() or "birds_eye" in camera_motion.lower() or sc_num % 3 == 0:
            shot_type = "overhead"
        else:
            shot_type = "low_angle_hero"

        script = f'''
import bpy
import math
import random

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.resolution_x = 1080
scene.render.resolution_y = 1920
scene.render.engine = 'BLENDER_WORKBENCH'

# High-fidelity stylized studio lighting with deep cavity & ambient occlusion shadows
scene.display.shading.light = 'STUDIO'
scene.display.shading.color_type = 'OBJECT'
scene.display.shading.show_shadows = True
scene.display.shading.shadow_intensity = 0.65
scene.display.shading.show_cavity = True
scene.display.shading.cavity_type = 'BOTH'
scene.display.shading.curvature_ridge_factor = 1.8
scene.display.shading.curvature_valley_factor = 1.8

def col(obj, r, g, b, a=1.0):
    obj.color = (r, g, b, a)

theme = "{theme}"
char_type = "{char_archetype}"
shot_type = "{shot_type}"

# Default Camera Setup
cam_x, cam_y, cam_z = 0.0, -2.4, 0.2
cam_rot_x = 76.0

# ==============================================================================
# ENVIRONMENT SYNTHESIS
# ==============================================================================
if theme == "ocean_naval":
    # Azure Tropical Sky
    bpy.ops.mesh.primitive_plane_add(size=90, location=(0, 30, 15))
    sky = bpy.context.active_object
    sky.rotation_euler = (math.radians(90), 0, 0)
    col(sky, 0.35, 0.65, 0.92)

    # Ocean Surface
    bpy.ops.mesh.primitive_plane_add(size=60, location=(0, 10, -2.0))
    ocean = bpy.context.active_object
    col(ocean, 0.08, 0.38, 0.68)

    # Wave Ripples & Foam
    for rx, ry, rz in [(-4.2, 5.0, -1.9), (3.5, 7.5, -1.9), (-2.0, 11.5, -1.9), (4.5, 4.0, -1.9)]:
        bpy.ops.mesh.primitive_cylinder_add(radius=2.4, depth=0.08, location=(rx, ry, rz))
        wave = bpy.context.active_object
        wave.scale = (1.6, 0.45, 1.0)
        col(wave, 0.82, 0.92, 0.98)

    # Pirate Ship Hull
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 6.0, -1.2))
    hull = bpy.context.active_object
    hull.scale = (3.4, 7.8, 1.6)
    col(hull, 0.32, 0.20, 0.12)

    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 6.0, -0.38))
    deck = bpy.context.active_object
    deck.scale = (3.1, 7.5, 0.1)
    col(deck, 0.58, 0.42, 0.26)

    # Bow
    bpy.ops.mesh.primitive_cylinder_add(vertices=3, radius=1.7, depth=1.5, location=(0, 10.2, -1.2))
    bow = bpy.context.active_object
    bow.rotation_euler = (0, 0, math.radians(180))
    col(bow, 0.28, 0.18, 0.10)

    # Mast & Sail
    bpy.ops.mesh.primitive_cylinder_add(radius=0.14, depth=6.5, location=(0, 7.5, 2.8))
    mast = bpy.context.active_object
    col(mast, 0.25, 0.15, 0.08)

    bpy.ops.mesh.primitive_cylinder_add(radius=0.08, depth=3.8, location=(0, 7.5, 4.2))
    yard = bpy.context.active_object
    yard.rotation_euler = (0, math.radians(90), 0)
    col(yard, 0.25, 0.15, 0.08)

    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 7.35, 3.2))
    sail = bpy.context.active_object
    sail.scale = (3.2, 0.04, 2.2)
    col(sail, 0.94, 0.93, 0.90)

    char_base = (0.0, 3.6, -0.35)
    cam_x, cam_y, cam_z = 0.0, -1.8, 0.2
    cam_rot_x = 76.0

elif theme == "lava_obby":
    # Dark Ash Crimson Sky
    bpy.ops.mesh.primitive_plane_add(size=90, location=(0, 30, 15))
    sky = bpy.context.active_object
    sky.rotation_euler = (math.radians(90), 0, 0)
    col(sky, 0.20, 0.04, 0.06)

    # Molten Lava Abyss
    bpy.ops.mesh.primitive_plane_add(size=60, location=(0, 12, -3.0))
    lava = bpy.context.active_object
    col(lava, 1.0, 0.32, 0.04)

    # Floating Neon Obby Stepping Stones
    platforms = [
        (0.0, 2.5, -0.8, (0.0, 0.95, 1.0)),     # Neon Cyan
        (-1.2, 5.0, 0.1, (1.0, 0.15, 0.70)),   # Neon Magenta
        (1.0, 7.8, 0.9, (1.0, 0.92, 0.05)),    # Neon Yellow
        (-0.5, 10.5, 1.8, (0.15, 1.0, 0.40)),  # Neon Green
    ]
    for px, py, pz, pcol in platforms:
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(px, py, pz))
        plat = bpy.context.active_object
        plat.scale = (1.5, 1.5, 0.28)
        col(plat, pcol[0], pcol[1], pcol[2])

    char_base = (-1.2, 5.0, 0.3)
    cam_x, cam_y, cam_z = 0.0, -1.5, 1.2
    cam_rot_x = 72.0

elif theme == "indoor_creepy":
    # Abandoned Hospital / Haunted Room
    bpy.ops.mesh.primitive_plane_add(size=40, location=(0, 10, -1.8))
    floor = bpy.context.active_object
    col(floor, 0.22, 0.25, 0.26)

    # Back Wall
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 14, 2.5))
    wall = bpy.context.active_object
    wall.scale = (20.0, 0.5, 8.5)
    col(wall, 0.28, 0.36, 0.35) # Eerie hospital mint

    # Side Walls
    for wx, rot in [(-4.5, 90), (4.5, -90)]:
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(wx, 8, 2.5))
        swall = bpy.context.active_object
        swall.scale = (14.0, 0.5, 8.5)
        swall.rotation_euler = (0, 0, math.radians(rot))
        col(swall, 0.25, 0.32, 0.30)

    # 3:00 AM Digital Clock Glowing Red
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 13.6, 5.0))
    clock_frame = bpy.context.active_object
    clock_frame.scale = (2.2, 0.15, 0.9)
    col(clock_frame, 0.05, 0.05, 0.05)

    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 13.5, 5.0))
    clock_face = bpy.context.active_object
    clock_face.scale = (1.9, 0.05, 0.7)
    col(clock_face, 1.0, 0.05, 0.05)

    # Hospital Gurney
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(2.2, 7.5, -0.6))
    bed = bpy.context.active_object
    bed.scale = (1.5, 3.2, 0.6)
    col(bed, 0.82, 0.85, 0.88)

    char_base = (-0.5, 7.0, -1.8)
    cam_x, cam_y, cam_z = 0.0, 1.5, 0.2
    cam_rot_x = 65.0

elif theme == "dungeon_temple":
    # Ancient Stone Floor
    bpy.ops.mesh.primitive_plane_add(size=40, location=(0, 10, -1.8))
    floor = bpy.context.active_object
    col(floor, 0.28, 0.28, 0.30)

    # Massive Ancient Columns
    for cx_col, cy_col in [(-3.0, 4.0), (3.0, 4.0), (-3.5, 9.0), (3.5, 9.0), (-4.0, 14.0), (4.0, 14.0)]:
        bpy.ops.mesh.primitive_cylinder_add(radius=0.55, depth=8.0, location=(cx_col, cy_col, 2.2))
        col_obj = bpy.context.active_object
        col(col_obj, 0.72, 0.70, 0.68)

    # Stone Altar / Pedestal
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 8.0, -0.6))
    altar = bpy.context.active_object
    altar.scale = (2.4, 2.4, 1.2)
    col(altar, 0.45, 0.42, 0.40)

    char_base = (0.0, 5.5, -1.8)
    cam_x, cam_y, cam_z = 0.0, 0.5, 0.2
    cam_rot_x = 68.0

elif theme == "celestial_sky":
    # Volze Sky Gives Back / Celestial Void
    bpy.ops.mesh.primitive_plane_add(size=90, location=(0, 30, 15))
    sky = bpy.context.active_object
    sky.rotation_euler = (math.radians(90), 0, 0)
    col(sky, 0.76, 0.52, 0.75) # Twilight violet

    # Sky Vortex & Glowing Halo
    bpy.ops.mesh.primitive_cylinder_add(radius=3.8, depth=0.1, location=(0, 18, 11))
    vortex_core = bpy.context.active_object
    vortex_core.rotation_euler = (math.radians(82), 0, 0)
    col(vortex_core, 0.03, 0.01, 0.05)

    bpy.ops.mesh.primitive_torus_add(major_radius=4.1, minor_radius=0.28, location=(0, 17.8, 11))
    vortex_ring = bpy.context.active_object
    vortex_ring.rotation_euler = (math.radians(82), 0, 0)
    col(vortex_ring, 1.0, 0.96, 0.85)

    # Procedural Puffy Clouds
    def make_cloud(base_loc, scale=(1, 1, 1)):
        blobs = [(0, 0, 0, 1.4), (1.2, 0.2, 0.0, 1.1), (-1.2, 0.1, 0.0, 1.15), (0.0, 0.2, 0.7, 0.95)]
        for dx, dy, dz, r in blobs:
            bpy.ops.mesh.primitive_uv_sphere_add(
                radius=r,
                location=(base_loc[0] + dx * scale[0], base_loc[1] + dy * scale[1], base_loc[2] + dz * scale[2])
            )
            s = bpy.context.active_object
            col(s, 0.98, 0.96, 0.95)
            bpy.ops.object.shade_smooth()

    make_cloud((-5.0, 15.0, 10.5), scale=(1.2, 1.0, 1.1))
    make_cloud((5.0, 15.5, 11.0), scale=(1.3, 1.0, 1.1))

    # Floating Cards & Relics
    for card_x, card_y, card_z, card_rot in [(-1.2, 6.0, 3.2, 25), (1.5, 7.5, 4.0, -35), (0.2, 5.0, 2.0, 12)]:
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(card_x, card_y, card_z))
        card = bpy.context.active_object
        card.scale = (0.55, 0.80, 0.03)
        card.rotation_euler = (math.radians(15), math.radians(card_rot), math.radians(card_rot))
        col(card, 0.98, 0.95, 0.92)

    char_base = (0.65, 1.6, -1.8)
    cam_x, cam_y, cam_z = 0.0, -2.6, -0.3
    cam_rot_x = 78.0

else:
    # City / Suburban Brookhaven Street
    bpy.ops.mesh.primitive_plane_add(size=50, location=(0, 10, -1.8))
    road = bpy.context.active_object
    col(road, 0.24, 0.24, 0.26)

    # Double yellow center lines
    for dy in (-0.14, 0.14):
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(dy, 10, -1.77))
        line = bpy.context.active_object
        line.scale = (0.12, 35.0, 0.02)
        col(line, 0.96, 0.84, 0.12)

    # Sidewalks
    for sw_x in (-3.5, 3.5):
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(sw_x, 10, -1.72))
        sw = bpy.context.active_object
        sw.scale = (2.0, 35.0, 0.12)
        col(sw, 0.65, 0.65, 0.68)

    # Houses
    for hx, hy, hz, wall_col, roof_col in [
        (-6.5, 5.0, 0.2, (0.88, 0.58, 0.35), (0.45, 0.15, 0.12)),
        (6.5, 6.0, 0.2, (0.92, 0.85, 0.65), (0.55, 0.22, 0.15)),
    ]:
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(hx, hy, hz + 0.8))
        house = bpy.context.active_object
        house.scale = (3.2, 4.5, 2.6)
        col(house, wall_col[0], wall_col[1], wall_col[2])

        bpy.ops.mesh.primitive_cylinder_add(vertices=3, radius=2.4, depth=4.6, location=(hx, hy, hz + 2.5))
        roof = bpy.context.active_object
        roof.rotation_euler = (math.radians(90), 0, 0)
        col(roof, roof_col[0], roof_col[1], roof_col[2])

    char_base = (0.0, 2.0, -1.8)
    cam_x, cam_y, cam_z = 0.0, -2.4, 0.0
    cam_rot_x = 76.0

# ==============================================================================
# CHARACTER SYNTHESIS
# ==============================================================================
cx, cy, cz = char_base

if char_type == "null_glitch":
    # Obsidian Void Avatar
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(cx, cy, cz + 1.35))
    torso = bpy.context.active_object
    torso.scale = (0.65, 0.35, 0.72)
    col(torso, 0.02, 0.02, 0.03)

    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(cx, cy, cz + 2.1))
    head = bpy.context.active_object
    head.scale = (0.42, 0.42, 0.42)
    col(head, 0.02, 0.02, 0.03)

    # Piercing Red Eyes
    for eye_x in (-0.11, 0.11):
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(cx + eye_x, cy - 0.22, cz + 2.15))
        eye = bpy.context.active_object
        eye.scale = (0.05, 0.02, 0.06)
        col(eye, 1.0, 0.02, 0.02)

    # Glitch Aura Blocks
    for gx, gy, gz in [(-0.6, -0.2, 1.8), (0.7, 0.1, 2.3), (-0.3, 0.4, 0.8), (0.5, -0.3, 1.1)]:
        bpy.ops.mesh.primitive_cube_add(size=0.12, location=(cx + gx, cy + gy, cz + gz))
        gc = bpy.context.active_object
        col(gc, 0.95, 0.05, 0.05)

    for side in (-1, 1):
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(cx + side * 0.19, cy, cz + 0.55))
        leg = bpy.context.active_object
        leg.scale = (0.28, 0.28, 0.70)
        col(leg, 0.02, 0.02, 0.03)

        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(cx + side * 0.48, cy, cz + 1.3))
        arm = bpy.context.active_object
        arm.scale = (0.26, 0.26, 0.65)
        col(arm, 0.02, 0.02, 0.03)

elif char_type == "warrior_katana":
    # Warrior / Pirate with Dual-Tone Katana
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(cx, cy, cz + 1.30))
    torso = bpy.context.active_object
    torso.scale = (0.65, 0.35, 0.70)
    col(torso, 0.85, 0.15, 0.15) # Crimson Coat

    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(cx, cy, cz + 2.0))
    head = bpy.context.active_object
    head.scale = (0.40, 0.40, 0.40)
    col(head, 0.98, 0.84, 0.55)

    for side in (-1, 1):
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(cx + side * 0.18, cy, cz + 0.55))
        leg = bpy.context.active_object
        leg.scale = (0.28, 0.28, 0.65)
        col(leg, 0.15, 0.15, 0.18)

    # Arm holding Katana
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(cx + 0.52, cy + 0.25, cz + 1.35))
    arm = bpy.context.active_object
    arm.scale = (0.28, 0.28, 0.62)
    arm.rotation_euler = (math.radians(-45), 0, 0)
    col(arm, 0.85, 0.15, 0.15)

    # Glowing Katana Blade
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(cx + 0.65, cy + 0.85, cz + 1.95))
    blade = bpy.context.active_object
    blade.scale = (0.04, 0.12, 1.6)
    blade.rotation_euler = (math.radians(-35), 0, math.radians(-10))
    col(blade, 0.15, 0.88, 1.0) # Glowing Cyan Edge

elif char_type == "multi_lineup":
    # 4 Distinct Colored Avatars
    lineup_colors = [
        (0.95, 0.20, 0.20), # Red
        (0.20, 0.65, 0.95), # Blue
        (0.20, 0.85, 0.30), # Green
        (0.95, 0.85, 0.15), # Yellow
    ]
    for idx, (r, g, b) in enumerate(lineup_colors):
        lx = (idx - 1.5) * 1.3
        ly = cy + 1.0
        lz = cz

        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(lx, ly, lz + 1.2))
        torso = bpy.context.active_object
        torso.scale = (0.55, 0.30, 0.60)
        col(torso, r, g, b)

        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(lx, ly, lz + 1.8))
        head = bpy.context.active_object
        head.scale = (0.36, 0.36, 0.36)
        col(head, 0.98, 0.85, 0.55)

        for side in (-1, 1):
            bpy.ops.mesh.primitive_cube_add(size=1.0, location=(lx + side * 0.15, ly, lz + 0.5))
            leg = bpy.context.active_object
            leg.scale = (0.22, 0.22, 0.55)
            col(leg, 0.18, 0.20, 0.24)

else:
    # Classic / Explorer Avatar with Details
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(cx, cy, cz + 1.25))
    torso = bpy.context.active_object
    torso.scale = (0.62, 0.32, 0.68)
    col(torso, 0.14, 0.44, 0.86)

    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(cx, cy, cz + 1.95))
    head = bpy.context.active_object
    head.scale = (0.38, 0.38, 0.38)
    head.rotation_euler = (math.radians(-35), 0, 0)
    col(head, 0.98, 0.85, 0.55)

    # Face Eyes
    for eye_side in (-1, 1):
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(cx + eye_side * 0.09, cy - 0.20, cz + 1.98))
        eye = bpy.context.active_object
        eye.scale = (0.045, 0.02, 0.055)
        col(eye, 0.06, 0.06, 0.08)

    # Boonie Explorer Hat if Explorer
    if char_type == "explorer":
        bpy.ops.mesh.primitive_cylinder_add(radius=0.38, depth=0.04, location=(cx, cy - 0.07, cz + 2.16))
        brim = bpy.context.active_object
        col(brim, 0.72, 0.64, 0.48)
        bpy.ops.mesh.primitive_cylinder_add(radius=0.24, depth=0.16, location=(cx, cy - 0.05, cz + 2.24))
        crown = bpy.context.active_object
        col(crown, 0.68, 0.60, 0.44)

    for side in (-1, 1):
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(cx + side * 0.46, cy, cz + 1.2))
        arm = bpy.context.active_object
        arm.scale = (0.28, 0.28, 0.62)
        col(arm, 0.98, 0.85, 0.55)

        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(cx + side * 0.17, cy, cz + 0.52))
        leg = bpy.context.active_object
        leg.scale = (0.28, 0.28, 0.65)
        col(leg, 0.20, 0.75, 0.20)

# ==============================================================================
# CAMERA SETUP
# ==============================================================================
if shot_type == "close_up":
    cam_x = cx
    cam_y = cy - 1.2
    cam_z = cz + 1.6
    cam_rot_x = 42.0
elif shot_type == "overhead":
    cam_x = 0.0
    cam_y = cy - 3.2
    cam_z = cz + 5.0
    cam_rot_x = 35.0

cam_data = bpy.data.cameras.new("DynamicCam")
cam_data.lens = 24
cam_obj = bpy.data.objects.new("DynamicCam", cam_data)
scene.collection.objects.link(cam_obj)
scene.camera = cam_obj
cam_obj.location = (cam_x, cam_y, cam_z)
cam_obj.rotation_euler = (math.radians(cam_rot_x), 0, 0)

scene.render.filepath = r"{str(hero_still_path)}"
bpy.ops.render.render(write_still=True)
print("HERO_STILL_RENDERED_DYNAMIC_SYNTHESIS")
'''
        return script

    def render_scene(self, request_payload: Dict[str, Any]) -> Dict[str, Any]:
        if request_payload.get("animateMotion"):
            from .blender_full_engine import BlenderFull3DEngine
            return BlenderFull3DEngine().render_scene(request_payload)

        t0 = time.time()
        scene_id = request_payload.get("sceneId") or f"hybrid_{int(time.time())}"
        duration = float(request_payload.get("durationSeconds", 3.0))
        subtitles = request_payload.get("subtitles") or {}

        hero_still_path = (OUTPUT_DIR / f"{scene_id}_hero.png").resolve()
        out_mp4_path = (OUTPUT_DIR / f"{scene_id}_3d_short.mp4").resolve()

        # 1. Render high-res prompt-driven 3D hero still via Blender 5.2
        blender_script = self._build_blender_script(hero_still_path, scene_id, request_payload)
        script_file = OUTPUT_DIR / f"script_{scene_id}.py"
        script_file.write_text(blender_script, encoding="utf-8")

        try:
            subprocess.run([BLENDER_EXE, "-b", "--python", str(script_file)], check=True, capture_output=True, timeout=25.0)
        finally:
            if script_file.exists():
                try:
                    script_file.unlink()
                except Exception:
                    pass

        # 2. Build ASS Subtitles if provided
        subtitle_filter = []
        subtitle_text = subtitles.get("text", "").strip() if isinstance(subtitles, dict) else str(subtitles).strip()
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
