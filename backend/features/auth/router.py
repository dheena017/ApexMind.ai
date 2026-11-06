"""FastAPI routes for Google, Facebook, and Instagram creator sign-in."""

import logging
from typing import Optional, Union
import httpx
from fastapi import APIRouter, HTTPException, status, Header
from .schemas import (
    GoogleAuthRequest,
    FacebookAuthRequest,
    InstagramAuthStartRequest,
    InstagramAuthCallbackRequest,
    OAuthAuthorizationResponse,
    AuthResponse,
    UserProfileDTO,
    LogoutResponse,
)
from .service import (
    authenticate_google_user,
    authenticate_facebook_user,
    authenticate_instagram_user,
    create_instagram_login_url,
    get_current_user_profile,
    get_session_user_id,
)

logger = logging.getLogger("ApexMind.features.auth")
router = APIRouter(prefix="/api/auth", tags=["Auth"])


@router.post(
    "/google",
    response_model=AuthResponse,
    summary="Sign in with Google",
    description="Authenticates a creator with a Google OAuth access token."
)
async def post_google_auth(payload: GoogleAuthRequest):
    try:
        data = await authenticate_google_user(payload.accessToken)
        return data
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except httpx.HTTPError as e:
        logger.error("Google profile verification request failed: %s", e)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Google sign-in is temporarily unavailable.",
        )
    except Exception as e:
        logger.error(f"Google authentication unexpected error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Google sign-in failed. Please try again."
        )


@router.post(
    "/facebook",
    response_model=AuthResponse,
    summary="Sign in with Facebook",
    description="Verifies a Facebook OAuth access token and creates a creator session."
)
async def post_facebook_auth(payload: FacebookAuthRequest):
    try:
        return await authenticate_facebook_user(payload.accessToken)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except httpx.HTTPError as e:
        logger.error("Facebook token/profile request failed: %s", e)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Facebook sign-in is temporarily unavailable.",
        )
    except Exception as e:
        logger.error("Facebook authentication unexpected error: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Facebook sign-in failed. Please try again.",
        )


@router.post(
    "/instagram",
    response_model=Union[OAuthAuthorizationResponse, AuthResponse],
    summary="Sign in with Instagram",
    description="Use action=start to get the provider authorization URL, then action=callback with the returned code and state to create a creator session."
)
async def post_instagram_auth(
    payload: Union[InstagramAuthStartRequest, InstagramAuthCallbackRequest],
):
    try:
        if isinstance(payload, InstagramAuthStartRequest):
            return create_instagram_login_url()
        return await authenticate_instagram_user(payload.code, payload.state)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except httpx.HTTPError as e:
        logger.error("Instagram token/profile request failed: %s", e)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Instagram sign-in is temporarily unavailable.",
        )
    except Exception as e:
        logger.error("Instagram authentication unexpected error: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Instagram sign-in failed. Please try again.",
        )


@router.get(
    "/me",
    response_model=UserProfileDTO,
    summary="Get current user profile",
    description="Returns the profile of the currently signed-in creator."
)
async def get_me(authorization: Optional[str] = Header(None)):
    try:
        scheme, _, token = (authorization or "").partition(" ")
        user_id = get_session_user_id(token) if scheme.lower() == "bearer" and token else None
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="A valid authenticated session is required."
            )
        user = get_current_user_profile(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="The authenticated creator account could not be found."
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
