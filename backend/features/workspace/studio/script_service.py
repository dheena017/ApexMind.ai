"""
backend/features/workspace/studio/script_service.py
Stage 1 of the ApexMind Studio Production Pipeline:
- Viral script content generation (hooks, monologue, call-to-action)
- 3-6 word mobile safe-zone subtitle pacing and duration budgeting
- Faceless B-roll stock video scene queries with negative keywords
- AI image frame generation prompts, styles, and lighting
- Broadcast sound design (soundtracks, dynamic ducking, timestamped SFX)
- Video SEO metadata (viral titles, hashtags, description)
- Stage 1 Main Orchestrator (orchestrate_stage1_script)
"""

from datetime import datetime, timezone
import logging
from typing import Any, Dict, Optional

from backend.database.repository import add_notification
from backend.shared.ai_models import DEFAULT_SCRIPT_MODEL, resolve_script_model
from backend.features.workspace.studio.genre_registry import get_genre_definition
from .providers import (
    GeminiMetadataProvider,
    GeminiScriptProvider,
    get_ai_script_models,
)

logger = logging.getLogger("ApexMind.Studio.Script")

_SCRIPT_PROVIDER = GeminiScriptProvider()
_METADATA_PROVIDER = GeminiMetadataProvider()

STAGE_ID: str = "script"
DEFAULT_ASPECT_RATIO: str = "9:16"


def get_script_providers_status() -> Dict[str, bool]:
    """Returns connectivity status for AI script and metadata providers."""
    return {
        "gemini_script": _SCRIPT_PROVIDER.is_configured(),
        "gemini_metadata": _METADATA_PROVIDER.is_configured(),
    }


