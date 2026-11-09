"""
backend/features/workspace/router.py
FastAPI central router for the Workspace feature:
Aggregates and registers all modular workspace sub-packages:
- Studio Production Pipeline (Stage 1: Script, Stage 2: Voice, Stage 3: Media, Stage 4: Captions)
- Text & Typography Service
- Audio, Soundtracks & SFX Service
- Elements & Overlays Service
- Canvas & Frame Studio Service
- Video Stock Service
- Image Stock Service
- Automation & Multi-Platform Schedules
- Workspace Presets & Media Library Routes
"""

import logging
from typing import Any, Dict, Optional

from fastapi import APIRouter, HTTPException, Query, status

from .schemas import (
    GenerateVoiceoverRequest,
    VoiceoverResponse,
)
from .service import (
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


# ══════════════════════════════════════════════════════════════════════════════
# WORKSPACE MODULAR SUB-PACKAGES (Unified Aggregation)
# ══════════════════════════════════════════════════════════════════════════════

# 1. Studio Production Pipeline (Stage 1: Script, Stage 2: Voice, Stage 3: Media, Stage 4: Captions)
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

# 8. Automation & Multi-Platform Schedules
from .automation import automation_router
router.include_router(automation_router)

# 9. 3D Visuals, Models & CGI Studio Service
from .visuals_3d import visuals_3d_router
router.include_router(visuals_3d_router)

