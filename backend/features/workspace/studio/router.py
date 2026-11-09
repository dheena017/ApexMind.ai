"""
backend/features/workspace/studio/router.py
FastAPI router for ApexMind Studio Production Pipeline:
- Stage 1: Script & Storyboard Generation (/api/studio/generate-script + Small APIs 1.1-1.5)
- Stage 2: Voiceover Synthesis (/api/studio/synthesize-voice + Small APIs 2.1-2.3)
- Stage 3: Media Resolution (/api/studio/resolve-media + Small APIs 3.1-3.4)
- Stage 4: Word-Timed Caption Generation (/api/studio/generate-captions + Small APIs 4.1-4.4)
- AI Model & Provider Status Discovery
"""

import logging
import time
from fastapi import APIRouter, HTTPException, status

from backend.shared.ai_models import DEFAULT_SCRIPT_MODEL
from backend.features.workspace.studio.genre_registry import list_available_genres
from .captions_service import (
    chunk_subtitles_by_words,
    export_captions_srt,
    export_captions_vtt,
    orchestrate_stage4_captions,
    run_studio_captions,
    style_caption_segments,
)
from .media_service import (
    orchestrate_stage3_media,
    resolve_music_track,
    resolve_sound_effects,
    resolve_stock_images,
    resolve_stock_videos,
    run_studio_media,
)
from .script_service import (
    generate_image_scenes,
    generate_metadata,
    generate_script_content,
    generate_script_subtitles,
    generate_video_metadata,
    generate_video_scenes,
    get_available_ai_models,
    get_script_providers_status,
    orchestrate_stage1_script,
    plan_sound_design,
    run_studio_script,
)
from .schemas import (
    # Stage 1 Schemas
    StudioHookOption,
    StudioImageFrameItem,
    StudioImageScenesRequest,
    StudioImageScenesResponse,
    StudioMetadataRequest,
    StudioMetadataResponse,
    StudioScriptContentRequest,
    StudioScriptContentResponse,
    StudioScriptRequest,
    StudioScriptResponse,
    StudioSoundDesignRequest,
    StudioSoundDesignResponse,
    StudioSubtitleItem,
    StudioSubtitlesRequest,
    StudioSubtitlesResponse,
    StudioVideoSceneItem,
    StudioVideoScenesRequest,
    StudioVideoScenesResponse,
    # Stage 2 Schemas
    StudioVoiceAlignRequest,
    StudioVoiceAlignResponse,
    StudioVoiceRequest,
    StudioVoiceResponse,
    StudioVoiceTimestampsRequest,
    StudioVoiceTimestampsResponse,
    StudioVoiceTTSRequest,
    StudioVoiceTTSResponse,
    # Stage 3 Schemas
    StudioBackgroundInfo,
    StudioMediaData,
    StudioMediaRequest,
    StudioMediaResolveImageRequest,
    StudioMediaResolveImageResponse,
    StudioMediaResolveMusicRequest,
    StudioMediaResolveMusicResponse,
    StudioMediaResolveSfxRequest,
    StudioMediaResolveSfxResponse,
    StudioMediaResolveVideoRequest,
    StudioMediaResolveVideoResponse,
    StudioMediaResponse,
    # Stage 4 Schemas
    StudioCaptionsChunkingRequest,
    StudioCaptionsChunkingResponse,
    StudioCaptionsExportSrtRequest,
    StudioCaptionsExportSrtResponse,
    StudioCaptionsExportVttRequest,
    StudioCaptionsExportVttResponse,
    StudioCaptionsHighlightingRequest,
    StudioCaptionsHighlightingResponse,
    StudioCaptionsRequest,
    StudioCaptionsResponse,
)
from .voice_service import (
    align_timeline_to_voice,
    extract_word_timestamps,
    orchestrate_stage2_voice,
    run_studio_voice,
    synthesize_voice_audio,
)

logger = logging.getLogger("ApexMind.Studio.Router")
router = APIRouter()


# ══════════════════════════════════════════════════════════════════════════════
# AI MODELS & PROVIDERS DISCOVERY
# ══════════════════════════════════════════════════════════════════════════════

@router.get(
    "/api/ai/models",
    tags=["Studio - AI & Discovery"],
    summary="List available Gemini models",
    description="Lists text-generation models currently available to the configured Gemini API key.",
)
def get_available_ai_models_route():
    try:
        return get_available_ai_models()
    except Exception as exc:
        logger.error(f"Could not load available Gemini models: {exc}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Could not load available Gemini models: {exc}",
        ) from exc


