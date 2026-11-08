"""
backend/features/workspace/elements/providers/giphy_stickers.py
Pure Live Animated Stickers Provider.
Queries 1,200+ Line-MD SMIL/CSS animated SVGs via jsDelivr CDN and Iconify live API.
Zero hardcoded data.
"""

from .base import IconifyCollectionProvider


class GiphyStickersElementProvider(IconifyCollectionProvider):
    name = "giphy_stickers"
    display_name = "Animated Stickers"
    category = "stickers"
    prefix = "line-md"
    element_type = "sticker"
    tag_name = "animated"
