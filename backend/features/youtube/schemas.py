"""
backend/features/youtube/schemas.py
Pydantic schemas and DTOs for YouTube integration & automations.
"""

from typing import Optional, List
from pydantic import BaseModel, Field

# ── 1. Request Models ─────────────────────────────────────────────────────────

class ConnectChannelRequest(BaseModel):
    channelName: Optional[str] = Field(default=None, description="Name of the YouTube channel")
    handle: Optional[str] = Field(default="", description="YouTube @handle or URL")
    niche: Optional[str] = Field(default="Motivational Quotes", description="Channel niche / focus")
    avatarUrl: Optional[str] = Field(default=None, description="Channel Avatar URL")
    bannerUrl: Optional[str] = Field(default=None, description="Channel Banner URL")
    subscribers: Optional[int] = Field(default=0, description="Subscriber count")
    videosUploaded: Optional[int] = Field(default=0, description="Videos count")
    autoResolve: Optional[bool] = Field(default=True, description="Whether to auto-fetch live stats from YouTube")

class LookupChannelRequest(BaseModel):
    query: str = Field(..., min_length=1, description="YouTube @handle, full URL, or Channel ID")

class CorrectChannelRequest(BaseModel):
    channelId: str = Field(..., description="ID of the channel to correct in database")
    query: Optional[str] = Field(default=None, description="New YouTube @handle or URL to correct with")

class PublishVideoRequest(BaseModel):
    title: str = Field(..., min_length=1, description="Video title")
    quote: str = Field(..., min_length=1, description="Script quote text")
    voice: Optional[str] = Field(default="Fenrir", description="Voice profile used")
    visualTheme: Optional[str] = Field(default="Dark Mountain Dawn", description="Visual backdrop theme")
    category: Optional[str] = Field(default="Motivation", description="Category")
    channelId: Optional[str] = Field(default=None, description="Target YouTube Channel ID")
    audioUrl: Optional[str] = Field(default=None, description="Generated voiceover audio URL")
    coverImageUrl: Optional[str] = Field(default=None, description="Visual backdrop cover image URL")

class ExchangeCodeRequest(BaseModel):
    code: str = Field(..., description="Google OAuth authorization code")
    redirectUri: Optional[str] = Field(default="http://127.0.0.1:5173", description="Redirect URI used during authorization")

class ToggleAutomationRequest(BaseModel):
    id: str = Field(..., description="ID of the automation job to toggle")


# ── 2. Response DTOs ──────────────────────────────────────────────────────────

class ChannelResponse(BaseModel):
    id: str
    name: str
    handle: str
    subscribers: int
    videosUploaded: int
    avatarUrl: Optional[str] = None
    bannerUrl: Optional[str] = None
    isAutoUploadEnabled: bool
    scheduleCron: str
    connectedAt: str
    niche: str

class VideoResponse(BaseModel):
    id: str
    title: str
    quote: str
    views: int
    likes: int
    publishedAt: str
    status: str
    duration: str
    channelId: Optional[str] = None
    videoUrl: str
    category: str
    voice: str

class AutomationJobResponse(BaseModel):
    id: str
    theme: str
    schedule: str
    voice: str
    musicTrack: str
    active: bool
    nextRun: str

class ChannelsListResponse(BaseModel):
    success: bool
    channels: List[ChannelResponse]
    videos: List[VideoResponse]

class ConnectChannelResponse(BaseModel):
    success: bool
    channel: ChannelResponse

class PublishVideoResponse(BaseModel):
    success: bool
    video: VideoResponse

class AutomationsListResponse(BaseModel):
    success: bool
    automations: List[AutomationJobResponse]

class LookupChannelResponse(BaseModel):
    success: bool
    channel: dict

class SyncChannelResponse(BaseModel):
    success: bool
    channel: ChannelResponse
    message: str

class ShortsListResponse(BaseModel):
    success: bool
    shorts: List[dict]

