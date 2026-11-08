"""
backend/features/workspace/elements/providers/brand_logos.py
Pure Live Brand & Tech Logos Provider.
Queries 3,700+ SimpleIcons SVG brand badges via jsDelivr CDN and Iconify live API.
Zero hardcoded data.
"""

from .base import IconifyCollectionProvider


class BrandLogosElementProvider(IconifyCollectionProvider):
    name = "brand_logos"
    display_name = "Brand Badges"
    category = "badges"
    prefix = "simple-icons"
    element_type = "badge"
    tag_name = "brand"
