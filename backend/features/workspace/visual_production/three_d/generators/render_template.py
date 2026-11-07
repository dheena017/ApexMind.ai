"""
backend/features/workspace/visual_production/three_d/generators/render_template.py

Headless Blender Python script executed inside the Blender 5.2 LTS runtime.
Constructs procedural 3D environments, character staging, lighting rigs,
and camera animation splines, rendering directly to high-fidelity PNG frame sequences.
"""

import json
import math
import os
import sys

# Attempt bpy import (available when running inside Blender)
try:
    import bpy
    import mathutils
except ImportError:
    bpy = None
    mathutils = None


def run_blender_scene_generation():
    if not bpy:
        print("ERROR: This script must be executed inside Blender via 'blender -b -P'.", file=sys.stderr)
        sys.exit(1)

    # 1. Parse payload JSON from arguments after '--'
    argv = sys.argv
    if "--" not in argv:
        print("ERROR: Missing payload argument after '--'.", file=sys.stderr)
        sys.exit(1)

    payload_file = argv[argv.index("--") + 1]
    with open(payload_file, "r", encoding="utf-8") as f:
        payload = json.load(f)

    frames_prefix = payload.get("frames_prefix") or payload.get("output_path", "output_frame_")
    width = int(payload.get("width", 1080))
    height = int(payload.get("height", 1920))
    fps = int(payload.get("fps", 30))
    frame_count = max(1, int(payload.get("frame_count", 90)))
    render_alpha = bool(payload.get("render_alpha", False))
    engine = str(payload.get("engine", "BLENDER_EEVEE"))
    samples = int(payload.get("samples", 12))
    camera_movement = payload.get("camera_movement", "push_in").lower()
    description = payload.get("visual_description", "")

    # Normalize engine for Blender 5.2 LTS ('BLENDER_EEVEE' or 'CYCLES')
    if "EEVEE" in engine.upper():
        engine = "BLENDER_EEVEE"
    elif "CYCLE" in engine.upper():
        engine = "CYCLES"
    else:
        engine = "BLENDER_EEVEE"

    print(f"[Blender] Setting up procedural scene: {width}x{height} @ {fps}fps ({frame_count} frames, engine={engine})")

    # 2. Reset to clean empty scene
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene

    # 3. Configure render engine & dimensions
    try:
        scene.render.engine = engine
    except Exception:
        scene.render.engine = "BLENDER_EEVEE"

    if scene.render.engine == "BLENDER_EEVEE":
        try:
            scene.eevee.taa_render_samples = samples
        except Exception:
            pass
    elif scene.render.engine == "CYCLES":
        try:
            scene.cycles.samples = samples
            scene.cycles.use_denoising = True
        except Exception:
            pass

    scene.render.resolution_x = width
    scene.render.resolution_y = height
    scene.render.fps = fps
    scene.frame_start = 1
    scene.frame_end = frame_count

    if render_alpha:
        scene.render.film_transparent = True

    # 4. Create procedural ground / environment
    bpy.ops.mesh.primitive_plane_add(size=30, location=(0, 0, 0))
    ground = bpy.context.active_object
    ground.name = "Ground_Plane"

    if render_alpha:
        # For transparent overlay renders, configure ground as shadow catcher or hide
        try:
            ground.is_shadow_catcher = True
        except Exception:
            pass
        if engine != "CYCLES":
            # In EEVEE, hide ground plane in render so alpha channel remains pure transparent
            ground.hide_render = True

    # Material for ground
    mat_ground = bpy.data.materials.new(name="Mat_Ground")
    try:
        mat_ground.use_nodes = True
        bsdf_ground = mat_ground.node_tree.nodes.get("Principled BSDF")
        if bsdf_ground:
            # Dark moody cinematic tone
            bsdf_ground.inputs["Base Color"].default_value = (0.05, 0.07, 0.09, 1.0)
            bsdf_ground.inputs["Roughness"].default_value = 0.6
    except Exception:
        pass
    ground.data.materials.append(mat_ground)

    # 5. Import Pre-Created / Reusable 3D Assets or Fallback to Stylized Subject
    assets = payload.get("assets") or []
    has_imported_character = False

    for item in assets:
        m_path = item.get("path")
        if m_path and os.path.exists(m_path):
            try:
                bpy.ops.object.select_all(action='DESELECT')
                ext = os.path.splitext(m_path)[1].lower()

                if ext == ".blend":
                    # Append objects from external .blend asset catalog
                    with bpy.data.libraries.load(m_path, link=False) as (data_from, data_to):
                        data_to.objects = [o for o in data_from.objects if not o.startswith("_")]
                    for o in data_to.objects:
                        if o is not None:
                            scene.collection.objects.link(o)
                            o.select_set(True)
                elif ext in (".gltf", ".glb"):
                    bpy.ops.import_scene.gltf(filepath=m_path)
                elif ext == ".obj":
                    bpy.ops.wm.obj_import(filepath=m_path)

                imported = [o for o in bpy.context.selected_objects if not o.parent]
                pos = item.get("position", [0.0, 0.0, 0.0])
                scale = item.get("scale", [1.0, 1.0, 1.0])
                for o in imported:
                    o.location = (pos[0], pos[1], pos[2])
                    o.scale = (scale[0], scale[1], scale[2])
                if item.get("type") in ("character", "focal", "animal"):
                    has_imported_character = True
                print(f"[Blender] Successfully imported 3D asset: {item.get('name')} from {m_path}")
            except Exception as imp_err:
                print(f"WARN: Failed importing {m_path}: {imp_err}")

    # Fallback to procedural focal subject mannequin if no pre-created character imported
    if not has_imported_character:
        bpy.ops.mesh.primitive_cylinder_add(radius=0.4, depth=1.6, location=(0, 0, 0.8))
        subject = bpy.context.active_object
        subject.name = "Focal_Subject"

        mat_subject = bpy.data.materials.new(name="Mat_Subject")
        try:
            mat_subject.use_nodes = True
            bsdf_subject = mat_subject.node_tree.nodes.get("Principled BSDF")
            if bsdf_subject:
                # Subtle warm bronze or teal metallic tone
                bsdf_subject.inputs["Base Color"].default_value = (0.65, 0.42, 0.22, 1.0)
                bsdf_subject.inputs["Metallic"].default_value = 0.4
                bsdf_subject.inputs["Roughness"].default_value = 0.35
        except Exception:
            pass
        subject.data.materials.append(mat_subject)

    # 6. Cinematic 3-point lighting rig
    # Key light
    bpy.ops.object.light_add(type="AREA", radius=2.0, location=(2.5, -3.0, 3.5))
    key_light = bpy.context.active_object
    key_light.data.energy = 350
    key_light.data.color = (1.0, 0.88, 0.72)  # Warm key

    # Fill light
    bpy.ops.object.light_add(type="AREA", radius=3.0, location=(-3.0, -2.5, 2.0))
    fill_light = bpy.context.active_object
    fill_light.data.energy = 120
    fill_light.data.color = (0.7, 0.82, 1.0)  # Cool fill

    # Rim / Back light
    bpy.ops.object.light_add(type="SPOT", location=(0, 3.0, 3.0))
    rim_light = bpy.context.active_object
    rim_light.data.energy = 400
    rim_light.data.spot_size = math.radians(60)
    rim_light.rotation_euler = (math.radians(-45), 0, math.radians(180))

    # 7. Animated Camera Rig with Cubic Bezier Splines
    bpy.ops.object.camera_add(location=(0, -4.5, 1.4), rotation=(math.radians(78), 0, 0))
    camera = bpy.context.active_object
    camera.name = "Main_Camera"
    camera.data.lens = 35.0
    scene.camera = camera

    # Camera motion keyframing
    if "orbit" in camera_movement:
        # Orbit motion around Z
        radius = 4.0
        for f in (1, frame_count):
            angle = (f / frame_count) * math.radians(35) - math.radians(17)
            camera.location = (radius * math.sin(angle), -radius * math.cos(angle), 1.3)
            camera.rotation_euler = (math.radians(78), 0, angle)
            camera.keyframe_insert(data_path="location", frame=f)
            camera.keyframe_insert(data_path="rotation_euler", frame=f)
    elif "pan" in camera_movement:
        camera.location = (-1.5, -4.0, 1.4)
        camera.keyframe_insert(data_path="location", frame=1)
        camera.location = (1.5, -4.0, 1.4)
        camera.keyframe_insert(data_path="location", frame=frame_count)
    else:
        # Default smooth push-in
        camera.location = (0, -4.5, 1.4)
        camera.keyframe_insert(data_path="location", frame=1)
        camera.location = (0, -2.6, 1.1)
        camera.keyframe_insert(data_path="location", frame=frame_count)

    # Set Bezier interpolation on camera curves (supports Blender 5.2 slotted actions and legacy)
    fcurves_list = []
    if camera.animation_data and camera.animation_data.action:
        act = camera.animation_data.action
        if hasattr(act, "fcurves"):
            fcurves_list.extend(act.fcurves)
        elif hasattr(act, "layers"):
            for layer in act.layers:
                for strip in getattr(layer, "strips", []):
                    for cb in getattr(strip, "channelbags", []):
                        fcurves_list.extend(getattr(cb, "fcurves", []))

    for fcurve in fcurves_list:
        for kf in getattr(fcurve, "keyframe_points", []):
            try:
                kf.interpolation = "BEZIER"
                kf.easing = "EASE_IN_OUT"
            except Exception:
                pass

    # 8. Render output configuration (PNG frame sequence)
    scene.render.image_settings.file_format = "PNG"
    if render_alpha:
        scene.render.image_settings.color_mode = "RGBA"
    else:
        scene.render.image_settings.color_mode = "RGB"

    scene.render.filepath = frames_prefix

    # 9. Execute render
    print(f"[Blender] Starting render of {frame_count} frames to {frames_prefix}####.png...")
    bpy.ops.render.render(animation=True)
    print("BLENDER_RENDER_COMPLETE")


if __name__ == "__main__":
    run_blender_scene_generation()
