"""
backend/features/workspace/elements/router.py
HTTP endpoints for Studio Visual Elements & Overlays:
- Multi-provider search across 16 live vector, emoji, sticker, shape, and badge providers
- Provider availability status
- Procedural custom badge creation
- Contextual element recommendations
"""

import logging
from typing import Any, Dict

from fastapi import APIRouter, HTTPException, Query, status

from backend.features.workspace.schemas import (
    CreateCustomBadgeRequest,
    CreateCustomBadgeResponse,
    ElementsCatalogResponse,
    RecommendedElementsRequest,
    RecommendedElementsResponse,
)
from .service import (
    create_custom_badge,
    get_element_providers_status,
    get_recommended_elements,
    search_elements,
)

logger = logging.getLogger("ApexMind.Workspace.ElementsRouter")
router = APIRouter()


@router.get(
    "/api/studio/elements/search",
    response_model=ElementsCatalogResponse,
    tags=["Studio Tools 4: Elements"],
    summary="Search Studio Elements & Overlays",
    operation_id="search_studio_elements",
    description="Live search across 16 modular vector, emoji, sticker, shape, and badge providers with zero hardcoded arrays.",
)
async def get_search_studio_elements(
    query: str = Query("", description="Keyword search term"),
    category: str = Query("all", description="Element category: all, badges, icons, emojis, stickers, shapes, brands, progress, frames"),
    provider: str = Query("all", description="Target provider or 'all'"),
    page: int = Query(1, ge=1, description="Page number"),
    pageSize: int = Query(24, ge=1, le=100, description="Items per page"),
):
    return search_elements(
        query=query,
        category=category,
        provider=provider,
        page=page,
        page_size=pageSize,
    )


@router.get(
    "/api/studio/elements/providers",
    tags=["Studio Tools 4: Elements"],
    summary="Get Element Providers Status",
    operation_id="get_studio_element_providers",
    description="Returns availability status for all 16 live element providers.",
)
async def get_studio_element_providers():
    return {
        "success": True,
        "providers": get_element_providers_status(),
    }


@router.post(
    "/api/studio/elements/custom-badge",
    response_model=CreateCustomBadgeResponse,
    tags=["Studio Tools 4: Elements"],
    summary="Create Custom Studio Badge",
    operation_id="create_custom_studio_badge",
    description="Generates a customized viral badge with gradient, styling, and text.",
)
def post_create_custom_badge(payload: CreateCustomBadgeRequest):
    try:
        return create_custom_badge(
            text=payload.text,
            gradient=payload.gradient,
            icon=payload.icon,
        )
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        logger.error(f"[ElementsRouter] Failed to create custom badge: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create custom badge: {e}",
        )


@router.post(
    "/api/studio/elements/recommend",
    response_model=RecommendedElementsResponse,
    tags=["Studio Tools 4: Elements"],
    summary="Get Contextual Recommended Elements",
    operation_id="get_recommended_studio_elements",
    description="Recommends visual elements tailored to the video's theme, topic, and tone.",
)
def post_recommended_elements(payload: RecommendedElementsRequest):
    try:
        return get_recommended_elements(
            category=payload.category,
            topic=payload.topic,
            tone=payload.tone,
        )
    except Exception as e:
        logger.error(f"[ElementsRouter] Recommendation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate element recommendations: {e}",
        )

