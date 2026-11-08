"""
backend/features/workspace/elements/providers/noto_emoji.py
Pure Live Google Noto High-Definition Emojis Provider.
Queries 3,800+ Google vector emojis via jsDelivr CDN and Iconify live API.
Zero hardcoded data.
"""

from .base import IconifyCollectionProvider


class NotoEmojiElementProvider(IconifyCollectionProvider):
    name = "noto_emoji"
    display_name = "Google Noto Emojis"
    category = "emojis"
    prefix = "noto"
    element_type = "emoji"
    tag_name = "noto"
