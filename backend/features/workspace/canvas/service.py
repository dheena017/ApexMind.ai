"""
backend/features/workspace/canvas/service.py
Central service for Canvas & Frame Studio:
- Target aspect ratios & platform dimensions
- 24 Cinematic Color LUT matrices & FFmpeg/CSS filters
- Studio solid & gradient canvas backdrops
- Frame & letterbox builder presets
- Video filter chain compilation
"""

import logging
from typing import Any, Dict, List, Optional

from .constants import (
    ASPECT_RATIO_MAP,
    CANVAS_FRAME_PRESETS,
    COLOR_LUTS,
    PLATFORM_RATIOS,
    STUDIO_GRADIENTS,
    STUDIO_SOLIDS,
)
from .filter_builder import (
    build_color_filter_chain,
    calculate_canvas_dimensions,
    generate_custom_gradient,
    resolve_lut_filter,
)

logger = logging.getLogger("ApexMind.Workspace.CanvasService")


def get_aspect_ratios() -> List[Dict[str, Any]]:
    """Returns all supported target output platforms and aspect ratio presets."""
    return PLATFORM_RATIOS


def get_color_luts(category: str = "all") -> List[Dict[str, Any]]:
    """Returns the 24 cinematic color LUT presets, optionally filtered by category."""
    clean_cat = (category or "all").strip().lower()
    if clean_cat == "all":
        return COLOR_LUTS
    return [lut for lut in COLOR_LUTS if lut.get("category", "").lower() == clean_cat]


def get_studio_solids() -> List[Dict[str, str]]:
    """Returns curated studio solid canvas backgrounds."""
    return STUDIO_SOLIDS


def get_studio_gradients() -> List[Dict[str, Any]]:
    """Returns featured studio gradient presets."""
    return STUDIO_GRADIENTS


def get_canvas_frame_presets() -> List[Dict[str, Any]]:
    """Returns frame, border, and letterbox build presets."""
    return CANVAS_FRAME_PRESETS


def get_canvas_presets() -> Dict[str, Any]:
    """
    Returns the comprehensive Canvas & Frame Studio catalog spanning all 5 subtabs:
    Ratio, LUTs, Solid, Gradient, and Build presets.
    """
    return {
        "success": True,
        "ratios": PLATFORM_RATIOS,
        "luts": COLOR_LUTS,
        "solids": STUDIO_SOLIDS,
        "gradients": STUDIO_GRADIENTS,
        "frames": CANVAS_FRAME_PRESETS,
        "totalLuts": len(COLOR_LUTS),
        "totalRatios": len(PLATFORM_RATIOS),
        "totalSolids": len(STUDIO_SOLIDS),
        "totalGradients": len(STUDIO_GRADIENTS),
    }


def resolve_canvas_dimensions(
    aspect_ratio: str = "9:16",
    resolution: int = 1080,
) -> Dict[str, Any]:
    """Calculates width, height, and display label for a target ratio and resolution."""
    width, height = calculate_canvas_dimensions(aspect_ratio, resolution)
    ratio_val = ASPECT_RATIO_MAP.get(aspect_ratio, 9 / 16)
    return {
        "aspectRatio": aspect_ratio,
        "resolution": resolution,
        "width": width,
        "height": height,
        "ratioValue": ratio_val,
        "dimensionLabel": f"{width} × {height}",
    }


def compile_filter_chain(filter_settings: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    """Compiles UI filter sliders and LUT selections into native FFmpeg filter clauses."""
    clauses = build_color_filter_chain(filter_settings)
    return {
        "success": True,
        "clauses": clauses,
        "filterString": ",".join(clauses) if clauses else "",
    }

