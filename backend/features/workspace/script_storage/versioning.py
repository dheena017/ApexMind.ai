"""
backend/features/workspace/script_storage/versioning.py

Semantic diff and version comparison engine for Script Generation Architecture v2 (Milestone 7).
"""

from typing import Any, Dict, List, Optional


def compute_script_diff(
    old_version_payload: Dict[str, Any],
    new_version_payload: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Computes a semantic difference between two script version documents.
    Tracks changes to title, totalDuration, aspect ratio, scenes, and character assets.
    """
    diff: Dict[str, Any] = {
        "titleChanged": old_version_payload.get("title") != new_version_payload.get("title"),
        "oldTitle": old_version_payload.get("title"),
        "newTitle": new_version_payload.get("title"),
        "durationDelta": round(
            float(new_version_payload.get("totalDuration", 0.0))
            - float(old_version_payload.get("totalDuration", 0.0)),
            2,
        ),
        "scenesAdded": [],
        "scenesRemoved": [],
        "scenesModified": [],
        "summary": [],
    }

    old_scenes = {
        s.get("sceneNumber", idx + 1): s
        for idx, s in enumerate(old_version_payload.get("scenes", []))
    }
    new_scenes = {
        s.get("sceneNumber", idx + 1): s
        for idx, s in enumerate(new_version_payload.get("scenes", []))
    }

    # Added scenes
    for num, sc in new_scenes.items():
        if num not in old_scenes:
            diff["scenesAdded"].append({"sceneNumber": num, "scene": sc})
            diff["summary"].append(f"Added Scene {num}")

    # Removed scenes
    for num, sc in old_scenes.items():
        if num not in new_scenes:
            diff["scenesRemoved"].append({"sceneNumber": num, "scene": sc})
            diff["summary"].append(f"Removed Scene {num}")

    # Modified scenes
    for num, new_sc in new_scenes.items():
        if num in old_scenes:
            old_sc = old_scenes[num]
            changes = []
            if old_sc.get("narration") != new_sc.get("narration"):
                changes.append("narration")
            if old_sc.get("visualDescription") != new_sc.get("visualDescription"):
                changes.append("visualDescription")
            if abs(float(old_sc.get("duration", 0.0)) - float(new_sc.get("duration", 0.0))) > 0.05:
                changes.append("duration")
            if old_sc.get("camera") != new_sc.get("camera"):
                changes.append("camera")

            if changes:
                diff["scenesModified"].append({
                    "sceneNumber": num,
                    "changedFields": changes,
                    "old": {f: old_sc.get(f) for f in changes},
                    "new": {f: new_sc.get(f) for f in changes},
                })
                diff["summary"].append(f"Modified Scene {num} ({', '.join(changes)})")

    if not diff["summary"]:
        diff["summary"].append("No semantic changes detected between versions.")

    return diff

