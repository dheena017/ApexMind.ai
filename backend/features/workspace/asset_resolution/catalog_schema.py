"""
backend/features/workspace/asset_resolution/catalog_schema.py

Blender asset catalog entry schemas (Milestone 10).
"""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class RigAttachmentPoint(BaseModel):
    boneName: str
    relativePosition: Dict[str, float] = Field(default_factory=lambda: {"x": 0.0, "y": 0.0, "z": 0.0})
    relativeRotation: Dict[str, float] = Field(default_factory=lambda: {"x": 0.0, "y": 0.0, "z": 0.0})


class BlenderAssetEntry(BaseModel):
    assetId: str
    assetType: str  # 'character', 'prop', 'environment', 'lighting_rig'
    name: str
    tags: List[str] = Field(default_factory=list)
    sourceFile: str  # e.g. "characters/dog_retriever.glb"
    rigType: Optional[str] = None  # e.g. "quadruped", "humanoid", "none"
    defaultScale: float = 1.0
    materialVariants: List[str] = Field(default_factory=list)
    animations: List[str] = Field(default_factory=list)
    attachmentPoints: Dict[str, RigAttachmentPoint] = Field(default_factory=dict)

