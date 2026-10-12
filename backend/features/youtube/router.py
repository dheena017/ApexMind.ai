"""
backend/features/youtube/router.py
FastAPI route endpoints for YouTube channel management, live lookups, correction,
publishing, and automations.
"""

from typing import Optional
from google.genai._gaos.types import BaseModel
import logging
from fastapi import APIRouter, HTTPException, status
from .schemas import (
    ConnectChannelRequest,
    LookupChannelRequest,
    CorrectChannelRequest,
    PublishVideoRequest,
    ToggleAutomationRequest,
    ChannelsListResponse,
    ConnectChannelResponse,
    LookupChannelResponse,
    SyncChannelResponse,
    ShortsListResponse,
    PublishVideoResponse,
    AutomationsListResponse,
)
from .service import (
    list_channels_and_videos,
    lookup_youtube_channel,
    connect_youtube_channel,
    sync_or_correct_channel,
    get_live_channel_shorts,
    delete_youtube_channel_route,
    publish_video_to_shorts,
    list_automations,
    toggle_automation,
)

logger = logging.getLogger("ApexMind.features.youtube")
router = APIRouter(tags=["YouTube Studio"])

@router.get(
    "/api/youtube/channels",
    response_model=ChannelsListResponse,
    summary="Get channels and published videos",
    description="Retrieve connected YouTube channels and catalog of published motivational Shorts."
)
async def get_channels_route():
    try:
        return list_channels_and_videos()
    except Exception as e:
        logger.error(f"Error fetching YouTube channels: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve YouTube channels."
        )

@router.post(
    "/api/youtube/lookup",
    response_model=LookupChannelResponse,
    summary="Lookup live YouTube channel",
    description="Resolves and verifies YouTube channel metadata in real-time by handle (@handle), URL, or Channel ID."
)
async def post_lookup_channel(payload: LookupChannelRequest):
    try:
        return lookup_youtube_channel(payload.query)
    except Exception as e:
        logger.warning(f"Error looking up YouTube channel '{payload.query}': {e}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"YouTube channel lookup failed: {str(e)}"
        )

@router.post(
    "/api/youtube/connect",
    response_model=ConnectChannelResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Connect YouTube channel",
    description="Link a new YouTube channel, automatically fetching real subscribers, avatar, and videos if requested."
)
async def post_connect_channel(payload: ConnectChannelRequest):
    try:
        return connect_youtube_channel(
            name=payload.channelName,
            handle=payload.handle or "",
            niche=payload.niche or "Motivational Quotes",
            avatar_url=payload.avatarUrl,
            subscribers=payload.subscribers or 0,
            videos_uploaded=payload.videosUploaded or 0,
            auto_resolve=payload.autoResolve if payload.autoResolve is not None else True,
        )
    except Exception as e:
        logger.error(f"Error connecting YouTube channel: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )

@router.post(
    "/api/youtube/channels/{channel_id}/sync",
    response_model=SyncChannelResponse,
    summary="Sync channel with live YouTube",
    description="Re-fetches current live YouTube metrics (subscribers, avatar, videos) and updates the channel."
)
async def post_sync_channel(channel_id: str):
    try:
        return sync_or_correct_channel(channel_id=channel_id)
    except Exception as e:
        logger.error(f"Error syncing YouTube channel '{channel_id}': {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )

@router.post(
    "/api/youtube/correct",
    response_model=SyncChannelResponse,
    summary="Correct YouTube channel handle/details",
    description="Corrects a connected channel by supplying an updated YouTube handle or URL and re-verifying."
)
async def post_correct_channel(payload: CorrectChannelRequest):
    try:
        return sync_or_correct_channel(channel_id=payload.channelId, new_query=payload.query)
    except Exception as e:
        logger.error(f"Error correcting YouTube channel '{payload.channelId}': {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )

@router.get(
    "/api/youtube/channels/{channel_id}/shorts",
    response_model=ShortsListResponse,
    summary="Get channel live YouTube Shorts",
    description="Fetches live YouTube Shorts published on the specified channel."
)
async def get_channel_shorts_route(channel_id: str, limit: int = 12):
    try:
        return get_live_channel_shorts(channel_id=channel_id, limit=limit)
    except Exception as e:
        logger.error(f"Error fetching channel shorts: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve live shorts."
        )

class UpdateChannelRequest(BaseModel):
    isAutoUploadEnabled: Optional[bool] = None
    scheduleCron: Optional[str] = None
    niche: Optional[str] = None
    name: Optional[str] = None
    handle: Optional[str] = None

@router.patch(
    "/api/youtube/channels/{channel_id}",
    summary="Update channel settings",
    description="Updates auto-upload, schedule, or niche settings for a channel."
)
async def patch_channel_route(channel_id: str, payload: UpdateChannelRequest):
    try:
        from backend.database.repository import update_channel
        updates = {k: v for k, v in payload.dict().items() if v is not None}
        updated = update_channel(channel_id, updates)
        if not updated:
            raise HTTPException(status_code=404, detail="Channel not found")
        return {"success": True, "channel": updated}
    except Exception as e:
        logger.error(f"Error updating channel '{channel_id}': {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )

@router.delete(
    "/api/youtube/channels/{channel_id}",
    summary="Disconnect YouTube channel",
    description="Removes a connected YouTube channel from the studio."
)
async def delete_channel_route(channel_id: str):
    try:
        return delete_youtube_channel_route(channel_id)
    except Exception as e:
        logger.error(f"Error deleting channel '{channel_id}': {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )

@router.post(
    "/api/youtube/publish",
    response_model=PublishVideoResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Publish short to YouTube",
    description="Publish an automated motivational video to YouTube Shorts."
)
async def post_publish_video(payload: PublishVideoRequest):
    try:
        return publish_video_to_shorts(
            title=payload.title,
            quote=payload.quote,
            voice=payload.voice or "Fenrir",
            category=payload.category or "Motivation",
            channel_id=payload.channelId,
        )
    except Exception as e:
        logger.error(f"Error publishing video: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to publish video."
        )

@router.get(
    "/api/automations",
    response_model=AutomationsListResponse,
    summary="Get scheduled automations",
    description="Retrieve all recurring daily cron automation pipelines."
)
async def get_automations_route():
    try:
        return list_automations()
    except Exception as e:
        logger.error(f"Error fetching automations: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve automations."
        )

@router.post(
    "/api/automations/toggle",
    response_model=AutomationsListResponse,
    summary="Toggle automation active state",
    description="Toggle active status of an automated publishing job."
)
async def post_toggle_automation(payload: ToggleAutomationRequest):
    try:
        return toggle_automation(payload.id)
    except Exception as e:
        logger.error(f"Error toggling automation: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
