"""
backend/features/workspace/visuals_3d/providers/__init__.py
Central registry and factory for live 3D asset providers.
Zero hardcoded data: all providers connect to live external APIs.
"""

from typing import Dict, List, Optional
from .base import BaseVisual3DProvider
from .poly_haven import PolyHaven3DProvider
from .pixabay_3d import Pixabay3DProvider
from .sketchfab import Sketchfab3DProvider
from .roblox_creator_store import RobloxCreatorStore3DProvider
from .sloyd_ai import SloydAI3DProvider
from .meshy_ai import MeshyAI3DProvider
from .poly_pizza import PolyPizza3DProvider
from .wikimedia_3d import Wikimedia3DProvider

_PROVIDERS: Dict[str, BaseVisual3DProvider] = {
    "poly_haven": PolyHaven3DProvider(),
    "pixabay_3d": Pixabay3DProvider(),
    "sketchfab": Sketchfab3DProvider(),
    "roblox_creator_store": RobloxCreatorStore3DProvider(),
    "sloyd_ai": SloydAI3DProvider(),
    "meshy_ai": MeshyAI3DProvider(),
    "wikimedia_3d": Wikimedia3DProvider(),
    "poly_pizza": PolyPizza3DProvider(),
}


def get_registered_providers() -> List[BaseVisual3DProvider]:
    """Returns list of all registered live 3D asset providers."""
    return list(_PROVIDERS.values())


def get_provider(name: str) -> Optional[BaseVisual3DProvider]:
    """Retrieves a specific provider by its system ID."""
    return _PROVIDERS.get(name.lower().strip())


__all__ = [
    "BaseVisual3DProvider",
    "PolyHaven3DProvider",
    "Pixabay3DProvider",
    "Sketchfab3DProvider",
    "RobloxCreatorStore3DProvider",
    "SloydAI3DProvider",
    "MeshyAI3DProvider",
    "PolyPizza3DProvider",
    "Wikimedia3DProvider",
    "get_registered_providers",
    "get_provider",
]
