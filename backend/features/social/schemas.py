"""
backend/features/social/schemas.py
Pydantic models and DTOs for Omnichannel Social Fleet & Syndication.
"""

from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class SocialAccountDTO(BaseModel):
    id: str
    userId: str
    platform: str  # 'youtube' | 'instagram' | 'facebook'
    platformAccountId: str
    name: str
    handle: str
    avatarUrl: Optional[str] = None
    bannerUrl: Optional[str] = None
    followersCount: int = 0
    postsCount: int = 0
    isActive: bool = True
    isAutoUploadEnabled: bool = True
    scheduleCron: str = "Daily at 08:00 AM EST"
    niche: str = "Motivation"
    connectedAt: str
    updatedAt: str
    hasAccessToken: bool = False
    hasRefreshToken: bool = False
    tokenExpiry: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class FleetListResponse(BaseModel):
    success: bool
    total: int
    accounts: List[SocialAccountDTO]


class OAuthUrlResponse(BaseModel):
    success: bool
    platform: str
    oauthUrl: str
    message: str


class ConnectPlatformRequest(BaseModel):
    code: Optional[str] = None
    accessToken: Optional[str] = None
    redirectUri: Optional[str] = None
    platformAccountId: Optional[str] = None
    handle: Optional[str] = None
    name: Optional[str] = None
    avatarUrl: Optional[str] = None


class DisconnectAccountRequest(BaseModel):
    accountId: str = Field(..., description="Internal social_accounts ID to disconnect")


class SyndicatePublishRequest(BaseModel):
    targetAccountIds: List[str] = Field(..., min_items=1, description="List of social_account IDs to syndicate to")
    videoUrl: str = Field(..., description="Direct public URL or local path to the rendered 9:16 video")
    title: str = Field(..., description="Post title or main hook")
    description: Optional[str] = Field(default="", description="Post caption, hashtags, and description")
    tags: Optional[List[str]] = Field(default_factory=list, description="Relevant category hashtags/tags")
    privacy: str = Field(default="public", description="Publish privacy: 'public' or 'private'")


class PlatformPublishResult(BaseModel):
    platform: str
    accountId: str
    accountName: str
    success: bool
    postId: Optional[str] = None
    url: Optional[str] = None
    status: str
    message: str


class SyndicatePublishResponse(BaseModel):
    success: bool
    totalTargets: int
    successfulCount: int
    failedCount: int
    results: List[PlatformPublishResult]


class PublishedPostDTO(BaseModel):
    id: str
    userId: str
    socialAccountId: str
    platform: str
    videoIdOrUrl: Optional[str] = None
    title: str
    caption: Optional[str] = None
    status: str
    views: int = 0
    likes: int = 0
    commentsCount: int = 0
    errorMessage: Optional[str] = None
    publishedAt: str


class PublishedPostsResponse(BaseModel):
    success: bool
    total: int
    posts: List[PublishedPostDTO]
