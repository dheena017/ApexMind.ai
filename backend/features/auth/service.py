"""
backend/features/auth/service.py
Authentication service supporting YouTube Channel authentication,
delivery address normalization ([channel]@youtube.com), and session management.
"""

import uuid
import logging
from typing import Dict, Any, Optional

from backend.database.repository import (
    upsert_user,
    get_user_by_email,
    get_user_by_id,
    get_latest_user,
    get_channels,
    get_oauth_channel,
)

logger = logging.getLogger("ApexMind.Auth")


def authenticate_channel_user(
    handle: str,
    name: Optional[str] = None,
    avatar_url: Optional[str] = None,
    channel_id: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Authenticates a creator session using their YouTube Channel details.
    Enforces that email is always the YouTube channel system delivery address: [channel]@youtube.com.
    """
    clean_handle = (handle or "creator").strip()
    if clean_handle.startswith("@"):
        clean_handle = clean_handle[1:]
    if not clean_handle:
        clean_handle = "creator"

    channel_name = name or clean_handle.capitalize()
    avatar = avatar_url or f"https://api.dicebear.com/7.x/initials/svg?seed={channel_name}"
    ch_id = channel_id

    # Check if this channel exists in the local database to enrich details
    try:
        oauth_ch = get_oauth_channel()
        if oauth_ch:
            stored_handle = (oauth_ch.get("handle") or "").replace("@", "").strip()
            if stored_handle.lower() == clean_handle.lower() or not handle:
                channel_name = oauth_ch.get("name") or channel_name
                avatar = oauth_ch.get("avatar_url") or avatar
                ch_id = oauth_ch.get("id") or ch_id
                clean_handle = stored_handle

        for ch in get_channels():
            stored_handle = (ch.get("handle") or "").replace("@", "").strip()
            if stored_handle.lower() == clean_handle.lower() or ch.get("id") == ch_id:
                channel_name = ch.get("name") or channel_name
                avatar = ch.get("avatar_url") or avatar
                ch_id = ch.get("id") or ch_id
                clean_handle = stored_handle
                break
    except Exception as e:
        logger.debug(f"Channel lookup note during auth: {e}")

    # For YouTube channels, email is strictly the channel delivery address [identifier]@youtube.com
    # For Mindset Forge, system delivery address is explicitly mindsetforge-v3q@youtube.com
    if (
        "mindsetforge" in clean_handle.lower()
        or "mindset forge" in channel_name.lower()
        or ch_id == "UCH0jnQrHaBOglbsLCBRoklg"
    ):
        clean_handle = "mindsetforge-v3q"
        channel_name = "Mindset Forge"
        email = "mindsetforge-v3q@youtube.com"
    else:
        email = f"{clean_handle.lower()}@youtube.com"

    user = upsert_user(
        email=email,
        name=channel_name,
        avatar_url=avatar,
        google_id=ch_id or "",
        provider="youtube_oauth",
    )

    token = f"yt_{uuid.uuid4().hex}"
    logger.info(f"YouTube Channel login successful for user: {user['name']} (@{clean_handle})")

    return {
        "success": True,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "name": user["name"],
            "avatarUrl": user["avatarUrl"],
            "provider": "youtube_oauth",
            "verified": True,
            "lastLoginAt": user["lastLoginAt"],
        },
        "token": token,
        "message": f"Welcome, {user['name']}!",
    }


def get_current_user_profile(user_id_or_email: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """Retrieves profile of the active creator, auto-resolving from connected YouTube channel."""
    user = None
    if user_id_or_email:
        user = get_user_by_id(user_id_or_email) or get_user_by_email(user_id_or_email)

    if not user:
        user = get_latest_user()

    if not user:
        # Check if an authorized YouTube OAuth channel exists in the database
        try:
            oauth_ch = get_oauth_channel()
            if oauth_ch:
                channel_title = oauth_ch.get("name") or "Mindset Forge"
                clean_handle = (oauth_ch.get("handle") or "mindsetforge-v3q").replace("@", "").strip()
                email = "mindsetforge-v3q@youtube.com" if "mindset" in clean_handle.lower() else f"{clean_handle}@youtube.com"
                avatar = oauth_ch.get("avatar_url") or f"https://api.dicebear.com/7.x/initials/svg?seed={channel_title}"
                user = upsert_user(
                    email=email,
                    name=channel_title,
                    avatar_url=avatar,
                    provider="youtube_oauth",
                )
        except Exception as e:
            logger.warning(f"Note checking OAuth channel for creator profile: {e}")

    if not user:
        # Provide default Mindset Forge creator profile
        user = upsert_user(
            email="mindsetforge-v3q@youtube.com",
            name="Mindset Forge",
            avatar_url="https://yt3.ggpht.com/8RRzGPIl4gUnVVz8gC0pdRjOD69LEx_-4Cnwy-hj30U_CWtW_CpfQZg51Qj6LfQGS57eI6mv=s800-c-k-c0x00ffffff-no-rj",
            provider="youtube_oauth",
        )

    resolved_email = user["email"]
    if not resolved_email or "@gmail.com" in resolved_email.lower() or "mindsetforge" in resolved_email.lower():
        resolved_email = "mindsetforge-v3q@youtube.com"

    return {
        "id": user["id"],
        "email": resolved_email,
        "name": user["name"],
        "avatarUrl": user["avatarUrl"],
        "provider": "youtube_oauth",
        "verified": True,
        "lastLoginAt": user.get("lastLoginAt"),
    }
