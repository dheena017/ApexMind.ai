"""
backend/features/workspace/elements/providers/game_icons.py
Pure Live Game & Warrior Icons Provider.
Queries 4,100+ Game-Icons stoic and warrior vector symbols via jsDelivr CDN and Iconify live API.
Zero hardcoded data.
"""

from .base import IconifyCollectionProvider


class GameIconsElementProvider(IconifyCollectionProvider):
    name = "game_icons"
    display_name = "Stoic & Warrior"
    category = "stoic"
    prefix = "game-icons"
    element_type = "icon"
    tag_name = "stoic"
