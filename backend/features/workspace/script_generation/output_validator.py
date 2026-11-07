"""
backend/features/workspace/script_generation/output_validator.py
Timing recalibration and structural validation engine for script generation.
"""

import logging
from typing import Any, Dict, List, Tuple
from .prompt_adherence_validator import validate_prompt_adherence

logger = logging.getLogger("ApexMind.ScriptGeneration.Validator")


def validate_and_recalibrate_script(
    script_data: Dict[str, Any],
    target_seconds: float,
    generation_profile: str = "motivational_reel",
    user_prompt: str = "",
    target_aspect_ratio: str = "9:16",
) -> Tuple[Dict[str, Any], Dict[str, Any]]:
    """
    Validates scene count, narrative structure, and duration budget.
    Linearly scales scene durations if within 15% tolerance, achieving +-5% target precision.
    Returns (recalibrated_script_data, validation_summary).
    """
    scenes = script_data.get("scenes") or script_data.get("storyboard") or []
    repaired_issues: List[str] = []
    errors: List[str] = []
    warnings: List[str] = []

    if not scenes:
        errors.append("Script contains zero scenes.")
        return script_data, {
            "isValid": False,
            "targetDuration": target_seconds,
            "actualDuration": 0.0,
            "durationDeltaPercent": 100.0,
            "sceneCount": 0,
            "repairedIssues": repaired_issues,
            "errors": errors,
            "warnings": warnings,
        }

    # 1. Calculate raw total duration
    raw_total = sum(float(s.get("duration", 0.0)) for s in scenes)
    delta_percent = abs(raw_total - target_seconds) / target_seconds if target_seconds > 0 else 0.0

    logger.debug(f"[Validator] Raw duration: {raw_total:.1f}s | Target: {target_seconds:.1f}s | Delta: {delta_percent*100:.1f}%")

    # 2. Timing recalibration: If within 15% tolerance or if duration was uncalibrated, scale linearly
    if raw_total <= 0 or delta_percent > 0.05:
        if raw_total > 0 and delta_percent <= 0.15:
            # Proportional scaling
            scale_factor = target_seconds / raw_total
            running_time = 0.0
            for idx, sc in enumerate(scenes):
                is_last = idx == len(scenes) - 1
                if is_last:
                    new_dur = max(1.5, round(target_seconds - running_time, 2))
                else:
                    new_dur = max(1.5, round(float(sc.get("duration", 3.0)) * scale_factor, 2))
                sc["startTime"] = round(running_time, 2)
                sc["start"] = sc["startTime"]
                sc["duration"] = new_dur
                running_time += new_dur
                sc["endTime"] = round(running_time, 2)
            repaired_issues.append(f"Linearly scaled scene durations from {raw_total:.1f}s to target {target_seconds:.1f}s.")
        else:
            # Rebalance evenly across scenes
            even_dur = round(target_seconds / len(scenes), 2)
            running_time = 0.0
            for idx, sc in enumerate(scenes):
                is_last = idx == len(scenes) - 1
                new_dur = max(1.5, round(target_seconds - running_time, 2)) if is_last else even_dur
                sc["startTime"] = round(running_time, 2)
                sc["start"] = sc["startTime"]
                sc["duration"] = new_dur
                running_time += new_dur
                sc["endTime"] = round(running_time, 2)
            repaired_issues.append(f"Rebalanced scene durations to {even_dur}s per scene to fit {target_seconds:.1f}s.")
    else:
        # Already within 5% target, just ensure contiguous startTime / endTime
        running_time = 0.0
        for sc in scenes:
            dur = float(sc.get("duration", 3.0))
            sc["startTime"] = round(running_time, 2)
            sc["start"] = sc["startTime"]
            running_time += dur
            sc["endTime"] = round(running_time, 2)

    final_total = sum(float(s.get("duration", 0.0)) for s in scenes)
    final_delta = abs(final_total - target_seconds) / target_seconds if target_seconds > 0 else 0.0

    script_data["scenes"] = scenes
    script_data["storyboard"] = scenes
    script_data["totalDuration"] = round(final_total, 2)

    # 3. Creative prompt adherence validation
    adherence_checks: List[Dict[str, Any]] = []
    adherence_score = 100.0
    if user_prompt:
        adherence_checks, adherence_score, adh_warns, adh_errs = validate_prompt_adherence(
            user_prompt=user_prompt,
            script_data=script_data,
            target_aspect_ratio=target_aspect_ratio,
            target_seconds=target_seconds,
        )
        warnings.extend(adh_warns)
        errors.extend(adh_errs)

    validation_summary = {
        "isValid": len(errors) == 0,
        "targetDuration": round(target_seconds, 2),
        "actualDuration": round(final_total, 2),
        "durationDeltaPercent": round(final_delta * 100, 2),
        "sceneCount": len(scenes),
        "repairedIssues": repaired_issues,
        "errors": errors,
        "warnings": warnings,
        "adherenceChecks": adherence_checks,
        "adherenceScorePercent": adherence_score,
    }

    return script_data, validation_summary

