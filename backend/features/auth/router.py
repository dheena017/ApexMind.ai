"""
backend/features/auth/router.py
FastAPI router for Google Authentication and User Identity.
"""

import logging
from typing import Optional
from fastapi import APIRouter, HTTPException, status, Header
from .schemas import (
    GoogleAuthRequest,
    EmailLoginRequest,
    AuthResponse,
    UserProfileDTO,
    LogoutResponse,
)
from .service import (
    authenticate_google_user,
    authenticate_email_user,
    get_current_user_profile,
)

logger = logging.getLogger("ApexMind.features.auth")
router = APIRouter(prefix="/api/auth", tags=["Authentication & Google Identity"])

@router.post(
    "/google",
    response_model=AuthResponse,
    summary="Sign in with Google",
    description="Authenticate or register a creator profile using Google Identity."
)
async def post_google_auth(payload: GoogleAuthRequest):
    try:
        data = authenticate_google_user(
            credential=payload.credential,
            email=payload.email,
            name=payload.name,
            picture=payload.picture,
            sub=payload.sub,
            access_token=payload.accessToken,
            channel=payload.channel,
        )
        return data
    except Exception as e:
        logger.error(f"Google authentication failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Google authentication failed: {str(e)}"
        )

@router.post(
    "/login",
    response_model=AuthResponse,
    summary="Email Sign In",
    description="Standard email login fallback."
)
async def post_email_login(payload: EmailLoginRequest):
    try:
        data = authenticate_email_user(email=payload.email, password=payload.password)
        return data
    except Exception as e:
        logger.error(f"Email login failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
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
    return {
        "success": True,
        "message": "Signed out successfully.",
    }
