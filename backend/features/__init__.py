"""
backend/features/__init__.py
Exports feature routers.
"""

try:
    from .auth import auth_router
except ImportError:
    auth_router = None

try:
    from .dashboard import dashboard_router
except ImportError:
    dashboard_router = None

try:
    from .notifications import router as notifications_router
except ImportError:
    notifications_router = None

try:
    from .settings import router as settings_router
except ImportError:
    settings_router = None

try:
    from .social import social_platform_router, social_router
except ImportError:
    social_platform_router = None
    social_router = None

try:
    from .videos import videos_router
except ImportError:
    videos_router = None

try:
    from .workspace import router as workspace_router
except ImportError:
    workspace_router = None

try:
    from .youtube import router as youtube_router
except ImportError:
    youtube_router = None

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
