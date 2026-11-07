"""
backend/features/workspace/animation_prep/spline_generator.py

Camera trajectory spline generator (Milestone 9).
Generates smooth cubic bezier path keyframes for 3D camera staging.
"""

from typing import Any, Dict, List


def generate_camera_spline(
    start_transform: Dict[str, Any],
    end_transform: Dict[str, Any],
    duration: float,
    movement_type: str = "push_in",
    lens_mm: float = 35.0,
) -> List[Dict[str, Any]]:
    """
    Interpolates camera position, rotation, and field of view over scene duration.
    Yields start and end keyframes with cubic bezier easing.
    """
    start_pos = start_transform.get("position", {"x": 0.0, "y": -4.0, "z": 1.2})
    end_pos = end_transform.get("position", {"x": 0.0, "y": -2.5, "z": 1.2})

    start_rot = start_transform.get("rotation", {"x": 10.0, "y": 0.0, "z": 0.0})
    end_rot = end_transform.get("rotation", {"x": 5.0, "y": 0.0, "z": 0.0})

    keyframe_0 = {
        "time": 0.0,
        "position": start_pos,
        "rotation": start_rot,
        "focalLength": lens_mm,
        "interpolation": "BEZIER",
        "easing": "EASE_IN_OUT",
    }

    keyframe_end = {
        "time": round(duration, 2),
        "position": end_pos,
        "rotation": end_rot,
        "focalLength": lens_mm,
        "interpolation": "BEZIER",
        "easing": "EASE_IN_OUT",
    }

    return [keyframe_0, keyframe_end]

