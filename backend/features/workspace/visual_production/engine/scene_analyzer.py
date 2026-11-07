"""
backend/features/workspace/visual_production/engine/scene_analyzer.py

Scene complexity analyzer and 3-tier production path resolution
for Stage 3: Visual Production.
"""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

from backend.features.workspace.visual_production.schemas import ProductionMode


class SceneAnalysisResult(BaseModel):
    """Complexity metrics and path recommendation for a single scene."""
    characterCount: int = 0
    charactersPresent: List[str] = Field(default_factory=list)
    hasDynamicCamera: bool = False
    cameraMovementType: str = "static"
    isNatureOrLandscape: bool = False
    isInteriorOrSciFi: bool = False
    visualComplexity: str = "medium"  # low, medium, high
    recommendedPath: ProductionMode = ProductionMode.MEDIA
    rationale: str = ""


NATURE_LANDSCAPE_KEYWORDS = {
    "mountain", "mountains", "cliff", "cliffs", "sky", "skies", "cloud", "clouds",
    "ocean", "sea", "lake", "river", "forest", "trees", "fog", "mist", "autumn",
    "sunset", "sunrise", "landscape", "horizon", "valley", "wilderness", "nature",
}

INTERIOR_SCIFI_KEYWORDS = {
    "room", "office", "corridor", "hallway", "laboratory", "lab", "chamber",
    "spaceship", "cockpit", "studio", "warehouse", "interior", "futuristic",
    "neon", "cyberpunk", "subway", "station",
}

DYNAMIC_CAMERA_KEYWORDS = {
    "orbit", "tracking", "crane", "push_in", "pull_out", "bezier", "spline",
    "pan_tilt", "dolly", "whip_pan", "fpv",
}


def analyze_scene_complexity(scene: Dict[str, Any]) -> SceneAnalysisResult:
    """
    Inspects scene characters, visual description, camera motion, and environments
    to evaluate visual complexity and suggest the ideal production mode.
    """
    # 1. Characters inspection
    raw_characters = scene.get("characters") or []
    characters_present = []
    for c in raw_characters:
        if isinstance(c, dict):
            name = c.get("name") or c.get("characterId") or c.get("id")
            if name:
                characters_present.append(name)
        elif isinstance(c, str):
            characters_present.append(c)

    char_count = len(characters_present)

    # 2. Camera movement inspection
    camera = scene.get("camera") or {}
    movement_type = "static"
    if isinstance(camera, dict):
        movement_type = str(camera.get("movement") or camera.get("type") or "static").lower()
    elif isinstance(camera, str):
        movement_type = camera.lower()

    has_dynamic_cam = any(kw in movement_type for kw in DYNAMIC_CAMERA_KEYWORDS)

    # 3. Environment & prompt keyword inspection
    vis_desc = str(scene.get("visualDescription") or scene.get("visualQuery") or "").lower()
    env = str(scene.get("environment") or "").lower()
    combined_text = f"{vis_desc} {env}"

    is_nature = any(kw in combined_text for kw in NATURE_LANDSCAPE_KEYWORDS)
    is_interior = any(kw in combined_text for kw in INTERIOR_SCIFI_KEYWORDS)

    # 4. Complexity score
    if char_count >= 2 and has_dynamic_cam:
        complexity = "high"
    elif char_count == 1 or has_dynamic_cam or is_interior:
        complexity = "medium"
    else:
        complexity = "low"

    # 5. Recommendation logic
    if char_count >= 1 and is_nature:
        rec_mode = ProductionMode.HYBRID
        rationale = f"Character(s) ({', '.join(characters_present)}) staged in natural landscape: optimal for hybrid compositing."
    elif char_count >= 1 and (has_dynamic_cam or is_interior):
        rec_mode = ProductionMode.THREE_D
        rationale = f"Character-driven scene with dynamic camera motion ({movement_type}): optimal for 3D procedural staging."
    elif char_count == 0 and is_nature:
        rec_mode = ProductionMode.MEDIA
        rationale = "Scenic environmental plate with no characters: optimal for high-res stock media."
    else:
        # Default production mode is Media
        rec_mode = ProductionMode.MEDIA
        rationale = "Standard scene composition: defaulting to cinematic stock media."

    return SceneAnalysisResult(
        characterCount=char_count,
        charactersPresent=characters_present,
        hasDynamicCamera=has_dynamic_cam,
        cameraMovementType=movement_type,
        isNatureOrLandscape=is_nature,
        isInteriorOrSciFi=is_interior,
        visualComplexity=complexity,
        recommendedPath=rec_mode,
        rationale=rationale,
    )


def resolve_production_path(
    project_mode: ProductionMode,
    scene_mode_override: Optional[ProductionMode] = None,
    scene_data: Optional[Dict[str, Any]] = None,
) -> tuple[ProductionMode, SceneAnalysisResult]:
    """
    Resolves the actual production path using the 3-Tier Resolution Hierarchy:
      Tier 1: Explicit per-scene override (if specified):
              - If explicitly AUTOMATIC, routes dynamically based on scene content.
              - Otherwise, enforces the explicit scene mode (MEDIA, THREE_D, HYBRID).
      Tier 2: Project-level mode (when no scene override is specified):
              - If AUTOMATIC, routes dynamically based on scene content.
              - Otherwise, uses project mode (MEDIA, THREE_D, HYBRID).
      Tier 3: Default system fallback (ProductionMode.MEDIA).
    """
    analysis = analyze_scene_complexity(scene_data or {})

    # Tier 1: Per-scene explicit override
    if scene_mode_override is not None:
        if scene_mode_override == ProductionMode.AUTOMATIC:
            return analysis.recommendedPath, analysis
        return scene_mode_override, analysis

    # Tier 2: Project-level mode
    if project_mode is not None:
        if project_mode == ProductionMode.AUTOMATIC:
            return analysis.recommendedPath, analysis
        return project_mode, analysis

    # Tier 3: Default system fallback
    return ProductionMode.MEDIA, analysis

