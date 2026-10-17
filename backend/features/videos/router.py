"""
backend/features/videos/router.py
FastAPI router for website-created studio videos.
These are exclusively videos generated and edited by ApexMind Studio (NOT YouTube live feed).
"""

import logging
from typing import Optional
from fastapi import APIRouter, HTTPException, status, Query

from backend.database.repository import (
    get_website_videos,
    get_website_video_by_id,
    add_website_video,
    delete_website_video,
    update_website_video,
)
from .schemas import (
    CreateWebsiteVideoRequest,
    UpdateWebsiteVideoRequest,
    WebsiteVideoListResponse,
    WebsiteVideoSchema,
)

logger = logging.getLogger("ApexMind.features.videos")
router = APIRouter(prefix="/api/studio-videos", tags=["Website Studio Videos"])

@router.get(
    "",
    response_model=WebsiteVideoListResponse,
    summary="Get all website-created studio videos",
    description="Retrieve list of videos created and rendered by ApexMind AI Video Studio with cover images and metadata."
)
async def list_website_videos(
    category: Optional[str] = Query(None, description="Filter by category"),
    search: Optional[str] = Query(None, description="Search by title, quote, voice"),
):
    try:
        videos = get_website_videos(category=category, search=search)
        logger.info(f"Retrieved {len(videos)} studio videos (Category: {category or 'all'}, Search: '{search or ''}')")
        return {
            "success": True,
            "videos": videos,
            "total": len(videos),
        }
    except Exception as e:
        logger.error(f"Error fetching website videos: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch website videos: {str(e)}"
        )


@router.post(
    "",
    response_model=WebsiteVideoSchema,
    status_code=status.HTTP_201_CREATED,
    summary="Save a newly created website studio video",
    description="Stores a new video created in the AI Video Studio with cover image and audio track."
)
async def create_website_video_endpoint(payload: CreateWebsiteVideoRequest):
    try:
        data = payload.dict(exclude_unset=True)
        video = add_website_video(data)
        logger.info(f"Saved studio video: '{video.get('title')}' [{video.get('category')}] (ID: {video.get('id')})")
        return video
    except Exception as e:
        logger.error(f"Error saving website video: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create website video: {str(e)}"
        )


@router.get(
    "/{video_id}",
    response_model=WebsiteVideoSchema,
    summary="Get single website studio video details"
)
async def get_website_video_endpoint(video_id: str):
    video = get_website_video_by_id(video_id)
    if not video:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Video '{video_id}' not found."
        )
    logger.info(f"Retrieved studio video details: '{video.get('title')}' (ID: {video_id})")
    return video


@router.patch(
    "/{video_id}",
    response_model=WebsiteVideoSchema,
    summary="Update website studio video details"
)
async def update_website_video_endpoint(video_id: str, payload: UpdateWebsiteVideoRequest):
    updates = payload.dict(exclude_unset=True)
    video = update_website_video(video_id, updates)
    if not video:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Video '{video_id}' not found."
        )
    logger.info(f"Updated studio video: '{video.get('title')}' (ID: {video_id})")
    return video


@router.delete(
    "/{video_id}",
    summary="Delete a website studio video"
)
async def delete_website_video_endpoint(video_id: str):
    deleted = delete_website_video(video_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Video '{video_id}' not found or already deleted."
        )
    logger.info(f"Deleted studio video (ID: {video_id})")
    return {
        "success": True,
        "message": f"Video '{video_id}' deleted successfully."
    }
