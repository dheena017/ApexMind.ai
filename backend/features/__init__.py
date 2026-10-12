"""
backend/features/__init__.py
Exports feature routers matching frontend modules exactly.
"""

from .workspace import router as workspace_router
from .youtube import router as youtube_router
from .notifications import router as notifications_router
from .dashboard import router as dashboard_router
from .auth import auth_router

__all__ = [
    "workspace_router",
    "youtube_router",
    "notifications_router",
    "dashboard_router",
    "auth_router",
]
