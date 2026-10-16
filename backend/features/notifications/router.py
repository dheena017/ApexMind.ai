"""
backend/features/notifications/router.py
FastAPI route endpoints for notifications.
"""

import logging
from typing import Optional
from fastapi import APIRouter, HTTPException, Query, status
from .schemas import (
    NotificationsListResponse,
    NotificationResponse,
    NotificationCreateRequest,
    NotificationToggleReadRequest,
    StandardSuccessResponse,
    NotificationUnreadCountResponse,
)
from .service import (
    list_notifications,
    get_unread_count,
    create_notification,
    toggle_item_read,
    delete_single_notification,
    mark_read,
    clear_all,
)

logger = logging.getLogger("ApexMind.features.notifications")
router = APIRouter(tags=["Notifications"])

@router.get(
    "/api/notifications/unread-count",
    response_model=NotificationUnreadCountResponse,
    summary="Get unread notifications count",
    description="Retrieve only the unread notifications count for badge polling."
)
async def get_unread_count_route(
    category: Optional[str] = Query(None, description="Optional category filter"),
):
    try:
        return get_unread_count(category=category)
    except Exception as e:
        logger.error(f"Error fetching unread notification count: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve unread notification count."
        )

@router.get(
    "/api/notifications",
    response_model=NotificationsListResponse,
    summary="Get notifications",
    description="Retrieve system alerts and activity notifications with optional category filtering."
)
async def get_notifications_route(
    category: Optional[str] = Query(None, description="Category filter (youtube, studio, achievements, system, or all)"),
    unread_only: bool = Query(False, description="Whether to filter by unread only"),
    limit: Optional[int] = Query(None, description="Maximum number of items to return"),
):
    try:
        return list_notifications(category=category, unread_only=unread_only, limit=limit)
    except Exception as e:
        logger.error(f"Error fetching notifications: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve notifications."
        )

@router.post(
    "/api/notifications",
    response_model=NotificationResponse,
    summary="Create a notification",
    description="Dispatch a new notification alert."
)
async def post_notification_route(payload: NotificationCreateRequest):
    try:
        return create_notification(
            title=payload.title,
            message=payload.message,
            type=payload.type or "info",
            category=payload.category or "system",
            action_url=payload.action_url,
            priority=payload.priority or "normal",
        )
    except Exception as e:
        logger.error(f"Error creating notification: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create notification."
        )

@router.patch(
    "/api/notifications/{notification_id}/read",
    response_model=StandardSuccessResponse,
    summary="Toggle single notification read state"
)
async def patch_notification_read(
    notification_id: str,
    payload: NotificationToggleReadRequest = NotificationToggleReadRequest(read=True),
):
    try:
        res = toggle_item_read(notif_id=notification_id, read_state=payload.read)
        return {"success": res["success"], "message": f"Updated notification {notification_id}"}
    except Exception as e:
        logger.error(f"Error toggling notification {notification_id} read state: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update notification."
        )

@router.delete(
    "/api/notifications/{notification_id}",
    response_model=StandardSuccessResponse,
    summary="Delete single notification"
)
async def delete_single_notification_route(notification_id: str):
    try:
        res = delete_single_notification(notif_id=notification_id)
        return {"success": res["success"], "message": f"Deleted notification {notification_id}"}
    except Exception as e:
        logger.error(f"Error deleting notification {notification_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete notification."
        )

@router.post(
    "/api/notifications/mark-read",
    response_model=StandardSuccessResponse,
    summary="Mark notifications as read"
)
async def post_mark_read(
    category: Optional[str] = Query(None, description="Optional category to mark as read"),
):
    try:
        res = mark_read(category=category)
        return {"success": True, "affected": res.get("affected")}
    except Exception as e:
        logger.error(f"Error marking notifications read: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to mark notifications read."
        )

@router.delete(
    "/api/notifications",
    response_model=StandardSuccessResponse,
    summary="Clear all notifications"
)
async def delete_notifications_route(
    category: Optional[str] = Query(None, description="Optional category to clear"),
):
    try:
        res = clear_all(category=category)
        return {"success": True, "affected": res.get("affected")}
    except Exception as e:
        logger.error(f"Error clearing notifications: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to clear notifications."
        )

