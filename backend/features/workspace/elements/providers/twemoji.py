"""
backend/features/workspace/elements/providers/twemoji.py
Pure Live Twemoji Vector Expressions Provider.
Queries 4,000+ Twitter vector emojis via jsDelivr CDN and Iconify live API.
Zero hardcoded data.
"""

from .base import IconifyCollectionProvider


class TwemojiElementProvider(IconifyCollectionProvider):
    name = "twemoji"
    display_name = "Twemoji Reactions"
    category = "emojis"
    prefix = "twemoji"
    element_type = "emoji"
    tag_name = "twemoji"

