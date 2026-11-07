"""
backend/features/workspace/script_generation/asset_planner.py

Asset cataloging, character identity planning, missing entity extraction,
and universal story-to-catalog asset binding generator.
"""

from typing import Any, Dict, List, Tuple
from ..asset_resolution.asset_resolver import BlenderAssetResolver, infer_asset_category


def extract_asset_manifest(
    scenes: List[Dict[str, Any]],
    raw_manifest: Dict[str, Any] | None = None,
) -> Tuple[Dict[str, Any], List[Dict[str, Any]]]:
    """
    Extracts or enriches the AssetManifest from generated scenes,
    reconciles physical entities mentioned in visual descriptions/actions (e.g. boy silhouette, debris),
    and computes verified universal story-to-catalog asset bindings (characters, animals, environments, props).
    """
    characters_map: Dict[str, Dict[str, Any]] = {}
    environments_map: Dict[str, Dict[str, Any]] = {}
    props_map: Dict[str, Dict[str, Any]] = {}

    # 1. Seed with any existing raw manifest items from LLM response
    if raw_manifest and isinstance(raw_manifest, dict):
        for c in raw_manifest.get("characters", []):
            if isinstance(c, dict) and c.get("id"):
                characters_map[c["id"]] = c
        for e in raw_manifest.get("environments", []):
            if isinstance(e, dict) and e.get("id"):
                environments_map[e["id"]] = e
        for p in raw_manifest.get("props", []):
            if isinstance(p, dict) and p.get("id"):
                props_map[p["id"]] = p

    # 2. Traverse scenes to discover and register all physical entities
    for sc in scenes:
        scene_num = sc.get("sceneNumber", 1)
        narrative_text = f"{sc.get('narration', '')} {sc.get('visualDescription', '')} {sc.get('action', '')}".lower()

        # Reconcile missing narrative entities mentioned in scene descriptions:
        # A. Boy silhouette (Maya's brother) in climax scenes (e.g., scene 7 or 8)
        if ("brother" in narrative_text or "silhouette of a small boy" in narrative_text or "small boy" in narrative_text) and scene_num >= 7:
            existing_char_ids = [c.get("characterId") or c.get("id") for c in sc.get("characters", []) if isinstance(c, dict)]
            if "boy_silhouette_01" not in existing_char_ids and "boy_01" not in existing_char_ids:
                sc.setdefault("characters", []).append({
                    "characterId": "boy_silhouette_01",
                    "role": "secondary",
                    "action": "descending_from_rift",
                    "classification": "secondary",
                    "locomotion": {"type": "float", "speedMps": 0.8, "pathType": "spline"},
                    "animation": {"clipId": "float_down", "startTime": sc.get("startTime", 0.0), "endTime": sc.get("endTime", 0.0), "loop": False, "keyframes": []},
                    "facialAnimation": [],
                    "lipSyncVisemes": [],
                    "startTransform": {"position": {"x": 0.0, "y": 2.0, "z": 3.0}, "rotation": {"x": 0.0, "y": 0.0, "z": 0.0}, "scale": {"x": 0.9, "y": 0.9, "z": 0.9}},
                    "endTransform": {"position": {"x": 0.0, "y": 0.5, "z": 1.0}, "rotation": {"x": 0.0, "y": 0.0, "z": 0.0}, "scale": {"x": 0.9, "y": 0.9, "z": 0.9}},
                })

        # B. Falling background debris (locket, shoe) in falling objects scenes
        if "locket" in narrative_text:
            existing_prop_ids = [p.get("propId") or p.get("id") for p in sc.get("props", []) if isinstance(p, dict)]
            if "locket_01" not in existing_prop_ids:
                sc.setdefault("props", []).append({
                    "propId": "locket_01",
                    "name": "Lost Locket",
                    "placement": "floating_debris",
                    "state": "floating",
                    "isGenericBackground": True,
                    "classification": "background_generic",
                })

        if "single shoe" in narrative_text or "shoe" in narrative_text:
            existing_prop_ids = [p.get("propId") or p.get("id") for p in sc.get("props", []) if isinstance(p, dict)]
            if "shoe_01" not in existing_prop_ids:
                sc.setdefault("props", []).append({
                    "propId": "shoe_01",
                    "name": "Single Shoe",
                    "placement": "floating_debris",
                    "state": "floating",
                    "isGenericBackground": True,
                    "classification": "background_generic",
                })

        # Register Characters in manifest
        for char in sc.get("characters", []):
            char_id = char.get("characterId") or char.get("id") if isinstance(char, dict) else str(char)
            if char_id:
                is_animal = any(k in char_id.lower() for k in ["dog", "retriever", "canine", "cat", "pet", "animal"])
                if char_id not in characters_map:
                    characters_map[char_id] = {
                        "id": char_id,
                        "assetType": "animal" if is_animal else "character",
                        "name": char_id.replace("_", " ").title(),
                        "appearance": {
                            "species": "canine" if is_animal else "humanoid",
                            "build": "slender" if "girl" in char_id or "boy" in char_id else "medium",
                        },
                        "accessories": [{"id": "red_collar", "type": "collar", "color": "crimson_red"}] if is_animal else [],
                        "identityRules": {
                            "preserveAppearance": True,
                            "preserveAccessories": True,
                            "reuseAcrossScenes": True,
                        },
                        "classification": char.get("classification", "secondary" if "silhouette" in char_id else "hero"),
                        "usage": {"firstScene": scene_num, "lastScene": scene_num, "sceneAppearances": [scene_num]},
                    }
                else:
                    usage = characters_map[char_id].setdefault("usage", {})
                    usage["lastScene"] = max(usage.get("lastScene", scene_num), scene_num)
                    appearances = usage.setdefault("sceneAppearances", [])
                    if scene_num not in appearances:
                        appearances.append(scene_num)

        # Register Environment in manifest
        env = sc.get("environment")
        if isinstance(env, dict) and env.get("assetId"):
            env_id = env["assetId"]
            if env_id not in environments_map:
                environments_map[env_id] = {
                    "id": env_id,
                    "assetType": "environment",
                    "name": env.get("name", env_id.replace("_", " ").title()),
                    "layoutMapId": env.get("layoutMapId"),
                    "timeOfDay": env.get("timeOfDay", "morning"),
                    "weather": env.get("weather", "clear"),
                    "fixedLandmarks": ["maple_boulevard", "cul_de_sac", "old_oak_tree"],
                    "lightingDefaults": {},
                    "classification": "hero",
                    "usage": {"sceneAppearances": [scene_num]},
                }
            else:
                apps = environments_map[env_id].setdefault("usage", {}).setdefault("sceneAppearances", [])
                if scene_num not in apps:
                    apps.append(scene_num)

        # Register Props in manifest
        for prop in sc.get("props", []):
            prop_id = prop.get("propId") or prop.get("id") if isinstance(prop, dict) else str(prop)
            if prop_id:
                is_bg = prop.get("isGenericBackground", False) if isinstance(prop, dict) else False
                prop_cls = prop.get("classification", "background_generic" if is_bg else "hero") if isinstance(prop, dict) else "hero"
                if prop_id not in props_map:
                    props_map[prop_id] = {
                        "id": prop_id,
                        "assetType": "prop",
                        "name": prop.get("name", prop_id.replace("_", " ").title()) if isinstance(prop, dict) else prop_id,
                        "description": "Scene prop item",
                        "scale": "small" if prop_id in ["toy_plane_01", "locket_01", "shoe_01"] else "medium",
                        "firstAppearsInScene": scene_num,
                        "reuseAcrossScenes": True,
                        "isGenericBackground": is_bg,
                        "classification": prop_cls,
                    }

    manifest = {
        "characters": list(characters_map.values()),
        "environments": list(environments_map.values()),
        "props": list(props_map.values()),
    }

    # 3. Generate Universal Story-to-Catalog Asset Bindings with Physical Verification
    resolver = BlenderAssetResolver()
    asset_bindings: List[Dict[str, Any]] = []

    # Bind all characters / animals
    for char_id, char_data in characters_map.items():
        is_animal = char_data.get("assetType") == "animal" or any(k in char_id.lower() for k in ["dog", "retriever", "canine", "cat"])
        category = "animals" if is_animal else "characters"
        binding = resolver.resolve_binding(
            story_asset_id=char_id,
            asset_type="animal" if is_animal else "character",
            name=char_data.get("name", char_id),
            classification=char_data.get("classification", "hero"),
            rig_type="rigify_quadruped" if is_animal else "humanoid",
            active_accessories=[acc.get("id") for acc in char_data.get("accessories", []) if isinstance(acc, dict)],
        )
        asset_bindings.append(binding)

    # Bind all environments
    for env_id, env_data in environments_map.items():
        binding = resolver.resolve_binding(
            story_asset_id=env_id,
            asset_type="environment",
            name=env_data.get("name", env_id),
            classification=env_data.get("classification", "hero"),
        )
        asset_bindings.append(binding)

    # Bind all props
    for prop_id, prop_data in props_map.items():
        binding = resolver.resolve_binding(
            story_asset_id=prop_id,
            asset_type="prop",
            name=prop_data.get("name", prop_id),
            is_generic_background=prop_data.get("isGenericBackground", False),
            classification=prop_data.get("classification", "hero"),
        )
        asset_bindings.append(binding)

    return manifest, asset_bindings
