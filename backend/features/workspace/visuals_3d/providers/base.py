"""
backend/features/workspace/visuals_3d/providers/base.py
Abstract base class and models for modular 3D asset providers.
Zero hardcoded data: all models, environments, and CGI loops are queried over live APIs.
"""

from abc import ABC, abstractmethod
import logging
from typing import Any, Dict, List, Optional

logger = logging.getLogger("ApexMind.Workspace.Visuals3D.Base")


class BaseVisual3DProvider(ABC):
    """Abstract contract for live 3D asset providers."""

    name: str = "base"
    display_name: str = "Base 3D Provider"
    provider_type: str = "asset"  # "asset" | "procedural" | "loop"
    requires_key: bool = False

    @abstractmethod
    def is_configured(self) -> bool:
        """Returns True if provider credentials are set or if provider is open/keyless."""
        pass

    @abstractmethod
    def search(
        self,
        query: str = "",
        category: str = "all",
        page: int = 1,
        page_size: int = 20,
    ) -> List[Dict[str, Any]]:
        """
        Search live 3D assets or loops from the provider.
        Must return a list of standardized Visual3DItem-compatible dictionaries.
        """
        pass

    @staticmethod
    def format_asset(
        id: str,
        title: str,
        asset_url: str,
        category: str = "props",
        provider: str = "3d",
        preview_url: Optional[str] = None,
        thumbnail_url: Optional[str] = None,
        format: str = "glb",
        is_video: bool = False,
        duration: Optional[float] = None,
        resolution: Optional[str] = "1080p",
        aspect_ratio: str = "9:16",
        triangles: Optional[int] = None,
        file_size_mb: Optional[float] = None,
        license: str = "CC0",
        author: Optional[str] = None,
        source_url: Optional[str] = None,
        tags: Optional[List[str]] = None,
        aesthetic_badges: Optional[List[str]] = None,
        **kwargs,
    ) -> Dict[str, Any]:
        """Formats into standard workspace 3D item dictionary."""
        effective_aspect_ratio = kwargs.get("aspectRatio", aspect_ratio)
        effective_name = title or "3D Asset"
        return {
            "id": str(id),
            "title": effective_name,
            "name": effective_name,
            "category": category,
            "provider": provider,
            "assetUrl": asset_url,
            "previewUrl": preview_url or asset_url,
            "thumbnailUrl": thumbnail_url or preview_url or asset_url,
            "format": format,
            "isVideo": is_video,
            "duration": float(duration) if duration is not None else None,
            "resolution": resolution or "1080p",
            "aspectRatio": effective_aspect_ratio,
            "triangles": triangles,
            "fileSizeMb": file_size_mb,
            "license": license,
            "author": author or "Open Community",
            "sourceUrl": source_url or asset_url,
            "tags": tags or [],
            "aestheticBadges": aesthetic_badges or [],
            "isCached": False,
        }
