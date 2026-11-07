"""
backend/features/workspace/text/__init__.py
Modular typography and font styles package.
"""

from .service import get_font_providers_status, search_fonts

__all__ = [
    "search_fonts",
    "get_font_providers_status",
]

