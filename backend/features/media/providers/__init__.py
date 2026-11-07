"""
backend/features/media/providers/__init__.py
Exports all provider adapters.
"""

from .video_google import GoogleVideoProvider
from .video_pexels import PexelsVideoProvider
from .video_pixabay import PixabayVideoProvider
from .video_wikimedia import WikimediaVideoProvider
from .video_mixkit import MixkitVideoProvider
from .video_coverr import CoverrVideoProvider
from .image_unsplash import UnsplashImageProvider
from .image_openverse import OpenverseImageProvider
from .image_flickr import FlickrImageProvider
from .audio_jamendo import JamendoAudioProvider
from .audio_wikimedia import WikimediaAudioProvider
from .sfx_freesound import SfxProvider

__all__ = [
    "GoogleVideoProvider",
    "PexelsVideoProvider",
    "PixabayVideoProvider",
    "WikimediaVideoProvider",
    "MixkitVideoProvider",
    "CoverrVideoProvider",
    "UnsplashImageProvider",
    "OpenverseImageProvider",
    "FlickrImageProvider",
    "JamendoAudioProvider",
    "WikimediaAudioProvider",
    "SfxProvider",
]
