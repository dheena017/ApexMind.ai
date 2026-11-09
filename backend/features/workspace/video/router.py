"""
backend/features/workspace/video/router.py
HTTP endpoints for workspace video capabilities:
- Stock video search across Pexels, Pixabay, Mixkit, Coverr, Wikimedia, Google CSE
- Video provider connectivity status
- Native FFmpeg multi-layer timeline video rendering
- Browser WebM to MP4 transcoding
"""

import logging
from typing import Any, Dict, List, Literal, Optional

from fastapi import APIRouter, File, Form, HTTPException, Query, UploadFile, status
from pydantic import BaseModel

from backend.shared.video_renderer import convert_webm_to_mp4, render_studio_video
from .service import get_video_providers_status, search_videos

logger = logging.getLogger("ApexMind.Workspace.VideoRouter")
router = APIRouter()


class RenderVideoApiRequest(BaseModel):
    title: str = "apexmind-video"
    aspectRatio: str = "9:16"
    duration: float = 15.0
    exactDuration: Optional[float] = None
    audioUrl: Optional[str] = None
    musicUrl: Optional[str] = None
    backdropUrl: Optional[str] = None
    backdropType: str = "image"
    videoClips: Optional[List[Dict[str, Any]]] = None
    imageClips: Optional[List[Dict[str, Any]]] = None
    sfxClips: Optional[List[Dict[str, Any]]] = None
    subtitles: List[Dict[str, Any]] = []
    captionColor: str = "#FACC15"
    captionFont: Optional[str] = "Impact"
    captionTransform: Optional[str] = "uppercase"
    filterSettings: Optional[Dict[str, Any]] = None
    voiceVolume: Optional[float] = 1.0
    musicVolume: Optional[float] = 0.65
    sfxVolume: Optional[float] = 0.85
    duckingSettings: Optional[Dict[str, Any]] = None
    fps: Literal[24, 30, 60] = 30
    videoBitrate: Literal[4, 8, 16, 25] = 8
    codec: Literal["h264", "hevc", "vp9", "av1"] = "h264"
    container: Literal["mp4", "webm", "mov"] = "mp4"
    audioSampleRate: Literal[24000, 44100, 48000] = 48000
    audioBitrate: Literal[128, 192, 320] = 192
    resolution: Literal[720, 1080, 1440] = 1080


@router.get(
    "/api/media/video-search",
    tags=["Stock Media"],
    summary="Video Search",
    operation_id="video_search",
    description="Searches stock video providers and returns workspace-specific fields such as videoUrl, posterUrl, and aesthetic badges.",
)
@router.get(
    "/api/workspace/video/search",
    tags=["Stock Media"],
    summary="Video Search (Alias)",
    operation_id="video_search_alias",
    include_in_schema=False,
)
async def get_open_videos(
    q: str = Query("", description="Search keywords"),
    category: str = Query("all", description="Video category"),
    provider: str = Query("all", description="Target provider or 'all'"),
    page: int = Query(1, ge=1, description="Page number"),
    pageSize: int = Query(20, ge=1, le=50, description="Items per page"),
    aspectRatio: str = Query("all", description="Target aspect ratio: all, 9:16, 16:9, etc."),
):
    return search_videos(
        query=q,
        category=category,
        provider=provider,
        page=page,
        page_size=pageSize,
        aspect_ratio=aspectRatio,
    )


@router.get(
    "/api/workspace/video/providers",
    tags=["Stock Media"],
    summary="Get Video Providers Status",
    operation_id="get_workspace_video_providers",
)
async def get_video_providers():
    return {
        "success": True,
        "providers": get_video_providers_status(),
    }


@router.post(
    "/api/workspace/render-video",
    tags=["Studio"],
    summary="Render Timeline to Full HD MP4",
    description="Assembles multi-layer video clips, images, voiceover, music, sound effects, and karaoke subtitles into a 1080x1920 MP4 using native FFmpeg.",
)
def post_render_video(payload: RenderVideoApiRequest):
    try:
        return render_studio_video(
            title=payload.title,
            aspect_ratio=payload.aspectRatio,
            duration=payload.duration,
            exact_duration=payload.exactDuration,
            audio_url=payload.audioUrl,
            music_url=payload.musicUrl,
            backdrop_url=payload.backdropUrl,
            backdrop_type=payload.backdropType,
            video_clips=payload.videoClips,
            image_clips=payload.imageClips,
            sfx_clips=payload.sfxClips,
            subtitles=payload.subtitles,
            caption_color=payload.captionColor,
            caption_font=payload.captionFont,
            caption_transform=payload.captionTransform,
            filter_settings=payload.filterSettings,
            voice_volume=payload.voiceVolume,
            music_volume=payload.musicVolume,
            sfx_volume=payload.sfxVolume,
            ducking_settings=payload.duckingSettings,
            fps=payload.fps,
            video_bitrate=payload.videoBitrate,
            codec=payload.codec,
            container=payload.container,
            audio_sample_rate=payload.audioSampleRate,
            audio_bitrate=payload.audioBitrate,
            resolution=payload.resolution,
        )
    except Exception as e:
        logger.error(f"[VideoRouter/RenderVideo] Error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Video rendering failed: {e}",
        )


@router.post(
    "/api/workspace/convert-to-mp4",
    tags=["Studio"],
    summary="Transcode Browser Recording",
    description="Converts canvas-recorded video to the requested codec, container, resolution, and audio settings.",
)
async def post_convert_to_mp4(
    file: UploadFile = File(...),
    filename: Optional[str] = Form("apexmind-video"),
    fps: Literal[24, 30, 60] = Form(30),
    videoBitrate: Literal[4, 8, 16, 25] = Form(8),
    codec: Literal["h264", "hevc", "vp9", "av1"] = Form("h264"),
    container: Literal["mp4", "webm", "mov"] = Form("mp4"),
    audioSampleRate: Literal[24000, 44100, 48000] = Form(48000),
    audioBitrate: Literal[128, 192, 320] = Form(192),
    resolution: Literal[720, 1080, 1440] = Form(1080),
    aspectRatio: Literal["9:16", "16:9", "1:1", "4:5", "21:9"] = Form("9:16"),
):
    try:
        content = await file.read()
        return convert_webm_to_mp4(
            content,
            filename_base=filename or "apexmind-video",
            fps=fps,
            video_bitrate=videoBitrate,
            codec=codec,
            container=container,
            audio_sample_rate=audioSampleRate,
            audio_bitrate=audioBitrate,
            resolution=resolution,
            aspect_ratio=aspectRatio,
        )
    except Exception as e:
        logger.error(f"[VideoRouter/ConvertToMp4] Error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Conversion failed: {e}",
        )
