"""
backend/features/workspace/asset_resolution/__init__.py
"""

from .catalog_schema import BlenderAssetEntry, RigAttachmentPoint
from .asset_resolver import BlenderAssetResolver, DEFAULT_3D_CATALOG

__all__ = [
    "BlenderAssetEntry",
    "RigAttachmentPoint",
    "BlenderAssetResolver",
    "DEFAULT_3D_CATALOG",
]

