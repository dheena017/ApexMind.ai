"""
backend/features/workspace/audio/providers/__init__.py
Exports all real live modular audio and sound effect providers.
Zero hardcoded data - 100% dynamic live API streams only.
"""

from .base import BaseAudioProvider
from .bbc_sfx import BBCSoundEffectsProvider
from .ccmixter import CCMixterAudioProvider
from .fma import FMAAudioProvider
from .freesound_open import OpenSFXProvider
from .incompetech import IncompetechAudioProvider
from .internet_archive import InternetArchiveAudioProvider
from .jamendo import JamendoAudioProvider
from .netlabels import NetlabelsAudioProvider
from .opengameart import OpenGameArtProvider
from .wikimedia import WikimediaAudioProvider

__all__ = [
    "BaseAudioProvider",
    "JamendoAudioProvider",
    "WikimediaAudioProvider",
    "InternetArchiveAudioProvider",
    "FMAAudioProvider",
    "CCMixterAudioProvider",
    "NetlabelsAudioProvider",
    "IncompetechAudioProvider",
    "OpenSFXProvider",
    "BBCSoundEffectsProvider",
    "OpenGameArtProvider",
]