def generate_script(
    category: str,
    topic: str,
    tone: str = "",
    length: str = "",
    model: str = DEFAULT_SCRIPT_MODEL,
    audio_mood: Optional[str] = None,
    background_style: Optional[str] = None,
    text_style: Optional[str] = None,
    video_style: Optional[str] = None,
    voice_name: Optional[str] = None,
    aspect_ratio: Optional[str] = None,
    music_track: Optional[str] = None,
    caption_style: Optional[str] = None,
    visual_theme: Optional[str] = None,
    motion_style: Optional[str] = None,
    output_format: Optional[str] = None,
    creative_context: Optional[Dict[str, Any]] = None,
    available_assets: Optional[Dict[str, Any]] = None,
    user_prompt: Optional[str] = None,
    genre: str = "motivation",
    genre_preset: Optional[str] = None,
    render_3d_engine: Optional[str] = None,
    suggested_3d_provider: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Core script generation orchestrator.
    Generates structured script + storyboard scenes and dispatches in-app notification.
    """
    effective_aspect = aspect_ratio or DEFAULT_ASPECT_RATIO
    data = _SCRIPT_PROVIDER.generate_script(
        category=category,
        topic=topic,
        tone=tone,
        length=length,
        model=model,
        audio_mood=audio_mood,
        background_style=background_style,
        text_style=text_style,
        video_style=video_style,
        voice_name=voice_name,
        aspect_ratio=effective_aspect,
        music_track=music_track,
        caption_style=caption_style,
        visual_theme=visual_theme,
        motion_style=motion_style,
        output_format=output_format,
        creative_context=creative_context,
        available_assets=available_assets,
        user_prompt=user_prompt,
        genre=genre,
        genre_preset=genre_preset,
        suggested_3d_provider=suggested_3d_provider,
    )

    scenes_count = len(data.get("storyboard") or data.get("scenes") or [])
    logger.debug(
        f"Generated AI script: '{data.get('title')}' ({scenes_count} scenes, "
        f"{data.get('estimatedDuration', '30s')})"
    )

    try:
        add_notification(
            title="AI Script Crafted",
            message=f"Generated script: '{data.get('title')}' in {category or 'General Motivation'}",
            type="info",
            category="studio",
            action_url="/workspace",
        )
    except Exception as e:
        logger.warning(f"Could not dispatch script notification: {e}")

    return {
        "success": True,
        "data": data,
        "memoryCount": 0,
    }


def run_studio_script(
    category: str,
    topic: str,
    tone: str = "",
    length: str = "",
    model: str = DEFAULT_SCRIPT_MODEL,
    aspect_ratio: str = DEFAULT_ASPECT_RATIO,
    voice_name: Optional[str] = None,
    music_track_id: Optional[str] = None,
    caption_style_preset: Optional[str] = None,
    backdrop_id: Optional[str] = None,
    audio_mood: Optional[str] = None,
    background_style: Optional[str] = None,
    text_style: Optional[str] = None,
    video_style: Optional[str] = None,
    visual_theme: Optional[str] = None,
    motion_style: Optional[str] = None,
    output_format: Optional[str] = None,
    creative_context: Optional[Dict[str, Any]] = None,
    available_assets: Optional[Dict[str, Any]] = None,
    user_prompt: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Studio pipeline Stage 1: Generate AI script + storyboard.
    Wraps generated script data into the standard Stage 1 envelope.
    """
    effective_model = resolve_script_model(model)
    logger.info(
        f"[Studio/Script] Starting Stage 1 | category='{category}' "
        f"topic='{topic}' model={effective_model} aspect={aspect_ratio}"
    )

    effective_topic = user_prompt.strip() if user_prompt and user_prompt.strip() else topic

    result = generate_script(
        category=category,
        topic=effective_topic,
        tone=tone,
        length=length,
        model=effective_model,
        audio_mood=audio_mood,
        background_style=background_style or (backdrop_id or ""),
        text_style=text_style or (caption_style_preset or ""),
        video_style=video_style,
        voice_name=voice_name,
        aspect_ratio=aspect_ratio,
        music_track=music_track_id,
        caption_style=caption_style_preset,
        visual_theme=visual_theme or backdrop_id,
        motion_style=motion_style,
        output_format=output_format,
        creative_context=creative_context,
        available_assets=available_assets,
        user_prompt=user_prompt,
    )

    logger.info(
        f"[Studio/Script] Stage 1 complete | title='{result.get('data', {}).get('title')}' "
        f"scenes={len(result.get('data', {}).get('storyboard', []))}"
    )

    return {
        "success": True,
        "stageId": STAGE_ID,
        "data": result.get("data", {}),
        "memoryCount": result.get("memoryCount", 0),
        "generatedAt": datetime.now(timezone.utc).isoformat(),
    }


def get_available_ai_models() -> Dict[str, Any]:
    """Returns available Gemini text/script generation models."""
    return get_ai_script_models()


# ==============================================================================
# STAGE 1: DEDICATED SMALL SERVICE FUNCTIONS
# ==============================================================================

def generate_script_content(
    category: str,
    topic: str,
    tone: str = "aggressive",
    target_duration_seconds: int = 30,
    user_prompt: Optional[str] = None,
    model: Optional[str] = None,
    genre: str = "motivation",
) -> Dict[str, Any]:
    """Small API 1.1: Generates viral hooks, main monologue, closing CTA, and assembled fullScript."""
    effective_model = resolve_script_model(model or DEFAULT_SCRIPT_MODEL)
    return _SCRIPT_PROVIDER.generate_script_content(
        category=category,
        topic=topic,
        tone=tone,
        target_duration_seconds=target_duration_seconds,
        user_prompt=user_prompt,
        model=effective_model,
        genre=genre,
    )


def generate_script_subtitles(
    full_script: str,
    target_duration_seconds: int = 30,
    caption_style_preset: str = "sub-hormozi",
    aspect_ratio: str = "9:16",
    model: Optional[str] = None,
) -> Dict[str, Any]:
    """Small API 1.2: Slices fullScript into 3-6 word mobile safe-zone subtitle lines with timestamps."""
    effective_model = resolve_script_model(model or DEFAULT_SCRIPT_MODEL)
    return _SCRIPT_PROVIDER.generate_script_subtitles(
        full_script=full_script,
        target_duration_seconds=target_duration_seconds,
        caption_style_preset=caption_style_preset,
        aspect_ratio=aspect_ratio,
        model=effective_model,
    )


def generate_video_scenes(
    subtitles: list,
    visual_theme: str = "Cinematic Dark Architecture",
    motion_style: str = "slow push in",
    aspect_ratio: str = "9:16",
    user_visual_prompt: Optional[str] = None,
    model: Optional[str] = None,
    genre: str = "motivation",
    suggested_3d_provider: Optional[str] = None,
    render_3d_engine: Optional[str] = None,
) -> Dict[str, Any]:
    """Small API 1.3A: Generates 3D and stock video scene directives, asset queries, and camera choreography."""
    effective_model = resolve_script_model(model or DEFAULT_SCRIPT_MODEL)
    return _SCRIPT_PROVIDER.generate_video_scenes(
        subtitles=subtitles,
        visual_theme=visual_theme,
        motion_style=motion_style,
        aspect_ratio=aspect_ratio,
        user_visual_prompt=user_visual_prompt,
        model=effective_model,
        genre=genre,
        suggested_3d_provider=suggested_3d_provider,
        render_3d_engine=render_3d_engine,
    )


def generate_image_scenes(
    subtitles: list,
    art_style: str = "hyperrealistic cinematic photography",
    color_palette: str = "moody dark teal and orange",
    aspect_ratio: str = "9:16",
    user_visual_prompt: Optional[str] = None,
    model: Optional[str] = None,
) -> Dict[str, Any]:
    """Small API 1.3B: Generates frame-by-frame AI image diffusion prompts and Ken Burns motion directions."""
    effective_model = resolve_script_model(model or DEFAULT_SCRIPT_MODEL)
    return _SCRIPT_PROVIDER.generate_image_scenes(
        subtitles=subtitles,
        art_style=art_style,
        color_palette=color_palette,
        aspect_ratio=aspect_ratio,
        user_visual_prompt=user_visual_prompt,
        model=effective_model,
    )


def plan_sound_design(
    category: str,
    tone: str = "aggressive",
    audio_mood: str = "Dark Phonk / Intense",
    target_duration_seconds: int = 30,
    scene_timestamps: Optional[list] = None,
    model: Optional[str] = None,
) -> Dict[str, Any]:
    """Small API 1.4: Plans soundtrack criteria, SFX triggers, and dynamic ducking curves."""
    effective_model = resolve_script_model(model or DEFAULT_SCRIPT_MODEL)
    return _SCRIPT_PROVIDER.plan_sound_design(
        category=category,
        tone=tone,
        audio_mood=audio_mood,
        target_duration_seconds=target_duration_seconds,
        scene_timestamps=scene_timestamps,
        model=effective_model,
    )


def generate_video_metadata(
    category: str = "Stoic Mindset & Discipline",
    topic: Optional[str] = None,
    full_script: Optional[str] = None,
    title: Optional[str] = None,
    hook: Optional[str] = None,
    quote: Optional[str] = None,
    cta: Optional[str] = None,
    model: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Small API 1.5: Unified Video Metadata & SEO Generator.
    Merges interactive publishing metadata and automated Stage 1 pipeline SEO.
    Generates high-CTR title variations (with angles and virality scores),
    rich descriptions with AI disclosures, and categorized hashtags (trending, niche, growth, ai).
    """
    effective_model = resolve_script_model(model or DEFAULT_SCRIPT_MODEL)
    return _METADATA_PROVIDER.generate_metadata(
        category=category,
        topic=topic or category,
        title=title or "",
        hook=hook or "",
        quote=quote or "",
        cta=cta or "",
        full_script=full_script or "",
        model=effective_model,
    )


# Alias for backward compatibility
generate_metadata = generate_video_metadata


# ==============================================================================
# MAIN STAGE 1 ORCHESTRATOR (Only calls the Small Functions above)
# ==============================================================================

def orchestrate_stage1_script(
    category: str,
    topic: str,
    tone: str = "aggressive",
    length: str = "30 seconds",
    model: str = DEFAULT_SCRIPT_MODEL,
    aspect_ratio: str = "9:16",
    voice_name: Optional[str] = None,
    music_track_id: Optional[str] = None,
    caption_style_preset: Optional[str] = None,
    backdrop_id: Optional[str] = None,
    audio_mood: Optional[str] = None,
    background_style: Optional[str] = None,
    text_style: Optional[str] = None,
    video_style: Optional[str] = None,
    visual_theme: Optional[str] = None,
    motion_style: Optional[str] = None,
    output_format: Optional[str] = None,
    creative_context: Optional[Dict[str, Any]] = None,
    available_assets: Optional[Dict[str, Any]] = None,
    user_prompt: Optional[str] = None,
    genre: str = "motivation",
    genre_preset: Optional[str] = None,
    render_3d_engine: Optional[str] = None,
    suggested_3d_provider: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Main Stage 1 Orchestrator:
    Contains zero duplicate logic; exclusively executes Small Functions 1.1 through 1.5 in order.
    """
    effective_model = resolve_script_model(model)
    genre_def = get_genre_definition(genre)
    target_seconds = 30
    if length:
        import re
        m = re.search(r"(\d+)", str(length))
        if m:
            target_seconds = int(m.group(1)) * (60 if "min" in str(length).lower() else 1)

    effective_topic = user_prompt.strip() if user_prompt and user_prompt.strip() else topic

    logger.info(
        f"[Studio/Stage1] Orchestrating Stage 1 via Small Functions | "
        f"genre='{genre_def.id}' category='{category}' topic='{effective_topic}' model={effective_model} target={target_seconds}s"
    )

    # 1. Execute Small API 1.1: Script Content & Hooks
    content = generate_script_content(
        category=category,
        topic=effective_topic,
        tone=tone or "aggressive",
        target_duration_seconds=target_seconds,
        user_prompt=user_prompt,
        model=effective_model,
        genre=genre,
    )
    full_script = content["fullScript"]

    # 2. Execute Small API 1.2: Subtitles Slicing
    subs_result = generate_script_subtitles(
        full_script=full_script,
        target_duration_seconds=target_seconds,
        caption_style_preset=caption_style_preset or text_style or "sub-hormozi",
        aspect_ratio=aspect_ratio or "9:16",
        model=effective_model,
    )
    subtitles = subs_result["subtitles"]

    # 3. Execute Small API 1.3: Visual Scenes (Video or Image)
    if video_style == "image":
        scenes_result = generate_image_scenes(
            subtitles=subtitles,
            aspect_ratio=aspect_ratio or "9:16",
            user_visual_prompt=user_prompt,
            model=effective_model,
        )
        storyboard = scenes_result["frames"]
    else:
        scenes_result = generate_video_scenes(
            subtitles=subtitles,
            visual_theme=visual_theme or background_style or backdrop_id or "Cinematic Dark Architecture",
            motion_style=motion_style or "slow push in",
            aspect_ratio=aspect_ratio or "9:16",
            user_visual_prompt=user_prompt,
            model=effective_model,
            genre=genre,
            suggested_3d_provider=suggested_3d_provider,
            render_3d_engine=render_3d_engine,
        )
        storyboard = scenes_result["scenes"]

    # 4. Execute Small API 1.4: Dynamic Sound Design
    scene_timestamps = [s.get("startTime", 0.0) for s in storyboard]
    sound_design = plan_sound_design(
        category=category,
        tone=tone or "aggressive",
        audio_mood=audio_mood or "Dark Phonk / Intense",
        target_duration_seconds=target_seconds,
        scene_timestamps=scene_timestamps,
        model=effective_model,
    )

    # 5. Execute Small API 1.5: Video Metadata & Viral SEO
    metadata = generate_video_metadata(
        category=category,
        topic=effective_topic,
        full_script=full_script,
        model=effective_model,
    )

    raw_titles = metadata.get("titleList") or metadata.get("titles") or []
    if raw_titles:
        first_t = raw_titles[0]
        title = first_t["title"] if isinstance(first_t, dict) else str(first_t)
    else:
        title = f"Master Your {category}"

    logger.info(
        f"[Studio/Stage1] Stage 1 Orchestration complete | title='{title}' "
        f"scenes={len(storyboard)} words={content['totalWords']}"
    )

    return {
        "success": True,
        "stageId": STAGE_ID,
        "data": {
            "title": title,
            "userPrompt": user_prompt or effective_topic,
            "genre": genre_def.id,
            "genreLabel": genre_def.label,
            "render3DEngine": render_3d_engine or "blender_hybrid",
            "suggested3DProvider": suggested_3d_provider or genre_def.recommended_3d_providers[0],
            "recommendedVoice": voice_name or genre_def.default_voice,
            "hook": content["selectedHook"],
            "quote": content["monologue"],
            "cta": content["cta"],
            "fullScript": full_script,
            "aspectRatio": aspect_ratio or "9:16",
            "totalWords": content["totalWords"],
            "hookOptions": content["hookOptions"],
            "storyboard": storyboard,
            "soundDesign": sound_design,
            "metadata": metadata,
            "subtitles": subtitles,
            "targetDurationSeconds": target_seconds,
            "durationSeconds": target_seconds,
            "tags": metadata.get("tags", []),
            "hashtags": metadata.get("hashtags", []),
            "description": metadata.get("description", ""),
        },
        "memoryCount": 0,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
    }


# Backwards compatibility alias
run_studio_script = orchestrate_stage1_script