@router.get(
    "/api/workspace/script/providers",
    tags=["Studio - AI & Discovery"],
    summary="Get Script Provider Status",
    description="Returns active connectivity status for Gemini script and metadata generators.",
)
def get_script_providers_route():
    return {
        "success": True,
        "providers": get_script_providers_status(),
    }


@router.get(
    "/api/studio/genres",
    tags=["Studio - AI & Discovery"],
    summary="List Supported Content Genres",
    description="Returns registered script production engines (Motivation, Roblox Story, Odd One Out, etc.).",
)
def get_studio_genres_route():
    return {
        "success": True,
        "genres": list_available_genres(),
    }


# ══════════════════════════════════════════════════════════════════════════════
# STAGE 1: DEDICATED SMALL REST APIs
# ══════════════════════════════════════════════════════════════════════════════

@router.post(
    "/api/studio/script-content",
    response_model=StudioScriptContentResponse,
    tags=["Studio - Stage 1: Script & Storyboard"],
    summary="Generate Script Content (Small API 1.1)",
    description="Generates viral hook options, main monologue, closing CTA, and assembled fullScript.",
)
def post_studio_script_content(payload: StudioScriptContentRequest):
    try:
        return generate_script_content(
            category=payload.category,
            topic=payload.topic or payload.category,
            tone=payload.tone or "aggressive",
            target_duration_seconds=payload.targetDurationSeconds,
            user_prompt=payload.userPrompt,
            model=payload.model,
            genre=payload.genre or "motivation",
        )
    except Exception as e:
        logger.error(f"[Studio/ScriptContent] Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post(
    "/api/studio/script-subtitles",
    response_model=StudioSubtitlesResponse,
    tags=["Studio - Stage 1: Script & Storyboard"],
    summary="Generate Script Subtitles (Small API 1.2)",
    description="Slices fullScript into 3-6 word mobile safe-zone subtitle lines with timestamps.",
)
def post_studio_script_subtitles(payload: StudioSubtitlesRequest):
    try:
        return generate_script_subtitles(
            full_script=payload.fullScript,
            target_duration_seconds=payload.targetDurationSeconds,
            caption_style_preset=payload.captionStylePreset or "sub-hormozi",
            aspect_ratio=payload.aspectRatio or "9:16",
            model=payload.model,
        )
    except Exception as e:
        logger.error(f"[Studio/ScriptSubtitles] Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post(
    "/api/studio/storyboard-scenes-video",
    response_model=StudioVideoScenesResponse,
    tags=["Studio - Stage 1: Script & Storyboard"],
    summary="Generate Faceless Video Scenes (Small API 1.3A)",
    description="Generates 100% faceless video search queries, fallback queries, negative terms, and camera movements.",
)
def post_studio_storyboard_scenes_video(payload: StudioVideoScenesRequest):
    try:
        return generate_video_scenes(
            subtitles=payload.subtitles,
            visual_theme=payload.visualTheme or "Cinematic Dark Architecture",
            motion_style=payload.motionStyle or "slow push in",
            aspect_ratio=payload.aspectRatio or "9:16",
            user_visual_prompt=payload.userVisualPrompt,
            model=payload.model,
        )
    except Exception as e:
        logger.error(f"[Studio/StoryboardVideo] Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post(
    "/api/studio/storyboard-scenes-image",
    response_model=StudioImageScenesResponse,
    tags=["Studio - Stage 1: Script & Storyboard"],
    summary="Generate Image Scenes & Prompts (Small API 1.3B)",
    description="Generates hyperrealistic cinematic image prompts, lighting, palettes, and Ken Burns motions.",
)
def post_studio_storyboard_scenes_image(payload: StudioImageScenesRequest):
    try:
        return generate_image_scenes(
            subtitles=payload.subtitles,
            art_style=payload.artStyle or "hyperrealistic cinematic photography",
            color_palette=payload.colorPalette or "moody dark teal and orange",
            aspect_ratio=payload.aspectRatio or "9:16",
            user_visual_prompt=payload.userVisualPrompt,
            model=payload.model,
        )
    except Exception as e:
        logger.error(f"[Studio/StoryboardImage] Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post(
    "/api/studio/sound-design",
    response_model=StudioSoundDesignResponse,
    tags=["Studio - Stage 1: Script & Storyboard"],
    summary="Plan Sound Design & SFX (Small API 1.4)",
    description="Generates soundtrack criteria, timestamped SFX placement cues, and dynamic sidechain ducking envelope.",
)
def post_studio_sound_design(payload: StudioSoundDesignRequest):
    try:
        return plan_sound_design(
            category=payload.category,
            tone=payload.tone or "aggressive",
            audio_mood=payload.audioMood or "Dark Phonk / Intense",
            target_duration_seconds=payload.targetDurationSeconds,
            scene_timestamps=payload.sceneTimestamps,
            model=payload.model,
        )
    except Exception as e:
        logger.error(f"[Studio/SoundDesign] Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post(
    "/api/studio/video-metadata",
    response_model=StudioMetadataResponse,
    tags=["Studio - Stage 1: Script & Storyboard"],
    summary="Generate Video Metadata & SEO (Small API 1.5)",
    description=(
        "Unified Video Metadata & SEO Generator: Produces 5 high-CTR titles with psychological angles "
        "and virality scores, engaging descriptions with AI disclosure statements, and categorized hashtags "
        "(trending, niche, growth, ai). Handles both automated Stage 1 pipeline execution and interactive publish UI."
    ),
)
def post_studio_video_metadata(payload: StudioMetadataRequest):
    try:
        return generate_video_metadata(
            category=payload.category,
            topic=payload.topic,
            full_script=payload.fullScript,
            title=payload.title,
            hook=payload.hook,
            quote=payload.quote,
            cta=payload.cta,
            model=payload.model,
        )
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        logger.error(f"[Studio/VideoMetadata] Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ── MAIN STAGE 1 ORCHESTRATOR API ─────────────────────────────────────────────

@router.post(
    "/api/studio/generate-script",
    response_model=StudioScriptResponse,
    tags=["Studio - Stage 1: Script & Storyboard"],
    summary="Generate Studio Script & Storyboard (Stage 1 Orchestrator)",
    operation_id="studio_generate_script",
    description=(
        "Main Stage 1 Orchestrator: Coordinates Small APIs 1.1 through 1.5 sequentially. "
        "Produces viral script content, mobile subtitles, faceless visual storyboard, sound design, and SEO metadata."
    ),
)
def post_studio_generate_script(payload: StudioScriptRequest):
    try:
        return orchestrate_stage1_script(
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
            genre=payload.genre or "motivation",
            genre_preset=payload.genrePreset,
            suggested_3d_provider=payload.suggested3DProvider,
        )
    except Exception as e:
        logger.error(f"[Studio/Stage1] Script generation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate script: {e}",
        )


# ══════════════════════════════════════════════════════════════════════════════
# STAGE 2: DEDICATED SMALL REST APIs
# ══════════════════════════════════════════════════════════════════════════════

@router.post(
    "/api/studio/voice-tts",
    response_model=StudioVoiceTTSResponse,
    tags=["Studio - Stage 2: Voiceover"],
    summary="Synthesize Raw Voice Audio (Small API 2.1)",
    description="Generates broadcast WAV audio using Gemini Neural TTS.",
)
def post_studio_voice_tts(payload: StudioVoiceTTSRequest):
    try:
        return synthesize_voice_audio(
            voice_name=payload.voiceName,
            text=payload.text,
            speech_style=payload.speechStyle,
            target_duration_seconds=payload.targetDurationSeconds,
            model=payload.model,
        )
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        logger.error(f"[Studio/VoiceTTS] Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post(
    "/api/studio/voice-timestamps",
    response_model=StudioVoiceTimestampsResponse,
    tags=["Studio - Stage 2: Voiceover"],
    summary="Extract Word Timestamps (Small API 2.2)",
    description="Extracts word-level start/end timestamps and flags vocal emphasis.",
)
def post_studio_voice_timestamps(payload: StudioVoiceTimestampsRequest):
    try:
        timestamps = extract_word_timestamps(
            text=payload.text,
            duration_seconds=payload.durationSeconds,
            audio_url=payload.audioUrl,
        )
        return {
            "success": True,
            "totalWords": len(timestamps),
            "wordTimestamps": timestamps,
        }
    except Exception as e:
        logger.error(f"[Studio/VoiceTimestamps] Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post(
    "/api/studio/voice-align-timeline",
    response_model=StudioVoiceAlignResponse,
    tags=["Studio - Stage 2: Voiceover"],
    summary="Align Timeline to Voice Audio (Small API 2.3)",
    description="Locks subtitle cuts and scene start/end durations to actual spoken audio boundaries.",
)
def post_studio_voice_align_timeline(payload: StudioVoiceAlignRequest):
    try:
        return align_timeline_to_voice(
            subtitles=payload.subtitles,
            scenes=payload.scenes,
            word_timestamps=[t.model_dump() for t in payload.wordTimestamps],
            actual_duration_seconds=payload.actualDurationSeconds,
        )
    except Exception as e:
        logger.error(f"[Studio/VoiceAlign] Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ── MAIN STAGE 2 ORCHESTRATOR API ─────────────────────────────────────────────

@router.post(
    "/api/studio/synthesize-voice",
    response_model=StudioVoiceResponse,
    tags=["Studio - Stage 2: Voiceover"],
    summary="Synthesize Storyboard Voiceover (Stage 2 Orchestrator)",
    operation_id="studio_synthesize_voice",
    description=(
        "Main Stage 2 Orchestrator: Coordinates Small APIs 2.1 through 2.3. "
        "Synthesizes neural broadcast speech, generates word-level timestamps, and locks timeline cuts."
    ),
)
def post_studio_synthesize_voice(payload: StudioVoiceRequest):
    if not payload.voiceName or not payload.voiceName.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="voiceName is required.",
        )
    if not payload.storyboard and not payload.fullNarrationText and not payload.fullScript:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Provide either storyboard[], fullNarrationText, or fullScript.",
        )
    try:
        return orchestrate_stage2_voice(
            voice_name=payload.voiceName,
            storyboard=[s.model_dump() for s in (payload.storyboard or [])],
            full_narration_text=payload.fullNarrationText or payload.fullScript,
            model=payload.model,
            speech_style=payload.speechStyle,
            target_duration_seconds=payload.targetDurationSeconds,
            subtitles=payload.subtitles,
            scenes=payload.scenes,
        )
    except ValueError as ve:
        logger.warning(f"[Studio/Voice] Validation error: {ve}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        logger.error(f"[Studio/Voice] Error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Voice synthesis failed: {e}",
        )


