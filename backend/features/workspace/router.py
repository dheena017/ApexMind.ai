"""
backend/features/workspace/router.py
FastAPI route endpoints for workspace: script generation, TTS, memory, and media assets.
"""

import logging
from typing import Optional
from fastapi import APIRouter, HTTPException, status, Query
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

