"""
backend/features/workspace/visuals_3d/engines/__init__.py
Central registry and factory for 3D build and render engines.
"""

from typing import Dict, List, Optional
from .base_engine import Base3DRenderEngine
from .motion_loops_engine import MotionLoops3DEngine
from .blender_hybrid_engine import BlenderHybrid3DEngine
from .blender_full_engine import BlenderFull3DEngine
from .webgl_engine import WebGLEngine

_ENGINES: Dict[str, Base3DRenderEngine] = {
    "motion_loop": MotionLoops3DEngine(),
    "blender_hybrid": BlenderHybrid3DEngine(),
    "blender_full": BlenderFull3DEngine(),
    "webgl": WebGLEngine(),
}


def get_registered_engines() -> List[Base3DRenderEngine]:
    """Returns list of all available 3D render engines."""
    return list(_ENGINES.values())


def get_engine(name: str) -> Optional[Base3DRenderEngine]:
    """Retrieves a specific render engine by name."""
    return _ENGINES.get(name.lower().strip())


__all__ = [
    "Base3DRenderEngine",
    "MotionLoops3DEngine",
    "BlenderHybrid3DEngine",
    "BlenderFull3DEngine",
    "WebGLEngine",
    "get_registered_engines",
    "get_engine",
]

