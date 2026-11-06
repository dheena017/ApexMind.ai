"""Pydantic schemas for Google, Facebook, and Instagram creator sign-in."""

from typing import Literal, Optional
from pydantic import BaseModel, Field


class GoogleAuthRequest(BaseModel):
    accessToken: str = Field(..., min_length=1, description="Google OAuth access token")


class FacebookAuthRequest(BaseModel):
    accessToken: str = Field(..., min_length=1, max_length=4096, description="Facebook OAuth access token")


class InstagramAuthStartRequest(BaseModel):
    action: Literal["start"]


class InstagramAuthCallbackRequest(BaseModel):
    action: Literal["callback"]
    code: str = Field(..., min_length=1, description="One-time authorization code returned by the provider")
    state: str = Field(..., min_length=1, description="Signed OAuth state returned by the authorization endpoint")


class OAuthAuthorizationResponse(BaseModel):
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
