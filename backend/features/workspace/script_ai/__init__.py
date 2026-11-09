"""
backend/features/workspace/script_ai/__init__.py
Central workspace AI script & metadata package.
Exports storyboard script generation, viral metadata creation, AI models discovery,
and the script_ai APIRouter.
"""

from .router import router as script_ai_router
from .service import (
    generate_metadata,
    generate_script,
    get_available_ai_models,
    get_script_providers_status,
    run_studio_script,
)

__all__ = [
    "script_ai_router",
    "run_studio_script",
    "generate_script",
    "generate_metadata",
    "get_available_ai_models",
    "get_script_providers_status",
]

