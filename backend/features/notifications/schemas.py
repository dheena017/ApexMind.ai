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
    count: Optional[int] = None
    unreadCount: Optional[int] = 0

class NotificationManageRequest(BaseModel):
    action: Optional[str] = "mark_read"
    notification_id: Optional[str] = None
    read: Optional[bool] = True
    category: Optional[str] = None

class NotificationManageResponse(BaseModel):
    success: bool = True
    action: str = "mark_read"
    affected: int = 0
    count: int = 0
    unreadCount: int = 0
    totalCount: int = 0
    message: Optional[str] = None


