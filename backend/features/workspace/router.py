"""
backend/features/workspace/router.py
FastAPI route endpoints for workspace: script generation, TTS, memory, and media assets.
"""

import logging
from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException, status, Query, UploadFile, File, Form
from .schemas import (
    GenerateVoiceoverRequest,
    VoiceoverResponse,
    MediaLibraryResponse,
    # Studio Pipeline v2 schemas
    StudioScriptRequest,
    StudioScriptResponse,
    StudioVoiceRequest,
    StudioVoiceResponse,
    StudioMediaRequest,
    StudioMediaResponse,
    StudioMediaData,
    StudioBackgroundInfo,
    StudioCaptionsRequest,
    StudioCaptionsResponse,
    CreateCustomBadgeRequest,
    CreateCustomBadgeResponse,
    GenerateMetadataRequest,
    GenerateMetadataResponse,
)
from .service import (
    synthesize_voiceover,
    get_media_library,
    generate_metadata,
)

logger = logging.getLogger("ApexMind.features.workspace")
router = APIRouter()

@router.post(
    "/api/generate-voiceover",
    response_model=VoiceoverResponse,
    summary="Generate voiceover TTS (legacy)",
    description="Synthesize high-converting audio voiceover using Gemini TTS.",
    include_in_schema=False,
)
def post_generate_voiceover(payload: GenerateVoiceoverRequest):
    if not payload.text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Text prompt is required."
        )
    if not payload.voiceName or not payload.voiceName.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Voice name is required. Please select a voice from the workspace."
        )
    try:
        return synthesize_voiceover(
            text=payload.text,
            voice_name=payload.voiceName,
            model=payload.model,
        )
    except Exception as e:
        logger.error(f"Error in voiceover synthesis: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate voiceover: {e}"
        )

@router.get(
    "/api/media-library",
    response_model=MediaLibraryResponse,
    tags=["Presets"],
    summary="Get Built-in Studio Presets",
    description="Returns the Studio's preset catalog (music presets, visual backdrops, and voice profiles). This is separate from live stock-provider searches."
)
async def get_media_library_route():
    return get_media_library()

@router.get(
    "/api/media/video-search",
    tags=["Stock Media"],
    summary="Video Search",
    operation_id="video_search",
    description="Searches stock video providers and returns workspace-specific fields such as videoUrl, posterUrl, and aesthetic badges."
)
async def get_open_videos_route(
    q: str = "",
    category: str = "all",
    provider: str = "all",
    page: int = 1,
    pageSize: int = 20,
    aspectRatio: str = "9:16"
):
    from .open_media_service import search_open_videos
    return search_open_videos(
        query=q,
        category=category,
        provider=provider,
        page=page,
        page_size=pageSize,
        aspect_ratio=aspectRatio
    )

@router.get(
    "/api/media/image-search",
    tags=["Stock Media"],
    summary="Image Search",
    operation_id="image_search",
    description="Searches stock image providers and returns workspace-specific fields such as imageUrl and thumbnail."
)
async def get_open_images_route(
    q: str = "",
    provider: str = "all",
    category: str = "all",
    page: int = 1,
    pageSize: int = 24,
    orientation: str = "portrait"
):
    from .open_media_service import search_open_images
    return search_open_images(
        query=q,
        category=category,
        page=page,
        page_size=pageSize,
        provider=provider,
        orientation=orientation
    )

@router.get(
    "/api/media/provider-status",
    tags=["Providers"],
    summary="Check Stock Media Provider Availability",
    operation_id="check_stock_media_provider_availability",
    description="Reports whether supported live stock-media providers are available."
)
async def get_open_media_providers_route():
    from .open_media_service import get_media_providers_status
    return get_media_providers_status()

# ══════════════════════════════════════════════════════════════════════════════
# STUDIO ELEMENTS & OVERLAYS SERVICE
# ══════════════════════════════════════════════════════════════════════════════

@router.post(
    "/api/studio/elements/custom-badge",
    response_model=CreateCustomBadgeResponse,
    tags=["Elements"],
    summary="Create Custom Studio Badge",
    operation_id="create_custom_studio_badge",
    description="Generates a customized viral badge with gradient, styling, and text."
)
def post_create_custom_badge_route(payload: CreateCustomBadgeRequest):
    from .elements_service import create_custom_badge
    try:
        return create_custom_badge(
            text=payload.text,
            gradient=payload.gradient,
            icon=payload.icon
        )
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))


