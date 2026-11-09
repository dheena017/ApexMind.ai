"""
backend/features/workspace/canvas/filter_builder.py
Canvas dimension calculation and color/LUT filter chain compiler:
- Computes exact width & height locked to even numbers for H.264/yuv420p video encoding
- Converts UI brightness, contrast, saturation, blur, vignette, and LUT filters into native FFmpeg clauses
"""

import math
from typing import Any, Dict, List, Optional, Tuple

from .constants import ASPECT_RATIO_MAP, COLOR_LUTS

# LUT lookup by ID or preset name
_LUT_LOOKUP: Dict[str, Dict[str, Any]] = {
    lut["id"]: lut for lut in COLOR_LUTS
}
for lut in COLOR_LUTS:
    _LUT_LOOKUP[lut["name"].lower()] = lut


def calculate_canvas_dimensions(
    aspect_ratio: str = "9:16",
    resolution: int = 1080,
) -> Tuple[int, int]:
    """
    Computes (width, height) for a given aspect ratio and resolution limit.
    Ensures dimensions are even numbers (divisible by 2) for H.264 / yuv420p FFmpeg compatibility.
    """
    ratio = ASPECT_RATIO_MAP.get(aspect_ratio, 9 / 16)
    res = max(360, int(resolution))

    if ratio < 1.0:
        # Portrait / Vertical (e.g. 9:16, 4:5)
        width = res
        height = round(width / ratio / 2) * 2
    elif ratio > 1.0:
        # Landscape / Widescreen (e.g. 16:9, 21:9)
        height = res
        width = round(height * ratio / 2) * 2
    else:
        # Square (1:1)
        width = res
        height = res

    return int(width), int(height)


def resolve_lut_filter(lut_id_or_name: str) -> Optional[str]:
    """Retrieves the pre-configured FFmpeg filter string for a given LUT ID or name."""
    clean = (lut_id_or_name or "").strip().lower()
    if clean in _LUT_LOOKUP:
        return _LUT_LOOKUP[clean].get("ffmpegFilter") or None
    return None


def build_color_filter_chain(filter_settings: Optional[Dict[str, Any]]) -> List[str]:
    """
    Generates FFmpeg video filter clauses for brightness, contrast, saturation,
    blur, vignette, and cinematic LUT color presets.
    """
    if not filter_settings:
        return []

    filters: List[str] = []

    # 1. Basic Brightness, Contrast & Saturation adjustments
    b = float(filter_settings.get("brightness", 100))
    c = float(filter_settings.get("contrast", 100))
    s = float(filter_settings.get("saturate", 100))

    if b != 100 or c != 100 or s != 100:
        b_val = (b - 100.0) / 100.0 * 0.45  # safe range [-0.45, 0.45]
        c_val = max(0.2, min(2.0, c / 100.0))
        s_val = max(0.0, min(3.0, s / 100.0))
        filters.append(f"eq=brightness={b_val:.3f}:contrast={c_val:.3f}:saturation={s_val:.3f}")

    # 2. Gaussian Blur
    blur_val = float(filter_settings.get("blur", 0))
    if blur_val > 0:
        sigma = min(15.0, blur_val * 0.5)
        filters.append(f"gblur=sigma={sigma:.2f}")

    # 3. Cinematic LUT or Preset Filter
    preset = filter_settings.get("presetFilter") or filter_settings.get("lutId")
    if preset:
        # Check against registered 24 LUT presets first
        lut_filter = resolve_lut_filter(str(preset))
        if lut_filter:
            filters.append(lut_filter)
        elif preset == "noir":
            filters.append("hue=s=0,eq=contrast=1.22:brightness=-0.04")
        elif preset == "cinematic":
            filters.append("colorbalance=rs=0.06:bs=-0.06,eq=contrast=1.1:saturation=1.15")
        elif preset == "cyberpunk":
            filters.append("colorbalance=rs=0.08:gs=-0.04:bs=0.1,eq=contrast=1.2:saturation=1.4")
        elif preset == "warm":
            filters.append("colorbalance=rs=0.08:gs=0.02:bs=-0.08")
        elif preset == "cool":
            filters.append("colorbalance=rs=-0.06:gs=0.02:bs=0.08")

    # 4. Vignette shading
    vignette = float(filter_settings.get("vignette", 0))
    if vignette > 15:
        angle = 0.35 + (vignette / 100.0) * 0.45
        filters.append(f"vignette=angle={angle:.2f}")

    return filters


def generate_custom_gradient(
    color1: str = "#09090b",
    color2: str = "#1e1b4b",
    angle: int = 135,
    grad_type: str = "linear",
) -> Dict[str, Any]:
    """Generates a dynamic CSS gradient string from colors and angle."""
    c1 = (color1 or "#000000").strip()
    c2 = (color2 or "#111111").strip()
    norm_angle = int(angle) % 360

    if grad_type == "radial":
        css = f"radial-gradient(circle at center, {c2} 0%, {c1} 100%)"
    else:
        css = f"linear-gradient({norm_angle}deg, {c1} 0%, {c2} 100%)"

    return {
        "value": css,
        "type": grad_type,
        "angle": norm_angle,
        "color1": c1,
        "color2": c2,
    }

