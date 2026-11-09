"""
backend/features/workspace/visuals_3d/engines/base_engine.py
Abstract base class and contract for 3D render and build engines.
"""

from abc import ABC, abstractmethod
import logging
from typing import Any, Dict

logger = logging.getLogger("ApexMind.Workspace.Visuals3D.Engine.Base")


class Base3DRenderEngine(ABC):
    """Abstract contract for 3D build and rendering engines."""

    name: str = "base_engine"
    display_name: str = "Base 3D Engine"
    typical_duration_sec: float = 3.0

    @abstractmethod
    def is_available(self) -> bool:
        """Returns True if engine binaries (FFmpeg, Blender, WebGL) are ready."""
        pass

    @abstractmethod
    def render_scene(self, request_payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Executes scene rendering or compilation.
        Must return a standardized dictionary containing videoUrl, duration, and render metrics.
        """
        pass

