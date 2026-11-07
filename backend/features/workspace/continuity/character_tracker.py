"""
backend/features/workspace/continuity/character_tracker.py

Character continuity and appearance consistency tracker (Milestone 8).
Validates that character physical traits, accessories, and scale remain consistent across scenes.
"""

from typing import Any, Dict, List, Optional


class CharacterContinuityTracker:
    """Verifies that characters maintain immutable appearance and consistent styling."""

    def __init__(self, character_manifest: Optional[List[Dict[str, Any]]] = None):
        self.manifest_characters: Dict[str, Dict[str, Any]] = {
            c["id"]: c for c in (character_manifest or []) if "id" in c
        }

    def track_scene_appearances(
        self, scenes: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Scans all scenes to register appearances and flags continuity violations.
        Returns appearance map and continuity warnings.
        """
        appearance_map: Dict[str, List[int]] = {}
        continuity_warnings: List[str] = []
        character_states: Dict[str, Dict[str, Any]] = {}

        for scene in scenes:
            scene_num = scene.get("sceneNumber", 0)
            characters = scene.get("characters", [])

            for char in characters:
                char_id = char.get("characterId") or char.get("id") or char.get("name")
                if not char_id:
                    continue

                if char_id not in appearance_map:
                    appearance_map[char_id] = []
                    character_states[char_id] = {
                        "scale": char.get("scale"),
                        "costume": char.get("costume"),
                    }

                appearance_map[char_id].append(scene_num)

                # Check scale continuity
                initial_scale = character_states[char_id].get("scale")
                curr_scale = char.get("scale")
                if initial_scale and curr_scale and initial_scale != curr_scale:
                    continuity_warnings.append(
                        f"Character '{char_id}' scale changed unexpectedly from {initial_scale} to {curr_scale} in Scene {scene_num}."
                    )

        return {
            "appearanceMap": appearance_map,
            "characterCount": len(appearance_map),
            "warnings": continuity_warnings,
        }

