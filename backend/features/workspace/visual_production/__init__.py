"""
backend/features/workspace/visual_production/__init__.py

Stage 3 Visual Production module for ApexMind Studio.
Supports Media, 3D (Blender 5.2 LTS), Hybrid compositing, and Automatic routing paths.
"""

from .schemas import (
    ProductionMode,
    SceneVisualStatus,
    VisualQualityTier,
    LicensePermissionState,
    AssetLicenseProvenance,
    QualityGateResult,
    SceneVisualOutput,
    VisualProductionRequest,
    VisualProductionResponse,
    SceneRegenerateRequest,
    SceneApprovalRequest,
)
from .config import visual_config
from .storage.visual_storage import visual_storage, VisualStorageManager

__all__ = [
    "ProductionMode",
    "SceneVisualStatus",
    "VisualQualityTier",
    "LicensePermissionState",
    "AssetLicenseProvenance",
    "QualityGateResult",
    "SceneVisualOutput",
    "VisualProductionRequest",
    "VisualProductionResponse",
    "SceneRegenerateRequest",
    "SceneApprovalRequest",
    "visual_config",
    "visual_storage",
    "VisualStorageManager",
]

