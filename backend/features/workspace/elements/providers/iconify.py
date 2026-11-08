"""
backend/features/workspace/elements/providers/iconify.py
Pure Live Iconify Multi-Set Vector Engine.
Zero hardcoded fallback arrays - queries live Iconify & jsDelivr APIs directly.
"""

from .base import IconifyCollectionProvider


class IconifyElementProvider(IconifyCollectionProvider):
    name = "iconify"
    display_name = "Iconify (200k+ Live)"
    category = "general"
    prefix = "lucide"
    element_type = "svg"
    tag_name = "iconify"
