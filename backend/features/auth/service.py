"""Authentication services for Google, Facebook, and Instagram creator sign-in."""

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


def create_instagram_login_url() -> Dict[str, str]:
    """Create the Instagram authorization URL with a signed, short-lived state."""
    app_id = settings.INSTAGRAM_APP_ID
    app_secret = settings.INSTAGRAM_APP_SECRET
    if not app_id or not app_secret:
        raise ValueError("Instagram sign-in is not configured. Set INSTAGRAM_APP_ID and INSTAGRAM_APP_SECRET on the backend.")

    provider = "instagram"
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
        "redirect_uri": settings.INSTAGRAM_AUTH_REDIRECT_URI,
        "response_type": "code",
        "scope": "instagram_business_basic",
        "enable_fb_login": "false",
        "state": state,
    }
    return {
        "authorizationUrl": f"https://www.instagram.com/oauth/authorize?{urllib.parse.urlencode(params)}",
        "state": state,
    }


def create_facebook_login_url() -> Dict[str, str]:
    """Create Facebook's HTTPS authorization-code URL with a signed, short-lived state."""
    app_id = settings.FACEBOOK_APP_ID
    if not app_id or not settings.FACEBOOK_APP_SECRET:
        raise ValueError(
            "Facebook sign-in is not configured. Set FACEBOOK_APP_ID and FACEBOOK_APP_SECRET on the backend."
        )

    provider = "facebook"
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
        "redirect_uri": settings.FACEBOOK_AUTH_REDIRECT_URI,
        "response_type": "code",
        "scope": "public_profile,email",
        "state": state,
    }
    return {
        "authorizationUrl": (
            f"https://www.facebook.com/{META_GRAPH_VERSION}/dialog/oauth?"
            f"{urllib.parse.urlencode(params)}"
        ),
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


async def authenticate_facebook_user(access_token: str) -> Dict[str, Any]:
    """Verify a Facebook SDK token against this app before authenticating its identity."""
    app_id = settings.FACEBOOK_APP_ID
    app_secret = settings.FACEBOOK_APP_SECRET
    if not app_id or not app_secret:
        raise ValueError("Facebook sign-in is not configured. Set FACEBOOK_APP_ID and FACEBOOK_APP_SECRET on the backend.")

    async with httpx.AsyncClient(timeout=15.0) as client:
        debug_response = await client.get(
            f"https://graph.facebook.com/{META_GRAPH_VERSION}/debug_token",
            params={
                "input_token": access_token,
                "access_token": f"{app_id}|{app_secret}",
            },
        )
        if debug_response.status_code != 200:
            logger.warning("Facebook access-token verification failed with HTTP %s", debug_response.status_code)
            raise ValueError("Facebook could not verify your account. Please sign in again.")
        debug_payload = debug_response.json()
        debug_data = debug_payload.get("data") if isinstance(debug_payload, dict) else None
        if not isinstance(debug_data, dict):
            raise ValueError("Facebook could not verify your account. Please sign in again.")
        provider_id = debug_data.get("user_id")
        if (
            debug_data.get("is_valid") is not True
            or str(debug_data.get("app_id") or "") != app_id
            or not provider_id
        ):
            raise ValueError("Facebook sign-in token is invalid or was issued to a different application.")

        profile_params = {
            "fields": "id,name,email,picture.type(large)",
            "access_token": access_token,
        }
        profile_response = await client.get(
            f"https://graph.facebook.com/{META_GRAPH_VERSION}/me",
            params=profile_params,
        )
        if profile_response.status_code != 200:
            logger.warning("Facebook account profile lookup failed with HTTP %s", profile_response.status_code)
            raise ValueError("Facebook could not verify your account profile. Please try again.")
        profile = profile_response.json()
    if not isinstance(profile, dict):
        raise ValueError("Facebook could not verify your account profile. Please try again.")
    if str(profile.get("id") or "") != str(provider_id):
        raise ValueError("Facebook returned a profile that does not match the verified access token.")

    return _create_meta_user_session("facebook", profile)


async def authenticate_facebook_code(code: str, state: str) -> Dict[str, Any]:
    """Exchange Facebook's one-time authorization code and authenticate its identity."""
    _validate_meta_state("facebook", state)
    app_id = settings.FACEBOOK_APP_ID
    app_secret = settings.FACEBOOK_APP_SECRET
    if not app_id or not app_secret:
        raise ValueError(
            "Facebook sign-in is not configured. Set FACEBOOK_APP_ID and FACEBOOK_APP_SECRET on the backend."
        )

    async with httpx.AsyncClient(timeout=15.0) as client:
        token_response = await client.get(
            f"https://graph.facebook.com/{META_GRAPH_VERSION}/oauth/access_token",
            params={
                "client_id": app_id,
                "client_secret": app_secret,
                "redirect_uri": settings.FACEBOOK_AUTH_REDIRECT_URI,
                "code": code,
            },
        )
        if token_response.status_code != 200:
            logger.warning(
                "Facebook authorization-code exchange failed with HTTP %s",
                token_response.status_code,
            )
            raise ValueError("Facebook sign-in could not verify your account. Please try again.")
        access_token = token_response.json().get("access_token")
        if not isinstance(access_token, str) or not access_token:
            raise ValueError("Facebook did not return an access token.")

        debug_response = await client.get(
            f"https://graph.facebook.com/{META_GRAPH_VERSION}/debug_token",
            params={
                "input_token": access_token,
                "access_token": f"{app_id}|{app_secret}",
            },
        )
        if debug_response.status_code != 200:
            logger.warning("Facebook access-token verification failed with HTTP %s", debug_response.status_code)
            raise ValueError("Facebook could not verify your account. Please sign in again.")
        debug_payload = debug_response.json()
        debug_data = debug_payload.get("data") if isinstance(debug_payload, dict) else None
        provider_id = debug_data.get("user_id") if isinstance(debug_data, dict) else None
        if (
            not isinstance(debug_data, dict)
            or debug_data.get("is_valid") is not True
            or str(debug_data.get("app_id") or "") != app_id
            or not provider_id
        ):
            raise ValueError("Facebook sign-in token is invalid or was issued to a different application.")

        profile_response = await client.get(
            f"https://graph.facebook.com/{META_GRAPH_VERSION}/me",
            params={
                "fields": "id,name,email,picture.type(large)",
                "access_token": access_token,
            },
        )
        if profile_response.status_code != 200:
            logger.warning("Facebook account profile lookup failed with HTTP %s", profile_response.status_code)
            raise ValueError("Facebook could not verify your account profile. Please try again.")
        profile = profile_response.json()

    if not isinstance(profile, dict) or str(profile.get("id") or "") != str(provider_id):
        raise ValueError("Facebook returned a profile that does not match the verified access token.")
    return _create_meta_user_session("facebook", profile)


def _create_meta_user_session(provider: str, profile: Dict[str, Any]) -> Dict[str, Any]:
    provider_id = str(profile.get("id") or profile.get("user_id") or "")
    if not provider_id:
        raise ValueError(f"{provider.capitalize()} did not return a valid account ID.")
    display_name = profile.get("name") or profile.get("username") or f"{provider.capitalize()} Creator"
    picture = profile.get("picture", {})
    avatar_url = (
        picture.get("data", {}).get("url")
        if isinstance(picture, dict)
        else profile.get("profile_picture_url")
    )
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


async def authenticate_instagram_user(code: str, state: str) -> Dict[str, Any]:
    """Exchange Instagram Login's single-use authorization code and authenticate its identity."""
    _validate_meta_state("instagram", state)
    app_id = settings.INSTAGRAM_APP_ID
    app_secret = settings.INSTAGRAM_APP_SECRET
    if not app_id or not app_secret:
        raise ValueError("Instagram sign-in is not configured on the backend.")

    async with httpx.AsyncClient(timeout=15.0) as client:
        token_response = await client.post(
            "https://api.instagram.com/oauth/access_token",
            data={
                "client_id": app_id,
                "client_secret": app_secret,
                "grant_type": "authorization_code",
                "redirect_uri": settings.INSTAGRAM_AUTH_REDIRECT_URI,
                "code": code,
            },
        )
        if token_response.status_code != 200:
            logger.warning("Instagram authorization-code exchange failed with HTTP %s", token_response.status_code)
            raise ValueError("Instagram sign-in could not verify your account. Please try again.")

        access_token = token_response.json().get("access_token")
        if not access_token:
            raise ValueError("Instagram did not return an access token.")

        profile_response = await client.get(
            f"https://graph.instagram.com/{META_GRAPH_VERSION}/me",
            params={
                "fields": "user_id,username,name,profile_picture_url",
                "access_token": access_token,
            },
        )
        if profile_response.status_code != 200:
            logger.warning("Instagram account profile lookup failed with HTTP %s", profile_response.status_code)
            raise ValueError("Instagram could not verify your account profile. Please try again.")
        profile = profile_response.json()

    return _create_meta_user_session("instagram", profile)


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


async def authenticate_google_user(access_token: str) -> Dict[str, Any]:
    """Verify a Google OAuth token through Google's userinfo endpoint and sign in that identity."""
    async with httpx.AsyncClient(timeout=15.0) as client:
        token_info_response = await client.get(
            "https://oauth2.googleapis.com/tokeninfo",
            params={"access_token": access_token},
        )
        if token_info_response.status_code != 200:
            logger.warning("Google access-token verification failed with HTTP %s", token_info_response.status_code)
            raise ValueError("Google could not verify your account. Please sign in again.")
        token_info = token_info_response.json()
        configured_client_id = settings.GOOGLE_CLIENT_ID.strip()
        token_client_id = next(
            (
                str(token_info.get(claim) or "").strip()
                for claim in ("issued_to", "audience", "aud", "azp", "client_id")
                if str(token_info.get(claim) or "").strip()
            ),
            "",
        )
        if not configured_client_id:
            raise ValueError(
                "Google sign-in is not configured. Set GOOGLE_CLIENT_ID to the Google Web OAuth client "
                "used by this app, then restart the frontend and backend."
            )
        if token_client_id != configured_client_id:
            logger.error(
                "Google OAuth client mismatch: token client ID is '%s', backend configured for '%s'.",
                token_client_id or "(missing)",
                configured_client_id,
            )
            token_client_detail = (
                f"'{token_client_id}'"
                if token_client_id
                else "missing from Google's token metadata"
            )
            raise ValueError(
                f"Google OAuth client mismatch: the token client ID is {token_client_detail}, but the "
                f"backend is configured for '{configured_client_id}'. Make sure the frontend and backend "
                "use the same Google Web OAuth client ID, add this site's exact origin in Google Cloud "
                "Console, and restart both servers."
            )

        response = await client.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        if response.status_code != 200:
            logger.warning("Google userinfo verification failed with HTTP %s", response.status_code)
            raise ValueError("Google could not verify your account. Please sign in again.")
        profile = response.json()

    resolved_email = profile.get("email")
    resolved_gid = profile.get("sub")
    if not isinstance(resolved_email, str) or not resolved_email.strip() or profile.get("email_verified") is not True:
        raise ValueError("Google did not provide a verified email address for this account.")
    if not isinstance(resolved_gid, str) or not resolved_gid.strip():
        raise ValueError("Google did not provide a valid account ID.")

    clean_email = resolved_email.lower().strip()
    clean_name = (profile.get("name") or clean_email.split("@")[0]).strip()
    avatar = profile.get("picture") or f"https://api.dicebear.com/7.x/initials/svg?seed={clean_name}"

    user = upsert_user(
        email=clean_email,
        name=clean_name,
        avatar_url=avatar,
        google_id=resolved_gid,
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
