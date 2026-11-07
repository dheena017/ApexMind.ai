"""
backend/features/workspace/open_media_service.py
Workspace response adapter delegating video and image searches directly
to the centralized modular media package (backend.features.media) to eliminate code duplication.
"""

from typing import Any, Dict

from backend.features.media import (
    search_media,
    get_providers_status as media_get_providers_status,
)

def get_media_providers_status() -> Dict[str, Any]:
    """Returns active connection status for media providers, delegating to media service."""
    status_data = media_get_providers_status()
    provs = status_data.providers
    return {
        "pexels": provs.get("pexels", {}).status == "active",
        "pixabay": provs.get("pixabay", {}).status == "active",
        "unsplash": provs.get("unsplash", {}).status == "active",
        "mixkit": True,
        "coverr": True,
        "openverse": True,
        "flickr": True,
        "jamendo": True,
        "wikimedia": True,
        "google_cse": provs.get("google_cse", {}).status == "active",
    }


def search_open_videos(
    query: str = "",
    category: str = "all",
    provider: str = "all",
    page: int = 1,
    page_size: int = 20,
    aspect_ratio: str = "9:16",
) -> Dict[str, Any]:
    """Search royalty-free videos, delegating directly to backend.features.media."""
    q = query or (category if category != "all" else "")
    res = search_media(
        query=q,
        media_type="video",
        provider=provider,
        aspect_ratio=aspect_ratio,
        page=page,
        limit=page_size,
    )
    items = [
        {
            "id": it.id,
            "title": it.title,
            "videoUrl": it.url,
            "previewUrl": it.previewUrl or it.url,
            "posterUrl": it.thumbnailUrl or it.previewUrl or "",
            "duration": it.duration or 10.0,
            "resolution": it.resolution or ("1080x1920" if aspect_ratio in ["9:16", "4:5"] else "1920x1080"),
            "aspectRatio": it.aspectRatio,
            "source": it.provider,
            "provider": it.provider,
            "aestheticBadges": it.extraMetadata.get("aestheticBadges", []),
            "aestheticScore": it.extraMetadata.get("aestheticScore", 0.0),
            "tags": it.extraMetadata.get("tags", []),
        }
        for it in res.items
    ]
    return {
        "success": True,
        "page": page,
        "pageSize": len(items),
        "total": res.total,
        "items": items,
        "providers": get_media_providers_status(),
    }


def search_open_images(
    query: str = "",
    category: str = "all",
    provider: str = "all",
    page: int = 1,
    page_size: int = 24,
    orientation: str = "portrait",
) -> Dict[str, Any]:
    """Search stock images, delegating directly to backend.features.media."""
    clean_query = (query or "").strip()
    clean_cat = (category or "").strip()
    if clean_query and clean_query.lower() not in ("all", "*"):
        q = clean_query
    elif clean_cat and clean_cat.lower() not in ("all", "*"):
        q = clean_cat
    else:
        q = ""
    if orientation in ["portrait", "9:16"]:
        ratio = "9:16"
    elif orientation in ["squarish", "1:1", "square"]:
        ratio = "1:1"
    else:
        ratio = "16:9"
    res = search_media(
        query=q,
        media_type="image",
        provider=provider,
        aspect_ratio=ratio,
        page=page,
        limit=page_size,
    )
    items = [
        {
            "id": it.id,
            "title": it.title,
            "name": it.title,
            "imageUrl": it.url,
            "url": it.url,
            "previewUrl": it.previewUrl or it.url,
            "thumbnail": it.thumbnailUrl or it.previewUrl or it.url,
            "aspectRatio": it.aspectRatio,
            "source": it.provider,
            "provider": it.provider,
        }
        for it in res.items
    ]
    return {
        "success": True,
        "page": page,
        "pageSize": len(items),
        "total": res.total,
        "items": items,
        "providers": get_media_providers_status(),
    }


__all__ = [
    "get_media_providers_status",
    "search_open_videos",
    "search_open_images",
]
