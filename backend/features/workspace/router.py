"""
backend/features/workspace/router.py
FastAPI route endpoints for workspace: script generation, TTS, memory, and media assets.
"""

import logging
from typing import Optional, List, Dict, Any, Literal
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException, status, Query, UploadFile, File, Form, Body, Header
from backend.shared.ai_models import (
    DEFAULT_SCRIPT_MODEL,
    get_available_models,
    get_default_script_model,
)
from .schemas import (
    GenerateVoiceoverRequest,
    VoiceoverResponse,
    MediaLibraryResponse,
    # Studio Pipeline v2 schemas
    StudioScriptRequest,
    StudioScriptResponse,
    ScriptJobResponse,
    JobStatusResponse,
    ScriptGenerationResponse,
    StudioVoiceRequest,
    StudioVoiceResponse,
    StudioMediaRequest,
    StudioMediaResponse,
    StudioMediaData,
    StudioBackgroundInfo,
    StudioCaptionsRequest,
    StudioCaptionsResponse,
    CreateCustomBadgeRequest,
    CreateCustomBadgeResponse,
    GenerateMetadataRequest,
    GenerateMetadataResponse,
)
from .service import (
    synthesize_voiceover,
    get_media_library,
    generate_metadata,
)

logger = logging.getLogger("ApexMind.features.workspace")
router = APIRouter()


@router.get(
    "/api/ai/models",
    tags=["AI"],
    summary="List available Gemini models",
    description="Lists text-generation models currently available to the configured Gemini API key.",
)
def get_available_ai_models_route():
    try:
        script_models, _ = get_available_models()
        return {
            "models": script_models,
            "defaultModel": get_default_script_model(),
        }
    except Exception as exc:
        logger.error(f"Could not load available Gemini models: {exc}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Could not load available Gemini models: {exc}",
        ) from exc


@router.post(
    "/api/generate-voiceover",
    response_model=VoiceoverResponse,
    summary="Generate voiceover TTS (legacy)",
    description="Synthesize high-converting audio voiceover using Gemini TTS.",
    include_in_schema=False,
)
def post_generate_voiceover(payload: GenerateVoiceoverRequest):
    if not payload.text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Text prompt is required."
        )
    if not payload.voiceName or not payload.voiceName.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Voice name is required. Please select a voice from the workspace."
        )
    try:
        return synthesize_voiceover(
            text=payload.text,
            voice_name=payload.voiceName,
            model=payload.model,
        )
    except Exception as e:
        logger.error(f"Error in voiceover synthesis: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate voiceover: {e}"
        )

@router.get(
    "/api/media-library",
    response_model=MediaLibraryResponse,
    tags=["Presets"],
    summary="Get Built-in Studio Presets",
    description="Returns the Studio's preset catalog (music presets, visual backdrops, and voice profiles). This is separate from live stock-provider searches."
)
async def get_media_library_route():
    return get_media_library()

@router.get(
    "/api/media/video-search",
    tags=["Stock Media"],
    summary="Video Search",
    operation_id="video_search",
    description="Searches stock video providers and returns workspace-specific fields such as videoUrl, posterUrl, and aesthetic badges."
)
async def get_open_videos_route(
    q: str = "",
    category: str = "all",
    provider: str = "all",
    page: int = 1,
    pageSize: int = 20,
    aspectRatio: str = "9:16"
):
    from .open_media_service import search_open_videos
    return search_open_videos(
        query=q,
        category=category,
        provider=provider,
        page=page,
        page_size=pageSize,
        aspect_ratio=aspectRatio
    )

@router.get(
    "/api/media/image-search",
    tags=["Stock Media"],
    summary="Image Search",
    operation_id="image_search",
    description="Searches stock image providers and returns workspace-specific fields such as imageUrl and thumbnail."
)
async def get_open_images_route(
    q: str = "",
    provider: str = "all",
    category: str = "all",
    page: int = 1,
    pageSize: int = 24,
    orientation: str = "portrait"
):
    from .open_media_service import search_open_images
    return search_open_images(
        query=q,
        category=category,
        page=page,
        page_size=pageSize,
        provider=provider,
        orientation=orientation
    )

