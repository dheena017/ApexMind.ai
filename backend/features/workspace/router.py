"""
backend/features/workspace/router.py
FastAPI route endpoints for workspace: script generation, TTS, memory, and media assets.
"""

import logging
from fastapi import APIRouter, HTTPException, status
from .schemas import (
    GenerateScriptRequest,
    GenerateScriptResponse,
    GenerateVoiceoverRequest,
    VoiceoverResponse,
    QuoteMemoryListResponse,
    MediaLibraryResponse,
)
from .service import (
    get_memory_list,
    generate_script,
    clear_memory,
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

@router.get(
    "/api/quote-memory",
    response_model=QuoteMemoryListResponse,
    summary="Get quote memory history",
    description="Retrieve all past quotes to guarantee zero repetition across video creations."
)
async def get_quotes_memory_route():
    try:
        return get_memory_list()
    except Exception as e:
        logger.error(f"Error fetching quote memory: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve quote memory."
        )

@router.delete(
    "/api/quote-memory",
    summary="Clear quote memory history"
)
async def delete_quotes_memory_route():
    try:
        return clear_memory()
    except Exception as e:
        logger.error(f"Error clearing quote memory: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to clear quote memory."
        )

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
async def get_open_videos_route(q: str = "", category: str = "all", page: int = 1, pageSize: int = 20, aspectRatio: str = "9:16"):
    from .open_media_service import search_open_videos
    return search_open_videos(query=q, category=category, page=page, page_size=pageSize, aspect_ratio=aspectRatio)

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
async def get_open_quotes_route(q: str = "", category: str = "all", limit: int = 30):
    from .open_media_service import search_open_quotes
    return search_open_quotes(query=q, category=category, limit=limit)

