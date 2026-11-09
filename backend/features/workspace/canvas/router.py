"""
backend/features/workspace/canvas/router.py
HTTP endpoints for Canvas & Frame Studio:
- Aspect ratio and target platform presets (Shorts, Reels, YouTube, Instagram)
- 24 Cinematic Color LUT matrices & CSS/FFmpeg filters
- Studio solid & gradient canvas backdrops
- Canvas & Frame builder presets
- Video filter chain compilation & dimension calculators
"""

from typing import Any, Dict, Optional

from fastapi import APIRouter, Body, Query
from pydantic import BaseModel

from .service import (
    compile_filter_chain,
    get_aspect_ratios,
    get_canvas_frame_presets,
    get_canvas_presets,
    get_color_luts,
    get_studio_gradients,
    get_studio_solids,
    resolve_canvas_dimensions,
)
from .filter_builder import generate_custom_gradient

router = APIRouter()


class CanvasDimensionsRequest(BaseModel):
    aspectRatio: str = "9:16"
    resolution: int = 1080


class FilterChainRequest(BaseModel):
    filterSettings: Dict[str, Any]


class CustomGradientRequest(BaseModel):
    color1: str = "#09090b"
    color2: str = "#1e1b4b"
    angle: int = 135
    type: str = "linear"


@router.get(
    "/api/workspace/canvas/presets",
    tags=["Studio Tools 6: Canvas"],
    summary="Get Canvas & Frame Studio Catalog",
    operation_id="get_canvas_studio_presets",
    description="Returns the unified catalog spanning all 5 subtabs: Ratio, LUTs, Solid, Gradient, and Build presets.",
)
async def get_canvas_presets_route():
    return get_canvas_presets()


@router.get(
    "/api/workspace/canvas/ratios",
    tags=["Studio Tools 6: Canvas"],
    summary="Get Target Output Platform Ratios",
    operation_id="get_canvas_platform_ratios",
    description="Returns all supported aspect ratios (9:16 Shorts/Reels, 16:9 YouTube, 1:1 Square, 4:5 Portrait, 21:9 Ultrawide).",
)
async def get_aspect_ratios_route():
    return {
        "success": True,
        "items": get_aspect_ratios(),
    }


@router.get(
    "/api/workspace/canvas/luts",
    tags=["Studio Tools 6: Canvas"],
    summary="Get 24 Cinematic Color LUT Presets",
    operation_id="get_canvas_color_luts",
    description="Returns the 24 cinematic color LUT presets with CSS filter and native FFmpeg filter clauses.",
)
async def get_color_luts_route(
    category: str = Query("all", description="LUT category filter: all, cinematic, moody, vintage, creative"),
):
    return {
        "success": True,
        "category": category,
        "items": get_color_luts(category=category),
    }


@router.get(
    "/api/workspace/canvas/solids",
    tags=["Studio Tools 6: Canvas"],
    summary="Get Studio Solid Canvas Presets",
    operation_id="get_canvas_solids",
)
async def get_studio_solids_route():
    return {
        "success": True,
        "items": get_studio_solids(),
    }


@router.get(
    "/api/workspace/canvas/gradients",
    tags=["Studio Tools 6: Canvas"],
    summary="Get Studio Gradient Canvas Presets",
    operation_id="get_canvas_gradients",
)
async def get_studio_gradients_route():
    return {
        "success": True,
        "items": get_studio_gradients(),
    }


@router.get(
    "/api/workspace/canvas/frames",
    tags=["Studio Tools 6: Canvas"],
    summary="Get Canvas & Frame Builder Presets",
    operation_id="get_canvas_frame_presets",
)
async def get_canvas_frame_presets_route():
    return {
        "success": True,
        "items": get_canvas_frame_presets(),
    }


@router.get(
    "/api/workspace/canvas/dimensions",
    tags=["Studio Tools 6: Canvas"],
    summary="Calculate Canvas Dimensions",
    operation_id="get_canvas_dimensions",
    description="Calculates even (divisible by 2) width and height for video encoding given an aspect ratio and resolution limit.",
)
async def get_canvas_dimensions_route(
    aspectRatio: str = Query("9:16", description="Aspect ratio e.g. 9:16, 16:9, 1:1, 4:5, 21:9"),
    resolution: int = Query(1080, description="Base resolution limit e.g. 1080, 720, 2160"),
):
    return {
        "success": True,
        **resolve_canvas_dimensions(aspect_ratio=aspectRatio, resolution=resolution),
    }


@router.post(
    "/api/workspace/canvas/filter-chain",
    tags=["Studio Tools 6: Canvas"],
    summary="Compile Video Filter Chain",
    operation_id="compile_canvas_filter_chain",
    description="Compiles UI color adjustments, blur, vignette, and LUT presets into native FFmpeg video filter clauses.",
)
async def post_compile_filter_chain(payload: FilterChainRequest):
    return compile_filter_chain(payload.filterSettings)


@router.post(
    "/api/workspace/canvas/custom-gradient",
    tags=["Studio Tools 6: Canvas"],
    summary="Generate Custom Gradient",
    operation_id="generate_canvas_custom_gradient",
)
async def post_generate_custom_gradient(payload: CustomGradientRequest):
    return {
        "success": True,
        "gradient": generate_custom_gradient(
            color1=payload.color1,
            color2=payload.color2,
            angle=payload.angle,
            grad_type=payload.type,
        ),
    }

