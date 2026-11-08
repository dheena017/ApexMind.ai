"""
backend/features/workspace/audio/__init__.py
Workspace modular audio package.
Unified module for:
- Live royalty-free soundtrack & SFX multi-provider search
- Acoustic energy envelope detection & musical beat snapping
- High-precision storyboard-to-speech audio & word alignment
- Syllable-weighted phonetic duration estimation & power word emphasis
- Audio streaming, archive resolution, and metadata normalization
"""

from .aligner import (
    FUNCTION_WORDS,
    TranscriptAlignment,
    WordTimestampItem,
    align_storyboard_to_audio,
    compute_word_weight,
    detect_sentence_boundaries,
    estimate_syllables,
    extract_actual_speech_word_timestamps,
    extract_pcm_energy_profile,
    is_power_word,
    snap_to_musical_beat,
)
from .archive_resolver import resolve_archive_item_audio
from .metadata_cleaner import clean_track_title_and_artist
from .router import router as audio_router
from .service import (
    get_audio_providers_status,
    search_sound_effects,
    search_soundtracks,
)

__all__ = [
    # Live Search
    "search_soundtracks",
    "search_sound_effects",
    "get_audio_providers_status",
    # Audio-Word Alignment
    "align_storyboard_to_audio",
    "compute_word_weight",
    "estimate_syllables",
    "is_power_word",
    "extract_pcm_energy_profile",
    "snap_to_musical_beat",
    "detect_sentence_boundaries",
    "extract_actual_speech_word_timestamps",
    "WordTimestampItem",
    "TranscriptAlignment",
    "FUNCTION_WORDS",
    # Resolution & Metadata
    "resolve_archive_item_audio",
    "clean_track_title_and_artist",
    # Router
    "audio_router",
]
