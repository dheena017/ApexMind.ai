"""
backend/features/media/__init__.py
Exports media router and service.
"""

from .router import router as media_router
from .service import (
    resolve_scenes_batch,
    resolve_single_scene,
    search_media,
    search_audio,
    search_sfx,
    get_providers_status,
)

__all__ = [
    "media_router",
    "resolve_scenes_batch",
    "resolve_single_scene",
    "search_media",
    "search_audio",
    "search_sfx",
    "get_providers_status",
]
