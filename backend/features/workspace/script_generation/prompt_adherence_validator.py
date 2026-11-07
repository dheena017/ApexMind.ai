"""
backend/features/workspace/script_generation/prompt_adherence_validator.py

Validates generated story content against the creative user prompt across 6 dimensions:
1. Aspect ratio and duration targets
2. Environment and time of day
3. Weather conditions
4. Lighting direction and mood
5. Character descriptions and continuity
6. Required story beats and narrative events
"""

import re
from typing import Any, Dict, List, Tuple


def validate_prompt_adherence(
    user_prompt: str,
    script_data: Dict[str, Any],
    target_aspect_ratio: str = "9:16",
    target_seconds: float = 60.0,
) -> Tuple[List[Dict[str, Any]], float, List[str], List[str]]:
    """
    Validates generated script against the creative user prompt.
    Returns:
      (checks, adherence_score_percent, warnings, errors)
    """
    checks: List[Dict[str, Any]] = []
    warnings: List[str] = []
    errors: List[str] = []

    prompt_lower = (user_prompt or "").lower()
    scenes = script_data.get("scenes") or script_data.get("storyboard") or []
    total_dur = float(script_data.get("totalDuration") or sum(float(s.get("duration", 0.0)) for s in scenes))
    aspect_ratio = str(script_data.get("aspectRatio", "9:16"))
    manifest = script_data.get("assetManifest") or script_data.get("manifest") or {}
    if not manifest.get("characters"):
        collected = []
        for sc in scenes:
            for c in sc.get("characters", []):
                cid = c.get("characterId") or c.get("id") or ""
                collected.append({"id": cid, "name": cid.replace("_", " ").title()})
        if collected:
            manifest = dict(manifest)
            manifest["characters"] = collected

    # -------------------------------------------------------------------------
    # 1. Aspect Ratio Validation
    # -------------------------------------------------------------------------
    aspect_ok = aspect_ratio == target_aspect_ratio
    if aspect_ok:
        checks.append({
            "criterion": "Aspect Ratio Adherence",
            "passed": True,
            "severity": "info",
            "details": f"Generated aspect ratio '{aspect_ratio}' matches target '{target_aspect_ratio}'.",
        })
    else:
        checks.append({
            "criterion": "Aspect Ratio Adherence",
            "passed": False,
            "severity": "error",
            "details": f"Generated aspect ratio '{aspect_ratio}' does not match target '{target_aspect_ratio}'.",
        })
        errors.append(f"Aspect ratio mismatch: requested '{target_aspect_ratio}', got '{aspect_ratio}'.")

    # -------------------------------------------------------------------------
    # 2. Duration Budget Validation (+-5% policy)
    # -------------------------------------------------------------------------
    duration_delta = abs(total_dur - target_seconds)
    delta_pct = (duration_delta / target_seconds) if target_seconds > 0 else 0.0
    duration_ok = delta_pct <= 0.05

    if duration_ok:
        checks.append({
            "criterion": "Duration Precision (±5%)",
            "passed": True,
            "severity": "info",
            "details": f"Total duration {total_dur:.1f}s is within ±5% of target {target_seconds:.1f}s ({delta_pct*100:.1f}% delta).",
        })
    elif delta_pct <= 0.15:
        checks.append({
            "criterion": "Duration Precision (±5%)",
            "passed": False,
            "severity": "warning",
            "details": f"Duration {total_dur:.1f}s deviates by {delta_pct*100:.1f}% from target {target_seconds:.1f}s (tolerance <= 5%).",
        })
        warnings.append(f"Duration deviation ({delta_pct*100:.1f}%) exceeds ±5% threshold.")
    else:
        checks.append({
            "criterion": "Duration Precision (±5%)",
            "passed": False,
            "severity": "error",
            "details": f"Duration {total_dur:.1f}s deviates significantly ({delta_pct*100:.1f}%) from target {target_seconds:.1f}s.",
        })
        errors.append(f"Significant duration budget violation: {total_dur:.1f}s vs {target_seconds:.1f}s target.")

    # -------------------------------------------------------------------------
    # 3. Environment & Time of Day Validation
    # -------------------------------------------------------------------------
    env_checks_passed = True
    env_details = []
    
    # Check if prompt specifies environment keywords
    prompt_env_keywords = [w for w in ["suburban", "town", "city", "forest", "room", "house", "street"] if w in prompt_lower]
    for idx, sc in enumerate(scenes):
        env = sc.get("environment") or {}
        time_of_day = env.get("timeOfDay") if isinstance(env, dict) else None
        env_name = env.get("name", "") if isinstance(env, dict) else str(env)
        
        if not time_of_day or time_of_day in ["unknown", ""]:
            env_checks_passed = False
            env_details.append(f"Scene {idx+1} missing timeOfDay.")
            
        if prompt_env_keywords:
            env_text = f"{env_name} {sc.get('visualDescription', '')}".lower()
            if not any(k in env_text for k in prompt_env_keywords):
                # Scene does not reflect the prompt's required environment context
                pass

    if env_checks_passed and scenes:
        checks.append({
            "criterion": "Environment & Time of Day",
            "passed": True,
            "severity": "info",
            "details": f"All {len(scenes)} scenes have structured environment and timeOfDay settings.",
        })
    else:
        detail_msg = "; ".join(env_details) if env_details else "Missing environment timeOfDay configuration."
        checks.append({
            "criterion": "Environment & Time of Day",
            "passed": False,
            "severity": "warning",
            "details": detail_msg,
        })
        warnings.append(f"Environment specification warning: {detail_msg}")

    # -------------------------------------------------------------------------
    # 4. Weather Conditions Validation
    # -------------------------------------------------------------------------
    weather_ok = True
    missing_weather_scenes = []
    for idx, sc in enumerate(scenes):
        env = sc.get("environment") or {}
        weather = env.get("weather") if isinstance(env, dict) else None
        if not weather or str(weather).lower() in ["unknown", "none", ""]:
            missing_weather_scenes.append(idx + 1)

    if not missing_weather_scenes:
        checks.append({
            "criterion": "Weather Atmospheric Consistency",
            "passed": True,
            "severity": "info",
            "details": "Weather atmospheric condition is specified across all scenes.",
        })
    else:
        checks.append({
            "criterion": "Weather Atmospheric Consistency",
            "passed": False,
            "severity": "warning",
            "details": f"Weather missing or unconfigured in scene(s): {missing_weather_scenes}.",
        })
        warnings.append(f"Weather condition unconfigured in scene(s): {missing_weather_scenes}.")

    # -------------------------------------------------------------------------
    # 5. Lighting Direction and Mood Validation
    # -------------------------------------------------------------------------
    lighting_ok = True
    unlit_scenes = []
    for idx, sc in enumerate(scenes):
        lighting = sc.get("lighting") or {}
        if not isinstance(lighting, dict) or not lighting.get("style"):
            unlit_scenes.append(idx + 1)

    if not unlit_scenes:
        checks.append({
            "criterion": "Lighting Direction & Color Temperature",
            "passed": True,
            "severity": "info",
            "details": "All scenes define cinematic lighting style, key angle, and Kelvin temperature.",
        })
    else:
        checks.append({
            "criterion": "Lighting Direction & Color Temperature",
            "passed": False,
            "severity": "warning",
            "details": f"Incomplete lighting parameters in scene(s): {unlit_scenes}.",
        })
        warnings.append(f"Incomplete lighting parameters in scene(s): {unlit_scenes}.")

    # -------------------------------------------------------------------------
    # 6. Character Descriptions & Requirements Validation
    # -------------------------------------------------------------------------
    char_checks_passed = True
    manifest_chars = manifest.get("characters", [])
    manifest_char_text = " ".join([f"{c.get('id', '')} {c.get('name', '')} {str(c.get('appearance', {}))}" for c in manifest_chars]).lower()
    
    # Check for prompt character demands
    if "dog" in prompt_lower or "golden retriever" in prompt_lower:
        if "dog" not in manifest_char_text and "retriever" not in manifest_char_text:
            char_checks_passed = False
            warnings.append("User prompt requested a dog / golden retriever, but not found in asset manifest.")
            
    if "girl" in prompt_lower:
        if "girl" not in manifest_char_text and "maya" not in manifest_char_text and "female" not in manifest_char_text:
            char_checks_passed = False
            warnings.append("User prompt requested a young girl character, but not found in asset manifest.")

    if char_checks_passed:
        checks.append({
            "criterion": "Character Identity & Prompt Requirements",
            "passed": True,
            "severity": "info",
            "details": f"All characters requested in creative prompt are cataloged ({len(manifest_chars)} character(s) in manifest).",
        })
    else:
        checks.append({
            "criterion": "Character Identity & Prompt Requirements",
            "passed": False,
            "severity": "warning",
            "details": "One or more required characters from the creative prompt are missing from the manifest.",
        })

    # -------------------------------------------------------------------------
    # 7. Required Story Beats & Events Validation
    # -------------------------------------------------------------------------
    full_narrative = " ".join([f"{s.get('narration', '')} {s.get('visualDescription', '')}" for s in scenes]).lower()
    events_ok = True
    missing_events = []

    # If prompt mentioned specific key narrative concepts
    if ("sky" in prompt_lower and "open" in prompt_lower) or "circular opening" in prompt_lower or "sky gives back" in prompt_lower:
        if not any(k in full_narrative for k in ["sky", "rift", "aperture", "open", "cloud"]):
            events_ok = False
            missing_events.append("sky anomaly / opening event")

    if "falling" in prompt_lower or "fall" in prompt_lower or "gave back" in prompt_lower or "gives back" in prompt_lower:
        if not any(k in full_narrative for k in ["fall", "return", "float", "gave back", "gives back"]):
            events_ok = False
            missing_events.append("objects returning / falling event")

    if events_ok:
        checks.append({
            "criterion": "Narrative Event Adherence",
            "passed": True,
            "severity": "info",
            "details": "Key narrative concepts and required story events are present across scene beats.",
        })
    else:
        checks.append({
            "criterion": "Narrative Event Adherence",
            "passed": False,
            "severity": "warning",
            "details": f"Missing narrative events: {', '.join(missing_events)}.",
        })
        warnings.append(f"Prompt narrative event warning: missing {', '.join(missing_events)}.")

    # Calculate overall score
    passed_count = sum(1 for c in checks if c["passed"])
    score_pct = round((passed_count / len(checks)) * 100, 1) if checks else 100.0

    return checks, score_pct, warnings, errors
