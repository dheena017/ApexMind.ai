"""
backend/features/social/__init__.py
Social Fleet & Omnichannel Cross-Publishing Feature.
"""

from .router import platform_router as social_platform_router
from .router import router as social_router

__all__ = ["social_router", "social_platform_router"]
