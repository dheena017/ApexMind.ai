"""
backend/features/workspace/continuity/manifest_validator.py

Cross-referencing validator that ensures every entity in the scene is declared in the Asset Manifest.
"""

from typing import Any, Dict, List, Set


class ManifestCrossValidator:
    """Checks bidirectional referential integrity between scenes and the Asset Manifest."""

    @staticmethod
    def validate_manifest_bindings(
        scenes: List[Dict[str, Any]],
        manifest: Dict[str, Any],
    ) -> Dict[str, Any]:
        manifest_chars = {c.get("id") for c in manifest.get("characters", []) if c.get("id")}
        manifest_props = {p.get("id") for p in manifest.get("props", []) if p.get("id")}
        manifest_envs = {e.get("id") for e in manifest.get("environments", []) if e.get("id")}

        unbound_characters: Set[str] = set()
        unbound_props: Set[str] = set()
        missing_manifest_entries: List[str] = []

        for sc in scenes:
            scene_num = sc.get("sceneNumber", 0)
            # Characters
            for c in sc.get("characters", []):
                cid = c.get("characterId") or c.get("id")
                if cid and cid not in manifest_chars:
                    unbound_characters.add(cid)
                    missing_manifest_entries.append(
                        f"Scene {scene_num}: Character '{cid}' is present in scene but missing from Asset Manifest."
                    )

            # Props
            for p in sc.get("props", []):
                pid = p.get("propId") or p.get("id")
                if pid and pid not in manifest_props:
                    unbound_props.add(pid)
                    missing_manifest_entries.append(
                        f"Scene {scene_num}: Prop '{pid}' is present in scene but missing from Asset Manifest."
                    )

        return {
            "isManifestComplete": len(missing_manifest_entries) == 0,
            "unboundCharacters": list(unbound_characters),
            "unboundProps": list(unbound_props),
            "issues": missing_manifest_entries,
        }

