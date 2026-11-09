"""
backend/features/workspace/image/providers/base.py
Abstract base class and models for modular stock image & photo providers.
Zero hardcoded data: all photography is queried and resolved dynamically over live APIs.
"""

import logging
from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional

logger = logging.getLogger("ApexMind.Workspace.Image.Base")


class BaseImageProvider(ABC):
    """Abstract contract for live stock photo and image providers."""

    name: str = "base"
    display_name: str = "Base Image Provider"

    @abstractmethod
    def is_configured(self) -> bool:
        """Returns True if provider API credentials are ready or provider is open/keyless."""
        pass

    @abstractmethod
    def search(
        self,
        query: str = "",
        orientation: str = "portrait",
        page: int = 1,
        page_size: int = 24,
    ) -> List[Dict[str, Any]]:
        """
        Search stock photos and images from the live provider.
        Must return a list of standardized image item dictionaries.
        """
        pass

    @staticmethod
    def format_image(
        id: str,
        title: str,
        image_url: str,
        preview_url: Optional[str] = None,
        thumbnail_url: Optional[str] = None,
        author: Optional[str] = None,
        aspect_ratio: str = "9:16",
        provider: str = "image",
        tags: Optional[List[str]] = None,
        width: Optional[int] = None,
        height: Optional[int] = None,
    ) -> Dict[str, Any]:
        """Standardizes image item dictionary structure across all providers."""
        img_url = image_url or ""
        prev_url = preview_url or img_url
        thumb_url = thumbnail_url or prev_url or img_url
        clean_title = title or f"Photo by {author or provider.capitalize()}"

        return {
            "id": id,
            "title": clean_title,
            "name": clean_title,
            "imageUrl": img_url,
            "url": img_url,
            "previewUrl": prev_url,
            "thumbnail": thumb_url,
            "thumbnailUrl": thumb_url,
            "author": author or provider.capitalize(),
            "aspectRatio": aspect_ratio,
            "source": provider,
            "provider": provider,
            "tags": tags or [],
            "width": width,
            "height": height,
        }

