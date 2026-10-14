"""
backend/features/youtube/router.py
FastAPI route endpoints for YouTube channel management, live lookups, correction,
publishing, and automations.
"""

import logging
from typing import Optional
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

from backend.database.repository import (
    get_community_posts,
    add_community_post,
    get_channel_by_id,
    update_channel,
)
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
from .youtube_service import (
    get_channel_live_feed,
    fetch_channel_playlists,
    fetch_channel_community_posts,
    get_channel_analytics,
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
        logger.error(f"Error resolving YouTube channel '{payload.query}': {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )

@router.post(
    "/api/youtube/connect",
    response_model=ConnectChannelResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Connect a YouTube channel",
    description="Connects and registers a new YouTube channel, automatically fetching subscriber counts and live avatar."
)
async def post_connect_channel(payload: ConnectChannelRequest):
    try:
        return connect_youtube_channel(
            name=payload.name,
            handle=payload.handle,
            niche=payload.niche,
            avatar_url=payload.avatarUrl,
            subscribers=payload.subscribers or 0,
            videos_uploaded=payload.videosUploaded or 0,
            banner_url=payload.bannerUrl,
            auto_resolve=True,
        )
    except Exception as e:
        logger.error(f"Error connecting YouTube channel: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to connect channel: {str(e)}"
        )

@router.post(
    "/api/youtube/sync",
    response_model=SyncChannelResponse,
    summary="Live sync/correct connected channel",
    description="Synchronizes subscriber counts, live handle, and verified metadata directly from YouTube."
)
async def post_sync_channel(payload: CorrectChannelRequest):
    try:
        return sync_or_correct_channel(payload.channelId, new_query=payload.newHandleOrQuery)
    except Exception as e:
        logger.error(f"Error synchronizing channel '{payload.channelId}': {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )

@router.get(
    "/api/youtube/channels/{channel_id}/shorts",
    response_model=ShortsListResponse,
    summary="Get channel YouTube Shorts",
    description="Fetches published Shorts from the connected YouTube channel."
)
async def get_channel_shorts_route(channel_id: str, limit: Optional[int] = 15):
    try:
        return get_live_channel_shorts(channel_id, limit=limit or 15)
    except Exception as e:
        logger.error(f"Error fetching channel shorts for '{channel_id}': {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve YouTube Shorts."
        )

@router.get(
    "/api/youtube/channels/{channel_id}/live-feed",
    summary="Get full live YouTube feed for channel",
    description="Live scrapes and returns real YouTube videos, shorts, for-you recommendations, and channel stats."
)
async def get_channel_live_feed_route(channel_id: str):
    try:
        return get_channel_live_feed(channel_id)
    except Exception as e:
        logger.error(f"Error fetching live channel feed for '{channel_id}': {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve live channel feed: {str(e)}"
        )

@router.get(
    "/api/youtube/channels/{channel_id}/playlists",
    summary="Get live YouTube playlists",
    description="Live scrapes and returns real published playlists for the channel from YouTube."
)
async def get_channel_playlists_route(channel_id: str):
    try:
        ch = get_channel_by_id(channel_id)
        handle = ch.get("handle") or ch.get("name") if ch else channel_id
        playlists = fetch_channel_playlists(handle)
        return {"success": True, "playlists": playlists}
    except Exception as e:
        logger.error(f"Error fetching channel playlists for '{channel_id}': {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve channel playlists: {str(e)}"
        )

@router.get(
    "/api/youtube/channels/{channel_id}/analytics",
    summary="Get live YouTube channel analytics",
    description="Returns real-time analytics, viewer retention, and growth metrics for the channel."
)
async def get_channel_analytics_route(channel_id: str):
    try:
        return {"success": True, "analytics": get_channel_analytics(channel_id)}
    except Exception as e:
        logger.error(f"Error fetching channel analytics for '{channel_id}': {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve channel analytics: {str(e)}"
        )

class CreateCommunityPostPayload(BaseModel):
    content: str
    channelId: Optional[str] = None
    author: Optional[str] = None
    handle: Optional[str] = None
    avatarUrl: Optional[str] = None

@router.get(
    "/api/youtube/channels/{channel_id}/posts",
    summary="Get channel community posts",
    description="Returns published community posts from database and live YouTube community feed."
)
async def get_channel_community_posts_route(channel_id: str):
    try:
        db_posts = get_community_posts(channel_id)
        ch = get_channel_by_id(channel_id)
        handle = ch.get("handle") or ch.get("name") if ch else channel_id
        live_posts = fetch_channel_community_posts(handle)
        # Merge, deduplicating by ID
        seen_ids = {p["id"] for p in db_posts}
        merged = db_posts + [p for p in live_posts if p["id"] not in seen_ids]
        return {"success": True, "posts": merged}
    except Exception as e:
        logger.error(f"Error fetching channel community posts for '{channel_id}': {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve community posts: {str(e)}"
        )

@router.post(
    "/api/youtube/channels/{channel_id}/posts",
    summary="Publish channel community post",
    description="Stores and publishes a new community post for the channel."
)
async def create_channel_community_post_route(channel_id: str, payload: CreateCommunityPostPayload):
    try:
        ch = get_channel_by_id(channel_id)
        author = payload.author or (ch.get("name") if ch else "Channel Creator")
        handle = payload.handle or (ch.get("handle") if ch else "@channel")
        avatar = payload.avatarUrl or (ch.get("avatar_url") if ch else None)
        new_post = add_community_post(
            content=payload.content,
            channel_id=channel_id,
            author=author,
            handle=handle,
            avatar_url=avatar,
        )
        return {"success": True, "post": new_post}
    except Exception as e:
        logger.error(f"Error publishing community post for '{channel_id}': {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
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