# ══════════════════════════════════════════════════════════════════════════════
# STAGE 3: DEDICATED SMALL REST APIs
# ══════════════════════════════════════════════════════════════════════════════

@router.post(
    "/api/studio/media-resolve-video",
    response_model=StudioMediaResolveVideoResponse,
    tags=["Studio - Stage 3: Media Resolution"],
    summary="Resolve Stock Videos (Small API 3.1)",
    description="Resolves live B-roll footage for each query from Pexels, Pixabay, or Wikimedia.",
)
async def post_studio_media_resolve_video(payload: StudioMediaResolveVideoRequest):
    try:
        results = await resolve_stock_videos(
            queries=payload.queries,
            aspect_ratio=payload.aspectRatio,
        )
        return {"success": True, "results": results}
    except Exception as e:
        logger.error(f"[Studio/MediaResolveVideo] Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post(
    "/api/studio/media-resolve-image",
    response_model=StudioMediaResolveImageResponse,
    tags=["Studio - Stage 3: Media Resolution"],
    summary="Resolve Stock Images / Frames (Small API 3.2)",
    description="Resolves stock photography or AI generated image frames for visual beats.",
)
async def post_studio_media_resolve_image(payload: StudioMediaResolveImageRequest):
    try:
        results = await resolve_stock_images(
            queries=payload.queries,
            aspect_ratio=payload.aspectRatio,
        )
        return {"success": True, "results": results}
    except Exception as e:
        logger.error(f"[Studio/MediaResolveImage] Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post(
    "/api/studio/media-resolve-sfx",
    response_model=StudioMediaResolveSfxResponse,
    tags=["Studio - Stage 3: Media Resolution"],
    summary="Resolve Sound Effects (Small API 3.3)",
    description="Resolves audio SFX cues from the sound design plan.",
)
async def post_studio_media_resolve_sfx(payload: StudioMediaResolveSfxRequest):
    try:
        resolved = await resolve_sound_effects(
            sfx_events=[e.model_dump() for e in payload.sfxEvents]
        )
        return {"success": True, "resolvedEvents": resolved}
    except Exception as e:
        logger.error(f"[Studio/MediaResolveSFX] Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post(
    "/api/studio/media-resolve-music",
    response_model=StudioMediaResolveMusicResponse,
    tags=["Studio - Stage 3: Media Resolution"],
    summary="Resolve Background Music (Small API 3.4)",
    description="Selects and formats background soundtrack matching genre, BPM, and mood.",
)
def post_studio_media_resolve_music(payload: StudioMediaResolveMusicRequest):
    try:
        track = resolve_music_track(
            genre=payload.genre,
            bpm=payload.bpm,
            mood=payload.mood,
        )
        return {"success": True, "track": track}
    except Exception as e:
        logger.error(f"[Studio/MediaResolveMusic] Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ── MAIN STAGE 3 ORCHESTRATOR API ─────────────────────────────────────────────

@router.post(
    "/api/studio/resolve-media",
    response_model=StudioMediaResponse,
    tags=["Studio - Stage 3: Media Resolution"],
    summary="Resolve Storyboard Media (Stage 3 Orchestrator)",
    operation_id="studio_resolve_media",
    description=(
        "Main Stage 3 Orchestrator: Coordinates Small APIs 3.1 through 3.4. "
        "Resolves B-roll video, stock images, sound effects, and background track."
    ),
)
async def post_studio_resolve_media(payload: StudioMediaRequest):
    if not payload.scenes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="scenes list cannot be empty.",
        )
    try:
        return await orchestrate_stage3_media(
            scenes=[s.model_dump() for s in payload.scenes],
            aspect_ratio=payload.aspectRatio,
            sfx_events=[e.model_dump() for e in (payload.sfxEvents or [])],
            backdrop_id=payload.backdropId,
            resolve_background=payload.resolveBackground,
            resolve_images=payload.resolveImages,
        )
    except Exception as e:
        logger.error(f"[Studio/Media] Error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Media resolution failed: {e}",
        )


