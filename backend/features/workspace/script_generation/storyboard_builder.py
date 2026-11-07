"""
backend/features/workspace/script_generation/storyboard_builder.py
Storyboard sequence builder ensuring comprehensive defaults and 2D/3D compatibility.
"""

from typing import Any, Dict, List
from uuid import uuid4


def build_scene_sequence(
    raw_scenes: List[Dict[str, Any]],
    target_aspect_ratio: str = "9:16",
    generation_profile: str = "motivational_reel",
) -> List[Dict[str, Any]]:
    """
    Standardizes a list of scenes with guaranteed schema attributes,
    populating 3D camera/lighting defaults and preserving 2D timeline fields.
    """
    standardized: List[Dict[str, Any]] = []
    current_time = 0.0

    for idx, sc in enumerate(raw_scenes):
        scene_num = idx + 1
        dur = float(sc.get("duration", 3.0))
        start_t = float(sc.get("startTime", sc.get("start", current_time)))
        end_t = start_t + dur
        current_time = end_t

        narration = str(sc.get("narration") or sc.get("subtitleText") or "").strip()
        visual_desc = str(sc.get("visualDescription") or sc.get("mediaName") or "").strip()
        action = str(sc.get("action") or narration or "Scene action").strip()
        beat = str(sc.get("beat") or ("hook" if idx == 0 else "body")).strip()

        # Build 3D camera specification
        raw_cam = sc.get("camera") if isinstance(sc.get("camera"), dict) else {}
        cam_start_tf = raw_cam.get("startTransform", {
            "position": {"x": 0.0, "y": -4.0, "z": 1.2},
            "rotation": {"x": 0.0, "y": 0.0, "z": 0.0},
            "scale": {"x": 1.0, "y": 1.0, "z": 1.0},
        })
        cam_end_tf = raw_cam.get("endTransform", {
            "position": {"x": 0.0, "y": -2.8, "z": 1.2},
            "rotation": {"x": 0.0, "y": 0.0, "z": 0.0},
            "scale": {"x": 1.0, "y": 1.0, "z": 1.0},
        })

        # Normalize camera spline path
        spline_path: List[Dict[str, Any]] = []
        raw_spline = raw_cam.get("splinePath")
        if isinstance(raw_spline, list) and raw_spline:
            for kf in raw_spline:
                if isinstance(kf, dict):
                    spline_path.append({
                        "timestamp": round(float(kf.get("timestamp", kf.get("time", start_t))), 2),
                        "position": kf.get("position", cam_start_tf["position"]),
                        "rotation": kf.get("rotation", cam_start_tf["rotation"]),
                        "fovDegrees": float(kf.get("fovDegrees", kf.get("fov", 54.43))),
                        "tension": float(kf.get("tension", 0.0)),
                        "continuity": float(kf.get("continuity", 0.0)),
                        "bias": float(kf.get("bias", 0.0)),
                    })
        elif generation_profile == "cinematic_3d_story":
            spline_path = [
                {
                    "timestamp": round(start_t, 2),
                    "position": cam_start_tf.get("position", {"x": 0.0, "y": -4.0, "z": 1.2}),
                    "rotation": cam_start_tf.get("rotation", {"x": 0.0, "y": 0.0, "z": 0.0}),
                    "fovDegrees": 54.43,
                    "tension": 0.0,
                    "continuity": 0.0,
                    "bias": 0.0,
                },
                {
                    "timestamp": round(end_t, 2),
                    "position": cam_end_tf.get("position", {"x": 0.0, "y": -2.8, "z": 1.2}),
                    "rotation": cam_end_tf.get("rotation", {"x": 0.0, "y": 0.0, "z": 0.0}),
                    "fovDegrees": 54.43,
                    "tension": 0.0,
                    "continuity": 0.0,
                    "bias": 0.0,
                },
            ]

        camera = {
            "shot": raw_cam.get("shot", "wide"),
            "angle": raw_cam.get("angle", "eye_level"),
            "movement": raw_cam.get("movement", "slow_dolly_in"),
            "lens": raw_cam.get("lens", {
                "focalLengthMm": 35,
                "depthOfField": True,
                "fStop": 2.8,
                "sensorWidthMm": 36.0,
            }),
            "focusTarget": raw_cam.get("focusTarget"),
            "trackingMode": raw_cam.get("trackingMode", "look_at"),
            "duration": dur,
            "splinePath": spline_path,
            "startTransform": cam_start_tf,
            "endTransform": cam_end_tf,
        }

        # Build 3D lighting specification
        raw_light = sc.get("lighting") if isinstance(sc.get("lighting"), dict) else {}
        lighting = {
            "style": raw_light.get("style", "warm_cinematic"),
            "intensity": raw_light.get("intensity", "soft"),
            "keyLightAngle": raw_light.get("keyLightAngle", "side_45_deg"),
            "colorTemperature": int(raw_light.get("colorTemperature", 4500)),
        }

        # Build 3D environment specification
        raw_env = sc.get("environment")
        if isinstance(raw_env, dict):
            env_id = str(raw_env.get("assetId") or raw_env.get("id") or "autumn_town_01")
            environment = {
                "assetId": env_id,
                "name": str(raw_env.get("name") or env_id.replace("_", " ").title()),
                "timeOfDay": str(raw_env.get("timeOfDay", "morning")),
                "weather": str(raw_env.get("weather", "clear")),
                "ambientLighting": str(raw_env.get("ambientLighting", "warm_sunlight")),
                "layoutMapId": raw_env.get("layoutMapId"),
            }
        elif isinstance(raw_env, str) and raw_env.strip():
            env_id = raw_env.strip()
            environment = {
                "assetId": env_id,
                "name": env_id.replace("_", " ").title(),
                "timeOfDay": "morning",
                "weather": "clear",
                "ambientLighting": "warm_sunlight",
                "layoutMapId": None,
            }
        else:
            environment = {
                "assetId": "autumn_town_01",
                "name": "Suburban Town",
                "timeOfDay": "morning",
                "weather": "clear",
                "ambientLighting": "warm_sunlight",
                "layoutMapId": None,
            }

        # Build characters list with robust normalization
        characters: List[Dict[str, Any]] = []
        raw_chars = sc.get("characters")
        if isinstance(raw_chars, list):
            for c in raw_chars:
                if isinstance(c, dict):
                    cid = str(c.get("characterId") or c.get("id") or "char_01")
                    role = str(c.get("role", "primary"))
                    c_action = str(c.get("action", ""))
                    loco = c.get("locomotion") if isinstance(c.get("locomotion"), dict) else {
                        "type": "walk",
                        "speedMps": 1.2,
                        "pathType": "spline",
                    }
                    anim = c.get("animation") if isinstance(c.get("animation"), dict) else {
                        "clipId": c_action or "idle",
                        "startTime": round(start_t, 2),
                        "endTime": round(end_t, 2),
                        "loop": False,
                        "keyframes": [],
                    }
                    pos = c.get("position") if isinstance(c.get("position"), dict) else {}
                    start_tf = c.get("startTransform") if isinstance(c.get("startTransform"), dict) else {
                        "position": {
                            "x": float(pos.get("x", 0.0)),
                            "y": float(pos.get("y", 0.0)),
                            "z": float(pos.get("z", 0.0)),
                        },
                        "rotation": {"x": 0.0, "y": 0.0, "z": 0.0},
                        "scale": {"x": 1.0, "y": 1.0, "z": 1.0},
                    }
                    end_tf = c.get("endTransform") if isinstance(c.get("endTransform"), dict) else dict(start_tf)

                    characters.append({
                        "characterId": cid,
                        "role": role,
                        "action": c_action,
                        "locomotion": loco,
                        "animation": anim,
                        "facialAnimation": c.get("facialAnimation") if isinstance(c.get("facialAnimation"), list) else [],
                        "lipSyncVisemes": c.get("lipSyncVisemes") if isinstance(c.get("lipSyncVisemes"), list) else [],
                        "startTransform": start_tf,
                        "endTransform": end_tf,
                    })
                elif isinstance(c, str) and c.strip():
                    cid = c.strip()
                    characters.append({
                        "characterId": cid,
                        "role": "primary",
                        "action": "idle",
                        "locomotion": {"type": "walk", "speedMps": 1.2, "pathType": "spline"},
                        "animation": {"clipId": "idle", "startTime": round(start_t, 2), "endTime": round(end_t, 2), "loop": False, "keyframes": []},
                        "facialAnimation": [],
                        "lipSyncVisemes": [],
                        "startTransform": {"position": {"x": 0.0, "y": 0.0, "z": 0.0}, "rotation": {"x": 0.0, "y": 0.0, "z": 0.0}, "scale": {"x": 1.0, "y": 1.0, "z": 1.0}},
                        "endTransform": {"position": {"x": 0.0, "y": 0.0, "z": 0.0}, "rotation": {"x": 0.0, "y": 0.0, "z": 0.0}, "scale": {"x": 1.0, "y": 1.0, "z": 1.0}},
                    })

        # Build props list with robust normalization
        props: List[Dict[str, Any]] = []
        raw_props = sc.get("props")
        if isinstance(raw_props, list):
            for p in raw_props:
                if isinstance(p, dict):
                    pid = str(p.get("propId") or p.get("id") or f"prop_{scene_num:02d}")
                    pname = str(p.get("name") or pid.replace("_", " ").title())
                    placement = str(p.get("placement") or (f"pos({p['position']['x']},{p['position']['y']},{p['position']['z']})" if isinstance(p.get("position"), dict) else "ground"))
                    pstate = str(p.get("state", "idle"))
                    props.append({
                        "propId": pid,
                        "name": pname,
                        "placement": placement,
                        "state": pstate,
                    })
                elif isinstance(p, str) and p.strip():
                    pid = p.strip()
                    props.append({
                        "propId": pid,
                        "name": pid.replace("_", " ").title(),
                        "placement": "ground",
                        "state": "idle",
                    })

        # Build audio specification with robust normalization
        raw_audio = sc.get("audio") if isinstance(sc.get("audio"), dict) else {}
        sfx_list: List[Dict[str, Any]] = []
        raw_sfx = raw_audio.get("sfx")
        if isinstance(raw_sfx, list):
            for s_idx, s in enumerate(raw_sfx):
                if isinstance(s, dict):
                    cue = str(s.get("cueId") or s.get("id") or s.get("name") or "sfx_cue")
                    ts = float(s.get("timestamp", s.get("time", start_t + 0.5 * s_idx)))
                    v = float(s.get("volumeDb", -12.0))
                    pan = float(s.get("pan", 0.0))
                    sfx_list.append({
                        "cueId": cue,
                        "timestamp": round(ts, 2),
                        "volumeDb": v,
                        "pan": pan,
                    })
                elif isinstance(s, str) and s.strip():
                    sfx_list.append({
                        "cueId": s.strip(),
                        "timestamp": round(start_t + 0.5 * s_idx, 2),
                        "volumeDb": -12.0,
                        "pan": 0.0,
                    })

        audio = {
            "sampleRate": int(raw_audio.get("sampleRate", 24000)),
            "dialogue": raw_audio.get("dialogue", {
                "speakerId": "narrator",
                "voiceName": "Puck",
                "text": narration,
                "startOffset": 0.2,
                "words": [],
            }),
            "ambient": raw_audio.get("ambient", {
                "trackId": "ambient_default",
                "volumeDb": -18.0,
                "fadeInDuration": 0.5,
                "fadeOutDuration": 0.5,
            }),
            "sfx": sfx_list,
            "musicMood": str(raw_audio.get("musicMood", "orchestral_wonder")),
        }

        # Build transitions
        raw_trans = sc.get("transitions") if isinstance(sc.get("transitions"), dict) else {}
        transitions = {
            "inTransition": raw_trans.get("inTransition", "cut"),
            "outTransition": raw_trans.get("outTransition", "cut"),
            "duration": float(raw_trans.get("duration", 0.5)),
        }

        scene_obj = {
            "sceneId": sc.get("sceneId") or f"scn_{scene_num:02d}_{uuid4().hex[:6]}",
            "sceneNumber": scene_num,
            "startTime": round(start_t, 2),
            "endTime": round(end_t, 2),
            "duration": round(dur, 2),
            "narration": narration,
            "visualDescription": visual_desc,
            "action": action,
            "characters": characters,
            "environment": environment,
            "props": props,
            "camera": camera,
            "lighting": lighting,
            "audio": audio,
            "transitions": transitions,
            "continuityNotes": str(sc.get("continuityNotes", "")),
            # Downstream & 2D Timeline compatibility
            "start": round(start_t, 2),
            "beat": beat,
            "mediaType": sc.get("mediaType", "video"),
            "mediaStatus": sc.get("mediaStatus", "unresolved"),
            "videoPrompt": sc.get("videoPrompt", visual_desc),
            "subtitleText": sc.get("subtitleText", narration),
            "aspectRatio": target_aspect_ratio,
        }

        # Preserve any extra stock search queries if present
        for field in ["googleSearchQuery", "visualQuery", "fallbackQueries", "negativeTerms", "textStyleId", "captionPresetClass", "captionPresetColor"]:
            if field in sc:
                scene_obj[field] = sc[field]

        standardized.append(scene_obj)

    return standardized
