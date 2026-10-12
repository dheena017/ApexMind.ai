"""
backend/features/youtube/schemas.py
Pydantic schemas and DTOs for YouTube integration & automations.
"""

from typing import Optional, List
from pydantic import BaseModel, Field

# ── 1. Request Models ─────────────────────────────────────────────────────────

class ConnectChannelRequest(BaseModel):
    channelName: str = Field(..., min_length=1, max_length=100, description="Name of the YouTube channel")
    handle: Optional[str] = Field(default="", description="YouTube @handle")
    niche: Optional[str] = Field(default="Motivational Quotes", description="Channel niche / focus")

class PublishVideoRequest(BaseModel):
    title: str = Field(..., min_length=1, description="Video title")
    quote: str = Field(..., min_length=1, description="Script quote text")
    voice: Optional[str] = Field(default="Fenrir", description="Voice profile used")
    visualTheme: Optional[str] = Field(default="Dark Mountain Dawn", description="Visual backdrop theme")
    category: Optional[str] = Field(default="Motivation", description="Category")
    channelId: Optional[str] = Field(default=None, description="Target YouTube Channel ID")

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
    channelId: str
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
