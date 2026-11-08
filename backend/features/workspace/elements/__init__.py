"""
backend/features/workspace/elements/__init__.py
Central modular elements & overlays package.
Exports multi-provider search, custom badge generation, provider health status,
and the studio elements APIRouter.
"""

from .router import router as elements_router
from .service import (
    create_custom_badge,
    get_element_providers_status,
    get_recommended_elements,
    search_elements,
)

__all__ = [
    "search_elements",
    "get_element_providers_status",
    "create_custom_badge",
    "get_recommended_elements",
    "elements_router",
]