@router.get(
    "/api/media/provider-status",
    tags=["Providers"],
    summary="Check Stock Media Provider Availability",
    operation_id="check_stock_media_provider_availability",
    description="Reports whether supported live stock-media providers are available."
)
async def get_open_media_providers_route():
    from .open_media_service import get_media_providers_status
    return get_media_providers_status()

# ══════════════════════════════════════════════════════════════════════════════
# STUDIO ELEMENTS & OVERLAYS SERVICE
# ══════════════════════════════════════════════════════════════════════════════

@router.post(
    "/api/studio/elements/custom-badge",
    response_model=CreateCustomBadgeResponse,
    tags=["Elements"],
    summary="Create Custom Studio Badge",
    operation_id="create_custom_studio_badge",
    description="Generates a customized viral badge with gradient, styling, and text."
)
def post_create_custom_badge_route(payload: CreateCustomBadgeRequest):
    from .elements_service import create_custom_badge
    try:
        return create_custom_badge(
            text=payload.text,
            gradient=payload.gradient,
            icon=payload.icon
        )
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))


# ══════════════════════════════════════════════════════════════════════════════
# STUDIO PRODUCTION PIPELINE — 4 Clean Stages & Native Video Rendering
# ══════════════════════════════════════════════════════════════════════════════

@router.post(
    "/api/studio/generate-script",
    response_model=StudioScriptResponse,
    tags=["Studio"],
    summary="Generate Storyboard Script (Stage 1)",
    description=(
        "Generates a full viral short-form script with multi-scene storyboard, hooks, "
        "sound design plan, and creative metadata via Gemini AI. "
        "Storyboard scenes are returned with mediaStatus='unresolved', ready for Stage 3."
    ),
)
def post_studio_generate_script(payload: StudioScriptRequest):
    from .studio_script_service import run_studio_script
    try:
        return run_studio_script(
            category=payload.category,
            topic=payload.topic or payload.category,
            tone=payload.tone or "",
            length=payload.length or "30 seconds",
            model=payload.model or DEFAULT_SCRIPT_MODEL,
            aspect_ratio=payload.aspectRatio or "9:16",
            voice_name=payload.voiceName,
            music_track_id=payload.musicTrackId,
            caption_style_preset=payload.captionStylePreset,
            backdrop_id=payload.backdropId,
            audio_mood=payload.audioMood,
            background_style=payload.backgroundStyle,
            text_style=payload.textStyle,
            video_style=payload.videoStyle,
            visual_theme=payload.visualTheme,
            motion_style=payload.motionStyle,
            output_format=payload.outputFormat,
            creative_context=payload.creativeContext,
            available_assets=payload.availableAssets,
            user_prompt=payload.userPrompt,
            generation_profile=payload.generationProfile,
            visual_style=payload.visualStyle,
            subtitle_style=payload.subtitleStyle,
            music_mood=payload.musicMood,
            project_id=payload.projectId,
            user_id=payload.userId,
        )
    except ValueError as ve:
        logger.warning(f"[Studio/Script] Validation error: {ve}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        logger.error(f"[Studio/Script] Error: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post(
    "/api/studio/generate-script/async",
    response_model=ScriptJobResponse,
    status_code=status.HTTP_202_ACCEPTED,
    tags=["Studio"],
    summary="Initiate Asynchronous Script Generation Job",
    description="Dispatches a durable generation job returning a jobId for progress polling.",
)
def post_studio_generate_script_async(payload: StudioScriptRequest):
    from .generation_jobs import create_generation_job
    try:
        job_info = create_generation_job(
            payload=payload.model_dump(),
            user_id=payload.userId,
            project_id=payload.projectId,
        )
        return job_info
    except Exception as e:
        logger.error(f"[Studio/Jobs] Failed to dispatch generation job: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get(
    "/api/studio/jobs/{job_id}",
    response_model=JobStatusResponse,
    tags=["Studio"],
    summary="Get Generation Job Status",
    description="Polls execution phase, progress percent, and retrieves result when completed.",
)
def get_studio_job_status(job_id: str):
    from .generation_jobs import get_generation_job_status
    status_info = get_generation_job_status(job_id)
    if not status_info:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Job '{job_id}' not found.")
    return status_info


@router.post(
    "/api/studio/jobs/{job_id}/cancel",
    tags=["Studio"],
    summary="Cancel Generation Job",
    description="Signals cooperative cancellation for an in-flight generation job.",
)
def post_cancel_studio_job(job_id: str):
    from .generation_jobs import cancel_generation_job
    success = cancel_generation_job(job_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Job '{job_id}' not found.")
    return {"success": True, "jobId": job_id, "status": "cancelled"}


@router.post(
    "/api/studio/generate-voice",
    tags=["Studio"],
    summary="Generate Storyboard Voice (Stage 2)",
    description=(
        "Generates full narration audio using zero-cost or cloud speech engines. "
        "Accepts either a Stage 1 script reference (scriptId) for multi-scene and regeneration workflows, "
        "or an inline storyboard/fullNarrationText."
    ),
)
async def post_studio_generate_voice(payload: dict = Body(...)):
    # 1. New Stage 2 Architecture: Script-based Generation / Regeneration
    if "scriptId" in payload and payload.get("scriptId"):
        from .voice_generation.schemas import GenerateVoiceRequest, VoiceGenerationMode
        from .voice_generation.services.script_reader import load_and_validate_script
        from .voice_generation.engine.voice_orchestrator import voice_orchestrator

        try:
            req = GenerateVoiceRequest(**payload)
            script_doc = load_and_validate_script(
                script_id=req.scriptId,
                project_id=req.projectId,
            )
            return await voice_orchestrator.generate_script_voice(
                script_document=script_doc,
                voice_config=req.voiceConfig,
                loudness_profile=req.loudnessProfile,
                mode=req.mode,
                selected_scene_ids=req.sceneIds,
                force_regenerate=req.forceRegenerate,
            )
        except ValueError as ve:
            logger.warning(f"[Studio/Voice] Validation error: {ve}")
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
        except PermissionError as pe:
            logger.warning(f"[Studio/Voice] Permission error: {pe}")
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(pe))
        except Exception as e:
            logger.error(f"[Studio/Voice] Error: {e}")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

    # 2. Legacy / Inline Storyboard Synthesis
    from .studio_voice_service import run_studio_voice
    voice_name = payload.get("voiceName") or payload.get("voice_name")
    if not voice_name or not str(voice_name).strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="voiceName or scriptId is required. Please provide a valid voice or script.",
        )
    storyboard = payload.get("storyboard")
    full_narration = payload.get("fullNarrationText") or payload.get("full_narration_text")
    if not storyboard and not full_narration:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Provide either scriptId, storyboard[], or fullNarrationText.",
        )
    try:
        return run_studio_voice(
            voice_name=voice_name,
            storyboard=[s if isinstance(s, dict) else s.model_dump() for s in (storyboard or [])],
            full_narration_text=full_narration,
            model=payload.get("model"),
            speech_style=payload.get("speechStyle"),
            target_duration_seconds=payload.get("targetDurationSeconds"),
        )
    except ValueError as ve:
        logger.warning(f"[Studio/Voice] Validation error: {ve}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        logger.error(f"[Studio/Voice] Error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Voice generation failed: {e}",
        )


