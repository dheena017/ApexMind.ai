"""
backend/features/workspace/media_catalog.py
Re-exports media catalog assets from backend.shared.media_catalog.
"""

from backend.shared.media_catalog import (
    MEDIA_TRACKS,
    VISUAL_BACKDROPS,
    VOICE_PROFILES,
    CURATED_STOCK_VIDEOS,
    CURATED_TEXT_PRESETS,
    CURATED_SFX,
    get_static_media_catalog,
)

__all__ = [
    "MEDIA_TRACKS",
    "VISUAL_BACKDROPS",
    "VOICE_PROFILES",
    "CURATED_STOCK_VIDEOS",
    "CURATED_TEXT_PRESETS",
    "CURATED_SFX",
    "get_static_media_catalog",
]
