"""
backend/features/auth/schemas.py
Pydantic schemas and DTOs for User Authentication (Email/Password & Google Sign-In)
and Multi-Channel Creator Sessions.
"""

from typing import Optional
from pydantic import BaseModel, Field


class ChannelAuthRequest(BaseModel):
    handle: str = Field(..., description="YouTube channel handle or identifier")
    name: Optional[str] = Field(default=None, description="YouTube channel display name")
    avatarUrl: Optional[str] = Field(default=None, description="YouTube channel avatar URL")
    channelId: Optional[str] = Field(default=None, description="YouTube channel ID")


class UserRegisterRequest(BaseModel):
    email: str = Field(..., description="Creator's valid email address")
    password: str = Field(..., min_length=6, description="Account password (min 6 characters)")
    name: str = Field(..., min_length=2, description="Creator's display or full name")


class UserLoginRequest(BaseModel):
    email: str = Field(..., description="Registered email address")
    password: str = Field(..., description="Account password")


class GoogleAuthRequest(BaseModel):
    credentialToken: Optional[str] = Field(default=None, description="Google Identity Services (GIS) ID Token (JWT)")
    email: Optional[str] = Field(default=None, description="Google verified email")
    name: Optional[str] = Field(default=None, description="Google account display name")
    avatarUrl: Optional[str] = Field(default=None, description="Google profile picture URL")
    googleId: Optional[str] = Field(default=None, description="Google Account ID")


class MetaOAuthCallbackRequest(BaseModel):
    code: str = Field(..., min_length=1, description="One-time authorization code returned by Meta")
    state: str = Field(..., min_length=1, description="Signed OAuth state returned by the authorization endpoint")


class MetaOAuthStartResponse(BaseModel):
    authorizationUrl: str
    state: str


class UserProfileDTO(BaseModel):
    id: str
    email: str
    name: str
    avatarUrl: str
    provider: str
    verified: bool = True
    activeChannelId: Optional[str] = None
    channelsCount: int = 0
    lastLoginAt: Optional[str] = None


class AuthResponse(BaseModel):
    success: bool
    user: UserProfileDTO
    token: str
    message: str


class LogoutResponse(BaseModel):
    success: bool
    message: str