@router.post(
    "/api/studio/generate-voice/async",
    response_model=ScriptJobResponse,
    status_code=status.HTTP_202_ACCEPTED,
    tags=["Studio"],
    summary="Initiate Asynchronous Voice Generation Job",
    description="Dispatches a durable voice generation job returning a jobId for progress polling.",
)
def post_studio_generate_voice_async(
    payload: dict = Body(...),
    idempotency_key: Optional[str] = Header(None, alias="X-Idempotency-Key"),
):
    from .generation_jobs import create_generation_job
    try:
        job_info = create_generation_job(
            payload=payload,
            idempotency_key=idempotency_key,
            user_id=payload.get("userId"),
            project_id=payload.get("projectId"),
            job_type="voice",
        )
        return job_info
    except Exception as e:
        logger.error(f"[Studio/Jobs] Failed to dispatch voice generation job: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post(
    "/api/studio/synthesize-voice",
    tags=["Studio"],
    summary="Generate Storyboard Voice (Stage 2) [Deprecated alias]",
    description="Deprecated alias for POST /api/studio/generate-voice.",
    include_in_schema=False,
)
async def post_studio_synthesize_voice(payload: dict = Body(...)):
    return await post_studio_generate_voice(payload)


@router.get(
    "/api/studio/voices",
    tags=["Studio"],
    summary="List Available Voice Providers & Voices",
    description="Discovers installed and available voices grouped by provider (Piper, Edge-TTS, System OS).",
)
def get_studio_voices():
    from .voice_generation.providers import voice_registry
    providers_list = []
    for p in voice_registry.list_providers():
        providers_list.append({
            "providerId": p.provider_id,
            "name": p.name,
            "isOffline": p.capabilities.isOffline,
            "voices": [
                {
                    "voiceId": v.voiceId,
                    "name": v.name,
                    "gender": v.gender,
                    "language": v.language,
                    "capabilities": v.capabilities.model_dump(),
                }
                for v in p.list_voices()
            ],
        })
    default_p = "piper" if (voice_registry.get_provider("piper") and voice_registry.get_provider("piper").is_available()) else "edge_tts"
    return {
        "success": True,
        "defaultProvider": default_p,
        "providers": providers_list,
    }


