"""
backend/features/notifications/router.py
FastAPI route endpoints for notifications.
"""

import logging
from fastapi import APIRouter, HTTPException, status
from .schemas import NotificationsListResponse, StandardSuccessResponse
from .service import list_notifications, mark_read, clear_all

logger = logging.getLogger("ApexMind.features.notifications")
router = APIRouter(tags=["Notifications"])

@router.get(
    "/api/notifications",
    response_model=NotificationsListResponse,
    summary="Get all notifications",
    description="Retrieve system alerts and activity notifications."
)
async def get_notifications_route():
    try:
        return list_notifications()
    except Exception as e:
        logger.error(f"Error fetching notifications: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve notifications."
        )

@router.post(
    "/api/notifications/mark-read",
    response_model=StandardSuccessResponse,
    summary="Mark all notifications as read"
)
async def post_mark_read():
    try:
        return mark_read()
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
async def delete_notifications_route():
    try:
        return clear_all()
    except Exception as e:
        logger.error(f"Error clearing notifications: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to clear notifications."
        )
