"""
backend/features/media/providers/__init__.py
Exports all provider adapters.
"""

from .video_google import GoogleVideoProvider
from .video_pexels import PexelsVideoProvider
from .video_pixabay import PixabayVideoProvider
from .video_wikimedia import WikimediaVideoProvider
from .image_unsplash import UnsplashImageProvider
from .image_gemini import GeminiImageProvider
from .audio_jamendo import JamendoAudioProvider
from .audio_wikimedia import WikimediaAudioProvider
from .sfx_freesound import SfxProvider

__all__ = [
    "GoogleVideoProvider",
    "PexelsVideoProvider",
    "PixabayVideoProvider",
    "WikimediaVideoProvider",
    "UnsplashImageProvider",
    "GeminiImageProvider",
    "JamendoAudioProvider",
    "WikimediaAudioProvider",
    "SfxProvider",
]
