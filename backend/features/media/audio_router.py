"""HTTP routes for live soundtrack and sound-effect searches."""

import time
from typing import Any, Dict

from fastapi import APIRouter, Query
from fastapi.responses import RedirectResponse

from backend.features.workspace.audio import (
    get_audio_providers_status,
    search_sound_effects,
    search_soundtracks,
)
from backend.features.workspace.audio.archive_resolver import resolve_archive_item_audio
from .schemas import AudioSearchResponse, SfxSearchResponse

router = APIRouter()


@router.get(
    "/api/media/audio-search",
    response_model=AudioSearchResponse,
    tags=["Audio"],
    summary="Audio Track Search",
    operation_id="audio_track_search",
    description="Searches live Jamendo, Wikimedia Commons, Internet Archive, and FMA soundtrack catalogs.",
)
def get_search_audio(
    q: str = Query("", description="Search terms"),
    genre: str = Query("", description="Genre filter, such as cinematic or ambient"),
    provider: str = Query("all", description="Live provider filter"),
    page: int = Query(1, ge=1),
    limit: int = Query(24, ge=1, le=50),
):
    started_at = time.perf_counter()
    res = search_soundtracks(query=q, genre=genre, provider=provider, page=page, page_size=limit)
    return AudioSearchResponse(
        success=True,
        data={
            "query": q,
            "genre": genre,
            "total": res["total"],
            "items": res["items"],
        },
        metadata={
            "executionTimeMs": int((time.perf_counter() - started_at) * 1000),
            "providers": res.get("providers", {}),
        },
    )


@router.get(
    "/api/media/sfx-search",
    response_model=SfxSearchResponse,
    tags=["Audio"],
    summary="Sound Effect Search",
    operation_id="sound_effect_search",
    description="Searches live open SFX commons, Wikimedia, and Internet Archive sound effects.",
)
def get_search_sfx(
    q: str = Query("whoosh", description="Sound effect category or search terms"),
    category: str = Query("all", description="Category filter"),
    provider: str = Query("all", description="Live provider filter"),
    page: int = Query(1, ge=1),
    limit: int = Query(24, ge=1, le=50),
):
    started_at = time.perf_counter()
    res = search_sound_effects(query=q, category=category, provider=provider, page=page, page_size=limit)
    return SfxSearchResponse(
        success=True,
        data={
            "query": q,
            "total": res["total"],
            "items": res["items"],
        },
        metadata={
            "executionTimeMs": int((time.perf_counter() - started_at) * 1000),
            "providers": res.get("providers", {}),
        },
    )


@router.get(
    "/api/media/audio-providers",
    tags=["Audio"],
    summary="Get Audio Providers Status",
    operation_id="get_audio_providers_status",
)
def get_audio_providers():
    return {
        "success": True,
        "providers": get_audio_providers_status(),
    }


@router.get(
    "/api/media/audio-stream",
    tags=["Audio"],
    summary="Resolve and stream direct audio",
    description="Resolves Archive.org and open audio items to verified playable streams with temporary redirect.",
)
def get_audio_stream_redirect(
    id: str = Query(..., description="Track identifier or item id"),
    url: str = Query("", description="Direct audio URL if already known"),
):
    if url and url.startswith("http") and not url.endswith("_vbr.mp3"):
        return RedirectResponse(url=url, status_code=307)
    resolved = resolve_archive_item_audio(id)
    if resolved and resolved.get("url"):
        return RedirectResponse(url=resolved["url"], status_code=307)
    if url and url.startswith("http"):
        return RedirectResponse(url=url, status_code=307)
    # Default fallback to open Wikimedia CC0 stream
    return RedirectResponse(url="https://upload.wikimedia.org/wikipedia/commons/4/4b/Silence_1s.ogg", status_code=307)

