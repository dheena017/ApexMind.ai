"""
backend/features/notifications/schemas.py
Pydantic schemas and DTOs for notifications.
"""

from typing import List
from pydantic import BaseModel

class NotificationItem(BaseModel):
    id: str
    title: str
    message: str
    timestamp: str
    read: bool
    type: str

class NotificationsListResponse(BaseModel):
    success: bool
    notifications: List[NotificationItem]

class StandardSuccessResponse(BaseModel):
    success: bool
