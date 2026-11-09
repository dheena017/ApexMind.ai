"""
backend/features/workspace/script_ai/providers/base.py
Abstract base class and contract for AI script & storyboard generation providers.
"""

import logging
from abc import ABC, abstractmethod
from typing import Any, Dict, Optional

logger = logging.getLogger("ApexMind.Workspace.ScriptAI.Base")


class BaseScriptProvider(ABC):
    """Abstract contract for AI script and metadata generators."""

    name: str = "base"
    display_name: str = "Base Script Provider"

    @abstractmethod
    def is_configured(self) -> bool:
        """Returns True if the AI provider credentials/keys are ready."""
        pass

    @abstractmethod
    def generate_script(
        self,
        category: str,
        topic: str,
        tone: str = "",
        length: str = "",
        model: Optional[str] = None,
        **kwargs,
    ) -> Dict[str, Any]:
        """Generates structured script and storyboard scenes."""
        pass

