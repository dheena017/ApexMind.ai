"""
backend/features/auth/service.py
Authentication service supporting:
- Email & Password registration and login (PBKDF2-HMAC-SHA256 salted hashing)
- Google Sign-In (Google Identity Services token authentication)
- Multi-Channel creator profiles and session management
- Legacy YouTube channel sign-in backward compatibility
"""

import logging
import hashlib
import hmac
import secrets
import json
import base64
import time
import urllib.parse
from typing import Dict, Any, Optional
import httpx

from backend.shared.config import settings

from backend.database.repository import (
    upsert_user,
    get_user_by_email,
    get_user_by_id,
    get_channels,
    get_channels_by_user,
    get_oauth_channel,
    create_user_with_password,
)

logger = logging.getLogger("ApexMind.Auth")
META_GRAPH_VERSION = "v27.0"
SESSION_TOKEN_LIFETIME_SECONDS = 7 * 24 * 60 * 60


def create_session_token(user_id: str) -> str:
    """Create a signed, user-specific session token."""
    expires_at = int(time.time()) + SESSION_TOKEN_LIFETIME_SECONDS
    payload = json.dumps(
        {"sub": user_id, "exp": expires_at},
        separators=(",", ":"),
    ).encode("utf-8")
    encoded_payload = base64.urlsafe_b64encode(payload).decode("ascii").rstrip("=")
    unsigned_token = f"v1.{encoded_payload}"
    signature = hmac.new(
        settings.JWT_SECRET_KEY.encode("utf-8"),
        unsigned_token.encode("ascii"),
        hashlib.sha256,
    ).digest()
    encoded_signature = base64.urlsafe_b64encode(signature).decode("ascii").rstrip("=")
    return f"{unsigned_token}.{encoded_signature}"


def get_session_user_id(token: str) -> Optional[str]:
    """Return the user ID for a valid, unexpired session token."""
    try:
        version, encoded_payload, supplied_signature = token.split(".")
        if version != "v1":
            return None

        unsigned_token = f"{version}.{encoded_payload}"
        expected_signature = base64.urlsafe_b64encode(
            hmac.new(
                settings.JWT_SECRET_KEY.encode("utf-8"),
                unsigned_token.encode("ascii"),
                hashlib.sha256,
            ).digest()
        ).decode("ascii").rstrip("=")
        if not hmac.compare_digest(supplied_signature, expected_signature):
            return None

        padded_payload = encoded_payload + "=" * (-len(encoded_payload) % 4)
        payload = json.loads(base64.urlsafe_b64decode(padded_payload).decode("utf-8"))
        user_id = payload.get("sub")
        expires_at = payload.get("exp")
        if not isinstance(user_id, str) or not user_id:
            return None
        if not isinstance(expires_at, int) or expires_at <= int(time.time()):
            return None
        return user_id
    except (ValueError, UnicodeDecodeError, AttributeError):
        return None


