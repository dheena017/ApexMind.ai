"""
backend/features/social/service.py
Omnichannel Social Fleet & Cross-Platform Syndication Service.
Orchestrates parallel publishing, OAuth connections, and post logging across all platforms.
"""

import os
import urllib.parse
import asyncio
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone

from backend.database.repository import (
    get_social_accounts,
    get_social_account_by_id,
    upsert_social_account,
    delete_social_account,
    record_published_post,
    get_published_posts,
    get_latest_user,
    get_channels,
)
from .adapters import get_adapter, ADAPTER_REGISTRY

logger = logging.getLogger("ApexMind.Social.Service")


def get_user_fleet(user_id: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Retrieves all supported connected social channels and pages.
    Automatically ensures that any existing authorized YouTube channels are represented in the fleet.
    """
    effective_user_id = user_id
    if not effective_user_id:
        latest = get_latest_user()
        effective_user_id = latest["id"] if latest else "usr_global"

    accounts = [
        account for account in get_social_accounts(user_id=effective_user_id)
        if account.get("platform") in ADAPTER_REGISTRY
    ]

    # If fleet has no accounts, check if there are legacy connected YouTube channels to auto-mirror
    if not any(a["platform"] == "youtube" for a in accounts):
        try:
            yt_channels = get_channels()
            for ch in yt_channels:
                if ch.get("hasRefreshToken") or ch.get("isOAuthAuthenticated") or ch.get("handle"):
                    mirrored = upsert_social_account(
                        user_id=effective_user_id,
                        platform="youtube",
                        platform_account_id=ch["id"],
                        name=ch["name"],
                        handle=ch["handle"],
                        avatar_url=ch.get("avatarUrl"),
                        banner_url=ch.get("bannerUrl"),
                        followers_count=ch.get("subscribers", 0),
                        posts_count=ch.get("videosUploaded", 0),
                        niche=ch.get("niche", "Motivational Quotes"),
                    )
                    accounts.append(mirrored)
        except Exception as e:
            logger.warning(f"Note during auto-mirroring YouTube channels to social fleet: {e}")

    return accounts


def generate_platform_oauth_url(
    platform: str,
    user_id: Optional[str] = None,
    redirect_uri: Optional[str] = None,
) -> Dict[str, str]:
    """Generates the OAuth consent URL for YouTube or Meta (Instagram/Facebook)."""
    clean_p = platform.lower().strip()
    state = urllib.parse.quote(f"uid={user_id or 'default'}&p={clean_p}&t={int(datetime.now(timezone.utc).timestamp())}")

    if clean_p == "youtube":
        from backend.features.youtube.youtube_live_service import generate_youtube_auth_url
        url = generate_youtube_auth_url(redirect_uri)
        return {"platform": "youtube", "oauthUrl": url}

    elif clean_p in ("meta", "instagram", "facebook"):
        app_id = os.getenv("META_APP_ID") or os.getenv("FACEBOOK_APP_ID") or "109283746581928"
        base_redir = redirect_uri or "http://localhost:5173/auth/callback/meta"
        scopes = "instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement,pages_manage_posts"
        url = (
            f"https://www.facebook.com/v19.0/dialog/oauth?"
            f"client_id={app_id}&redirect_uri={urllib.parse.quote(base_redir)}"
            f"&scope={urllib.parse.quote(scopes)}&response_type=code&state={state}"
        )
        return {"platform": clean_p, "oauthUrl": url}

    else:
        raise ValueError(f"OAuth URL generation not supported for platform: {platform}")


async def publish_to_single_destination(
    account: Dict[str, Any],
    video_url: str,
    title: str,
    description: str,
    tags: Optional[List[str]] = None,
    privacy: str = "public",
) -> Dict[str, Any]:
    """Publishes to an individual platform adapter and records the result."""
    platform = account["platform"]
    acc_id = account["id"]
    acc_name = account.get("name", "Account")

    try:
        adapter = get_adapter(platform)
        res = await adapter.publish_video(
            account=account,
            video_path_or_url=video_url,
            title=title,
            description=description,
            tags=tags,
            privacy=privacy,
        )

        success = res.get("success", False)
        post_id = res.get("postId")
        url = res.get("url")
        status = res.get("status", "published" if success else "failed")
        msg = res.get("message", "Published successfully" if success else "Publish failed")

        # Record publication in database
        record_published_post(
            user_id=account.get("userId", "usr_global"),
            social_account_id=acc_id,
            platform=platform,
            video_id_or_url=url or post_id,
            title=title,
            caption=description,
            status=status,
            error_message=None if success else msg,
        )

        return {
            "platform": platform,
            "accountId": acc_id,
            "accountName": acc_name,
            "success": success,
            "postId": post_id,
            "url": url,
            "status": status,
            "message": msg,
        }

    except Exception as e:
        logger.error(f"Syndication failure for {platform} account {acc_id}: {e}")
        record_published_post(
            user_id=account.get("userId", "usr_global"),
            social_account_id=acc_id,
            platform=platform,
            video_id_or_url=None,
            title=title,
            caption=description,
            status="failed",
            error_message=str(e),
        )
        return {
            "platform": platform,
            "accountId": acc_id,
            "accountName": acc_name,
            "success": False,
            "postId": None,
            "url": None,
            "status": "failed",
            "message": f"{platform.capitalize()} error: {str(e)}",
        }


async def syndicate_publish(
    target_account_ids: List[str],
    video_url: str,
    title: str,
    description: str,
    tags: Optional[List[str]] = None,
    privacy: str = "public",
) -> Dict[str, Any]:
    """
    Executes parallel multi-platform syndication across all selected fleet destinations.
    """
    if not target_account_ids:
        raise ValueError("At least one target social destination must be selected.")

    # 1. Resolve all target account models
    accounts_to_publish: List[Dict[str, Any]] = []
    for acc_id in target_account_ids:
        acc = get_social_account_by_id(acc_id)
        if acc:
            accounts_to_publish.append(acc)
        else:
            logger.warning(f"Could not find social account with ID: {acc_id}")

    if not accounts_to_publish:
        raise ValueError("None of the specified social accounts were found in your fleet.")

    logger.info(f"Starting Omnichannel Syndication for '{title}' across {len(accounts_to_publish)} destinations...")

    # 2. Dispatch all publications in parallel
    tasks = [
        publish_to_single_destination(
            account=acc,
            video_url=video_url,
            title=title,
            description=description,
            tags=tags,
            privacy=privacy,
        )
        for acc in accounts_to_publish
    ]

    results = await asyncio.gather(*tasks, return_exceptions=False)

    successful = sum(1 for r in results if r["success"])
    failed = len(results) - successful

    logger.info(f"Syndication completed: {successful} succeeded, {failed} failed.")

    return {
        "success": successful > 0,
        "totalTargets": len(results),
        "successfulCount": successful,
        "failedCount": failed,
        "results": results,
    }
