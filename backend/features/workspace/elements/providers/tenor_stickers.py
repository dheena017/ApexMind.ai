"""
backend/features/workspace/elements/providers/tenor_stickers.py
Pure Live Animated Stickers Provider.
Queries 450+ animated Meteocons FX and vector stickers via jsDelivr CDN and Iconify live API.
Zero hardcoded data.
"""

from .base import IconifyCollectionProvider


class TenorStickersElementProvider(IconifyCollectionProvider):
    name = "tenor_stickers"
    display_name = "Animated FX Stickers"
    category = "stickers"
    prefix = "meteocons"
    element_type = "sticker"
    tag_name = "animated"
