"""
backend/features/workspace/text/providers/base.py
Abstract base class for modular font and typography providers.
"""

from abc import ABC, abstractmethod
from typing import Any, Dict, List


class BaseFontProvider(ABC):
    """Base interface for all typography and font style providers."""

    name: str = "base"
    display_name: str = "Base Provider"

    @abstractmethod
    def is_configured(self) -> bool:
        """Check if provider is available and configured."""
        pass

    @abstractmethod
    def search(
        self,
        query: str = "",
        category: str = "all",
        page: int = 1,
        page_size: int = 24,
    ) -> List[Dict[str, Any]]:
        """Search font styles from this provider."""
        pass

    @abstractmethod
    def get_total(self, query: str = "", category: str = "all") -> int:
        """Get total number of available fonts matching criteria."""
        pass

