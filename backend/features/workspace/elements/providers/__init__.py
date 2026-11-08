"""
backend/features/workspace/elements/providers/__init__.py
Live Element Providers for Studio Elements and Overlays.
Zero hardcoded lists - 100% dynamic API and modular live providers.
"""

from .base import BaseElementProvider
from .brand_logos import BrandLogosElementProvider
from .cryptologos import CryptoLogosElementProvider
from .flags_iso import WorldFlagsElementProvider
from .game_icons import GameIconsElementProvider
from .giphy_stickers import GiphyStickersElementProvider
from .iconify import IconifyElementProvider
from .noto_emoji import NotoEmojiElementProvider
from .openmoji import OpenMojiElementProvider
from .openverse import OpenverseElementProvider
from .reshot import ReshotElementProvider
from .studio import StudioElementProvider
from .svg_shapes import SVGShapesElementProvider
from .svgrepo import SVGRepoElementProvider
from .tenor_stickers import TenorStickersElementProvider
from .twemoji import TwemojiElementProvider
from .wikimedia import WikimediaElementProvider

__all__ = [
    "BaseElementProvider",
    "StudioElementProvider",
    "IconifyElementProvider",
    "SVGRepoElementProvider",
    "GameIconsElementProvider",
    "OpenMojiElementProvider",
    "TwemojiElementProvider",
    "NotoEmojiElementProvider",
    "GiphyStickersElementProvider",
    "TenorStickersElementProvider",
    "WikimediaElementProvider",
    "OpenverseElementProvider",
    "ReshotElementProvider",
    "SVGShapesElementProvider",
    "BrandLogosElementProvider",
    "CryptoLogosElementProvider",
    "WorldFlagsElementProvider",
]

