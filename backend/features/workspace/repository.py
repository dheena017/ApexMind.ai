"""
backend/features/workspace/repository.py
Database persistence and SQLite queries for workspace media assets.
"""

from typing import Dict, Any
from backend.database.repository import get_media_library


def fetch_media_library() -> Dict[str, Any]:
    """Retrieve media library catalog from SQLite database."""
    return get_media_library()
