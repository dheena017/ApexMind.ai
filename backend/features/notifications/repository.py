"""
backend/features/notifications/repository.py
SQLite persistence for notifications.
"""

from typing import List, Dict, Any
from backend.database.repository import (
    get_notifications,
    mark_notifications_read,
    clear_notifications,
)

def fetch_notifications() -> List[Dict[str, Any]]:
    return get_notifications()

def set_all_read() -> None:
    mark_notifications_read()

def delete_all_notifications() -> None:
    clear_notifications()
