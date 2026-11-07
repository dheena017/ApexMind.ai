"""
backend/features/workspace/audio/providers/base.py
Abstract base class for modular live audio and sound effect providers.
Zero hardcoded data - pure live API queries only.
"""

from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional


class BaseAudioProvider(ABC):
    """Abstract live audio provider contract."""
    name: str = "base"
    display_name: str = "Base Audio Provider"

    @abstractmethod
    def is_configured(self) -> bool:
        """Returns True if the provider is active and ready to query."""
        pass

    @abstractmethod
    def search_tracks(
        self,
        query: str = "",
        genre: str = "all",
        page: int = 1,
        page_size: int = 24,
    ) -> List[Dict[str, Any]]:
        """Search background soundtracks from live streaming APIs."""
        pass

    @abstractmethod
    def search_sfx(
        self,
        query: str = "",
        category: str = "all",
        page: int = 1,
        page_size: int = 24,
    ) -> List[Dict[str, Any]]:
        """Search sound effects (whooshes, impacts, risers) from live APIs."""
        pass

    def get_total_tracks(self, query: str = "", genre: str = "all") -> int:
        """Returns estimated or cached total matching tracks."""
        return 0

    def get_total_sfx(self, query: str = "", category: str = "all") -> int:
        """Returns estimated or cached total matching sound effects."""
        return 0

    @staticmethod
    def format_duration(seconds: float) -> str:
        """Format seconds into M:SS or S.Ss representation."""
        if seconds <= 0:
            return "0:30"
        if seconds < 60:
            return f"{seconds:.1f}s" if seconds != int(seconds) else f"{int(seconds)}s"
        mins = int(seconds // 60)
        secs = int(seconds % 60)
        return f"{mins}:{secs:02d}"

