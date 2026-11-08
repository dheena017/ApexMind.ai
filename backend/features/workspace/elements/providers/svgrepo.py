"""
backend/features/workspace/elements/providers/svgrepo.py
Pure Live Tabler & Open-Source Vectors Provider.
Queries 6,300+ Tabler open SVG vectors via jsDelivr CDN and Iconify live API.
Zero hardcoded data.
"""

from .base import IconifyCollectionProvider


class SVGRepoElementProvider(IconifyCollectionProvider):
    name = "svgrepo"
    display_name = "Tabler Open Vectors"
    category = "general"
    prefix = "tabler"
    element_type = "svg"
    tag_name = "tabler"


SvgRepoElementProvider = SVGRepoElementProvider
