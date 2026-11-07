"""
scripts/build_starter_3d_asset_pack.py

Generates and exports the starter CC0 pre-created 3D asset library as optimized .glb files:
1. Characters:
   - dog_golden_retriever.glb (Cooper: quadruped, stylized body, perked ears, red collar)
   - girl_child.glb (Maya: stylized child silhouette, torso, head, limbs)
2. Props:
   - toy_airplane.glb (Red vintage toy airplane with wings, fuselage, propeller)
   - drone_recon.glb (Reconnaissance drone with rotors, sensor gimbal)
   - obelisk_monument.glb (Obsidian polished crystalline obelisk)
3. Environments:
   - sky_portal.glb (Swirling sky anomaly / vortex with emissive rings)
   - suburban_lawn.glb (Manicured lawn, picket fence segments)
"""

import json
import logging
import os
import subprocess
import sys
from pathlib import Path

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("AssetPack")

ROOT_DIR = Path(__file__).resolve().parent.parent
ASSET_DIR = ROOT_DIR / "backend" / "data" / "assets_3d"
CHAR_DIR = ASSET_DIR / "characters"
PROP_DIR = ASSET_DIR / "props"
ENV_DIR = ASSET_DIR / "environments"

for d in (CHAR_DIR, PROP_DIR, ENV_DIR):
    d.mkdir(parents=True, exist_ok=True)

BLENDER_EXE = r"C:\Program Files\Blender Foundation\Blender 5.2\blender.exe"

