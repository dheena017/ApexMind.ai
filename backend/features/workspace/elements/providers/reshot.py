"""
backend/features/workspace/elements/providers/reshot.py
Pure Live Creator Vector Elements Provider.
Queries 2,100+ Lucide vector icons via jsDelivr CDN and Iconify live API.
Zero hardcoded data.
"""

from .base import IconifyCollectionProvider


class ReshotElementProvider(IconifyCollectionProvider):
    name = "reshot"
    display_name = "Lucide Studio"
    category = "general"
    prefix = "lucide"
    element_type = "svg"
    tag_name = "vector"
