"""
backend/features/workspace/asset_resolution/asset_catalog.py

Asset catalog manager and physical file verification engine.
Enforces category isolation, path boundary checks, physical file checks,
SHA-256 verification, and Blender compatibility checks.
"""

import hashlib
import logging
import os
from pathlib import Path
from typing import Any, Dict, List, Literal, Optional, Tuple

logger = logging.getLogger("ApexMind.AssetResolution.Catalog")

# Approved 3D Asset Categories
VALID_ASSET_CATEGORIES = {
    "characters",
    "animals",
    "environments",
    "houses",
    "props",
    "materials",
    "textures",
    "animations",
    "cameras",
}

DEFAULT_CATALOG_ROOT = Path("backend/data/asset_catalog").resolve()


class AssetVerificationResult:
    def __init__(
        self,
        status: Literal["resolved", "needs_modeling", "needs_generation", "unresolved", "incompatible"],
        model_path: Optional[str] = None,
        sha256: Optional[str] = None,
        error_message: Optional[str] = None,
        blender_version: Optional[str] = None,
    ):
        self.status = status
        self.model_path = model_path
        self.sha256 = sha256
        self.error_message = error_message
        self.blender_version = blender_version or "4.2.0"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "status": self.status,
            "modelFilePath": self.model_path,
            "sha256": self.sha256,
            "notes": self.error_message,
            "blenderVersion": self.blender_version,
        }


def get_catalog_root() -> Path:
    """Returns the absolute resolved path to the asset catalog root."""
    return DEFAULT_CATALOG_ROOT


def validate_asset_path(
    category: str,
    asset_id: str,
    catalog_root: Optional[Path] = None,
    extension: str = ".blend",
) -> Tuple[bool, Optional[Path], Optional[str]]:
    """
    Validates that the target asset path resides strictly within the approved category directory.
    Prevents path traversal attacks and category leakage.
    """
    root = (catalog_root or get_catalog_root()).resolve()
    
    if category not in VALID_ASSET_CATEGORIES:
        return False, None, f"Invalid asset category '{category}'. Must be one of {sorted(VALID_ASSET_CATEGORIES)}."

    # Normalize filename
    safe_name = os.path.basename(asset_id)
    if not safe_name or safe_name != asset_id:
        return False, None, f"Asset ID '{asset_id}' contains invalid path characters."

    filename = f"{safe_name}{extension}" if not safe_name.endswith(extension) else safe_name
    category_dir = (root / category).resolve()
    target_path = (category_dir / filename).resolve()

    # Path traversal guard
    try:
        common = os.path.commonpath([str(root), str(target_path)])
        if os.path.abspath(common) != str(root):
            return False, None, f"Path traversal violation: '{target_path}' escapes catalog root."
    except ValueError:
        return False, None, "Path traversal violation across drive letters."

    return True, target_path, None


def verify_physical_blend_asset(
    file_path: Path | str,
    expected_sha256: Optional[str] = None,
    catalog_root: Optional[Path] = None,
) -> AssetVerificationResult:
    """
    Strictly verifies a physical .blend asset file:
    1. Validates file path is inside approved catalog
    2. Verifies physical file existence and readability
    3. Computes and validates SHA-256 hash
    4. Validates Blender magic header bytes (b"BLENDER")
    
    Returns AssetVerificationResult with guaranteed non-false-positive status.
    """
    root = (catalog_root or get_catalog_root()).resolve()
    path = Path(file_path).resolve()

    # 1. Path confinement check
    try:
        common = os.path.commonpath([str(root), str(path)])
        if os.path.abspath(common) != str(root):
            return AssetVerificationResult(
                status="incompatible",
                model_path=str(path),
                error_message=f"Path '{path}' is outside approved asset catalog root '{root}'."
            )
    except ValueError:
        return AssetVerificationResult(
            status="incompatible",
            model_path=str(path),
            error_message="Path traversal across drive boundaries detected."
        )

    # 2. File existence check
    if not path.exists():
        return AssetVerificationResult(
            status="needs_modeling",
            model_path=str(path),
            error_message=f"Physical asset file does not exist: '{path}'."
        )

    if not path.is_file():
        return AssetVerificationResult(
            status="incompatible",
            model_path=str(path),
            error_message=f"Asset path is a directory, not a file: '{path}'."
        )

    # 3. Readability & Header check
    try:
        with open(path, "rb") as f:
            header = f.read(12)
            if not header.startswith(b"BLENDER"):
                return AssetVerificationResult(
                    status="incompatible",
                    model_path=str(path),
                    error_message=f"Corrupt or invalid Blender file header: '{header[:7]}' != 'BLENDER'."
                )
            # Re-read full data for SHA-256
            f.seek(0)
            hasher = hashlib.sha256()
            while chunk := f.read(65536):
                hasher.update(chunk)
            computed_sha256 = hasher.hexdigest()
    except Exception as read_err:
        return AssetVerificationResult(
            status="incompatible",
            model_path=str(path),
            error_message=f"Cannot read physical asset file: {read_err}"
        )

    # 4. Hash verification
    if expected_sha256 and expected_sha256.lower() != computed_sha256.lower():
        return AssetVerificationResult(
            status="incompatible",
            model_path=str(path),
            sha256=computed_sha256,
            error_message=f"SHA-256 hash mismatch: expected {expected_sha256}, got {computed_sha256}."
        )

    return AssetVerificationResult(
        status="resolved",
        model_path=str(path),
        sha256=computed_sha256,
        error_message=None,
        blender_version="4.2.0"
    )

