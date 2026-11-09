"""
backend/features/workspace/audio/router.py
HTTP endpoints for workspace audio services:
- Live royalty-free soundtrack search across 7 CC & open music providers
- Live sound-effects search across BBC, Open SFX, Wikimedia & OpenGameArt
- Provider availability status
- Dynamic audio stream resolving & redirection
"""

import time
from typing import Any, Dict, Optional

from fastapi import APIRouter, Query
from fastapi.responses import RedirectResponse

from .archive_resolver import resolve_archive_item_audio
from .service import (
    get_audio_providers_status,
    search_sound_effects,
    search_soundtracks,
)

router = APIRouter()


@router.get(
    "/api/workspace/audio/soundtracks",
    tags=["Studio Tools 1: Audio"],
    summary="Search Modular Soundtrack Providers",
    operation_id="search_modular_soundtracks",
    description="Live query to modular free audio providers: Jamendo (500K+ CC tracks), Wikimedia Commons, Internet Archive, and Free Music Archive. 100% dynamic live APIs with zero hardcoded data.",
)
@router.get(
    "/api/workspace/audio/tracks",
    tags=["Studio Tools 1: Audio"],
    summary="Search Modular Soundtrack Providers (Alias)",
    operation_id="search_modular_tracks_alias",
    include_in_schema=False,
)
@router.get(
    "/api/media/audio-search",
    tags=["Studio Tools 1: Audio"],
    summary="Search Modular Soundtrack Providers (Media Alias)",
    operation_id="search_media_tracks_alias",
    include_in_schema=False,
)
async def get_workspace_soundtracks(
    q: str = Query("", description="Search query string"),
    genre: str = Query("all", description="Music genre filter"),
    provider: str = Query("all", description="Specific audio provider or all"),
    page: int = Query(1, ge=1),
    pageSize: int = Query(24, ge=1, le=50),
    limit: Optional[int] = Query(None, description="Limit alias for pageSize"),
):
    eff_page_size = limit if limit is not None else pageSize
    return search_soundtracks(
        query=q,
        genre=genre,
        provider=provider,
        page=page,
        page_size=eff_page_size,
    )


@router.get(
    "/api/workspace/audio/sfx",
    tags=["Studio Tools 1: Audio"],
    summary="Search Modular Sound Effect Providers",
    operation_id="search_modular_sfx",
    description="Live query to modular free SFX providers: Open SFX Commons, Wikimedia Commons, and Internet Archive. 100% dynamic live APIs with zero hardcoded data.",
)
@router.get(
    "/api/media/sfx-search",
    tags=["Studio Tools 1: Audio"],
    summary="Search Modular Sound Effect Providers (Media Alias)",
    operation_id="search_media_sfx_alias",
    include_in_schema=False,
)
async def get_workspace_sfx(
    q: str = Query("whoosh", description="Sound effect search term"),
    category: str = Query("all", description="Sound effect category"),
    provider: str = Query("all", description="Specific audio provider or all"),
    page: int = Query(1, ge=1),
    pageSize: int = Query(24, ge=1, le=50),
    limit: Optional[int] = Query(None, description="Limit alias for pageSize"),
):
    eff_page_size = limit if limit is not None else pageSize
    return search_sound_effects(
        query=q,
        category=category,
        provider=provider,
        page=page,
        page_size=eff_page_size,
    )


@router.get(
    "/api/workspace/audio/providers",
    tags=["Studio Tools 1: Audio"],
    summary="Get Modular Audio Providers Status",
    operation_id="get_workspace_audio_providers",
)
async def get_workspace_audio_providers():
    return {
        "success": True,
        "providers": get_audio_providers_status(),
    }


@router.get(
    "/api/workspace/audio/stream",
    tags=["Studio Tools 1: Audio"],
    summary="Resolve and Stream Direct Audio",
    operation_id="resolve_workspace_audio_stream",
    description="Resolves audio item identifier to a playable direct stream URL with HTTP redirect.",
)
@router.get(
    "/api/media/audio-stream",
    tags=["Studio Tools 1: Audio"],
    summary="Resolve and Stream Direct Audio (Media Alias)",
    operation_id="resolve_media_audio_stream_alias",
    include_in_schema=False,
)
def get_workspace_audio_stream(
    id: str = Query(..., description="Audio track or SFX identifier"),
    url: str = Query("", description="Direct audio URL if already known"),
):
    if url and url.startswith("http"):
        return RedirectResponse(url=url, status_code=307)
    resolved = resolve_archive_item_audio(id)
    if resolved and resolved.get("url"):
        return RedirectResponse(url=resolved["url"], status_code=307)
    return RedirectResponse(
        url="https://upload.wikimedia.org/wikipedia/commons/4/4b/Silence_1s.ogg",
        status_code=307,
    )
