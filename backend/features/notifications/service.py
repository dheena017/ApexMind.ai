import logging
from typing import Dict, Any, Optional
from .repository import (
    fetch_notifications,
    insert_notification,
    toggle_read,
    delete_single,
    set_all_read,
    delete_all_notifications,
)

logger = logging.getLogger("ApexMind.Notifications")

def list_notifications(
    category: Optional[str] = None,
    unread_only: bool = False,
    limit: Optional[int] = None,
) -> Dict[str, Any]:
    all_notifs = fetch_notifications()
    unread_count = sum(1 for n in all_notifs if not n.get("read"))
    
    # Filtered list
    notifs = fetch_notifications(category=category, unread_only=unread_only, limit=limit)
    logger.info(f"Retrieved {len(notifs)} notifications (Unread: {unread_count}, Filter category: {category}).")
    return {
        "success": True,
        "notifications": notifs,
        "unreadCount": unread_count,
        "totalCount": len(all_notifs),
    }

def create_notification(
    title: str,
    message: str,
    type: str = "info",
    category: str = "system",
    action_url: Optional[str] = None,
    priority: str = "normal",
) -> Dict[str, Any]:
    item = insert_notification(
        title=title,
        message=message,
        type=type,
        category=category,
        action_url=action_url,
        priority=priority,
    )
    logger.info(f"Created notification: '{title}' [{category}/{type}]")
    return {
        "success": True,
        "notification": item,
    }

def toggle_item_read(notif_id: str, read_state: bool = True) -> Dict[str, Any]:
    updated = toggle_read(notif_id, read_state=read_state)
    logger.info(f"Toggled notification read state: id={notif_id}, read={read_state}")
    return {"success": updated}

def delete_single_notification(notif_id: str) -> Dict[str, Any]:
    deleted = delete_single(notif_id)
    logger.info(f"Deleted notification: id={notif_id}")
    return {"success": deleted}

def mark_read(category: Optional[str] = None) -> Dict[str, Any]:
    count = set_all_read(category=category)
    logger.info(f"Executed mark-read for notifications (category={category}, updated={count}).")
    return {"success": True, "affected": count}

def clear_all(category: Optional[str] = None) -> Dict[str, Any]:
    count = delete_all_notifications(category=category)
    logger.info(f"Executed clear for notifications (category={category}, deleted={count}).")
    return {"success": True, "affected": count}


