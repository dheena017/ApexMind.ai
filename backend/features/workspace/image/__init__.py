"""
backend/features/workspace/image/__init__.py
Central workspace image package.
Exports modular stock image search, provider health status, and the image APIRouter.
"""

from .router import router as image_router
from .service import get_image_providers_status, search_images

__all__ = [
    "image_router",
    "search_images",
    "get_image_providers_status",
]

