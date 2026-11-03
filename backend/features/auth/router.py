"""
backend/features/auth/router.py
FastAPI router for YouTube Channel Authentication and Creator Identity.
Exclusively supports YouTube Channel sign-in and profile sessions.
"""

import logging
from typing import Optional
from fastapi import APIRouter, HTTPException, status, Header
from .schemas import (
    ChannelAuthRequest,
    AuthResponse,
    UserProfileDTO,
    LogoutResponse,
)
from .service import (
    authenticate_channel_user,
    get_current_user_profile,
)

logger = logging.getLogger("ApexMind.features.auth")
router = APIRouter(prefix="/api/auth", tags=["Authentication & YouTube Identity"])


@router.post(
    "/channel",
    response_model=AuthResponse,
    summary="Sign in with YouTube Channel",
    description="Authenticate or register a creator profile using a YouTube Channel."
)
async def post_channel_auth(payload: ChannelAuthRequest):
    try:
        data = authenticate_channel_user(
            handle=payload.handle,
            name=payload.name,
            avatar_url=payload.avatarUrl,
            channel_id=payload.channelId,
        )
        logger.info(f"YouTube Channel authenticated: '{data['user']['name']}' ({data['user']['email']})")
        return data
    except Exception as e:
        logger.error(f"YouTube Channel authentication failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"YouTube Channel authentication failed: {str(e)}"
        )


@router.get(
    "/me",
    response_model=UserProfileDTO,
    summary="Get current user profile",
    description="Returns the profile of the currently signed-in creator."
)
async def get_me(authorization: Optional[str] = Header(None)):
    try:
        user = get_current_user_profile()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="No authenticated creator session found."
            )
        user_name = user.get("name", "Creator") if isinstance(user, dict) else getattr(user, "name", "Creator")
        user_email = user.get("email", "") if isinstance(user, dict) else getattr(user, "email", "")
        logger.debug(f"Loaded creator session profile: '{user_name}' ({user_email})")
        return user
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching active profile: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve creator profile."
        )


@router.post(
    "/logout",
    response_model=LogoutResponse,
    summary="Sign out",
    description="Terminates current session."
)
async def post_logout():
    logger.info("Creator session logged out successfully.")
    return {
        "success": True,
        "message": "Signed out successfully.",
    }
