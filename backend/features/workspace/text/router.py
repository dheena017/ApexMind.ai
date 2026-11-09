"""
backend/features/workspace/text/router.py
HTTP endpoints for Typography & Font services:
- Live multi-provider font search across Google Fonts, Fontshare, Fontsource, Bunny Fonts & GWFH
- Typography provider status
"""

from typing import Any, Dict

from fastapi import APIRouter, Query

from .service import (
    get_font_providers_status,
    search_fonts,
)

router = APIRouter()


@router.get(
    "/api/media/font-search",
    tags=["Studio Tools 5: Typography"],
    summary="Search Modular Font Providers",
    operation_id="search_modular_fonts",
    description="Live query to 5 modular open-source font providers: Google Fonts (1,950+ fonts), Fontshare ITF (100+ viral display fonts), Fontsource CDN (1,600+ fonts), Bunny Fonts (1,900+ fonts), and GWFH Open Fonts (1,500+ fonts). 100% dynamic live APIs with zero hardcoded data.",
)
@router.get(
    "/api/workspace/text/fonts",
    tags=["Studio Tools 5: Typography"],
    summary="Search Modular Font Providers (Alias)",
    operation_id="search_workspace_fonts_alias",
    include_in_schema=False,
)
async def get_open_fonts(
    q: str = Query("", description="Font family search query"),
    category: str = Query("all", description="Font category: all, sans-serif, serif, display, handwriting, monospace"),
    provider: str = Query("all", description="Specific font provider or 'all'"),
    page: int = Query(1, ge=1, description="Page number"),
    pageSize: int = Query(24, ge=1, le=100, description="Items per page"),
):
    return search_fonts(
        query=q,
        category=category,
        provider=provider,
        page=page,
        page_size=pageSize,
    )


@router.get(
    "/api/workspace/text/providers",
    tags=["Studio Tools 5: Typography"],
    summary="Get Typography Providers Status",
    operation_id="get_workspace_text_providers",
)
async def get_text_providers():
    return {
        "success": True,
        "providers": get_font_providers_status(),
    }

