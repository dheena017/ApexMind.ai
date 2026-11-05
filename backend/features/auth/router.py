"""
backend/features/auth/router.py
FastAPI router for User Authentication (Email/Password & Google Sign-In)
and Multi-Channel Creator Identity.
"""

import logging
from typing import Optional
import httpx
from fastapi import APIRouter, HTTPException, status, Header
from .schemas import (
    UserRegisterRequest,
    UserLoginRequest,
    GoogleAuthRequest,
    MetaOAuthCallbackRequest,
    MetaOAuthStartResponse,
    ChannelAuthRequest,
    AuthResponse,
    UserProfileDTO,
    LogoutResponse,
)
from .service import (
    register_email_user,
    login_email_user,
    authenticate_google_user,
    authenticate_meta_user,
    authenticate_channel_user,
    create_meta_login_url,
    get_current_user_profile,
)

logger = logging.getLogger("ApexMind.features.auth")
router = APIRouter(prefix="/api/auth", tags=["Authentication & Creator Identity"])


@router.post(
    "/register",
    response_model=AuthResponse,
    summary="Register with Email & Password",
    description="Registers a new creator account with email, password, and display name."
)
async def post_register(payload: UserRegisterRequest):
    try:
        data = register_email_user(
            email=payload.email,
            password=payload.password,
            name=payload.name,
        )
        return data
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Registration unexpected error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Registration failed. Please try again."
        )


@router.post(
    "/login",
    response_model=AuthResponse,
    summary="Sign in with Email & Password",
    description="Authenticates an existing creator using email and password."
)
async def post_login(payload: UserLoginRequest):
    try:
        data = login_email_user(
            email=payload.email,
            password=payload.password,
        )
        return data
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Login unexpected error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Login failed. Please check credentials."
        )


@router.post(
    "/google",
    response_model=AuthResponse,
    summary="Sign in with Google",
    description="Authenticates or registers a creator using Google Sign-In / GIS credential."
)
async def post_google_auth(payload: GoogleAuthRequest):
    try:
        data = authenticate_google_user(
            credential_token=payload.credentialToken,
            email=payload.email,
            name=payload.name,
            avatar_url=payload.avatarUrl,
            google_id=payload.googleId,
        )
        return data
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Google authentication unexpected error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Google sign-in failed. Please try again."
        )


@router.get(
    "/meta/{provider}/authorize-url",
    response_model=MetaOAuthStartResponse,
    summary="Start Facebook or Instagram sign-in",
)
async def get_meta_authorization_url(provider: str):
    try:
        return create_meta_login_url(provider.lower())
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error("Could not start %s sign-in: %s", provider, e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not start social sign-in. Please try again.",
        )


@router.post(
    "/meta/{provider}/callback",
    response_model=AuthResponse,
    summary="Complete Facebook or Instagram sign-in",
)
async def post_meta_callback(provider: str, payload: MetaOAuthCallbackRequest):
    try:
        return await authenticate_meta_user(provider.lower(), payload.code, payload.state)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except httpx.HTTPError as e:
        logger.error("%s token/profile request failed: %s", provider, e)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"{provider.capitalize()} sign-in is temporarily unavailable.",
        )
    except Exception as e:
        logger.error("%s authentication unexpected error: %s", provider, e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"{provider.capitalize()} sign-in failed. Please try again.",
        )


@router.post(
    "/channel",
    response_model=AuthResponse,
    summary="Legacy Channel Sign-in",
    description="Authenticate or register a creator profile using a YouTube Channel handle.",
    deprecated=True
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