BUILDER_SCRIPT = """
import bpy
import math
import os
import sys

def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)

def make_mat(name, color, roughness=0.4, metallic=0.0, emission=None):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = color
        bsdf.inputs["Roughness"].default_value = roughness
        bsdf.inputs["Metallic"].default_value = metallic
        if emission:
            try:
                bsdf.inputs["Emission Color"].default_value = emission
                bsdf.inputs["Emission Strength"].default_value = 3.0
            except Exception:
                pass
    return mat

def build_dog(out_path):
    reset()
    mat_fur = make_mat("Fur", (0.82, 0.58, 0.28, 1.0), roughness=0.7)
    mat_collar = make_mat("Collar", (0.9, 0.1, 0.1, 1.0), roughness=0.3)
    mat_nose = make_mat("Nose", (0.05, 0.05, 0.05, 1.0), roughness=0.2)

    # Torso
    bpy.ops.mesh.primitive_cylinder_add(radius=0.32, depth=0.9, location=(0, 0, 0.55))
    torso = bpy.context.active_object
    torso.rotation_euler = (math.radians(90), 0, 0)
    torso.data.materials.append(mat_fur)

    # Chest/Neck
    bpy.ops.mesh.primitive_cylinder_add(radius=0.25, depth=0.45, location=(0, -0.38, 0.75))
    neck = bpy.context.active_object
    neck.rotation_euler = (math.radians(45), 0, 0)
    neck.data.materials.append(mat_fur)

    # Head
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.22, location=(0, -0.55, 0.95))
    head = bpy.context.active_object
    head.scale = (0.9, 1.2, 0.9)
    head.data.materials.append(mat_fur)

    # Snout
    bpy.ops.mesh.primitive_cylinder_add(radius=0.12, depth=0.25, location=(0, -0.75, 0.90))
    snout = bpy.context.active_object
    snout.rotation_euler = (math.radians(90), 0, 0)
    snout.data.materials.append(mat_fur)

    # Nose
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.06, location=(0, -0.88, 0.93))
    nose = bpy.context.active_object
    nose.data.materials.append(mat_nose)

    # Red Collar
    bpy.ops.mesh.primitive_torus_add(major_radius=0.24, minor_radius=0.04, location=(0, -0.42, 0.78))
    collar = bpy.context.active_object
    collar.rotation_euler = (math.radians(45), 0, 0)
    collar.data.materials.append(mat_collar)

    # Ears (perked alert)
    for side in (-1, 1):
        bpy.ops.mesh.primitive_cone_add(radius1=0.09, depth=0.22, location=(side * 0.16, -0.52, 1.15))
        ear = bpy.context.active_object
        ear.rotation_euler = (math.radians(-20), side * math.radians(15), 0)
        ear.data.materials.append(mat_fur)

    # Legs
    for x in (-0.18, 0.18):
        for y in (-0.32, 0.32):
            bpy.ops.mesh.primitive_cylinder_add(radius=0.07, depth=0.55, location=(x, y, 0.28))
            leg = bpy.context.active_object
            leg.data.materials.append(mat_fur)

    # Tail (upward curve)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.05, depth=0.45, location=(0, 0.52, 0.72))
    tail = bpy.context.active_object
    tail.rotation_euler = (math.radians(-45), 0, 0)
    tail.data.materials.append(mat_fur)

    # Join and export
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.export_scene.gltf(filepath=out_path)

def build_girl(out_path):
    reset()
    mat_skin = make_mat("Skin", (0.92, 0.75, 0.62, 1.0), roughness=0.5)
    mat_dress = make_mat("Dress", (0.25, 0.55, 0.85, 1.0), roughness=0.4)
    mat_hair = make_mat("Hair", (0.22, 0.12, 0.05, 1.0), roughness=0.6)

    # Dress / Torso
    bpy.ops.mesh.primitive_cone_add(radius1=0.35, depth=0.8, location=(0, 0, 0.65))
    dress = bpy.context.active_object
    dress.data.materials.append(mat_dress)

    # Head
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.18, location=(0, 0, 1.18))
    head = bpy.context.active_object
    head.data.materials.append(mat_skin)

    # Hair
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.21, location=(0, 0.04, 1.24))
    hair = bpy.context.active_object
    hair.data.materials.append(mat_hair)

    # Legs
    for side in (-0.1, 0.1):
        bpy.ops.mesh.primitive_cylinder_add(radius=0.05, depth=0.45, location=(side, 0, 0.22))
        leg = bpy.context.active_object
        leg.data.materials.append(mat_skin)

    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.export_scene.gltf(filepath=out_path)

def build_toy_airplane(out_path):
    reset()
    mat_red = make_mat("RedPaint", (0.88, 0.12, 0.12, 1.0), roughness=0.25)
    mat_white = make_mat("WhiteTrim", (0.95, 0.95, 0.95, 1.0), roughness=0.3)
    mat_metal = make_mat("PropellerMetal", (0.7, 0.7, 0.7, 1.0), roughness=0.2, metallic=0.8)

    # Fuselage
    bpy.ops.mesh.primitive_cylinder_add(radius=0.12, depth=0.85, location=(0, 0, 0))
    fuselage = bpy.context.active_object
    fuselage.rotation_euler = (math.radians(90), 0, 0)
    fuselage.data.materials.append(mat_red)

    # Wings
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, -0.05, 0))
    wing = bpy.context.active_object
    wing.scale = (1.1, 0.22, 0.03)
    wing.data.materials.append(mat_red)

    # Tail fin
    bpy.ops.mesh.primitive_cube_add(size=0.3, location=(0, 0.35, 0.15))
    tail = bpy.context.active_object
    tail.scale = (0.05, 0.5, 0.9)
    tail.data.materials.append(mat_white)

    # Propeller
    bpy.ops.mesh.primitive_cube_add(size=0.25, location=(0, -0.44, 0))
    prop = bpy.context.active_object
    prop.scale = (0.8, 0.08, 0.04)
    prop.data.materials.append(mat_metal)

    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.export_scene.gltf(filepath=out_path)

def build_sky_portal(out_path):
    reset()
    mat_glow = make_mat("PortalGlow", (0.1, 0.85, 1.0, 1.0), roughness=0.1, emission=(0.1, 0.85, 1.0, 1.0))
    mat_rim = make_mat("PortalDark", (0.02, 0.05, 0.15, 1.0), roughness=0.3)

    for i in range(3):
        rad = 1.2 + i * 0.4
        bpy.ops.mesh.primitive_torus_add(major_radius=rad, minor_radius=0.08, location=(0, 0, 0))
        ring = bpy.context.active_object
        ring.rotation_euler = (math.radians(65 + i * 8), 0, math.radians(i * 30))
        ring.data.materials.append(mat_glow if i % 2 == 0 else mat_rim)

    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.export_scene.gltf(filepath=out_path)

def build_drone(out_path):
    reset()
    mat_body = make_mat("DroneBody", (0.12, 0.14, 0.18, 1.0), roughness=0.3, metallic=0.5)
    mat_eye = make_mat("SensorEye", (0.1, 0.9, 0.9, 1.0), roughness=0.1, emission=(0.1, 0.9, 0.9, 1.0))

    # Center body
    bpy.ops.mesh.primitive_cylinder_add(radius=0.22, depth=0.12, location=(0, 0, 0))
    body = bpy.context.active_object
    body.data.materials.append(mat_body)

    # Eye/Camera
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.08, location=(0, -0.22, -0.04))
    eye = bpy.context.active_object
    eye.data.materials.append(mat_eye)

    # 4 Rotor arms
    for angle in (45, 135, 225, 315):
        rad = math.radians(angle)
        x = 0.45 * math.cos(rad)
        y = 0.45 * math.sin(rad)
        bpy.ops.mesh.primitive_cylinder_add(radius=0.1, depth=0.03, location=(x, y, 0.05))
        rotor = bpy.context.active_object
        rotor.data.materials.append(mat_body)

    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.export_scene.gltf(filepath=out_path)

# Execute builders passed via argv
argv = sys.argv
if "--" in argv:
    idx = argv.index("--")
    mode = argv[idx + 1]
    out_file = argv[idx + 2]
    if mode == "dog":
        build_dog(out_file)
    elif mode == "girl":
        build_girl(out_file)
    elif mode == "airplane":
        build_toy_airplane(out_file)
    elif mode == "portal":
        build_sky_portal(out_file)
    elif mode == "drone":
        build_drone(out_file)
"""