# ══════════════════════════════════════════════════════════════════════════════
# STUDIO PRODUCTION PIPELINE — 4 Clean Stages & Native Video Rendering
# ══════════════════════════════════════════════════════════════════════════════

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
def post_studio_generate_script(payload: StudioScriptRequest):
    from .studio_script_service import run_studio_script
    try:
        return run_studio_script(
            category=payload.category,
            topic=payload.topic or payload.category,
            tone=payload.tone or "",
            length=payload.length or "30 seconds",
            model=payload.model or "gemini-2.5-flash",
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
    except ValueError as ve:
        logger.warning(f"[Studio/Script] Validation error: {ve}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        logger.error(f"[Studio/Script] Error: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post(
    "/api/studio/synthesize-voice",
    response_model=StudioVoiceResponse,
    tags=["Studio"],
    summary="Synthesize Storyboard Voice (Stage 2)",
    description=(
        "Synthesizes a full narration voiceover using Gemini TTS. "
        "Accepts either storyboard[] (narration auto-assembled from subtitleText) "
        "or a direct fullNarrationText string. "
        "Returns audioUrl, durationSeconds, and word-level timestamps."
    ),
)
def post_studio_synthesize_voice(payload: StudioVoiceRequest):
    from .studio_voice_service import run_studio_voice
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
    tags=["Studio"],
    summary="Resolve Scene Stock Media & SFX (Stage 3)",
    description=(
        "Batch-resolves real stock video/image URLs for all storyboard scenes concurrently "
        "using Google CSE, Pexels, Pixabay, and Wikimedia. "
        "Also resolves SFX audio URLs and returns backdrop/background metadata."
    ),
)
def post_studio_resolve_media(payload: StudioMediaRequest):
    import time as _time
    from .studio_media_service import run_studio_media
    t0 = _time.perf_counter()
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
            metadata={"executionTimeMs": int((_time.perf_counter() - t0) * 1000)},
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
    tags=["Studio"],
    summary="Generate Word-Timed Captions (Stage 4)",
    description=(
        "Generates scene-aligned, word-level timed captions pinned to each scene's time window. "
        "Returns timelineClips[] directly usable as LocalClips[] in StudioTimelinePane, "
        "plus SRT and WebVTT exports."
    ),
)
def post_studio_generate_captions(payload: StudioCaptionsRequest):
    from .studio_captions_service import run_studio_captions
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

class RenderVideoApiRequest(BaseModel):
    title: str = "apexmind-video"
    aspectRatio: str = "9:16"
    duration: float = 15.0
    exactDuration: Optional[float] = None
    audioUrl: Optional[str] = None
    musicUrl: Optional[str] = None
    backdropUrl: Optional[str] = None
    backdropType: str = "image"
    videoClips: Optional[List[Dict[str, Any]]] = None
    imageClips: Optional[List[Dict[str, Any]]] = None
    sfxClips: Optional[List[Dict[str, Any]]] = None
    subtitles: List[Dict[str, Any]] = []
    captionColor: str = "#FACC15"
    captionFont: Optional[str] = "Impact"
    captionTransform: Optional[str] = "uppercase"
    filterSettings: Optional[Dict[str, Any]] = None
    voiceVolume: Optional[float] = 1.0
    musicVolume: Optional[float] = 0.65
    sfxVolume: Optional[float] = 0.85
    duckingSettings: Optional[Dict[str, Any]] = None
    fps: int = 30


@router.post(
    "/api/workspace/render-video",
    tags=["Studio"],
    summary="Render Timeline to Full HD MP4",
    description="Assembles multi-layer video clips, images, voiceover, music, sound effects, and karaoke subtitles into a 1080x1920 MP4 using native FFmpeg.",
)
def post_render_video(payload: RenderVideoApiRequest):
    from .video_render_service import render_studio_video
    try:
        result = render_studio_video(
            title=payload.title,
            aspect_ratio=payload.aspectRatio,
            duration=payload.duration,
            exact_duration=payload.exactDuration,
            audio_url=payload.audioUrl,
            music_url=payload.musicUrl,
            backdrop_url=payload.backdropUrl,
            backdrop_type=payload.backdropType,
            video_clips=payload.videoClips,
            image_clips=payload.imageClips,
            sfx_clips=payload.sfxClips,
            subtitles=payload.subtitles,
            caption_color=payload.captionColor,
            caption_font=payload.captionFont,
            caption_transform=payload.captionTransform,
            filter_settings=payload.filterSettings,
            voice_volume=payload.voiceVolume,
            music_volume=payload.musicVolume,
            sfx_volume=payload.sfxVolume,
            ducking_settings=payload.duckingSettings,
            fps=payload.fps,
        )
        return result
    except Exception as e:
        logger.error(f"[Workspace/RenderVideo] Error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Video rendering failed: {e}",
        )


@router.post(
    "/api/workspace/convert-to-mp4",
    tags=["Studio"],
    summary="Transcode WebM Recording to MP4",
    description="Converts canvas-recorded WebM blobs to broadcast-ready H.264 MP4 with AAC audio.",
)
async def post_convert_to_mp4(
    file: UploadFile = File(...),
    filename: Optional[str] = Form("apexmind-video"),
):
    from .video_render_service import convert_webm_to_mp4
    try:
        content = await file.read()
        return convert_webm_to_mp4(content, filename_base=filename or "apexmind-video")
    except Exception as e:
        logger.error(f"[Workspace/ConvertToMp4] Error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Conversion failed: {e}",
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
        logger.error(f"Generate metadata error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
