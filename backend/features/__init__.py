"""
backend/features/__init__.py
Exports feature routers.
"""

from .auth import auth_router
from .dashboard import dashboard_router
from .notifications import router as notifications_router
from .settings import router as settings_router
from .social import social_platform_router, social_router
from .videos import videos_router
from .workspace import router as workspace_router
from .youtube import router as youtube_router

__all__ = [
    "workspace_router",
    "youtube_router",
    "notifications_router",
    "auth_router",
    "settings_router",
    "videos_router",
    "dashboard_router",
    "social_router",
    "social_platform_router",
]
