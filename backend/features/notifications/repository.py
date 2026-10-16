"""
backend/features/notifications/repository.py
SQLite persistence for notifications.
"""

from typing import List, Dict, Any, Optional
from backend.database.repository import (
    get_notifications,
    get_unread_notification_count,
    add_notification,
    mark_notification_read,
    delete_notification,
    mark_notifications_read,
    clear_notifications,
)

def fetch_notifications(
    category: Optional[str] = None,
    unread_only: bool = False,
    limit: Optional[int] = None,
) -> List[Dict[str, Any]]:
    return get_notifications(category=category, unread_only=unread_only, limit=limit)

def fetch_unread_count(category: Optional[str] = None) -> int:
    return get_unread_notification_count(category=category)

def insert_notification(
    title: str,
    message: str,
    type: str = "info",
    category: str = "system",
    action_url: Optional[str] = None,
    priority: str = "normal",
) -> Dict[str, Any]:
    return add_notification(
        title=title,
        message=message,
        type=type,
        category=category,
        action_url=action_url,
        priority=priority,
    )

def toggle_read(notif_id: str, read_state: bool = True) -> bool:
    return mark_notification_read(notif_id, read_state=read_state)

def delete_single(notif_id: str) -> bool:
    return delete_notification(notif_id)

def set_all_read(category: Optional[str] = None) -> int:
    return mark_notifications_read(category=category)

def delete_all_notifications(category: Optional[str] = None) -> int:
    return clear_notifications(category=category)

