"""
backend/features/social/service.py
Omnichannel Social Fleet & Cross-Platform Syndication Service.
Orchestrates parallel publishing, OAuth connections, and post logging across all platforms.
"""

import urllib.parse
import asyncio
import logging
import binascii
import base64
import hashlib
import hmac
import json
import secrets
import time
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone

import httpx

from backend.shared.config import settings
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
META_GRAPH_VERSION = "v27.0"
META_SCOPES = {
    "facebook": "pages_show_list,pages_read_engagement,pages_manage_posts",
    "instagram": "pages_show_list,pages_read_engagement,instagram_basic,instagram_content_publish",
}


def _create_meta_social_state(platform: str, user_id: Optional[str]) -> str:
    payload = {
        "platform": platform,
        "user_id": user_id,
        "timestamp": int(time.time()),
        "nonce": secrets.token_urlsafe(24),
    }
    encoded = base64.urlsafe_b64encode(
        json.dumps(payload, separators=(",", ":")).encode("utf-8")
    ).decode("ascii").rstrip("=")
    signature = hmac.new(
        settings.JWT_SECRET_KEY.encode("utf-8"),
        encoded.encode("ascii"),
        hashlib.sha256,
    ).hexdigest()
    return f"{encoded}.{signature}"


def _validate_meta_social_state(state: str) -> Dict[str, Any]:
    try:
        encoded, supplied_signature = state.split(".", 1)
        expected_signature = hmac.new(
            settings.JWT_SECRET_KEY.encode("utf-8"),
            encoded.encode("ascii"),
            hashlib.sha256,
        ).hexdigest()
        if not hmac.compare_digest(supplied_signature, expected_signature):
            raise ValueError
        payload = json.loads(
            base64.urlsafe_b64decode(encoded + "=" * (-len(encoded) % 4))
        )
        if not isinstance(payload, dict):
            raise ValueError
        state_age = int(time.time()) - int(payload["timestamp"])
        if (
            payload.get("platform") not in ("facebook", "instagram")
            or state_age < 0
            or state_age > 600
        ):
            raise ValueError
        return payload
    except (ValueError, KeyError, TypeError, UnicodeError, binascii.Error) as exc:
        raise ValueError("Meta authorization state is invalid or expired. Please try again.") from exc


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

    try:
        # Keep each connected YouTube channel in the fleet, even when other
        # YouTube accounts already exist.
        fleet_channel_ids = {
            account.get("platformAccountId")
            for account in accounts
            if account.get("platform") == "youtube"
        }
        for ch in get_channels():
            if ch["id"] in fleet_channel_ids:
                continue
            mirrored = upsert_social_account(
                user_id=effective_user_id,
                platform="youtube",
                platform_account_id=ch["id"],
                name=ch["name"],
                handle=ch["handle"],
                avatar_url=ch.get("avatarUrl"),
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

    if clean_p == "youtube":
        from backend.features.youtube.youtube_live_service import generate_youtube_auth_url
        url = generate_youtube_auth_url(redirect_uri)
        return {"platform": "youtube", "oauthUrl": url}

    elif clean_p in ("meta", "instagram", "facebook"):
        if clean_p == "meta":
            clean_p = "facebook"
        app_id = (
            (settings.INSTAGRAM_APP_ID or settings.META_APP_ID)
            if clean_p == "instagram"
            else settings.META_APP_ID
        )
        app_secret = (
            (settings.INSTAGRAM_APP_SECRET or settings.META_APP_SECRET)
            if clean_p == "instagram"
            else settings.META_APP_SECRET
        )
        if not app_id or not app_secret:
            if clean_p == "instagram":
                raise ValueError(
                    "Instagram connections are not configured. Set INSTAGRAM_APP_ID and "
                    "INSTAGRAM_APP_SECRET, or configure META_APP_ID and META_APP_SECRET."
                )
            raise ValueError("Facebook connections are not configured. Set META_APP_ID and META_APP_SECRET.")
        state = _create_meta_social_state(clean_p, user_id)
        if redirect_uri and redirect_uri != settings.META_REDIRECT_URI:
            raise ValueError("Meta OAuth redirect URI must match META_REDIRECT_URI.")
        params = {
            "client_id": app_id,
            "redirect_uri": settings.META_REDIRECT_URI,
            "scope": META_SCOPES[clean_p],
            "response_type": "code",
            "state": state,
        }
        authorization_endpoint = f"https://www.facebook.com/{META_GRAPH_VERSION}/dialog/oauth"
        url = f"{authorization_endpoint}?{urllib.parse.urlencode(params)}"
        return {"platform": clean_p, "oauthUrl": url}

    else:
        raise ValueError(f"OAuth URL generation not supported for platform: {platform}")


async def complete_meta_social_oauth(code: str, state: str) -> Dict[str, Any]:
    """Exchange Meta authorization and persist only verified Pages/professional accounts."""
    state_data = _validate_meta_social_state(state)
    platform = state_data["platform"]
    user_id = state_data.get("user_id")
    if not user_id:
        latest = get_latest_user()
        user_id = latest["id"] if latest else "usr_global"

    app_id = (
        (settings.INSTAGRAM_APP_ID or settings.META_APP_ID)
        if platform == "instagram"
        else settings.META_APP_ID
    )
    app_secret = (
        (settings.INSTAGRAM_APP_SECRET or settings.META_APP_SECRET)
        if platform == "instagram"
        else settings.META_APP_SECRET
    )
    if not app_id or not app_secret:
        if platform == "instagram":
            raise ValueError(
                "Instagram connections are not configured. Set INSTAGRAM_APP_ID and "
                "INSTAGRAM_APP_SECRET, or configure META_APP_ID and META_APP_SECRET."
            )
        raise ValueError("Facebook connections are not configured. Set META_APP_ID and META_APP_SECRET.")

    token_url = f"https://graph.facebook.com/{META_GRAPH_VERSION}/oauth/access_token"
    graph_url = f"https://graph.facebook.com/{META_GRAPH_VERSION}"
    async with httpx.AsyncClient(timeout=20.0) as client:
        try:
            token_response = await client.get(
                token_url,
                params={
                    "client_id": app_id,
                    "client_secret": app_secret,
                    "redirect_uri": settings.META_REDIRECT_URI,
                    "code": code,
                },
            )
            token_response.raise_for_status()
            token_data = token_response.json()
            if token_data.get("error"):
                raise ValueError("Meta could not verify the authorization code. Please try again.")
            user_token = token_data.get("access_token")
            if not user_token:
                raise ValueError("Meta did not return an access token. Please try again.")

            long_token_response = await client.get(
                token_url,
                params={
                    "grant_type": "fb_exchange_token",
                    "client_id": app_id,
                    "client_secret": app_secret,
                    "fb_exchange_token": user_token,
                },
            )
            long_token_response.raise_for_status()
            long_token_data = long_token_response.json()
            if long_token_data.get("error") or not long_token_data.get("access_token"):
                raise ValueError("Meta could not extend the access token. Please reconnect and try again.")
            user_token = long_token_data["access_token"]

            pages_response = await client.get(
                f"{graph_url}/me/accounts",
                params={
                    "fields": (
                        "id,name,username,access_token,category,picture{url},"
                        "followers_count,fan_count,"
                        "instagram_business_account{id,username,profile_picture_url,"
                        "followers_count,media_count}"
                    ),
                    "access_token": user_token,
                },
            )
            pages_response.raise_for_status()
            pages_data = pages_response.json()
            if pages_data.get("error"):
                raise ValueError("Meta could not list the Pages you manage. Check the permissions and try again.")
        except httpx.HTTPStatusError as exc:
            response_error = {}
            try:
                body = exc.response.json()
                if isinstance(body, dict) and isinstance(body.get("error"), dict):
                    response_error = body["error"]
            except ValueError:
                pass

            error_message = (
                response_error.get("error_user_msg")
                or response_error.get("message")
                or "Meta rejected the authorization request."
            )
            error_code = response_error.get("code")
            logger.warning(
                "Meta OAuth request was rejected (status=%s, code=%s): %s",
                exc.response.status_code,
                error_code,
                error_message,
            )
            raise ValueError(
                f"Meta could not connect this account: {error_message} "
                "Check that Instagram is a Business or Creator account linked to a Facebook Page "
                "and that the required Meta permissions are enabled."
            ) from exc
        except httpx.HTTPError as exc:
            logger.warning("Meta OAuth request failed (%s)", type(exc).__name__)
            raise ValueError("Meta could not complete the connection. Please try again.") from exc

    saved_accounts = []
    pages = pages_data.get("data")
    if not isinstance(pages, list):
        raise ValueError("Meta did not return a valid list of managed Pages.")
    for page in pages:
        if not isinstance(page, dict):
            continue
        page_token = page.get("access_token")
        if not page.get("id") or not page_token:
            continue

        if platform == "facebook":
            picture = page.get("picture")
            avatar_url = picture.get("data", {}).get("url") if isinstance(picture, dict) else None
            saved_accounts.append(upsert_social_account(
                user_id=user_id,
                platform="facebook",
                platform_account_id=str(page["id"]),
                name=page.get("name") or "Facebook Page",
                handle=page.get("username") or str(page["id"]),
                avatar_url=avatar_url,
                followers_count=int(page.get("fan_count") or page.get("followers_count") or 0),
                access_token=page_token,
                metadata={"category": page.get("category")},
            ))
            continue

        instagram = page.get("instagram_business_account")
        if not isinstance(instagram, dict) or not instagram.get("id"):
            continue
        saved_accounts.append(upsert_social_account(
            user_id=user_id,
            platform="instagram",
            platform_account_id=str(instagram["id"]),
            name=instagram.get("username") or "Instagram Professional Account",
            handle=f"@{instagram['username']}" if instagram.get("username") else "Instagram",
            avatar_url=instagram.get("profile_picture_url"),
            followers_count=int(instagram.get("followers_count") or 0),
            posts_count=int(instagram.get("media_count") or 0),
            access_token=page_token,
            metadata={"facebookPageId": str(page["id"])},
        ))

    if not saved_accounts:
        if platform == "facebook":
            raise ValueError("No Facebook Pages were found for this account. You must manage a Page to connect it.")
        raise ValueError(
            "No Instagram professional account was found. Connect a Business or Creator Instagram account to a Facebook Page, then try again."
        )

    return {
        "platform": platform,
        "accounts": saved_accounts,
        "message": f"Connected {len(saved_accounts)} {platform} destination(s) to your fleet.",
    }


async def _complete_instagram_login_oauth(code: str, user_id: str) -> Dict[str, Any]:
    """Exchange Instagram Business Login credentials and save the publishing account."""
    async with httpx.AsyncClient(timeout=20.0) as client:
        try:
            short_token_response = await client.post(
                "https://api.instagram.com/oauth/access_token",
                files={
                    "client_id": (None, settings.INSTAGRAM_APP_ID),
                    "client_secret": (None, settings.INSTAGRAM_APP_SECRET),
                    "grant_type": (None, "authorization_code"),
                    "redirect_uri": (None, settings.META_REDIRECT_URI),
                    "code": (None, code),
                },
            )
            short_token_response.raise_for_status()
            short_token_data = short_token_response.json()
            short_lived_token = short_token_data.get("access_token")
            if not short_lived_token:
                raise ValueError("Instagram did not return an access token. Please try again.")

            long_token_response = await client.get(
                "https://graph.instagram.com/access_token",
                params={
                    "grant_type": "ig_exchange_token",
                    "client_secret": settings.INSTAGRAM_APP_SECRET,
                    "access_token": short_lived_token,
                },
            )
            long_token_response.raise_for_status()
            long_token_data = long_token_response.json()
            access_token = long_token_data.get("access_token")
            if not access_token:
                raise ValueError("Instagram could not extend the access token. Please reconnect and try again.")

            profile_response = await client.get(
                f"https://graph.instagram.com/{META_GRAPH_VERSION}/me",
                params={
                    "fields": "user_id,username,account_type,profile_picture_url,followers_count,media_count",
                    "access_token": access_token,
                },
            )
            profile_response.raise_for_status()
            profile = profile_response.json()
        except httpx.HTTPStatusError as exc:
            response_error = {}
            try:
                body = exc.response.json()
                if isinstance(body, dict):
                    error = body.get("error")
                    response_error = error if isinstance(error, dict) else body
            except ValueError:
                pass
            message = (
                response_error.get("error_user_msg")
                or response_error.get("error_message")
                or response_error.get("message")
                or "Instagram rejected the authorization request."
            )
            logger.warning(
                "Instagram Login request was rejected (status=%s, code=%s): %s",
                exc.response.status_code,
                response_error.get("code"),
                message,
            )
            raise ValueError(
                f"Instagram could not connect this account: {message} "
                "Check Instagram Business Login is enabled and META_REDIRECT_URI is registered "
                "in the Instagram API setup."
            ) from exc
        except httpx.HTTPError as exc:
            logger.warning("Instagram Login request failed (%s)", type(exc).__name__)
            raise ValueError("Instagram could not complete the connection. Please try again.") from exc

    instagram_user_id = profile.get("user_id") or profile.get("id")
    if not instagram_user_id or not profile.get("username"):
        raise ValueError("Instagram did not return a valid professional account profile.")

    expires_in = long_token_data.get("expires_in")
    token_expiry = None
    if expires_in is not None:
        try:
            token_expiry = datetime.fromtimestamp(
                time.time() + int(expires_in), tz=timezone.utc
            ).isoformat()
        except (TypeError, ValueError, OverflowError):
            logger.warning("Instagram returned an invalid access-token lifetime.")

    account = upsert_social_account(
        user_id=user_id,
        platform="instagram",
        platform_account_id=str(instagram_user_id),
        name=profile["username"],
        handle=f"@{profile['username']}",
        avatar_url=profile.get("profile_picture_url"),
        followers_count=int(profile.get("followers_count") or 0),
        posts_count=int(profile.get("media_count") or 0),
        access_token=access_token,
        token_expiry=token_expiry,
        metadata={
            "authProvider": "instagram_login",
            "accountType": profile.get("account_type"),
        },
    )
    return {
        "platform": "instagram",
        "accounts": [account],
        "message": f"Connected Instagram account @{profile['username']} to your fleet.",
    }


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
