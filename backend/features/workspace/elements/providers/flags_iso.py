"""
backend/features/workspace/elements/providers/flags_iso.py
Pure Live ISO World Flags Provider.
Queries 690+ Circle-Flags circular vector country flags via jsDelivr CDN and Iconify live API.
Zero hardcoded data.
"""

from .base import IconifyCollectionProvider


class WorldFlagsElementProvider(IconifyCollectionProvider):
    name = "flags_iso"
    display_name = "World Flags"
    category = "general"
    prefix = "circle-flags"
    element_type = "icon"
    tag_name = "flag"


FlagsIsoElementProvider = WorldFlagsElementProvider
