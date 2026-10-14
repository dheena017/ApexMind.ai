"""
backend/features/youtube/schemas.py
Pydantic schemas and DTOs for YouTube live integration, SEO, analytics, and mutation endpoints.
"""

from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


# ── 1. Query & Mutation Request Models ───────────────────────────────────────

class LookupChannelRequest(BaseModel):
    query: str = Field(..., min_length=1, description="YouTube @handle, full URL, or Channel ID")


class UpdateVideoRequest(BaseModel):
    videoId: str = Field(..., description="ID of the video on YouTube")
    title: Optional[str] = Field(default=None, description="New video title")
    description: Optional[str] = Field(default=None, description="New video description")
    tags: Optional[List[str]] = Field(default=None, description="Updated tags")
    privacyStatus: Optional[str] = Field(default="public", description="public, unlisted, private")


class DeleteVideoRequest(BaseModel):
    videoId: str = Field(..., description="ID of the video to delete from YouTube")


class CreatePlaylistRequest(BaseModel):
    title: str = Field(..., min_length=1, description="Playlist title")
    description: Optional[str] = Field(default="", description="Playlist description")
    privacyStatus: Optional[str] = Field(default="public", description="public, unlisted, private")


class UpdatePlaylistRequest(BaseModel):
    playlistId: str = Field(..., description="Playlist ID")
    title: Optional[str] = Field(default=None, description="Updated title")
    description: Optional[str] = Field(default=None, description="Updated description")
    privacyStatus: Optional[str] = Field(default=None, description="Updated privacy")


class DeletePlaylistRequest(BaseModel):
    playlistId: str = Field(..., description="ID of the playlist to delete")


class AddPlaylistItemRequest(BaseModel):
    playlistId: str = Field(..., description="Target playlist ID")
    videoId: str = Field(..., description="Video ID to append to playlist")


class ReplyCommentRequest(BaseModel):
    videoId: str = Field(..., description="Video ID")
    text: str = Field(..., min_length=1, description="Comment text or reply")
    parentId: Optional[str] = Field(default=None, description="Parent comment ID if replying")


# ── 2. Backwards-compatible Legacy Request Models ─────────────────────────────

class ConnectChannelRequest(BaseModel):
    channelName: Optional[str] = Field(default=None)
    handle: Optional[str] = Field(default="")
    niche: Optional[str] = Field(default="Motivational Quotes")
    avatarUrl: Optional[str] = Field(default=None)
    bannerUrl: Optional[str] = Field(default=None)
    subscribers: Optional[int] = Field(default=0)
    videosUploaded: Optional[int] = Field(default=0)
    autoResolve: Optional[bool] = Field(default=True)


class CorrectChannelRequest(BaseModel):
    channelId: str = Field(...)
    query: Optional[str] = Field(default=None)


class PublishVideoRequest(BaseModel):
    title: str = Field(..., min_length=1)
    quote: str = Field(..., min_length=1)
    voice: Optional[str] = Field(default="Fenrir")
    visualTheme: Optional[str] = Field(default="Dark Mountain Dawn")
    category: Optional[str] = Field(default="Motivation")
    channelId: Optional[str] = Field(default=None)
    audioUrl: Optional[str] = Field(default=None)
    coverImageUrl: Optional[str] = Field(default=None)


class ToggleAutomationRequest(BaseModel):
    id: str = Field(...)


# ── 3. Response DTOs ──────────────────────────────────────────────────────────

class ChannelDetailsResponse(BaseModel):
    success: bool
    source: str = "youtube-official-live"
    channel: Dict[str, Any]


class ChannelVideosResponse(BaseModel):
    success: bool
    source: str = "youtube-official-live"
    total: int
    videos: List[Dict[str, Any]]


class ChannelShortsResponse(BaseModel):
    success: bool
    source: str = "youtube-official-live"
    total: int
    shorts: List[Dict[str, Any]]


class ChannelPlaylistsResponse(BaseModel):
    success: bool
    source: str = "youtube-official-live"
    playlists: List[Dict[str, Any]]


class ChannelAnalyticsResponse(BaseModel):
    success: bool
    source: str = "youtube-official-live"
    analytics: Dict[str, Any]


class VideoDetailsResponse(BaseModel):
    success: bool
    source: str = "youtube-official-live"
    video: Dict[str, Any]


class VideoCommentsResponse(BaseModel):
    success: bool
    source: str = "youtube-official-live"
    total: int
    comments: List[Dict[str, Any]]


class VideoThumbnailsResponse(BaseModel):
    success: bool
    videoId: str
    thumbnails: Dict[str, str]
    bestAvailable: str


class VideoChaptersResponse(BaseModel):
    success: bool
    videoId: str
    hasChapters: bool
    chapters: List[Dict[str, Any]]


class VideoTranscriptResponse(BaseModel):
    success: bool
    videoId: str
    language: str
    transcript: List[Dict[str, Any]]
    fullText: str


class SeoAutocompleteResponse(BaseModel):
    success: bool
    query: str
    suggestions: List[str]


# Legacy response models for backward compatibility
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
    automations: List[Dict[str, Any]]


class LookupChannelResponse(BaseModel):
    success: bool
    channel: Dict[str, Any]


class SyncChannelResponse(BaseModel):
    success: bool
    channel: ChannelResponse
    message: str


class ShortsListResponse(BaseModel):
    success: bool
    shorts: List[Dict[str, Any]]


class TokenConnectRequest(BaseModel):
    accessToken: str

