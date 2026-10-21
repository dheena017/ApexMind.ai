"""
backend/features/media/base.py
Abstract base classes and core data models for the media provider engine.
"""

from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class MediaAsset(BaseModel):
    id: str
    mediaType: str = Field(..., description="'video' | 'image' | 'audio' | 'sfx'")
    title: str
    url: str
    previewUrl: Optional[str] = None
    thumbnailUrl: Optional[str] = None
    duration: Optional[float] = None
    resolution: Optional[str] = None
    aspectRatio: str = "9:16"
    provider: str
    extraMetadata: Dict[str, Any] = Field(default_factory=dict)


class BaseMediaProvider(ABC):
    """Abstract interface that all video, image, audio, and SFX providers must implement."""

    @property
    @abstractmethod
    def name(self) -> str:
        """Unique provider identifier (e.g. 'google_cse', 'pexels', 'pixabay')."""
        pass

    @property
    @abstractmethod
    def supported_types(self) -> List[str]:
        """List of supported media types: ['video', 'image', 'audio', 'sfx']."""
        pass

    @abstractmethod
    def is_configured(self) -> bool:
        """Returns True if the required API keys or environment variables are configured."""
        pass

    @abstractmethod
    def search(
        self,
        query: str,
        media_type: str = "video",
        limit: int = 10,
        aspect_ratio: str = "9:16",
        page: int = 1,
        **kwargs,
    ) -> List[MediaAsset]:
        """Performs a live search against the provider's external API."""
        pass
