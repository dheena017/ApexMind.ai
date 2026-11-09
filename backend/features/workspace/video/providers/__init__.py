"""
backend/features/workspace/video/providers/__init__.py
Exports all modular stock video providers.
"""

from .base import BaseVideoProvider
from .coverr import CoverrVideoProvider
from .google import GoogleVideoProvider
from .mixkit import MixkitVideoProvider
from .pexels import PexelsVideoProvider
from .pixabay import PixabayVideoProvider
from .wikimedia import WikimediaVideoProvider

__all__ = [
    "BaseVideoProvider",
    "PexelsVideoProvider",
    "PixabayVideoProvider",
    "MixkitVideoProvider",
    "CoverrVideoProvider",
    "WikimediaVideoProvider",
    "GoogleVideoProvider",
]

