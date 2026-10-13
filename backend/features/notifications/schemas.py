"""
backend/features/notifications/schemas.py
Pydantic schemas and DTOs for notifications.
"""

from typing import List, Optional
from pydantic import BaseModel

class NotificationItem(BaseModel):
    id: str
    title: str
    message: str
    timestamp: str
    read: bool
    type: str = "info"
    category: Optional[str] = "system"
    action_url: Optional[str] = None
    priority: Optional[str] = "normal"

class NotificationCreateRequest(BaseModel):
    title: str
    message: str
    type: Optional[str] = "info"
    category: Optional[str] = "system"
    action_url: Optional[str] = None
    priority: Optional[str] = "normal"

class NotificationToggleReadRequest(BaseModel):
    read: bool = True

class NotificationResponse(BaseModel):
    success: bool
    notification: NotificationItem

class NotificationsListResponse(BaseModel):
    success: bool
    notifications: List[NotificationItem]
    unreadCount: int = 0
    totalCount: int = 0

class StandardSuccessResponse(BaseModel):
    success: bool
    message: Optional[str] = None
    affected: Optional[int] = None

