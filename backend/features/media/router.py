"""
backend/features/media/router.py
FastAPI router for dynamic internet media sourcing, scene resolution, and asset discovery.
"""

import time
import logging
from typing import Optional
from fastapi import APIRouter, HTTPException, Query, status

from .schemas import (
    BatchResolveMediaRequest,
    BatchResolveMediaResponse,
    SingleSceneResolveRequest,
    SingleSceneResolveResponse,
    MediaSearchResponse,
    AudioSearchResponse,
    SfxSearchResponse,
    ProvidersStatusResponse,
)
from .service import (
    resolve_scenes_batch,
    resolve_single_scene,
    search_media,
    search_audio,
    search_sfx,
    get_providers_status,
)

logger = logging.getLogger("ApexMind.features.media")
router = APIRouter(tags=["Media Engine"])


@router.post(
    "/api/media/resolve-scenes",
    response_model=BatchResolveMediaResponse,
    summary="Batch resolve media cuts for storyboard scenes",
    description="Concurrently queries Google CSE, Pexels, Pixabay, and Wikimedia for all scene queries with duplicate prevention.",
)
def post_resolve_scenes(payload: BatchResolveMediaRequest):
    t0 = time.perf_counter()
    try:
        data = resolve_scenes_batch(scenes=payload.scenes, aspect_ratio=payload.aspectRatio)
        execution_ms = int((time.perf_counter() - t0) * 1000)
        return BatchResolveMediaResponse(
            success=True,
            data=data,
            metadata={"executionTimeMs": execution_ms},
        )
    except Exception as e:
        logger.error(f"Error resolving scenes media batch: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to resolve scene media: {e}",
        )


@router.post(
    "/api/media/resolve-scene",
    response_model=SingleSceneResolveResponse,
    summary="Regenerate single scene visual",
    description="Resolves a replacement video/image for a specific scene cut with exclusion list support.",
)
def post_resolve_single_scene(payload: SingleSceneResolveRequest):
    t0 = time.perf_counter()
    try:
        data = resolve_single_scene(
            scene_number=payload.sceneNumber,
            query=payload.query,
            media_type=payload.mediaType,
            aspect_ratio=payload.aspectRatio,
            exclude_urls=payload.excludeUrls,
        )
        execution_ms = int((time.perf_counter() - t0) * 1000)
        return SingleSceneResolveResponse(
            success=True,
            data=data,
            metadata={"executionTimeMs": execution_ms},
        )
    except Exception as e:
        logger.error(f"Error regenerating single scene media: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to resolve scene: {e}",
        )


@router.get(
    "/api/media/search",
    response_model=MediaSearchResponse,
    summary="Live search videos or photos",
    description="Queries Google CSE, Pexels, Pixabay, Unsplash, or Wikimedia Commons.",
)
def get_search_media(
    q: str = Query("", description="Search term"),
    type: str = Query("video", description="'video' | 'image'"),
    provider: str = Query("all", description="Provider filter: 'all', 'google', 'pexels', 'pixabay', 'wikimedia', 'unsplash'"),
    aspectRatio: str = Query("9:16", description="'9:16', '16:9', '1:1'"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=50),
):
    t0 = time.perf_counter()
    data = search_media(
        query=q,
        media_type=type,
        provider=provider,
        aspect_ratio=aspectRatio,
        page=page,
        limit=limit,
    )
    execution_ms = int((time.perf_counter() - t0) * 1000)
    return MediaSearchResponse(
        success=True,
        data=data,
        metadata={"executionTimeMs": execution_ms},
    )


@router.get(
    "/api/media/audio",
    response_model=AudioSearchResponse,
    summary="Search royalty-free soundtracks",
    description="Queries Jamendo and open audio catalogs by mood or genre with waveform peaks.",
)
def get_search_audio(
    q: str = Query("", description="Search terms"),
    genre: str = Query("", description="Genre filter (e.g. 'cinematic', 'ambient')"),
    limit: int = Query(20, ge=1, le=50),
):
    t0 = time.perf_counter()
    data = search_audio(query=q, genre=genre, limit=limit)
    execution_ms = int((time.perf_counter() - t0) * 1000)
    return AudioSearchResponse(
        success=True,
        data=data,
        metadata={"executionTimeMs": execution_ms},
    )


@router.get(
    "/api/media/sfx",
    response_model=SfxSearchResponse,
    summary="Search sound effects",
    description="Queries high-impact sound effects (whoosh, sub drop, riser, impact).",
)
def get_search_sfx(
    q: str = Query("whoosh", description="Sound effect category or name"),
    limit: int = Query(20, ge=1, le=50),
):
    t0 = time.perf_counter()
    data = search_sfx(query=q, limit=limit)
    execution_ms = int((time.perf_counter() - t0) * 1000)
    return SfxSearchResponse(
        success=True,
        data=data,
        metadata={"executionTimeMs": execution_ms},
    )


@router.get(
    "/api/media/providers",
    response_model=ProvidersStatusResponse,
    summary="Media provider API status",
    description="Reports connection health, active credentials, and latency for Google CSE, Pexels, Pixabay, etc.",
)
def get_providers():
    t0 = time.perf_counter()
    data = get_providers_status()
    execution_ms = int((time.perf_counter() - t0) * 1000)
    return ProvidersStatusResponse(
        success=True,
        data=data,
        metadata={"executionTimeMs": execution_ms},
    )
