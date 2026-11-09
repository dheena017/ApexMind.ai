"""
backend/features/workspace/video/__init__.py
Central workspace video package.
Exports modular stock video search, provider health status, and the video APIRouter.
"""

from .router import router as video_router
from .service import (
    get_video_providers_status,
    is_faceless_item,
    sanitize_faceless_query,
    search_videos,
)

__all__ = [
    "video_router",
    "search_videos",
    "get_video_providers_status",
    "is_faceless_item",
    "sanitize_faceless_query",
]
