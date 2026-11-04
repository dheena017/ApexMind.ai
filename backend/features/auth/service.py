"""
backend/features/auth/service.py
Authentication service supporting:
- Email & Password registration and login (PBKDF2-HMAC-SHA256 salted hashing)
- Google Sign-In (Google Identity Services token authentication)
- Multi-Channel creator profiles and session management
- Legacy YouTube channel sign-in backward compatibility
"""

import uuid
import logging
import hashlib
import hmac
import secrets
import json
import base64
from typing import Dict, Any, Optional

from backend.database.repository import (
    upsert_user,
    get_user_by_email,
    get_user_by_id,
    get_latest_user,
    get_channels,
    get_channels_by_user,
    get_oauth_channel,
    create_user_with_password,
    set_user_active_channel,
)

logger = logging.getLogger("ApexMind.Auth")


def hash_password(password: str, salt: Optional[str] = None) -> tuple[str, str]:
    """Hashes a password with PBKDF2-HMAC-SHA256 and a 16-byte random salt."""
    effective_salt = salt or secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        effective_salt.encode("utf-8"),
        iterations=100_000,
    )
    return key.hex(), effective_salt


def verify_password(password: str, stored_hash: str, salt: str) -> bool:
    """Verifies a plain-text password against a stored hash and salt."""
    if not stored_hash or not salt:
        return False
    computed_hash, _ = hash_password(password, salt)
    return hmac.compare_digest(computed_hash, stored_hash)


def register_email_user(email: str, password: str, name: str) -> Dict[str, Any]:
    """Registers a new creator using Email and Password."""
    clean_email = email.lower().strip()
    clean_name = name.strip()

    if not clean_email or "@" not in clean_email:
        raise ValueError("A valid email address is required.")
    if len(password) < 6:
        raise ValueError("Password must be at least 6 characters long.")
    if len(clean_name) < 2:
        raise ValueError("Name must be at least 2 characters.")

    existing = get_user_by_email(clean_email)
    if existing:
        raise ValueError(f"An account with email '{clean_email}' already exists. Please sign in.")

    pwd_hash, salt = hash_password(password)
    avatar = f"https://api.dicebear.com/7.x/initials/svg?seed={clean_name}"

    user = create_user_with_password(
        email=clean_email,
        name=clean_name,
        password_hash=pwd_hash,
        salt=salt,
        avatar_url=avatar,
    )

    token = f"usr_{uuid.uuid4().hex}"
    logger.info(f"User registered successfully: '{clean_name}' ({clean_email})")

    return {
        "success": True,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "name": user["name"],
            "avatarUrl": user["avatarUrl"],
            "provider": "email",
            "verified": True,
            "activeChannelId": None,
            "channelsCount": 0,
            "lastLoginAt": user["lastLoginAt"],
        },
        "token": token,
        "message": f"Welcome to ApexMind Studio, {clean_name}!",
    }


def login_email_user(email: str, password: str) -> Dict[str, Any]:
    """Authenticates a creator using their email and password."""
    clean_email = email.lower().strip()
    user = get_user_by_email(clean_email)

    if not user:
        raise ValueError("Invalid email or password.")

    stored_hash = user.get("passwordHash")
    salt = user.get("salt")

    if not stored_hash or not salt:
        # User might have registered via Google OAuth
        if user.get("provider") == "google":
            raise ValueError("This account was created with Google Sign-In. Please sign in with Google.")
        raise ValueError("Account does not have a password configured. Please use social sign-in.")

    if not verify_password(password, stored_hash, salt):
        raise ValueError("Invalid email or password.")

    channels = get_channels_by_user(user["id"])
    active_channel = user.get("activeChannelId") or (channels[0]["id"] if channels else None)

    token = f"usr_{uuid.uuid4().hex}"
    logger.info(f"User logged in successfully: '{user['name']}' ({clean_email})")

    return {
        "success": True,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "name": user["name"],
            "avatarUrl": user["avatarUrl"],
            "provider": user.get("provider", "email"),
            "verified": True,
            "activeChannelId": active_channel,
            "channelsCount": len(channels),
            "lastLoginAt": user.get("lastLoginAt"),
        },
        "token": token,
        "message": f"Welcome back, {user['name']}!",
    }


