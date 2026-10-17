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
    StandardSuccessResponse,
    NotificationManageRequest,
    NotificationManageResponse,
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

@router.post(
    "/api/notifications/manage",
    response_model=NotificationManageResponse,
    summary="Manage notifications",
    description="Unified endpoint to mark all read, toggle single notification read state, delete a notification, or retrieve unread badge count."
)
async def post_manage_notifications(
    payload: Optional[NotificationManageRequest] = None,
    action: Optional[str] = Query(None, description="Action: mark_read, toggle_read, delete, unread_count"),
    notification_id: Optional[str] = Query(None, description="Notification ID for toggle_read or delete"),
    read: Optional[bool] = Query(None, description="Read state for toggle_read"),
    category: Optional[str] = Query(None, description="Category filter"),
):
    try:
        act = (payload.action if payload and payload.action else action) or "mark_read"
        act_clean = act.lower().replace("-", "_")
        target_id = (payload.notification_id if payload and payload.notification_id else notification_id)
        target_read = (payload.read if payload and payload.read is not None else read)
        if target_read is None:
            target_read = True
        target_category = (payload.category if payload and payload.category else category)
        if target_category == "all":
            target_category = None

        affected = 0
        message = ""

        if act_clean in ("mark_read", "mark_all_read"):
            res = mark_read(category=target_category)
            affected = res.get("affected", 0)
            message = f"Marked {affected} notifications as read."

        elif act_clean in ("toggle_read", "read", "unread"):
            if not target_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="notification_id is required for toggle_read action."
                )
            res = toggle_item_read(notif_id=target_id, read_state=target_read)
            affected = 1 if res.get("success") else 0
            message = f"Notification {target_id} read state set to {target_read}."

        elif act_clean == "delete":
            if not target_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="notification_id is required for delete action."
                )
            res = delete_single_notification(notif_id=target_id)
            affected = 1 if res.get("success") else 0
            message = f"Notification {target_id} deleted."

        elif act_clean in ("count", "unread_count"):
            message = "Unread notifications count retrieved."

        elif act_clean in ("clear_all", "delete_all"):
            res = clear_all(category=target_category)
            affected = res.get("affected", 0)
            message = f"Cleared {affected} notifications."

        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unknown notification action '{act}'."
            )

        unread_data = get_unread_count(category=target_category)
        unread_count = unread_data.get("unreadCount", 0)
        from .repository import fetch_notifications
        all_items = fetch_notifications(category=target_category)

        return {
            "success": True,
            "action": act_clean,
            "affected": affected,
            "count": affected,
            "unreadCount": unread_count,
            "totalCount": len(all_items),
            "message": message,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error managing notifications: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to manage notification state."
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

