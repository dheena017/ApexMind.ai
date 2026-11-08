"""
backend/features/workspace/elements/providers/openmoji.py
Pure Live OpenMoji Open-Source Vector Emoji Provider.
Queries 4,500+ OpenMoji vector emojis via jsDelivr CDN and Iconify live API.
Zero hardcoded data.
"""

from .base import IconifyCollectionProvider


class OpenMojiElementProvider(IconifyCollectionProvider):
    name = "openmoji"
    display_name = "OpenMoji Expressions"
    category = "emojis"
    prefix = "openmoji"
    element_type = "emoji"
    tag_name = "openmoji"
