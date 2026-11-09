"""
backend/features/workspace/image/providers/__init__.py
Exports all modular stock image and photo providers.
"""

from .base import BaseImageProvider
from .flickr import FlickrImageProvider
from .openverse import OpenverseImageProvider
from .pexels import PexelsImageProvider
from .pixabay import PixabayImageProvider
from .unsplash import UnsplashImageProvider
from .wikimedia import WikimediaImageProvider

__all__ = [
    "BaseImageProvider",
    "UnsplashImageProvider",
    "PexelsImageProvider",
    "PixabayImageProvider",
    "OpenverseImageProvider",
    "FlickrImageProvider",
    "WikimediaImageProvider",
]

