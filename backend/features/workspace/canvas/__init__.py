"""
backend/features/workspace/canvas/__init__.py
Workspace modular Canvas & Frame Studio package.
Unified module for:
- Target aspect ratios & platform presets (9:16, 16:9, 1:1, 4:5, 21:9)
- 24 Cinematic Color LUT matrices & FFmpeg/CSS color filters
- Curated studio solid & gradient canvas backdrops
- Canvas & Frame builder presets (letterbox, border radius, padding)
- FFmpeg video filter chain compiler & canvas dimension calculator
- Canvas APIRouter
"""

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
from .router import router as canvas_router
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

__all__ = [
    # Router
    "canvas_router",
    # Service Functions
    "get_canvas_presets",
    "get_aspect_ratios",
    "get_color_luts",
    "get_studio_solids",
    "get_studio_gradients",
    "get_canvas_frame_presets",
    "resolve_canvas_dimensions",
    "compile_filter_chain",
    # Calculation & Filter Compilers
    "calculate_canvas_dimensions",
    "build_color_filter_chain",
    "resolve_lut_filter",
    "generate_custom_gradient",
    # Presets & Constants
    "PLATFORM_RATIOS",
    "ASPECT_RATIO_MAP",
    "COLOR_LUTS",
    "STUDIO_SOLIDS",
    "STUDIO_GRADIENTS",
    "CANVAS_FRAME_PRESETS",
]