# ══════════════════════════════════════════════════════════════════════════════
# STAGE 4: DEDICATED SMALL REST APIs
# ══════════════════════════════════════════════════════════════════════════════

@router.post(
    "/api/studio/captions-chunking",
    response_model=StudioCaptionsChunkingResponse,
    tags=["Studio - Stage 4: Captions"],
    summary="Chunk Word Timestamps (Small API 4.1)",
    description="Groups word-level timestamps into mobile safe-zone subtitle lines (3-4 words max).",
)
def post_studio_captions_chunking(payload: StudioCaptionsChunkingRequest):
    try:
        chunks = chunk_subtitles_by_words(
            word_timestamps=payload.wordTimestamps,
            max_words_per_chunk=payload.maxWordsPerChunk,
        )
        return {"success": True, "chunks": chunks}
    except Exception as e:
        logger.error(f"[Studio/CaptionsChunking] Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post(
    "/api/studio/captions-highlighting",
    response_model=StudioCaptionsHighlightingResponse,
    tags=["Studio - Stage 4: Captions"],
    summary="Style Caption Segments & Highlights (Small API 4.2)",
    description="Applies CSS visual presets (sub-hormozi, sub-beast, sub-minimal) and keyword highlights.",
)
def post_studio_captions_highlighting(payload: StudioCaptionsHighlightingRequest):
    try:
        styled = style_caption_segments(
            chunks=payload.chunks,
            style_preset=payload.stylePreset,
            highlight_color=payload.highlightColor,
        )
        return {"success": True, "styledSegments": styled}
    except Exception as e:
        logger.error(f"[Studio/CaptionsHighlighting] Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post(
    "/api/studio/captions-export-srt",
    response_model=StudioCaptionsExportSrtResponse,
    tags=["Studio - Stage 4: Captions"],
    summary="Export SRT Subtitles (Small API 4.3)",
    description="Converts timed caption segments into standard SubRip (.srt) format.",
)
def post_studio_captions_export_srt(payload: StudioCaptionsExportSrtRequest):
    try:
        content = export_captions_srt(payload.segments)
        return {"success": True, "format": "srt", "content": content}
    except Exception as e:
        logger.error(f"[Studio/CaptionsExportSRT] Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post(
    "/api/studio/captions-export-vtt",
    response_model=StudioCaptionsExportVttResponse,
    tags=["Studio - Stage 4: Captions"],
    summary="Export WebVTT Subtitles (Small API 4.4)",
    description="Converts timed caption segments into standard WebVTT (.vtt) format for HTML5 players.",
)
def post_studio_captions_export_vtt(payload: StudioCaptionsExportVttRequest):
    try:
        content = export_captions_vtt(payload.segments)
        return {"success": True, "format": "vtt", "content": content}
    except Exception as e:
        logger.error(f"[Studio/CaptionsExportVTT] Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ── MAIN STAGE 4 ORCHESTRATOR API ─────────────────────────────────────────────

@router.post(
    "/api/studio/generate-captions",
    response_model=StudioCaptionsResponse,
    tags=["Studio - Stage 4: Captions"],
    summary="Generate Word-Timed Captions (Stage 4 Orchestrator)",
    operation_id="studio_generate_captions",
    description=(
        "Main Stage 4 Orchestrator: Coordinates Small APIs 4.1 through 4.4. "
        "Generates scene-aligned, word-level timed captions and exports SRT/VTT formats."
    ),
)
def post_studio_generate_captions(payload: StudioCaptionsRequest):
    if not payload.storyboardScenes and not payload.fullNarrationText:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Provide either storyboardScenes[] or fullNarrationText.",
        )
    try:
        return orchestrate_stage4_captions(
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
