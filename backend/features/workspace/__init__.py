"""
backend/features/workspace/__init__.py
"""

try:
    from .router import router
except ImportError:
    router = None

__all__ = ["router"]
