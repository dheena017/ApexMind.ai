"""
backend/features/workspace/script_generation/generation_service.py
Central orchestrator for ApexMind Script Generation v2.1.2.
"""

import logging
import time
from datetime import datetime, timezone
from typing import Any, Dict
from uuid import uuid4

from backend.shared.ai.model_registry import resolve_script_model
from backend.shared.ai.providers.gemini.script_generator import (
    _generate_script_with_fallback,
    _build_emergency_theme_script,
    parse_target_seconds,
)
from .prompt_builder import build_generation_prompt
from .storyboard_builder import build_scene_sequence
from .output_validator import validate_and_recalibrate_script
from .asset_planner import extract_asset_manifest

logger = logging.getLogger("ApexMind.ScriptGeneration.Service")


def run_script_generation(
    category: str = "Stoic Mindset & Discipline",
    topic: str = "",
    user_prompt: str | None = None,
    generation_profile: str = "motivational_reel",
    tone: str | None = None,
    length: str = "30 seconds",
    model: str | None = None,
    aspect_ratio: str = "9:16",
    voice_name: str | None = None,
    visual_style: str | None = None,
    subtitle_style: str | None = None,
    music_mood: str | None = None,
    project_id: str | None = None,
    user_id: str | None = None,
    **kwargs: Any,
) -> Dict[str, Any]:
    """
    Executes end-to-end script generation producing a verified ScriptGenerationResponse envelope.
    """
    # Normalize camelCase parameters
    generation_profile = kwargs.pop("generationProfile", None) or generation_profile
    user_prompt = kwargs.pop("userPrompt", None) or user_prompt
    aspect_ratio = kwargs.pop("aspectRatio", None) or aspect_ratio
    voice_name = kwargs.pop("voiceName", None) or voice_name
    visual_style = kwargs.pop("visualStyle", None) or visual_style
    subtitle_style = kwargs.pop("subtitleStyle", None) or subtitle_style
    music_mood = kwargs.pop("musicMood", None) or music_mood
    project_id = kwargs.pop("projectId", None) or project_id
    user_id = kwargs.pop("userId", None) or user_id

    start_time = time.perf_counter()
    generation_id = f"gen_{uuid4().hex}"
    target_seconds = float(parse_target_seconds(length))
    target_model = resolve_script_model(model)
    effective_topic = (user_prompt.strip() if user_prompt and user_prompt.strip() else topic) or category

    logger.info(
        f"[ScriptGen] Starting generation | id={generation_id} profile='{generation_profile}' "
        f"model='{target_model}' target={target_seconds}s aspect='{aspect_ratio}'"
    )

    # 1. Assemble Profile-Aware Prompt
    system_instruction, prompt = build_generation_prompt(
        category=category,
        topic=effective_topic,
        user_prompt=user_prompt,
        generation_profile=generation_profile,
        tone=tone,
        length=length,
        aspect_ratio=aspect_ratio,
        visual_style=visual_style,
        subtitle_style=subtitle_style,
        music_mood=music_mood,
    )

    # 2. Execute AI Model Generation with Resilient Fallbacks
    raw_res = None
    used_model = target_model
    try:
        raw_res, used_model = _generate_script_with_fallback(
            prompt=prompt,
            target_model=target_model,
            system_instruction=system_instruction,
        )
    except Exception as exc:
        logger.warning(f"[ScriptGen] Online AI generation raised error ({exc}), applying emergency synthesis...")

    # 3. Emergency Synthesis Fallback if Gemini unavailable or quota exceeded
    if not raw_res or not isinstance(raw_res, dict):
        logger.warning(f"[ScriptGen] Falling back to intelligent emergency synthesis engine | category='{category}'")
        raw_res = _build_emergency_theme_script(
            category=category,
            topic=effective_topic,
            target_aspect_ratio=aspect_ratio,
            target_seconds=int(target_seconds),
        )

    # 4. Standardize Scene Sequence & Staging Defaults
    raw_scenes = raw_res.get("scenes") or raw_res.get("storyboard") or []
    scenes = build_scene_sequence(
        raw_scenes=raw_scenes,
        target_aspect_ratio=aspect_ratio,
        generation_profile=generation_profile,
    )
    raw_res["scenes"] = scenes

    # 5. Output Validation & Duration Recalibration (+-5% Policy)
    recalibrated_data, validation_summary = validate_and_recalibrate_script(
        script_data=raw_res,
        target_seconds=target_seconds,
        generation_profile=generation_profile,
        user_prompt=effective_topic,
        target_aspect_ratio=aspect_ratio,
    )

    # 6. Asset Manifest & Story-to-Catalog Bindings
    manifest, asset_bindings = extract_asset_manifest(
        scenes=recalibrated_data["scenes"],
        raw_manifest=raw_res.get("assetManifest"),
    )

    # 7. Construct Final Document & Envelopes
    script_doc = {
        "id": f"scr_{uuid4().hex[:12]}",
        "version": 1,
        "title": recalibrated_data.get("title", f"{category} Video"),
        "description": recalibrated_data.get("description", effective_topic),
        "targetAudience": recalibrated_data.get("targetAudience", "broad audience"),
        "totalDuration": validation_summary["actualDuration"],
        "aspectRatio": aspect_ratio,
        "scenes": recalibrated_data["scenes"],
        "hook": recalibrated_data.get("hook", ""),
        "hooks": recalibrated_data.get("hooks", []),
        "quote": recalibrated_data.get("quote", ""),
        "cta": recalibrated_data.get("cta", ""),
        "soundDesign": recalibrated_data.get("soundDesign", {}),
    }

    elapsed_ms = int((time.perf_counter() - start_time) * 1000)
    metadata = {
        "modelUsed": used_model,
        "promptVersion": "v2.1.2",
        "totalInputTokens": len(prompt) // 4,
        "totalOutputTokens": len(str(recalibrated_data)) // 4,
        "generationLatencyMs": elapsed_ms,
        "tags": recalibrated_data.get("tags", ["#Shorts", "#ApexMind"]),
        "hashtags": recalibrated_data.get("hashtags", []),
        "createdAt": datetime.now(timezone.utc).isoformat(),
    }

    # Backward-compatible data envelope for legacy pipeline stages (voice, media, captions)
    legacy_envelope = dict(script_doc)
    legacy_envelope["storyboard"] = script_doc["scenes"]
    legacy_envelope["tags"] = metadata["tags"]
    legacy_envelope["estimatedDuration"] = f"{int(validation_summary['actualDuration'])}s"
    legacy_envelope["generationProfile"] = generation_profile
    legacy_envelope["recommendedVoice"] = voice_name or "Fenrir"
    legacy_envelope["captionStyle"] = subtitle_style or "Hormozi Viral Yellow"

    return {
        "success": True,
        "generationId": generation_id,
        "generationProfile": generation_profile,
        "stageId": "script",  # Preserved for legacy StudioScriptResponse
        "script": script_doc,
        "data": legacy_envelope,  # Preserved for legacy StudioScriptResponse
        "assetManifest": manifest,
        "assetBindings": asset_bindings,
        "metadata": metadata,
        "validation": validation_summary,
        "memoryCount": 0,
        "generatedAt": metadata["createdAt"],
    }

