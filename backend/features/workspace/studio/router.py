"""
backend/features/workspace/studio/router.py
FastAPI router for ApexMind Studio Production Pipeline:
- Stage 2: Voiceover Synthesis (POST /api/studio/synthesize-voice)
- Stage 3: Media Resolution (POST /api/studio/resolve-media)
- Stage 4: Word-Timed Caption Generation (POST /api/studio/generate-captions)
"""

import logging
import time
from fastapi import APIRouter, HTTPException, status

from .captions_service import run_studio_captions
from .media_service import run_studio_media
from .schemas import (
    StudioBackgroundInfo,
    StudioCaptionsRequest,
    StudioCaptionsResponse,
    StudioMediaData,
    StudioMediaRequest,
    StudioMediaResponse,
    StudioVoiceRequest,
    StudioVoiceResponse,
)
from .voice_service import run_studio_voice

logger = logging.getLogger("ApexMind.Studio.Router")
router = APIRouter(tags=["Studio"])


@router.post(
    "/api/studio/synthesize-voice",
    response_model=StudioVoiceResponse,
    summary="Synthesize Storyboard Voice (Stage 2)",
    operation_id="studio_synthesize_voice",
    description=(
        "Synthesizes a full narration voiceover using Gemini TTS. "
        "Accepts either storyboard[] (narration auto-assembled from subtitleText) "
        "or a direct fullNarrationText string. "
        "Returns audioUrl, durationSeconds, and word-level timestamps."
    ),
)
def post_studio_synthesize_voice(payload: StudioVoiceRequest):
    if not payload.voiceName or not payload.voiceName.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="voiceName is required. Please select a voice from the workspace.",
        )
    if not payload.storyboard and not payload.fullNarrationText:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Provide either storyboard[] or fullNarrationText.",
        )
    try:
        return run_studio_voice(
            voice_name=payload.voiceName,
            storyboard=[s.model_dump() for s in (payload.storyboard or [])],
            full_narration_text=payload.fullNarrationText,
            model=payload.model,
            speech_style=payload.speechStyle,
            target_duration_seconds=payload.targetDurationSeconds,
        )
    except ValueError as ve:
        logger.warning(f"[Studio/Voice] Validation error: {ve}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        logger.error(f"[Studio/Voice] Error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Voice synthesis failed: {e}",
        )


@router.post(
    "/api/studio/resolve-media",
    response_model=StudioMediaResponse,
    summary="Resolve Scene Stock Media & SFX (Stage 3)",
    operation_id="studio_resolve_media",
    description=(
        "Batch-resolves real stock video/image URLs for all storyboard scenes concurrently "
        "using Google CSE, Pexels, Pixabay, and Wikimedia. "
        "Also resolves SFX audio URLs and returns backdrop/background metadata."
    ),
)
def post_studio_resolve_media(payload: StudioMediaRequest):
    t0 = time.perf_counter()
    try:
        result = run_studio_media(
            scenes=[s.model_dump() for s in payload.scenes],
            aspect_ratio=payload.aspectRatio,
            sfx_events=[e.model_dump() for e in (payload.sfxEvents or [])],
            backdrop_id=payload.backdropId,
            resolve_background=payload.resolveBackground,
            resolve_images=payload.resolveImages,
        )
        validated_data = StudioMediaData(
            scenes=result["data"]["scenes"],
            sfxEvents=result["data"]["sfxEvents"],
            background=StudioBackgroundInfo(**result["data"]["background"]),
            resolvedCount=result["data"]["resolvedCount"],
            failedCount=result["data"]["failedCount"],
            totalScenes=result["data"]["totalScenes"],
        )
        return StudioMediaResponse(
            success=True,
            stageId="media",
            data=validated_data,
            metadata={"executionTimeMs": int((time.perf_counter() - t0) * 1000)},
            generatedAt=result.get("generatedAt", ""),
        )
    except Exception as e:
        logger.error(f"[Studio/Media] Error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Media resolution failed: {e}",
        )


@router.post(
    "/api/studio/generate-captions",
    response_model=StudioCaptionsResponse,
    summary="Generate Word-Timed Captions (Stage 4)",
    operation_id="studio_generate_captions",
    description=(
        "Generates scene-aligned, word-level timed captions pinned to each scene's time window. "
        "Returns timelineClips[] directly usable as LocalClips[] in StudioTimelinePane, "
        "plus SRT and WebVTT exports."
    ),
)
def post_studio_generate_captions(payload: StudioCaptionsRequest):
    if not payload.storyboardScenes and not payload.fullNarrationText:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Provide either storyboardScenes[] or fullNarrationText.",
        )
    try:
        return run_studio_captions(
            storyboard_scenes=[s.model_dump() for s in (payload.storyboardScenes or [])],
            duration_seconds=payload.durationSeconds,
            full_narration_text=payload.fullNarrationText,
            style_preset=payload.stylePreset,
            max_words_per_segment=payload.maxWordsPerSegment,
            aspect_ratio=payload.aspectRatio,
            caption_color=payload.captionColor,
            caption_font_family=payload.captionFontFamily,
        )
    except ValueError as ve:
        logger.warning(f"[Studio/Captions] Validation error: {ve}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        logger.error(f"[Studio/Captions] Error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Caption generation failed: {e}",
        )

