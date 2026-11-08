"""
backend/features/workspace/elements/providers/cryptologos.py
Pure Live Cryptocurrency & Web3 Badges Provider.
Queries 480+ Cryptocurrency color SVG tokens via jsDelivr CDN and Iconify live API.
Zero hardcoded data.
"""

from .base import IconifyCollectionProvider


class CryptoLogosElementProvider(IconifyCollectionProvider):
    name = "cryptologos"
    display_name = "Crypto Badges"
    category = "badges"
    prefix = "cryptocurrency-color"
    element_type = "badge"
    tag_name = "crypto"
