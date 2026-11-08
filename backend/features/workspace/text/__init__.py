"""
backend/features/workspace/text/__init__.py
Modular typography and font styles package.
Exports live font search, font providers status, and the text APIRouter.
"""

from .router import router as text_router
from .service import get_font_providers_status, search_fonts

__all__ = [
    "search_fonts",
    "get_font_providers_status",
    "text_router",
]
