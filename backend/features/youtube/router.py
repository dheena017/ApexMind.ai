"""
backend/features/youtube/router.py
FastAPI route endpoints for YouTube channel management, publishing, and automations.
"""

import logging
from fastapi import APIRouter, HTTPException, status
from .schemas import (
    ConnectChannelRequest,
    PublishVideoRequest,
    ToggleAutomationRequest,
    ChannelsListResponse,
    ConnectChannelResponse,
    PublishVideoResponse,
    AutomationsListResponse,
)
from .service import (
    list_channels_and_videos,
    connect_youtube_channel,
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
    "/api/youtube/connect",
    response_model=ConnectChannelResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Connect YouTube channel",
    description="Link a new YouTube channel with automatic scheduling settings."
)
async def post_connect_channel(payload: ConnectChannelRequest):
    try:
        return connect_youtube_channel(
            name=payload.channelName,
            handle=payload.handle or "",
            niche=payload.niche or "Motivational Quotes",
        )
    except Exception as e:
        logger.error(f"Error connecting YouTube channel: {e}")
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
