"""
backend/features/workspace/animation_prep/locomotion_planner.py

Character locomotion planner (Milestone 9).
Computes root motion vectors, facing angles, and stride cycles.
"""

import math
from typing import Any, Dict


def plan_character_locomotion(
    start_pos: Dict[str, float],
    end_pos: Dict[str, float],
    duration: float,
    movement_type: str = "walk",
) -> Dict[str, Any]:
    """
    Computes root motion trajectory and stride frequency for character movement.
    """
    dx = end_pos.get("x", 0.0) - start_pos.get("x", 0.0)
    dy = end_pos.get("y", 0.0) - start_pos.get("y", 0.0)
    dz = end_pos.get("z", 0.0) - start_pos.get("z", 0.0)
    distance = math.sqrt(dx * dx + dy * dy + dz * dz)

    speed = distance / duration if duration > 0 else 0.0
    facing_angle_deg = math.degrees(math.atan2(dx, dy)) if (dx != 0 or dy != 0) else 0.0

    # Base stride length ~0.7m for walking, ~1.2m for running
    stride_length = 1.2 if movement_type == "run" else 0.7
    strides = distance / stride_length if stride_length > 0 else 0.0
    frequency = strides / duration if duration > 0 else 0.0

    return {
        "movementType": movement_type,
        "startPosition": start_pos,
        "endPosition": end_pos,
        "totalDistanceMeters": round(distance, 2),
        "averageSpeedMps": round(speed, 2),
        "facingAngleDegrees": round(facing_angle_deg, 1),
        "strideFrequencyHz": round(frequency, 2),
        "clipName": f"{movement_type.capitalize()}_Cycle",
    }

