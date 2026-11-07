"""
backend/features/workspace/audio/__init__.py
Workspace modular audio package.
Exports live soundtrack and SFX search services.
Zero hardcoded data.
"""

from .service import (
    get_audio_providers_status,
    search_sound_effects,
    search_soundtracks,
)

__all__ = [
    "search_soundtracks",
    "search_sound_effects",
    "get_audio_providers_status",
]

