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
async def post_generate_script(payload: GenerateScriptRequest):
    try:
        return generate_script(
            category=payload.category or "Stoic Mindset & Discipline",
            topic=payload.topic or "Overcoming laziness, building daily grit",
            tone=payload.tone or "Authoritative & Inspiring",
            length=payload.length or "30 seconds",
            model=payload.model or "gemini-2.5-flash",
        )
    except Exception as e:
        logger.error(f"Error in script generation: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate script: {e}"
        )

@router.post(
    "/api/generate-voiceover",
    response_model=VoiceoverResponse,
    summary="Generate voiceover TTS",
    description="Synthesize high-converting audio voiceover using Gemini TTS."
)
async def post_generate_voiceover(payload: GenerateVoiceoverRequest):
    if not payload.text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Text prompt is required."
        )
    try:
        return synthesize_voiceover(
            text=payload.text,
            voice_name=payload.voiceName or "Fenrir",
            model=payload.model or "gemini-2.5-flash-preview-tts",
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
