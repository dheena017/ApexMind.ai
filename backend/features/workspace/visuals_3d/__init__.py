"""
backend/features/workspace/visuals_3d/__init__.py
Central workspace 3D visuals, models & CGI package.
Exports modular 3D search, provider health status, Blender render execution,
and the studio 3D APIRouter.
"""

from .router import router as visuals_3d_router
from .service import (
    get_available_3d_providers,
    search_3d_assets,
    download_and_cache_3d_asset,
    list_local_3d_assets,
    get_brain_presets,
    generate_procedural_brain_mesh,
    render_3d_motion_loop_scene,
    render_blender_hybrid_scene,
    render_blender_full_sequence,
    assemble_multi_scene_3d_short,
)

__all__ = [
    "visuals_3d_router",
    "get_available_3d_providers",
    "search_3d_assets",
    "download_and_cache_3d_asset",
    "list_local_3d_assets",
    "get_brain_presets",
    "generate_procedural_brain_mesh",
    "render_3d_motion_loop_scene",
    "render_blender_hybrid_scene",
    "render_blender_full_sequence",
    "assemble_multi_scene_3d_short",
]