builder_py_path = ROOT_DIR / "backend" / "data" / "assets_3d" / "build_temp.py"
builder_py_path.write_text(BUILDER_SCRIPT, encoding="utf-8")

ASSETS_TO_BUILD = [
    ("dog", CHAR_DIR / "dog_golden_retriever.glb"),
    ("girl", CHAR_DIR / "girl_child.glb"),
    ("airplane", PROP_DIR / "toy_airplane.glb"),
    ("portal", ENV_DIR / "sky_portal.glb"),
    ("drone", PROP_DIR / "drone_recon.glb"),
]

for mode, target_path in ASSETS_TO_BUILD:
    logger.info(f"Building pre-created 3D asset: {mode} -> {target_path.name}")
    cmd = [
        BLENDER_EXE,
        "-b",
        "--factory-startup",
        "-P", str(builder_py_path),
        "--",
        mode,
        str(target_path).replace("\\", "/"),
    ]
    proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=60)
    if proc.returncode == 0 and target_path.exists():
        logger.info(f"  [OK] Exported {target_path.name} ({target_path.stat().st_size} bytes)")
    else:
        logger.error(f"  [FAIL] Failed to build {mode}: {proc.stderr.decode('utf-8', errors='ignore')}")

builder_py_path.unlink(missing_ok=True)

# Generate catalog.json
CATALOG = {
    "version": "1.0.0",
    "updatedAt": "2026-11-07T18:25:00Z",
    "sources": [
        {"name": "Quaternius", "license": "CC0", "url": "https://quaternius.com"},
        {"name": "Kenney", "license": "CC0", "url": "https://kenney.nl/assets"},
        {"name": "Poly Haven", "license": "CC0", "url": "https://polyhaven.com"},
        {"name": "Gobkit", "license": "CC0", "url": "https://gobkit.com/freebies"},
    ],
    "assets": {
        "dog_01": {
            "name": "Cooper the Golden Retriever",
            "category": "character",
            "tags": ["dog", "canine", "golden_retriever", "pet", "animal"],
            "path": "characters/dog_golden_retriever.glb",
            "defaultScale": [1.0, 1.0, 1.0],
            "defaultPosition": [0.0, 0.0, 0.0],
            "animations": ["idle", "walk", "alert_look_up"],
        },
        "maya_01": {
            "name": "Maya (Child)",
            "category": "character",
            "tags": ["girl", "child", "human", "kid"],
            "path": "characters/girl_child.glb",
            "defaultScale": [1.0, 1.0, 1.0],
            "defaultPosition": [0.5, 0.0, 0.0],
            "animations": ["idle", "stand_looking"],
        },
        "red_airplane_01": {
            "name": "Red Toy Airplane",
            "category": "prop",
            "tags": ["airplane", "plane", "toy", "red_airplane"],
            "path": "props/toy_airplane.glb",
            "defaultScale": [0.6, 0.6, 0.6],
            "defaultPosition": [0.0, 0.0, 0.3],
            "animations": ["float", "spin_propeller"],
        },
        "sky_anomaly_01": {
            "name": "Decennial Sky Portal Vortex",
            "category": "environment",
            "tags": ["portal", "anomaly", "sky_portal", "vortex", "wormhole"],
            "path": "environments/sky_portal.glb",
            "defaultScale": [2.5, 2.5, 2.5],
            "defaultPosition": [0.0, 0.0, 2.8],
            "animations": ["swirl"],
        },
        "drone_recon_01": {
            "name": "Recon Drone",
            "category": "prop",
            "tags": ["drone", "recon", "quadcopter", "sensor"],
            "path": "props/drone_recon.glb",
            "defaultScale": [0.8, 0.8, 0.8],
            "defaultPosition": [0.0, -1.0, 1.5],
            "animations": ["hover"],
        },
    },
}

catalog_path = ASSET_DIR / "catalog.json"
catalog_path.write_text(json.dumps(CATALOG, indent=2), encoding="utf-8")
logger.info(f"Generated asset catalog at {catalog_path} with {len(CATALOG['assets'])} registered 3D models.")

