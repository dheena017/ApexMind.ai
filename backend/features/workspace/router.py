"""
backend/features/workspace/router.py
FastAPI central router for the Workspace feature:
Aggregates and registers all modular workspace sub-packages:
- Studio Production Pipeline (Stage 2: Voice, Stage 3: Media, Stage 4: Captions)
- Text & Typography Service
- Audio, Soundtracks & SFX Service
- Elements & Overlays Service
- Canvas & Frame Studio Service
- Video Stock Service
- Image Stock Service
- Script & AI Engine (Stage 1)
- Automation & Multi-Platform Schedules
- Legacy Workspace Presets & Voiceover Routes
"""

import logging
from typing import Any, Dict, Optional

from fastapi import APIRouter, HTTPException, Query, status

from .schemas import (
    GenerateVoiceoverRequest,
    MediaLibraryResponse,
    VoiceoverResponse,
)
from .service import (
    get_media_library,
    synthesize_voiceover,
)

logger = logging.getLogger("ApexMind.Workspace.Router")
router = APIRouter()


# ── LEGACY & STUDIO PRESETS ENDPOINTS ──────────────────────────────────────────

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
            detail="Text prompt is required.",
        )
    if not payload.voiceName or not payload.voiceName.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Voice name is required. Please select a voice from the workspace.",
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
            detail=f"Failed to generate voiceover: {e}",
        )


@router.get(
    "/api/media-library",
    response_model=MediaLibraryResponse,
    tags=["Presets"],
    summary="Get Built-in Studio Presets",
    description="Returns the Studio's preset catalog (music presets, visual backdrops, and voice profiles).",
)
async def get_media_library_route():
    return get_media_library()


@router.get(
    "/api/media/provider-status",
    tags=["Providers"],
    summary="Check Stock Media Provider Availability",
    operation_id="check_stock_media_provider_availability",
    description="Reports whether supported live stock-media providers are available.",
)
async def get_open_media_providers_route():
    from .image import get_image_providers_status
    from .video import get_video_providers_status

    provider_status: Dict[str, Any] = {}
    provider_status.update(get_video_providers_status())
    provider_status.update(get_image_providers_status())
    return provider_status


# ══════════════════════════════════════════════════════════════════════════════
# WORKSPACE MODULAR SUB-PACKAGES (Unified Aggregation)
# ══════════════════════════════════════════════════════════════════════════════

# 1. Studio Production Pipeline (Voice, Media, Captions)
from .studio import studio_router
router.include_router(studio_router)

# 2. Text & Typography Service
from .text import text_router
router.include_router(text_router)

# 3. Audio, Soundtracks & SFX Service
from .audio import audio_router
router.include_router(audio_router)

# 4. Elements & Overlays Service
from .elements import elements_router
router.include_router(elements_router)

# 5. Canvas & Frame Studio Service
from .canvas import canvas_router
router.include_router(canvas_router)

# 6. Video Stock Service
from .video import video_router
router.include_router(video_router)

# 7. Image Stock Service
from .image import image_router
router.include_router(image_router)

# 8. Script & AI Engine (Stage 1)
from .script_ai import script_ai_router
router.include_router(script_ai_router)

# 9. Automation & Multi-Platform Schedules
from .automation import automation_router
router.include_router(automation_router)
