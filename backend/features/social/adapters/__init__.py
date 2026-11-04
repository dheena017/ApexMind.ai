"""
backend/features/social/adapters/__init__.py
Registry of platform publisher adapters.
"""

from typing import Dict
from .base import SocialPlatformPublisher
from .youtube_adapter import YouTubePublisherAdapter
from .instagram_adapter import InstagramPublisherAdapter
from .facebook_adapter import FacebookPublisherAdapter
from .tiktok_adapter import TikTokPublisherAdapter

ADAPTER_REGISTRY: Dict[str, SocialPlatformPublisher] = {
    "youtube": YouTubePublisherAdapter(),
    "instagram": InstagramPublisherAdapter(),
    "facebook": FacebookPublisherAdapter(),
    "tiktok": TikTokPublisherAdapter(),
}


def get_adapter(platform: str) -> SocialPlatformPublisher:
    """Retrieves the publisher adapter for a given platform name."""
    clean_p = platform.lower().strip()
    if clean_p not in ADAPTER_REGISTRY:
        raise ValueError(f"Unsupported social platform publisher: '{platform}'. Supported: {list(ADAPTER_REGISTRY.keys())}")
    return ADAPTER_REGISTRY[clean_p]