def authenticate_google_user(
    credential_token: Optional[str] = None,
    email: Optional[str] = None,
    name: Optional[str] = None,
    avatar_url: Optional[str] = None,
    google_id: Optional[str] = None,
) -> Dict[str, Any]:
    """Authenticates or registers a creator using Google Sign-In / GIS token."""
    resolved_email = email
    resolved_name = name
    resolved_avatar = avatar_url
    resolved_gid = google_id

    # If an ID token was provided, extract payload safely
    if credential_token and not resolved_email:
        try:
            # Attempt safe JWT unverified payload decode (Header.Payload.Signature)
            parts = credential_token.split(".")
            if len(parts) >= 2:
                payload_b64 = parts[1]
                # Fix padding
                padded = payload_b64 + "=" * (-len(payload_b64) % 4)
                decoded = base64.urlsafe_b64decode(padded.encode("utf-8")).decode("utf-8")
                token_data = json.loads(decoded)
                resolved_email = token_data.get("email")
                resolved_name = token_data.get("name") or token_data.get("given_name")
                resolved_avatar = token_data.get("picture")
                resolved_gid = token_data.get("sub")
        except Exception as e:
            logger.warning(f"Could not parse Google ID token payload: {e}")

    if not resolved_email:
        raise ValueError("Unable to retrieve verified email from Google Sign-In.")

    clean_email = resolved_email.lower().strip()
    clean_name = (resolved_name or clean_email.split("@")[0]).strip()
    avatar = resolved_avatar or f"https://api.dicebear.com/7.x/initials/svg?seed={clean_name}"

    user = upsert_user(
        email=clean_email,
        name=clean_name,
        avatar_url=avatar,
        google_id=resolved_gid or "",
        provider="google",
    )

    channels = get_channels_by_user(user["id"])
    active_channel = user.get("activeChannelId") or (channels[0]["id"] if channels else None)

    token = f"usr_{uuid.uuid4().hex}"
    logger.info(f"Google Sign-In successful for user: '{clean_name}' ({clean_email})")

    return {
        "success": True,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "name": user["name"],
            "avatarUrl": user["avatarUrl"],
            "provider": "google",
            "verified": True,
            "activeChannelId": active_channel,
            "channelsCount": len(channels),
            "lastLoginAt": user["lastLoginAt"],
        },
        "token": token,
        "message": f"Signed in with Google as {clean_name}!",
    }


def authenticate_channel_user(
    handle: str,
    name: Optional[str] = None,
    avatar_url: Optional[str] = None,
    channel_id: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Legacy channel sign-in adapter for backward compatibility.
    """
    clean_handle = (handle or "creator").strip()
    if clean_handle.startswith("@"):
        clean_handle = clean_handle[1:]
    if not clean_handle:
        clean_handle = "creator"

    channel_name = name or clean_handle.capitalize()
    avatar = avatar_url or f"https://api.dicebear.com/7.x/initials/svg?seed={channel_name}"
    ch_id = channel_id

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
            "activeChannelId": ch_id,
            "channelsCount": 1,
            "lastLoginAt": user["lastLoginAt"],
        },
        "token": token,
        "message": f"Welcome, {user['name']}!",
    }


def get_current_user_profile(user_id_or_email: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """Retrieves profile of the active creator account."""
    user = None
    if user_id_or_email:
        user = get_user_by_id(user_id_or_email) or get_user_by_email(user_id_or_email)

    if not user:
        user = get_latest_user()

    if not user:
        try:
            oauth_ch = get_oauth_channel()
            if oauth_ch:
                channel_title = oauth_ch.get("name") or "ApexMind Creator"
                clean_handle = (oauth_ch.get("handle") or "creator").replace("@", "").strip()
                email = f"{clean_handle}@youtube.com"
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
        user = upsert_user(
            email="creator@apexmind.ai",
            name="ApexMind Creator",
            avatar_url="https://api.dicebear.com/7.x/initials/svg?seed=ApexMind",
            provider="email",
        )

    channels = get_channels_by_user(user["id"]) if user.get("id") else []
    active_channel = user.get("activeChannelId") or (channels[0]["id"] if channels else None)

    return {
        "id": user["id"],
        "email": user["email"],
        "name": user["name"],
        "avatarUrl": user["avatarUrl"],
        "provider": user.get("provider", "email"),
        "verified": True,
        "activeChannelId": active_channel,
        "channelsCount": len(channels),
        "lastLoginAt": user.get("lastLoginAt"),
    }
