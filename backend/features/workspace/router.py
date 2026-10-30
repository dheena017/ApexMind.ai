"""
backend/features/workspace/router.py
FastAPI route endpoints for workspace: script generation, TTS, memory, and media assets.
"""

import logging
from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException, status, Query, UploadFile, File, Form
from .schemas import (
    GenerateScriptRequest,
    GenerateScriptResponse,
    GenerateVoiceoverRequest,
    VoiceoverResponse,
    GenerateCaptionsRequest,
    GenerateCaptionsResponse,
    QuoteMemoryListResponse,
    CreateQuoteMemoryRequest,
    CreateQuoteMemoryResponse,
    DeleteQuoteMemoryResponse,
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
)
from .service import (
    get_memory_list,
    generate_script,
    clear_memory,
    add_manual_quote,
    remove_quote,
    synthesize_voiceover,
    get_media_library,
)

logger = logging.getLogger("ApexMind.features.workspace")
router = APIRouter(tags=["Workspace Studio"])

@router.post(
    "/api/generate-script",
    response_model=GenerateScriptResponse,
    summary="Generate motivational script",
    description="Generate viral YouTube Shorts script using Gemini AI with memory deduplication."
)
def post_generate_script(payload: GenerateScriptRequest):
    try:
        return generate_script(
            category=payload.category or "Stoic Mindset & Discipline",
            topic=payload.topic or "Overcoming laziness, building daily grit",
            tone=payload.tone or "",
            length=payload.length or "",
            model=payload.model or "gemini-2.5-flash",
            audio_mood=payload.audioMood,
            background_style=payload.backgroundStyle,
            text_style=payload.textStyle,
            video_style=payload.videoStyle,
            voice_name=payload.voiceName,
            aspect_ratio=payload.aspectRatio,
            music_track=payload.musicTrack,
            caption_style=payload.captionStyle,
            visual_theme=payload.visualTheme,
            motion_style=payload.motionStyle,
            output_format=payload.outputFormat,
            creative_context=payload.creativeContext,
            available_assets=payload.availableAssets,
        )
    except ValueError as ve:
        logger.warning(f"Validation error in script generation: {ve}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve)
        )
    except Exception as e:
        logger.error(f"Error in script generation: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.post(
    "/api/generate-voiceover",
    response_model=VoiceoverResponse,
    summary="Generate voiceover TTS",
    description="Synthesize high-converting audio voiceover using Gemini TTS."
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

@router.post(
    "/api/generate-captions",
    response_model=GenerateCaptionsResponse,
    summary="Generate Closed Captions",
    description="Generate word-level karaoke timestamps, safe-zone line chunking, SRT, and WebVTT for subtitles.",
)
def post_generate_captions(payload: GenerateCaptionsRequest):
    try:
        from .captions_service import generate_closed_captions
        data = generate_closed_captions(
            text=payload.text,
            duration_seconds=payload.durationSeconds,
            style_preset=payload.stylePreset,
            max_words_per_segment=payload.maxWordsPerSegment,
        )
        return GenerateCaptionsResponse(
            success=True,
            data=data,
            metadata={"totalSegments": len(data.get("segments", []))},
        )
    except Exception as e:
        logger.error(f"Error generating captions: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate captions: {e}"
        )

@router.get(
    "/api/quote-memory",
    response_model=QuoteMemoryListResponse,
    summary="Get quote memory history",
    description="Retrieve past quotes to guarantee zero repetition across video creations. Supports category filtering, keyword search, pagination, and sorting.",
)
async def get_quotes_memory_route(
    category: Optional[str] = Query(None, description="Filter quotes by theme/category (e.g. 'Stoic Mindset', 'Motivation')"),
    search: Optional[str] = Query(None, description="Search across quote text, hook, or title"),
    limit: int = Query(50, ge=1, le=200, description="Max quotes to return per page"),
    offset: int = Query(0, ge=0, description="Pagination offset"),
    sort: str = Query("newest", description="Sort by: 'newest', 'oldest', 'category', 'title'"),
):
    try:
        return get_memory_list(
            limit=limit,
            offset=offset,
            category=category,
            search=search,
            sort=sort,
        )
    except Exception as e:
        logger.error(f"Error fetching quote memory: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve quote memory."
        )


@router.post(
    "/api/quote-memory",
    response_model=CreateQuoteMemoryResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add quote to memory",
    description="Manually register a quote in the uniqueness memory store to prevent AI repetition or preserve favorite quotes.",
)
async def post_quote_memory_route(payload: CreateQuoteMemoryRequest):
    try:
        return add_manual_quote(
            title=payload.title,
            quote=payload.quote,
            hook=payload.hook,
            category=payload.category,
        )
    except Exception as e:
        logger.error(f"Error saving quote to memory: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to add quote to memory: {e}"
        )


@router.delete(
    "/api/quote-memory",
    response_model=DeleteQuoteMemoryResponse,
    summary="Delete quote memory history",
    description="Delete a specific quote by ID from memory, or clear all quote history if no ID is specified.",
)
async def delete_quotes_memory_route(
    quote_id: Optional[str] = Query(None, alias="id", description="Optional ID of specific quote to delete. If omitted, clears all quotes."),
):
    try:
        return clear_memory(quote_id=quote_id)
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(ve)
        )
    except Exception as e:
        logger.error(f"Error clearing quote memory: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to clear quote memory."
        )


