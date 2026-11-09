"""
backend/features/workspace/studio/__init__.py
ApexMind Studio Production Pipeline Package:
- Stage 2: Voiceover Synthesis (run_studio_voice)
- Stage 3: Media Resolution (run_studio_media)
- Stage 4: Word-Timed Captions Alignment (run_studio_captions)
- Studio APIRouter (studio_router)
"""

from .captions_service import generate_closed_captions, run_studio_captions
from .media_service import run_studio_media
from .router import router as studio_router
from .voice_service import run_studio_voice

__all__ = [
    "studio_router",
    "run_studio_voice",
    "run_studio_media",
    "run_studio_captions",
    "generate_closed_captions",
]