@router.get(
    "/api/studio/scripts/{script_id}/voice",
    tags=["Studio"],
    summary="Retrieve Generated Voice Metadata for Script",
    description="Returns scene audio URLs and master narration track metadata for a given scriptId.",
)
def get_script_voice_metadata(script_id: str):
    import soundfile as sf
    from .voice_generation.storage.audio_storage import audio_storage
    s_dir = audio_storage.get_script_dir(script_id)
    master_path = s_dir / "narration_master.wav"
    if not master_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No generated voice assets found for script '{script_id}'.",
        )

    try:
        data, sr = sf.read(str(master_path))
        dur = float(len(data)) / float(sr)
    except Exception as e:
        dur = 0.0

    scene_files = sorted(s_dir.glob("*_v*.wav"))
    scenes = []
    seen_ids = set()
    for sf_path in reversed(scene_files):
        if "narration_master" in sf_path.name or sf_path.name.startswith("."):
            continue
        base_id = sf_path.stem.split("_v")[0]
        if base_id not in seen_ids:
            seen_ids.add(base_id)
            try:
                s_data, s_sr = sf.read(str(sf_path))
                s_dur = float(len(s_data)) / float(s_sr)
            except Exception:
                s_dur = 0.0
            v = int(sf_path.stem.split("_v")[-1])
            scenes.append({
                "sceneId": base_id,
                "version": v,
                "audioUrl": f"/media/voice/{script_id}/{sf_path.name}",
                "actualDuration": round(s_dur, 3),
            })
    scenes.reverse()

    return {
        "success": True,
        "schemaVersion": "2.0",
        "scriptId": script_id,
        "masterAudioUrl": f"/media/voice/{script_id}/narration_master.wav",
        "masterDuration": round(dur, 3),
        "scenes": scenes,
    }


