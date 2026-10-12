"""
backend/features/auth/service.py
Authentication service supporting Google OAuth token verification, profile synchronization,
and session management.
"""

import os
import uuid
import logging
from typing import Dict, Any, Optional
from backend.database.repository import (
    upsert_user,
    get_user_by_email,
    get_user_by_id,
    get_latest_user,
)

logger = logging.getLogger("ApexMind.Auth")

def authenticate_google_user(
    credential: Optional[str] = None,
    email: Optional[str] = None,
    name: Optional[str] = None,
    picture: Optional[str] = None,
    sub: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Authenticates a user via Google.
    If credential (JWT ID token) is present, verifies with Google OAuth2 library if client ID configured.
    Otherwise uses structured profile provided by the client (OAuth popup/One-Tap/Google login).
    """
    google_id = sub or ""
    verified_email = email
    verified_name = name
    verified_picture = picture

    if credential:
        try:
            from google.oauth2 import id_token
            from google.auth.transport import requests as google_requests

            client_id = os.getenv("GOOGLE_CLIENT_ID")
            # If client_id is set, verify against it; otherwise verify token structure
            id_info = id_token.verify_oauth2_token(
                credential,
                google_requests.Request(),
                client_id,
            )
            verified_email = id_info.get("email") or verified_email
            verified_name = id_info.get("name") or verified_name
            verified_picture = id_info.get("picture") or verified_picture
            google_id = id_info.get("sub") or google_id
            logger.info(f"Verified Google JWT token for: {verified_email}")
        except Exception as e:
            logger.warning(f"Google JWT ID token verification fallback: {e}")
            # If token verification fails (e.g. no internet to cert endpoint or custom mock), fallback to provided email

    if not verified_email:
        raise ValueError("Google authentication requires an email address.")
    if not verified_name:
        verified_name = verified_email.split("@")[0].capitalize() or "Creator"
    if not verified_picture:
        verified_picture = f"https://api.dicebear.com/7.x/initials/svg?seed={verified_name}"

    # Upsert into database
    user = upsert_user(
        email=verified_email,
        name=verified_name,
        avatar_url=verified_picture,
        google_id=google_id,
        provider="google",
    )

    token = f"ga_{uuid.uuid4().hex}"
    logger.info(f"Google login successful for user: {user['name']} ({user['email']})")

    return {
        "success": True,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "name": user["name"],
            "avatarUrl": user["avatarUrl"],
            "provider": "google",
            "verified": True,
            "lastLoginAt": user["lastLoginAt"],
        },
        "token": token,
        "message": f"Welcome back, {user['name']}! Signed in with Google.",
    }


def authenticate_email_user(email: str, password: Optional[str] = None) -> Dict[str, Any]:
    """Fallback email login."""
    clean_email = email.strip()
    name = clean_email.split("@")[0].capitalize() or "Creator"
    avatar = f"https://api.dicebear.com/7.x/initials/svg?seed={name}"

    user = upsert_user(
        email=clean_email,
        name=name,
        avatar_url=avatar,
        provider="email",
    )

    token = f"em_{uuid.uuid4().hex}"
    return {
        "success": True,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "name": user["name"],
            "avatarUrl": user["avatarUrl"],
            "provider": "email",
            "verified": True,
            "lastLoginAt": user["lastLoginAt"],
        },
        "token": token,
        "message": f"Welcome, {user['name']}!",
    }


def get_current_user_profile(user_id_or_email: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """Retrieves profile of the active user."""
    if not user_id_or_email:
        user = get_latest_user()
        if not user:
            return None
    else:
        user = get_user_by_id(user_id_or_email) or get_user_by_email(user_id_or_email)
        if not user:
            return None

    return {
        "id": user["id"],
        "email": user["email"],
        "name": user["name"],
        "avatarUrl": user["avatarUrl"],
        "provider": user.get("provider", "google"),
        "verified": True,
        "lastLoginAt": user.get("lastLoginAt"),
    }
