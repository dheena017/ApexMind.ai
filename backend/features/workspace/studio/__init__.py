"""
backend/features/workspace/studio/__init__.py
ApexMind Studio Production Pipeline Package:
- Stage 1: Script & Storyboard Engine (script_service.py)
- Stage 2: Voiceover Synthesis Engine (voice_service.py)
- Stage 3: Media Resolution Engine (media_service.py)
- Stage 4: Word-Timed Captions Engine (captions_service.py)
- Studio Central APIRouter (router.py)
"""

from .captions_service import (
    chunk_subtitles_by_words,
    export_captions_srt,
    export_captions_vtt,
    generate_closed_captions,
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
from .router import router as studio_router
from .script_service import (
    generate_image_scenes,
    generate_metadata,
    generate_script,
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
from .voice_service import (
    align_timeline_to_voice,
    extract_word_timestamps,
    orchestrate_stage2_voice,
    run_studio_voice,
    synthesize_voice_audio,
)

__all__ = [
    "studio_router",
    # Stage 1: Script & Storyboard
    "run_studio_script",
    "orchestrate_stage1_script",
    "generate_script",
    "generate_script_content",
    "generate_script_subtitles",
    "generate_video_scenes",
    "generate_image_scenes",
    "plan_sound_design",
    "generate_video_metadata",
    "generate_metadata",
    "get_available_ai_models",
    "get_script_providers_status",
    # Stage 2: Voiceover Synthesis
    "run_studio_voice",
    "orchestrate_stage2_voice",
    "synthesize_voice_audio",
    "extract_word_timestamps",
    "align_timeline_to_voice",
    # Stage 3: Media Resolution
    "run_studio_media",
    "orchestrate_stage3_media",
    "resolve_stock_videos",
    "resolve_stock_images",
    "resolve_sound_effects",
    "resolve_music_track",
    # Stage 4: Captions Generation
    "run_studio_captions",
    "orchestrate_stage4_captions",
    "chunk_subtitles_by_words",
    "style_caption_segments",
    "export_captions_srt",
    "export_captions_vtt",
    "generate_closed_captions",
]