@router.post(
    "/api/studio/resolve-media",
    response_model=StudioMediaResponse,
    tags=["Studio"],
    summary="Resolve Scene Stock Media & SFX (Stage 3)",
    description=(
        "Batch-resolves real stock video/image URLs for all storyboard scenes concurrently "
        "using Google CSE, Pexels, Pixabay, and Wikimedia. "
        "Also resolves SFX audio URLs and returns backdrop/background metadata."
    ),
)
def post_studio_resolve_media(payload: StudioMediaRequest):
    import time as _time
    from .studio_media_service import run_studio_media
    t0 = _time.perf_counter()
    try:
        result = run_studio_media(
            scenes=[s.model_dump() for s in payload.scenes],
            aspect_ratio=payload.aspectRatio,
            sfx_events=[e.model_dump() for e in (payload.sfxEvents or [])],
            backdrop_id=payload.backdropId,
            resolve_background=payload.resolveBackground,
            resolve_images=payload.resolveImages,
        )
        validated_data = StudioMediaData(
            scenes=result["data"]["scenes"],
            sfxEvents=result["data"]["sfxEvents"],
            background=StudioBackgroundInfo(**result["data"]["background"]),
            resolvedCount=result["data"]["resolvedCount"],
            failedCount=result["data"]["failedCount"],
            totalScenes=result["data"]["totalScenes"],
        )
        return StudioMediaResponse(
            success=True,
            stageId="media",
            data=validated_data,
            metadata={"executionTimeMs": int((_time.perf_counter() - t0) * 1000)},
            generatedAt=result.get("generatedAt", ""),
        )
    except Exception as e:
        logger.error(f"[Studio/Media] Error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Media resolution failed: {e}",
        )


@router.post(
    "/api/studio/generate-captions",
    response_model=StudioCaptionsResponse,
    tags=["Studio"],
    summary="Generate Word-Timed Captions (Stage 4)",
    description=(
        "Generates scene-aligned, word-level timed captions pinned to each scene's time window. "
        "Returns timelineClips[] directly usable as LocalClips[] in StudioTimelinePane, "
        "plus SRT and WebVTT exports."
    ),
)
def post_studio_generate_captions(payload: StudioCaptionsRequest):
    from .studio_captions_service import run_studio_captions
    if not payload.storyboardScenes and not payload.fullNarrationText:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Provide either storyboardScenes[] or fullNarrationText.",
        )
    try:
        return run_studio_captions(
            storyboard_scenes=[s.model_dump() for s in (payload.storyboardScenes or [])],
            duration_seconds=payload.durationSeconds,
            full_narration_text=payload.fullNarrationText,
            style_preset=payload.stylePreset,
            max_words_per_segment=payload.maxWordsPerSegment,
            aspect_ratio=payload.aspectRatio,
            caption_color=payload.captionColor,
            caption_font_family=payload.captionFontFamily,
        )
    except ValueError as ve:
        logger.warning(f"[Studio/Captions] Validation error: {ve}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        logger.error(f"[Studio/Captions] Error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Caption generation failed: {e}",
        )

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


@router.post(
    "/api/workspace/render-video",
    tags=["Studio"],
    summary="Render Timeline to Full HD MP4",
    description="Assembles multi-layer video clips, images, voiceover, music, sound effects, and karaoke subtitles into a 1080x1920 MP4 using native FFmpeg.",
)
def post_render_video(payload: RenderVideoApiRequest):
    from .video_render_service import render_studio_video
    try:
        result = render_studio_video(
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
        return result
    except Exception as e:
        logger.error(f"[Workspace/RenderVideo] Error: {e}")
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
    from .video_render_service import convert_webm_to_mp4
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
        logger.error(f"[Workspace/ConvertToMp4] Error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Conversion failed: {e}",
        )

@router.post(
    "/api/workspace/generate-metadata",
    response_model=GenerateMetadataResponse,
    tags=["Content Tools"],
    summary="Generate viral titles, description, and hashtags",
    description="Generate high-CTR titles, optimized description, and categorized hashtags via AI.",
)
def post_generate_metadata(payload: GenerateMetadataRequest):
    if not any((payload.topic, payload.title, payload.hook, payload.quote)):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Provide a video title or script before generating metadata.",
        )
    try:
        data = generate_metadata(
            category=payload.category or "",
            topic=payload.topic or "",
            title=payload.title or "",
            hook=payload.hook or "",
            quote=payload.quote or "",
            cta=payload.cta or "",
            model=payload.model,
        )
        return {
            "success": True,
            **data,
        }
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"Generate metadata error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
