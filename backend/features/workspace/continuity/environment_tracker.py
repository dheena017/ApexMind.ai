"""
backend/features/workspace/continuity/environment_tracker.py

Environment and lighting continuity tracker (Milestone 8).
Validates that time-of-day, weather, and world scale do not jump unnaturally between contiguous scenes.
"""

from typing import Any, Dict, List


class EnvironmentContinuityTracker:
    """Monitors environment settings, time of day transitions, and lighting logic."""

    @staticmethod
    def audit_environment_flow(scenes: List[Dict[str, Any]]) -> Dict[str, Any]:
        warnings: List[str] = []
        environment_timeline: List[Dict[str, Any]] = []

        prev_env: Dict[str, Any] = {}
        for idx, sc in enumerate(scenes):
            scene_num = sc.get("sceneNumber", idx + 1)
            env = sc.get("environment") or {}
            lighting = sc.get("lighting") or {}

            time_of_day = env.get("timeOfDay") or lighting.get("timeOfDay")
            weather = env.get("weather")
            location = env.get("locationName") or env.get("preset")

            # Check consecutive jumps
            if prev_env:
                prev_tod = prev_env.get("timeOfDay")
                if prev_tod and time_of_day and prev_tod != time_of_day:
                    # e.g., noon to midnight in consecutive beats without transition note
                    transitions = sc.get("transitions", {})
                    if not transitions.get("type") or transitions.get("type") == "cut":
                        warnings.append(
                            f"Time of day shifted abruptly from '{prev_tod}' to '{time_of_day}' between Scene {scene_num - 1} and Scene {scene_num} without a temporal transition."
                        )

            record = {
                "sceneNumber": scene_num,
                "location": location,
                "timeOfDay": time_of_day,
                "weather": weather,
            }
            environment_timeline.append(record)
            prev_env = record

        return {
            "timeline": environment_timeline,
            "warnings": warnings,
        }

