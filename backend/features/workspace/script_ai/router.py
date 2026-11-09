"""
backend/features/workspace/script_ai/router.py
HTTP endpoints for AI Script Generation, Metadata, and Gemini Models:
- Stage 1 Studio Storyboard Script Generation
- High-CTR Viral Title, Description, and Hashtags Generation
- Gemini AI Models Discovery
- Script Provider Health Status
"""

import logging

from fastapi import APIRouter, HTTPException, status

from backend.features.workspace.schemas import (
    GenerateMetadataRequest,
    GenerateMetadataResponse,
    StudioScriptRequest,
    StudioScriptResponse,
)
from backend.shared.ai_models import DEFAULT_SCRIPT_MODEL
from .service import (
    generate_metadata,
    get_available_ai_models,
    get_script_providers_status,
    run_studio_script,
)

logger = logging.getLogger("ApexMind.Workspace.ScriptAIRouter")
router = APIRouter()


@router.get(
    "/api/ai/models",
    tags=["AI"],
    summary="List available Gemini models",
    description="Lists text-generation models currently available to the configured Gemini API key.",
)
def get_available_ai_models_route():
    try:
        return get_available_ai_models()
    except Exception as exc:
        logger.error(f"Could not load available Gemini models: {exc}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Could not load available Gemini models: {exc}",
        ) from exc


@router.get(
    "/api/workspace/script/providers",
    tags=["AI"],
    summary="Get Script Provider Status",
    description="Returns active connectivity status for Gemini script and metadata generators.",
)
def get_script_providers_route():
    return {
        "success": True,
        "providers": get_script_providers_status(),
    }


@router.post(
    "/api/studio/generate-script",
    response_model=StudioScriptResponse,
    tags=["Studio"],
    summary="Generate Storyboard Script (Stage 1)",
    description=(
        "Generates a full viral short-form script with multi-scene storyboard, hooks, "
        "sound design plan, and creative metadata via Gemini AI. "
        "Storyboard scenes are returned with mediaStatus='unresolved', ready for Stage 3."
    ),
)
@router.post(
    "/api/workspace/script/generate",
    response_model=StudioScriptResponse,
    tags=["Studio"],
    summary="Generate Storyboard Script (Alias)",
    include_in_schema=False,
)
def post_studio_generate_script(payload: StudioScriptRequest):
    try:
        return run_studio_script(
            category=payload.category,
            topic=payload.topic or payload.category,
            tone=payload.tone or "",
            length=payload.length or "30 seconds",
            model=payload.model or DEFAULT_SCRIPT_MODEL,
            aspect_ratio=payload.aspectRatio or "9:16",
            voice_name=payload.voiceName,
            music_track_id=payload.musicTrackId,
            caption_style_preset=payload.captionStylePreset,
            backdrop_id=payload.backdropId,
            audio_mood=payload.audioMood,
            background_style=payload.backgroundStyle,
            text_style=payload.textStyle,
            video_style=payload.videoStyle,
            visual_theme=payload.visualTheme,
            motion_style=payload.motionStyle,
            output_format=payload.outputFormat,
            creative_context=payload.creativeContext,
            available_assets=payload.availableAssets,
            user_prompt=payload.userPrompt,
        )
    except Exception as e:
        logger.error(f"[ScriptAIRouter] Script generation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate script: {e}",
        )


@router.post(
    "/api/workspace/generate-metadata",
    response_model=GenerateMetadataResponse,
    tags=["Content Tools"],
    summary="Generate viral titles, description, and hashtags",
    description="Generate high-CTR titles, optimized description, and categorized hashtags via AI.",
)
def post_generate_metadata(payload: GenerateMetadataRequest):
    if not any((payload.topic, payload.title, payload.hook, payload.quote)):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Provide a video title or script before generating metadata.",
        )
    try:
        data = generate_metadata(
            category=payload.category or "",
            topic=payload.topic or "",
            title=payload.title or "",
            hook=payload.hook or "",
            quote=payload.quote or "",
            cta=payload.cta or "",
            model=payload.model,
        )
        return {
            "success": True,
            **data,
        }
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"[ScriptAIRouter] Generate metadata error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