@router.delete(
    "/api/quote-memory/{quote_id}",
    response_model=DeleteQuoteMemoryResponse,
    summary="Delete quote by ID",
    description="Delete a specific quote by its ID from memory store.",
    include_in_schema=False,
)
async def delete_quote_by_path_route(quote_id: str):
    return await delete_quotes_memory_route(quote_id=quote_id)

@router.get(
    "/api/media-library",
    response_model=MediaLibraryResponse,
    summary="Get copyright-free media library",
    description="Retrieve royalty-free audio tracks, dynamic visual backdrops, and vocal profile presets."
)
async def get_media_library_route():
    return get_media_library()

@router.get(
    "/api/workspace/open-media/videos",
    summary="Search open-source & royalty-free videos",
    description="Query Pexels, Pixabay, or keyless open stock video loops."
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
    "/api/workspace/open-media/images",
    summary="Search 100M+ stock photos",
    description="Query Pexels, Pixabay, Unsplash, or Wikimedia Commons photography."
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
    "/api/workspace/open-media/providers",
    summary="Get media provider API connection status",
    description="Check whether Pexels, Pixabay, and Unsplash API keys are active."
)
async def get_open_media_providers_route():
    from .open_media_service import get_media_providers_status
    return get_media_providers_status()

@router.get(
    "/api/workspace/open-media/tracks",
    summary="Search royalty-free soundtracks",
    description="Query Jamendo & open audio tracks by mood or genre."
)
async def get_open_tracks_route(q: str = "", genre: str = "", limit: int = 20):
    from .open_media_service import search_open_tracks
    return search_open_tracks(query=q, genre=genre, limit=limit)

@router.get(
    "/api/workspace/open-media/sfx",
    summary="Search sound effects",
    description="Query open sound effects library."
)
async def get_open_sfx_route(q: str = "whoosh", limit: int = 20):
    from .open_media_service import search_open_sfx
    return search_open_sfx(query=q, limit=limit)


@router.get(
    "/api/workspace/open-media/quotes",
    summary="Search real viral hooks & quotes from open-source APIs",
    description="Query ZenQuotes and DummyJSON open APIs dynamically with zero API keys."
)
async def get_open_quotes_route(
    q: str = "",
    category: str = "all",
    author: str = "",
    page: int = 1,
    limit: int = 30
):
    from .open_media_service import search_open_quotes
    return search_open_quotes(query=q, category=category, author=author, page=page, limit=limit)



# ══════════════════════════════════════════════════════════════════════════════
# STUDIO PIPELINE v2 — 4 Clean, Independently-Callable Endpoints
# ══════════════════════════════════════════════════════════════════════════════

@router.post(
    "/api/studio/generate-script",
    response_model=StudioScriptResponse,
    summary="[Stage 1] Studio AI Script Generation",
    description=(
        "Generates a full viral short-form script with multi-scene storyboard, hooks, "
        "sound design plan, and creative metadata via Gemini AI. "
        "Storyboard scenes are returned with mediaStatus='unresolved', ready for Stage 3."
    ),
    tags=["Studio Pipeline"],
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
    summary="[Stage 2] Studio Voice Synthesis",
    description=(
        "Synthesizes a full narration voiceover using Gemini TTS. "
        "Accepts either storyboard[] (narration auto-assembled from subtitleText) "
        "or a direct fullNarrationText string. "
        "Returns audioUrl, durationSeconds, and word-level timestamps."
    ),
    tags=["Studio Pipeline"],
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
    summary="[Stage 3] Studio Media Resolution",
    description=(
        "Batch-resolves real stock video/image URLs for all storyboard scenes concurrently "
        "using Google CSE, Pexels, Pixabay, and Wikimedia. "
        "Also resolves SFX audio URLs and returns backdrop/background metadata."
    ),
    tags=["Studio Pipeline"],
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
    summary="[Stage 4] Studio Caption Generation",
    description=(
        "Generates scene-aligned, word-level timed captions pinned to each scene's time window. "
        "Returns timelineClips[] directly usable as LocalClips[] in StudioTimelinePane, "
        "plus SRT and WebVTT exports."
    ),
    tags=["Studio Pipeline"],
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
    audioUrl: Optional[str] = None
    musicUrl: Optional[str] = None
    backdropUrl: Optional[str] = None
    backdropType: str = "image"
    subtitles: List[Dict[str, Any]] = []
    captionColor: str = "#FACC15"


@router.post(
    "/api/workspace/render-video",
    summary="Render Full HD broadcast-quality MP4 using native FFmpeg",
    tags=["Workspace Studio"],
)
def post_render_video(payload: RenderVideoApiRequest):
    from .video_render_service import render_studio_video
    try:
        result = render_studio_video(
            title=payload.title,
            aspect_ratio=payload.aspectRatio,
            duration=payload.duration,
            audio_url=payload.audioUrl,
            music_url=payload.musicUrl,
            backdrop_url=payload.backdropUrl,
            backdrop_type=payload.backdropType,
            subtitles=payload.subtitles,
            caption_color=payload.captionColor,
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
    summary="Transcode WebM blob to Full HD MP4 with AAC audio",
    tags=["Workspace Studio"],
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
