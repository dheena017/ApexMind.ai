"""
backend/features/workspace/video/providers/base.py
Abstract base class and models for modular stock video providers.
Zero hardcoded data: all video clips are queried and resolved dynamically over live APIs.
"""

import logging
from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional

logger = logging.getLogger("ApexMind.Workspace.Video.Base")


class BaseVideoProvider(ABC):
    """Abstract contract for live stock video providers."""

    name: str = "base"
    display_name: str = "Base Video Provider"

    @abstractmethod
    def is_configured(self) -> bool:
        """Returns True if provider API credentials are ready or if provider is open/keyless."""
        pass

    @abstractmethod
    def search(
        self,
        query: str = "",
        aspect_ratio: str = "9:16",
        page: int = 1,
        page_size: int = 20,
    ) -> List[Dict[str, Any]]:
        """
        Search stock video clips from the live provider.
        Must return a list of standardized video item dictionaries.
        """
        pass

    @staticmethod
    def format_video(
        id: str,
        title: str,
        video_url: str,
        preview_url: Optional[str] = None,
        poster_url: Optional[str] = None,
        duration: float = 10.0,
        resolution: Optional[str] = None,
        aspect_ratio: str = "9:16",
        provider: str = "video",
        aesthetic_badges: Optional[List[str]] = None,
        aesthetic_score: float = 0.0,
        tags: Optional[List[str]] = None,
        source: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Standardizes video item dictionary structure across all providers."""
        default_res = "1080x1920" if aspect_ratio in ["9:16", "4:5"] else "1920x1080"
        return {
            "id": id,
            "title": title or f"Stock Video ({provider.capitalize()})",
            "videoUrl": video_url,
            "previewUrl": preview_url or video_url,
            "posterUrl": poster_url or preview_url or "",
            "duration": float(duration or 10.0),
            "resolution": resolution or default_res,
            "aspectRatio": aspect_ratio,
            "source": source or provider,
            "provider": provider,
            "aestheticBadges": aesthetic_badges or [],
            "aestheticScore": float(aesthetic_score or 0.0),
            "tags": tags or [],
        }

