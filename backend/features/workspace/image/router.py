"""
backend/features/workspace/image/router.py
HTTP endpoints for workspace image capabilities:
- Stock photo search across Unsplash, Pexels, Pixabay, Openverse, Flickr, Wikimedia
- Image provider connectivity status
"""

import logging
from typing import Any, Dict

from fastapi import APIRouter, Query

from .service import get_image_providers_status, search_images

logger = logging.getLogger("ApexMind.Workspace.ImageRouter")
router = APIRouter()


@router.get(
    "/api/media/image-search",
    tags=["Studio Tools 3: Stock Images"],
    summary="Image Search",
    operation_id="image_search",
    description="Searches stock image providers and returns workspace-specific fields such as imageUrl, thumbnail, author, and aspect ratio.",
)
@router.get(
    "/api/workspace/image/search",
    tags=["Studio Tools 3: Stock Images"],
    summary="Image Search (Alias)",
    operation_id="image_search_alias",
    include_in_schema=False,
)
async def get_open_images(
    q: str = Query("", description="Search keywords"),
    provider: str = Query("all", description="Target provider or 'all'"),
    category: str = Query("all", description="Category filter"),
    page: int = Query(1, ge=1, description="Page number"),
    pageSize: int = Query(24, ge=1, le=100, description="Items per page"),
    orientation: str = Query("portrait", description="Orientation: portrait, landscape, squarish"),
):
    return search_images(
        query=q,
        category=category,
        page=page,
        page_size=pageSize,
        provider=provider,
        orientation=orientation,
    )


@router.get(
    "/api/workspace/image/providers",
    tags=["Studio Tools 3: Stock Images"],
    summary="Get Image Providers Status",
    operation_id="get_workspace_image_providers",
)
async def get_image_providers():
    return {
        "success": True,
        "providers": get_image_providers_status(),
    }

