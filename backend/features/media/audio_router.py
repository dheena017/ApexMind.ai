"""HTTP routes for live soundtrack and sound-effect searches."""

import time

from fastapi import APIRouter, Query

from .schemas import AudioSearchResponse, SfxSearchResponse
from .service import search_audio, search_sfx

router = APIRouter()


@router.get(
    "/api/media/audio-search",
    response_model=AudioSearchResponse,
    tags=["Audio"],
    summary="Audio Track Search",
    operation_id="audio_track_search",
    description="Searches Jamendo and Wikimedia Commons soundtrack catalogs by query or genre.",
)
def get_search_audio(
    q: str = Query("", description="Search terms"),
    genre: str = Query("", description="Genre filter, such as cinematic or ambient"),
    limit: int = Query(20, ge=1, le=50),
):
    started_at = time.perf_counter()
    data = search_audio(query=q, genre=genre, limit=limit)
    return AudioSearchResponse(
        success=True,
        data=data,
        metadata={"executionTimeMs": int((time.perf_counter() - started_at) * 1000)},
    )


@router.get(
    "/api/media/sfx-search",
    response_model=SfxSearchResponse,
    tags=["Audio"],
    summary="Sound Effect Search",
    operation_id="sound_effect_search",
    description="Searches the curated open sound-effects catalog and Wikimedia Commons.",
)
def get_search_sfx(
    q: str = Query("whoosh", description="Sound effect category or search terms"),
    limit: int = Query(20, ge=1, le=50),
):
    started_at = time.perf_counter()
    data = search_sfx(query=q, limit=limit)
    return SfxSearchResponse(
        success=True,
        data=data,
        metadata={"executionTimeMs": int((time.perf_counter() - started_at) * 1000)},
    )
