"""
backend/features/workspace/visuals_3d/router.py
FastAPI router for ApexMind 3D Visuals & CGI Studio Engine:
- Group 1: 3D Asset Discovery & Catalog (/api/workspace/3d-visuals/assets/*)
- Group 2: ApexMind 3D Neural Brain Engine (/api/workspace/3d-visuals/brain/*)
- Group 3: AI 3D Scene Director (/api/workspace/3d-visuals/director/*)
- Group 4: 3D Render & Building Engines (/api/workspace/3d-visuals/render/*)
- Group 5: Jobs, Streaming & Master Assembly (/api/workspace/3d-visuals/jobs/*)
"""

import logging
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, File, HTTPException, Query, UploadFile, status
from fastapi.responses import FileResponse

from .schemas import (
    Assemble3DShortRequest,
    Assemble3DShortResponse,
    BrainAudioModulationRequest,
    BrainAudioModulationResponse,
    BrainConfig,
    BrainPresetsResponse,
    CameraPresetsResponse,
    CancelJobResponse,
    Compile3DSceneRequest,
    Compile3DSceneResponse,
    Download3DAssetRequest,
    Download3DAssetResponse,
    GenerateBrainMeshResponse,
    Local3DAssetsListResponse,
    RenderBlenderFullRequest,
    RenderBlenderHybridRequest,
    RenderJobCreatedResponse,
    RenderJobStatusResponse,
    RenderMotionLoopRequest,
    RenderSceneResultResponse,
    SaveWebGLStreamResponse,
    Search3DAssetsRequest,
    Search3DAssetsResponse,
    Studio3DProvidersResponse,
)
from .service import (
    assemble_multi_scene_3d_short,
    calculate_brain_audio_modulation,
    cancel_render_job,
    compile_prompt_to_3d_scene,
    download_and_cache_3d_asset,
    generate_procedural_brain_mesh,
    get_available_3d_providers,
    get_brain_presets,
    get_camera_choreography_presets,
    get_render_job_status,
    list_local_3d_assets,
    render_blender_full_sequence,
    render_blender_hybrid_scene,
    render_3d_motion_loop_scene,
    save_webgl_recorded_stream,
    search_3d_assets,
)
from .providers import get_provider

logger = logging.getLogger("ApexMind.Workspace.Visuals3D.Router")
router = APIRouter(prefix="/api/workspace/3d-visuals", tags=["Studio Tools: 3D Visuals & CGI"])


# ══════════════════════════════════════════════════════════════════════════════
# GROUP 1: 3D ASSET DISCOVERY & CATALOG ENDPOINTS
# ══════════════════════════════════════════════════════════════════════════════

@router.get("/providers", response_model=Studio3DProvidersResponse, summary="List 3D Providers & Engines")
def get_providers_endpoint():
    return get_available_3d_providers()


@router.post("/assets/search", response_model=Search3DAssetsResponse, summary="Search 3D Assets (Post)")
def search_assets_endpoint(payload: Search3DAssetsRequest):
    return search_3d_assets(payload)


# Media alias matching /api/media/video-search pattern
@router.get("/assets/search", response_model=Search3DAssetsResponse, summary="Search 3D Assets (Get)")
def search_assets_get_endpoint(
    q: str = Query(default="", description="Search query"),
    category: str = Query(default="all"),
    provider: str = Query(default="all"),
    page: int = Query(default=1, ge=1),
    pageSize: int = Query(default=20, ge=1, le=50),
):
    payload = Search3DAssetsRequest(query=q, category=category, provider=provider, page=page, pageSize=pageSize)
    return search_3d_assets(payload)


@router.post("/assets/download", response_model=Download3DAssetResponse, summary="Download & Cache .glb Asset")
def download_asset_endpoint(payload: Download3DAssetRequest):
    try:
        return download_and_cache_3d_asset(payload)
    except Exception as e:
        logger.error(f"Download 3D asset error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/sketchfab/{uid}/download", summary="Resolve Sketchfab glTF Download URL via Official Download API")
def get_sketchfab_download_endpoint(uid: str):
    prov = get_provider("sketchfab")
    if prov and hasattr(prov, "get_download_url"):
        return prov.get_download_url(uid)
    return {
        "success": True,
        "uid": uid,
        "downloadUrl": f"https://sketchfab.com/3d-models/{uid}#download",
        "directUrl": f"https://sketchfab.com/3d-models/{uid}",
    }


@router.post("/sloyd/generate", summary="Generate 3D Model via Official Sloyd AI API")
def sloyd_generate_endpoint(payload: Dict[str, Any]):
    prov = get_provider("sloyd_ai")
    if prov and hasattr(prov, "generate_text_to_3d"):
        prompt = payload.get("prompt", "lowpoly prop")
        topology = payload.get("topology", "auto")
        target_face_count = payload.get("targetFaceCount", 15000)
        texture_resolution = payload.get("textureResolution", "2k")
        t_pose = payload.get("tPose", False)
        return prov.generate_text_to_3d(prompt, topology, target_face_count, texture_resolution, t_pose)
    return {
        "success": False,
        "message": "Sloyd AI provider not available.",
    }


@router.get("/sloyd/jobs/{job_id}", summary="Check Sloyd AI 3D Generation Job Status")
def sloyd_job_status_endpoint(job_id: str):
    prov = get_provider("sloyd_ai")
    if prov and hasattr(prov, "get_job_status"):
        return prov.get_job_status(job_id)
    return {
        "success": False,
        "jobId": job_id,
        "message": "Sloyd AI provider not available.",
    }


