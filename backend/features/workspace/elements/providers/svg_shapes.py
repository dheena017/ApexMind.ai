"""
backend/features/workspace/elements/providers/svg_shapes.py
Pure Live Shapes & Flat Callouts Provider.
Queries 3,100+ Microsoft Fluent Flat geometric elements via jsDelivr CDN and Iconify live API.
Zero hardcoded data.
"""

from .base import IconifyCollectionProvider


class SVGShapesElementProvider(IconifyCollectionProvider):
    name = "svg_shapes"
    display_name = "Fluent Shapes"
    category = "shapes"
    prefix = "fluent-emoji-flat"
    element_type = "svg"
    tag_name = "shape"


SvgShapesElementProvider = SVGShapesElementProvider
