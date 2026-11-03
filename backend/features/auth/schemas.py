"""
backend/features/auth/schemas.py
Pydantic schemas and DTOs for YouTube Channel Authentication and Creator Sessions.
"""

from typing import Optional
from pydantic import BaseModel, Field

class ChannelAuthRequest(BaseModel):
    handle: str = Field(..., description="YouTube channel handle or identifier")
    name: Optional[str] = Field(default=None, description="YouTube channel display name")
    avatarUrl: Optional[str] = Field(default=None, description="YouTube channel avatar URL")
    channelId: Optional[str] = Field(default=None, description="YouTube channel ID")

class UserProfileDTO(BaseModel):
    id: str
    email: str
    name: str
    avatarUrl: str
    provider: str
    verified: bool = True
    lastLoginAt: Optional[str] = None

class AuthResponse(BaseModel):
    success: bool
    user: UserProfileDTO
    token: str
    message: str

class LogoutResponse(BaseModel):
    success: bool
    message: str