@router.get("/assets/local", response_model=Local3DAssetsListResponse, summary="List Local Cached .glb Assets")
def list_local_assets_endpoint(category: Optional[str] = Query(default=None)):
    return list_local_3d_assets(category)


# ══════════════════════════════════════════════════════════════════════════════
# GROUP 2: APEXMIND 3D NEURAL BRAIN ENDPOINTS
# ══════════════════════════════════════════════════════════════════════════════

@router.get("/brain/presets", response_model=BrainPresetsResponse, summary="Get Curated 3D Brain Presets")
def get_brain_presets_endpoint():
    return get_brain_presets()


@router.post("/brain/generate", response_model=GenerateBrainMeshResponse, summary="Generate Procedural 3D Brain .glb")
def generate_brain_endpoint(config: BrainConfig):
    try:
        return generate_procedural_brain_mesh(config)
    except Exception as e:
        logger.error(f"Generate brain error: {e}")
        raise HTTPException(status_code=500, detail=f"Blender failed to generate 3D Brain: {e}")


@router.post("/brain/modulate-audio", response_model=BrainAudioModulationResponse, summary="Calculate Brain Audio Reactivity")
def modulate_brain_endpoint(payload: BrainAudioModulationRequest):
    return calculate_brain_audio_modulation(payload.audioUrl, bpm=payload.bpm, intensity_factor=payload.intensityFactor)


# ══════════════════════════════════════════════════════════════════════════════
# GROUP 3: AI 3D SCENE DIRECTOR ENDPOINTS
# ══════════════════════════════════════════════════════════════════════════════

@router.post("/director/compile-prompt", response_model=Compile3DSceneResponse, summary="Compile Prompt to 3D Scene")
def compile_prompt_endpoint(payload: Compile3DSceneRequest):
    return compile_prompt_to_3d_scene(payload)


@router.get("/director/camera-presets", response_model=CameraPresetsResponse, summary="Get Camera Choreography Presets")
def get_camera_presets_endpoint():
    return get_camera_choreography_presets()


# ══════════════════════════════════════════════════════════════════════════════
# GROUP 4: 3D RENDER & BUILDING ENGINE ENDPOINTS
# ══════════════════════════════════════════════════════════════════════════════

@router.post("/render/motion-loop", response_model=RenderSceneResultResponse, summary="Render 3D Motion Loop Scene (~2-3s)")
def render_motion_loop_endpoint(payload: RenderMotionLoopRequest):
    try:
        return render_3d_motion_loop_scene(payload)
    except Exception as e:
        logger.error(f"Render 3D loop error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/render/blender-hybrid", response_model=RenderSceneResultResponse, summary="Render Blender 3D Hybrid Scene (~4-6s)")
def render_blender_hybrid_endpoint(payload: RenderBlenderHybridRequest):
    try:
        return render_blender_hybrid_scene(payload)
    except Exception as e:
        logger.error(f"Render Blender hybrid error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/render/blender-full", response_model=RenderSceneResultResponse, summary="Render Blender Full Sequence (CGI)")
def render_blender_full_endpoint(payload: RenderBlenderFullRequest):
    try:
        return render_blender_full_sequence(payload)
    except Exception as e:
        logger.error(f"Render Blender full sequence error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/render/webgl-stream-save", response_model=SaveWebGLStreamResponse, summary="Save In-Browser WebGL Stream")
async def save_webgl_stream_endpoint(file: UploadFile = File(...)):
    content = await file.read()
    return save_webgl_recorded_stream(content, file.filename or "stream.webm")


# ══════════════════════════════════════════════════════════════════════════════
# GROUP 5: JOBS, STREAMING & MASTER ASSEMBLY ENDPOINTS
# ══════════════════════════════════════════════════════════════════════════════

@router.get("/jobs/{job_id}/status", response_model=RenderJobStatusResponse, summary="Get Render Job Status")
def get_job_status_endpoint(job_id: str):
    return get_render_job_status(job_id)


@router.post("/jobs/{job_id}/cancel", response_model=CancelJobResponse, summary="Cancel Render Job")
def cancel_job_endpoint(job_id: str):
    return cancel_render_job(job_id)


@router.post("/render/assemble-short", response_model=Assemble3DShortResponse, summary="Assemble Multi-Scene 3D Short")
def assemble_short_endpoint(payload: Assemble3DShortRequest):
    try:
        return assemble_multi_scene_3d_short(payload.sceneVideoUrls, title=payload.title, audio_config=payload.audioConfig.dict() if payload.audioConfig else None)
    except Exception as e:
        logger.error(f"Assemble short error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ══════════════════════════════════════════════════════════════════════════════
# STATIC PHYSICAL FILE STREAMING ENDPOINTS
# ══════════════════════════════════════════════════════════════════════════════

@router.get("/file/{category}/{filename}", summary="Stream Physical 3D Asset File")
def stream_3d_file_endpoint(category: str, filename: str):
    base_dir = Path("backend/data/3d_assets") if category != "rendered" else Path("backend/data/rendered_shorts/3d_scenes")
    target_file = (base_dir / category / filename).resolve() if category != "rendered" else (base_dir / filename).resolve()

    if not target_file.exists():
        raise HTTPException(status_code=404, detail=f"3D asset file '{filename}' not found.")

    media_type = "model/gltf-binary" if filename.endswith(".glb") else ("video/mp4" if filename.endswith(".mp4") else "image/png")
    return FileResponse(target_file, media_type=media_type)