def create_meta_login_url(provider: str) -> Dict[str, str]:
    """Create a provider-specific Meta authorization URL with a signed, short-lived state."""
    if provider == "facebook":
        app_id = settings.META_APP_ID
        if not app_id or not settings.META_APP_SECRET:
            raise ValueError("Meta sign-in is not configured. Set META_APP_ID and META_APP_SECRET on the backend.")
        authorization_endpoint = f"https://www.facebook.com/{META_GRAPH_VERSION}/dialog/oauth"
        scopes = "public_profile,email"
    elif provider == "instagram":
        app_id = settings.INSTAGRAM_APP_ID or settings.META_APP_ID
        if not app_id or not (settings.INSTAGRAM_APP_SECRET or settings.META_APP_SECRET):
            raise ValueError("Instagram sign-in is not configured. Set INSTAGRAM_APP_ID and INSTAGRAM_APP_SECRET on the backend.")
        authorization_endpoint = f"https://www.facebook.com/{META_GRAPH_VERSION}/dialog/oauth"
        scopes = "public_profile,pages_show_list,instagram_basic"
    else:
        raise ValueError(f"Unsupported Meta sign-in provider: {provider}")

    timestamp = str(int(time.time()))
    nonce = secrets.token_urlsafe(24)
    unsigned_state = f"{provider}.{timestamp}.{nonce}"
    signature = hmac.new(
        settings.JWT_SECRET_KEY.encode("utf-8"),
        unsigned_state.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()
    state = f"{unsigned_state}.{signature}"
    params = {
        "client_id": app_id,
        "redirect_uri": settings.META_AUTH_REDIRECT_URI,
        "response_type": "code",
        "scope": scopes,
        "state": state,
    }
    return {
        "authorizationUrl": f"{authorization_endpoint}?{urllib.parse.urlencode(params)}",
        "state": state,
    }


def _validate_meta_state(provider: str, state: str) -> None:
    parts = state.split(".")
    if len(parts) != 4:
        raise ValueError("Social sign-in state is invalid or expired. Please try again.")

    state_provider, timestamp, nonce, supplied_signature = parts
    unsigned_state = f"{state_provider}.{timestamp}.{nonce}"
    expected_signature = hmac.new(
        settings.JWT_SECRET_KEY.encode("utf-8"),
        unsigned_state.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()
    try:
        state_age = int(time.time()) - int(timestamp)
    except ValueError as exc:
        raise ValueError("Social sign-in state is invalid or expired. Please try again.") from exc

    if (
        state_provider != provider
        or state_age < 0
        or state_age > 600
        or not hmac.compare_digest(supplied_signature, expected_signature)
    ):
        raise ValueError("Social sign-in state is invalid or expired. Please try again.")


async def authenticate_meta_user(provider: str, code: str, state: str) -> Dict[str, Any]:
    """Exchange a single-use provider code server-side and authenticate the returned identity."""
    _validate_meta_state(provider, state)
    redirect_uri = settings.META_AUTH_REDIRECT_URI

    if provider in ("facebook", "instagram"):
        app_id = (
            (settings.INSTAGRAM_APP_ID or settings.META_APP_ID)
            if provider == "instagram"
            else settings.META_APP_ID
        )
        app_secret = (
            (settings.INSTAGRAM_APP_SECRET or settings.META_APP_SECRET)
            if provider == "instagram"
            else settings.META_APP_SECRET
        )
        token_endpoint = f"https://graph.facebook.com/{META_GRAPH_VERSION}/oauth/access_token"
        profile_endpoint = f"https://graph.facebook.com/{META_GRAPH_VERSION}/me"
        if not app_id or not app_secret:
            raise ValueError(f"{provider.capitalize()} sign-in is not configured on the backend.")
        token_request = {
            "client_id": app_id,
            "client_secret": app_secret,
            "redirect_uri": redirect_uri,
            "code": code,
        }
    else:
        raise ValueError(f"Unsupported Meta sign-in provider: {provider}")

    async with httpx.AsyncClient(timeout=15.0) as client:
        token_response = await client.get(token_endpoint, params=token_request)
        if token_response.status_code != 200:
            logger.warning("%s authorization-code exchange failed with HTTP %s", provider, token_response.status_code)
            raise ValueError(f"{provider.capitalize()} sign-in could not verify your account. Please try again.")

        token_data = token_response.json()
        token_data_items = token_data.get("data")
        if isinstance(token_data_items, list) and token_data_items:
            token_data = token_data_items[0]
        access_token = token_data.get("access_token")
        if not access_token:
            raise ValueError(f"{provider.capitalize()} did not return an access token.")

        profile_params = {"fields": "id,name,email,picture.type(large)"}
        profile_response = await client.get(
            profile_endpoint,
            params={**profile_params, "access_token": access_token},
        )
        if profile_response.status_code != 200:
            logger.warning("%s account profile lookup failed with HTTP %s", provider, profile_response.status_code)
            raise ValueError(f"{provider.capitalize()} could not verify your account profile. Please try again.")
        profile = profile_response.json()

    provider_id = str(profile.get("id") or profile.get("user_id") or token_data.get("user_id") or "")
    if not provider_id:
        raise ValueError(f"{provider.capitalize()} did not return a valid account ID.")

    display_name = profile.get("name") or profile.get("username") or f"{provider.capitalize()} Creator"
    picture = profile.get("picture", {})
    avatar_url = picture.get("data", {}).get("url") if isinstance(picture, dict) else None
    identity_hash = hashlib.sha256(f"{provider}:{provider_id}".encode("utf-8")).hexdigest()
    internal_email = f"{provider}-{identity_hash}@oauth.apexmind.invalid"
    user = upsert_user(
        email=internal_email,
        name=display_name,
        avatar_url=avatar_url,
        provider=provider,
    )
    channels = get_channels_by_user(user["id"])
    active_channel = user.get("activeChannelId") or (channels[0]["id"] if channels else None)
    return {
        "success": True,
        "user": {
            "id": user["id"],
            "email": "",
            "name": user["name"],
            "avatarUrl": user["avatarUrl"],
            "provider": provider,
            "verified": True,
            "activeChannelId": active_channel,
            "channelsCount": len(channels),
            "lastLoginAt": user["lastLoginAt"],
        },
        "token": create_session_token(user["id"]),
        "message": f"Signed in with {provider.capitalize()} as {display_name}!",
    }


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

    token = create_session_token(user["id"])
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

    token = create_session_token(user["id"])
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

    token = create_session_token(user["id"])
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

    token = create_session_token(user["id"])
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


def get_current_user_profile(user_id: str) -> Optional[Dict[str, Any]]:
    """Retrieve the profile belonging to the authenticated session user."""
    user = get_user_by_id(user_id)
    if not user:
        return None

    channels = get_channels_by_user(user["id"]) if user.get("id") else []
    active_channel = user.get("activeChannelId") or (channels[0]["id"] if channels else None)

    return {
        "id": user["id"],
        "email": "" if user["email"].endswith("@oauth.apexmind.invalid") else user["email"],
        "name": user["name"],
        "avatarUrl": user["avatarUrl"],
        "provider": user.get("provider", "email"),
        "verified": True,
        "activeChannelId": active_channel,
        "channelsCount": len(channels),
        "lastLoginAt": user.get("lastLoginAt"),
    }
