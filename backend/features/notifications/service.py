import logging
from typing import Dict, Any
from .repository import fetch_notifications, set_all_read, delete_all_notifications

logger = logging.getLogger("ApexMind.Notifications")

def list_notifications() -> Dict[str, Any]:
    notifs = fetch_notifications()
    logger.info(f"Retrieved {len(notifs)} system notifications.")
    return {
        "success": True,
        "notifications": notifs,
    }

def mark_read() -> Dict[str, Any]:
    set_all_read()
    logger.info("Executed bulk mark-read for notifications.")
    return {"success": True}

def clear_all() -> Dict[str, Any]:
    delete_all_notifications()
    logger.info("Executed bulk delete for all notifications.")
    return {"success": True}

