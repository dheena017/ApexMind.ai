"""
backend/features/social/router.py
FastAPI router for Omnichannel Social Fleet Management & Cross-Platform Syndication.
"""

import logging
from typing import Optional, List
from fastapi import APIRouter, HTTPException, status, Query

from .schemas import (
    FleetListResponse,
    OAuthUrlResponse,
    ConnectPlatformRequest,
    DisconnectAccountRequest,
    SyndicatePublishRequest,
    SyndicatePublishResponse,
    PublishedPostsResponse,
)
from .service import (
    get_user_fleet,
    generate_platform_oauth_url,
    syndicate_publish,
)
from backend.database.repository import (
    upsert_social_account,
    delete_social_account,
    get_published_posts,
    get_latest_user,
)

logger = logging.getLogger("ApexMind.features.social")
router = APIRouter(prefix="/api/social", tags=["Omnichannel Social Fleet & Syndication"])


@router.get(
    "/accounts",
    response_model=FleetListResponse,
    summary="List Social Fleet Accounts",
    description="Returns all connected social channels, pages, and profiles across YouTube, Instagram, Facebook, and TikTok.",
)
async def list_fleet_accounts(userId: Optional[str] = None):
    try:
        fleet = get_user_fleet(userId)
        return {
            "success": True,
            "total": len(fleet),
            "accounts": fleet,
        }
    except Exception as e:
        logger.error(f"Error listing social fleet accounts: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch social accounts: {str(e)}"
        )


@router.get(
    "/oauth-url",
    response_model=OAuthUrlResponse,
    summary="Get Social Platform OAuth URL",
    description="Returns authorization consent URL for connecting YouTube, Instagram, Facebook, or TikTok.",
)
async def get_oauth_url(
    platform: str = Query(..., description="'youtube', 'instagram', 'facebook', 'meta', or 'tiktok'"),
    redirectUri: Optional[str] = Query(None, description="Client redirect URI"),
    userId: Optional[str] = Query(None, description="Master account User ID"),
):
    try:
        res = generate_platform_oauth_url(platform, userId, redirectUri)
        return {
            "success": True,
            "platform": res["platform"],
            "oauthUrl": res["oauthUrl"],
            "message": f"Generated OAuth URL for {platform.capitalize()}",
        }
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        logger.error(f"Error generating OAuth URL for {platform}: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post(
    "/connect/{platform}",
    summary="Connect or Mock Social Account",
    description="Connects a platform account to the user's fleet using OAuth tokens or handle details.",
)
async def connect_account(
    platform: str,
    payload: ConnectPlatformRequest,
    userId: Optional[str] = None,
):
    clean_p = platform.lower().strip()
    effective_user_id = userId
    if not effective_user_id:
        latest = get_latest_user()
        effective_user_id = latest["id"] if latest else "usr_global"

    handle_clean = payload.handle or f"creator_{clean_p}"
    name_clean = payload.name or handle_clean.replace("@", "").capitalize()
    avatar_clean = payload.avatarUrl or f"https://api.dicebear.com/7.x/initials/svg?seed={name_clean}"
    platform_acc_id = payload.platformAccountId or f"{clean_p[:2]}_{int(hash(handle_clean)) % 10000000}"

    saved = upsert_social_account(
        user_id=effective_user_id,
        platform=clean_p,
        platform_account_id=platform_acc_id,
        name=name_clean,
        handle=handle_clean if handle_clean.startswith("@") else f"@{handle_clean}",
        avatar_url=avatar_clean,
        access_token=payload.accessToken,
    )

    return {
        "success": True,
        "message": f"Successfully connected {clean_p.capitalize()} account '{name_clean}'!",
        "account": saved,
    }


@router.post(
    "/disconnect",
    summary="Disconnect Social Fleet Account",
    description="Removes a connected social channel/page from the fleet.",
)
async def disconnect_account(payload: DisconnectAccountRequest):
    try:
        deleted = delete_social_account(payload.accountId)
        if not deleted:
            raise HTTPException(status_code=404, detail=f"Account with ID '{payload.accountId}' not found.")
        return {
            "success": True,
            "message": f"Successfully disconnected social account {payload.accountId}.",
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error disconnecting account: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post(
    "/syndicate-publish",
    response_model=SyndicatePublishResponse,
    summary="One-Click Omnichannel Syndication",
    description="Publishes a single generated video to multiple selected social destinations simultaneously in parallel.",
)
async def post_syndicate_publish(payload: SyndicatePublishRequest):
    try:
        res = await syndicate_publish(
            target_account_ids=payload.targetAccountIds,
            video_url=payload.videoUrl,
            title=payload.title,
            description=payload.description or "",
            tags=payload.tags,
            privacy=payload.privacy,
        )
        return res
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        logger.error(f"Syndication publication failure: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Syndication orchestrator failed: {str(e)}"
        )


@router.get(
    "/posts",
    response_model=PublishedPostsResponse,
    summary="List Published Omnichannel Posts",
    description="Retrieves multi-platform published posts and tracking status.",
)
async def list_published_posts(
    userId: Optional[str] = None,
    platform: Optional[str] = None,
    limit: int = 50,
):
    posts = get_published_posts(user_id=userId, platform=platform, limit=limit)
    return {
        "success": True,
        "total": len(posts),
        "posts": posts,
    }

