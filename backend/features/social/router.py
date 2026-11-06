"""
backend/features/social/router.py
FastAPI router for Omnichannel Social Fleet Management & Cross-Platform Syndication.
"""

import logging
from typing import Optional
from fastapi import APIRouter, HTTPException, status, Query, Header

from .schemas import (
    MetaOAuthCallbackRequest,
    MetaOAuthCallbackResponse,
    DisconnectAccountRequest,
    SyndicatePublishRequest,
    SyndicatePublishResponse,
    PublishedPostsResponse,
)
from .service import get_user_fleet, generate_platform_oauth_url, complete_meta_social_oauth, syndicate_publish
from .adapters import ADAPTER_REGISTRY
from backend.database.repository import (
    delete_social_account,
    get_published_posts,
)
from backend.features.auth.service import get_session_user_id

logger = logging.getLogger("ApexMind.features.social")
router = APIRouter(prefix="/api/social")
platform_router = APIRouter(tags=["Social"])


def _require_session_user_id(authorization: Optional[str]) -> str:
    scheme, _, token = (authorization or "").partition(" ")
    user_id = get_session_user_id(token) if scheme.lower() == "bearer" and token else None
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="A valid authenticated session is required.",
        )
    return user_id


async def _get_platform_status(platform: str, authorization: Optional[str]):
    try:
        user_id = _require_session_user_id(authorization)
        accounts = [
            account for account in get_user_fleet(user_id)
            if account.get("platform") == platform
        ]
        return {
            "success": True,
            "platform": platform,
            "connected": bool(accounts),
            "total": len(accounts),
            "accounts": accounts,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error loading %s account status", platform)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to load {platform} account status: {str(e)}",
        )


async def _get_platform_connect_url(
    platform: str,
    redirect_uri: Optional[str],
    authorization: Optional[str],
):
    try:
        user_id = _require_session_user_id(authorization)
        result = generate_platform_oauth_url(platform, user_id, redirect_uri)
        return {
            "success": True,
            "platform": result["platform"],
            "oauthUrl": result["oauthUrl"],
            "message": f"Generated OAuth URL for {platform.capitalize()}",
        }
    except HTTPException:
        raise
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    except Exception as exc:
        logger.exception("Error generating OAuth URL for %s", platform)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc))


@platform_router.get(
    "/api/facebook/status",
    summary="Get Facebook Connection Status",
)
async def get_facebook_status(authorization: Optional[str] = Header(None)):
    return await _get_platform_status("facebook", authorization)


@platform_router.get(
    "/api/instagram/status",
    summary="Get Instagram Connection Status",
)
async def get_instagram_status(authorization: Optional[str] = Header(None)):
    return await _get_platform_status("instagram", authorization)


@platform_router.get(
    "/api/facebook/connect",
    summary="Start Facebook Connection",
)
async def get_facebook_connect_url(
    redirect_uri: Optional[str] = Query(None, alias="redirectUri"),
    authorization: Optional[str] = Header(None),
):
    return await _get_platform_connect_url("facebook", redirect_uri, authorization)


@platform_router.get(
    "/api/instagram/connect",
    summary="Start Instagram Connection",
)
async def get_instagram_connect_url(
    redirect_uri: Optional[str] = Query(None, alias="redirectUri"),
    authorization: Optional[str] = Header(None),
):
    return await _get_platform_connect_url("instagram", redirect_uri, authorization)


@router.post(
    "/meta/oauth-callback",
    response_model=MetaOAuthCallbackResponse,
    tags=["Social"],
    summary="Complete Facebook or Instagram Account OAuth",
    description="Validates the signed provider state and connects managed Facebook Pages or an Instagram professional account.",
)
async def complete_meta_oauth(payload: MetaOAuthCallbackRequest):
    try:
        result = await complete_meta_social_oauth(payload.code, payload.state)
        return {"success": True, **result}
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    except Exception:
        logger.exception("Error completing Meta social connection")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to connect Meta destination.")


async def _disconnect_platform_account(
    platform: str,
    payload: DisconnectAccountRequest,
    authorization: Optional[str] = Header(None),
):
    try:
        user_id = _require_session_user_id(authorization)
        account = next(
            (
                item for item in get_user_fleet(user_id)
                if item.get("id") == payload.accountId
                and item.get("platform") == platform
            ),
            None,
        )
        if not account:
            raise HTTPException(
                status_code=404,
                detail=f"{platform.capitalize()} account with ID '{payload.accountId}' not found.",
            )
        deleted = delete_social_account(payload.accountId, user_id=user_id)
        if not deleted:
            raise HTTPException(status_code=404, detail=f"{platform.capitalize()} account was not found.")
        return {
            "success": True,
            "message": f"Successfully disconnected {platform.capitalize()} account {payload.accountId}.",
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error disconnecting %s account", platform)
        raise HTTPException(status_code=500, detail=f"Failed to disconnect {platform} account: {str(e)}")


@platform_router.post(
    "/api/facebook/disconnect",
    summary="Disconnect Facebook Account",
)
async def disconnect_facebook_account(
    payload: DisconnectAccountRequest,
    authorization: Optional[str] = Header(None),
):
    return await _disconnect_platform_account("facebook", payload, authorization)


@platform_router.post(
    "/api/instagram/disconnect",
    summary="Disconnect Instagram Account",
)
async def disconnect_instagram_account(
    payload: DisconnectAccountRequest,
    authorization: Optional[str] = Header(None),
):
    return await _disconnect_platform_account("instagram", payload, authorization)


@router.post(
    "/syndicate-publish",
    response_model=SyndicatePublishResponse,
    tags=["Social"],
    summary="One-Click Omnichannel Syndication",
    description="Publishes a single generated video to multiple selected social destinations simultaneously in parallel.",
)
async def post_syndicate_publish(
    payload: SyndicatePublishRequest,
    authorization: Optional[str] = Header(None),
):
    try:
        user_id = _require_session_user_id(authorization)
        res = await syndicate_publish(
            user_id=user_id,
            target_account_ids=payload.targetAccountIds,
            video_url=payload.videoUrl,
            title=payload.title,
            description=payload.description or "",
            tags=payload.tags,
            privacy=payload.privacy,
        )
        return res
    except HTTPException:
        raise
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
    tags=["Social"],
    summary="List Published Omnichannel Posts",
    description="Retrieves multi-platform published posts and tracking status.",
)
async def list_published_posts(
    authorization: Optional[str] = Header(None),
    platform: Optional[str] = None,
    limit: int = 50,
):
    user_id = _require_session_user_id(authorization)
    posts = [
        post for post in get_published_posts(user_id=user_id, platform=platform, limit=limit)
        if post.get("platform") in ADAPTER_REGISTRY
    ]
    return {
        "success": True,
        "total": len(posts),
        "posts": posts,
    }
