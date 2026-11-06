"""
backend/features/youtube/router.py
FastAPI router for YouTube Live Intelligence & RESTful CRUD Operations.

Architecture:
- 100% Live YouTube Integration (Dual-Engine: Official Atom Protocol + YouTube Data API v3)
- Zero local database storage for content (channels, videos, shorts, playlists stream live)
- Complete RESTful CRUD actions: GET, POST, PATCH, DELETE directly on YouTube
- High-precision Pydantic validation & error handling
"""

import logging
import urllib.parse
from typing import Optional, Dict, Any
from fastapi import APIRouter, HTTPException, status, Body, Header
from backend.shared.ai_models import DEFAULT_SCRIPT_MODEL

from .schemas import (
    ChannelDetailsResponse,
    ChannelVideosResponse,
    ChannelShortsResponse,
    ChannelPlaylistsResponse,
    TokenConnectRequest,
    CodeConnectRequest,
    DisconnectYouTubeRequest,
    PublishVideoRequest,
    PublishVideoResponse,
)
from .youtube_live_service import (
    resolve_channel_metadata,
    fetch_channel_videos,
    fetch_channel_videos_sorted,
    fetch_channel_shorts,
    fetch_channel_playlists,
    handle_oauth_callback,
    fetch_authenticated_channel_details,
    get_authenticated_youtube_client,
    YouTubeOAuthReauthorizationRequired,
)
from .service import publish_video_to_shorts
from backend.database.repository import (
    get_oauth_channel,
    get_channels,
    get_channels_by_user,
    save_oauth_channel,
    disconnect_youtube_channels,
    delete_social_account,
    set_user_active_channel,
)
from backend.features.auth.service import get_session_user_id

logger = logging.getLogger("ApexMind.features.youtube")
router = APIRouter()
yt_router = APIRouter(tags=["YouTube"])
yt_connection_router = APIRouter(tags=["Social"])


def _require_session_user_id(authorization: Optional[str]) -> str:
    scheme, _, token = (authorization or "").partition(" ")
    user_id = get_session_user_id(token) if scheme.lower() == "bearer" and token else None
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="A valid authenticated session is required.",
        )
    return user_id


def _resolve_target(
    query: Optional[str] = None,
    channel: Optional[str] = None,
    channel_id: Optional[str] = None,
    handle: Optional[str] = None,
) -> str:
    target = (query or channel or channel_id or handle or "").strip()
    if target:
        return target
    raise HTTPException(
        status_code=400,
        detail="Channel parameter is required. Please specify a channel query.",
    )


# ==============================================================================
# Domain 1: Channel Intelligence (Live Queries)
# ==============================================================================

@yt_router.get(
    "/api/youtube/channel/details",
    response_model=ChannelDetailsResponse,
    summary="Get YouTube Channel Details",
    operation_id="get_youtube_channel_details",
    description="Resolves canonical channel ID, verified badge, high-res avatar, banner, subscribers, joined date, views, and country in a single call.",
)
async def get_live_channel_details(
    handle: Optional[str] = None,
    channel_id: Optional[str] = None,
    query: Optional[str] = None,
    channel: Optional[str] = None,
    authorization: Optional[str] = Header(None),
):
    target = _resolve_target(query, channel, channel_id, handle)
    try:
        scheme, _, token = (authorization or "").partition(" ")
        resolved_user_id = (
            get_session_user_id(token)
            if scheme.lower() == "bearer" and token
            else None
        )
        data = resolve_channel_metadata(target, user_id=resolved_user_id)
        logger.debug(f"Resolved channel metadata for '{target}' ➔ '{data.get('name')}' [Subs: {data.get('subscribers')}, Views: {data.get('totalLifetimeViews')}] (ID: {data.get('channelId', data.get('id'))})")
        return {"success": True, "source": data.get("source", "youtube-official-live"), "channel": data}
    except Exception as e:
        logger.warning(f"Live channel details resolution failed for '{target}': {e}. Falling back to database...")
        try:
            for ch in get_channels():
                ch_h = (ch.get("handle") or "").strip()
                ch_id = (ch.get("id") or "").strip()
                if (ch_h and (target in ch_h or ch_h in target)) or (ch_id and (target in ch_id or ch_id in target)):
                    logger.info(f"Returning cached database channel details for '{target}' -> '{ch['name']}'")
                    return {
                        "success": True,
                        "source": "database-cache",
                        "channel": {
                            "channelId": ch["id"],
                            "name": ch["name"],
                            "handle": ch_h or f"@{target.lstrip('@')}",
                            "avatarUrl": ch.get("avatarUrl") or f"https://api.dicebear.com/7.x/initials/svg?seed={urllib.parse.quote(ch['name'])}&backgroundColor=0284c7,4f46e5,7c3aed",
                            "bannerUrl": ch.get("bannerUrl") or "",
                            "subscribers": ch.get("subscribers", 0),
                            "videosUploaded": ch.get("videosUploaded", 0),
                            "description": "",
                            "verified": False,
                            "channelUrl": f"https://www.youtube.com/{ch_h or target}",
                            "joinedDate": "Unavailable",
                            "country": "Global",
                            "totalLifetimeViews": 0,
                            "links": [],
                            "source": "database-cache",
                        }
                    }
        except Exception as db_err:
            logger.debug(f"Database channel fallback error: {db_err}")

        raise HTTPException(
            status_code=404,
            detail=f"YouTube channel '{target}' could not be resolved or found. Please verify the handle.",
        )


@yt_router.get(
    "/api/youtube/channel/videos",
    response_model=ChannelVideosResponse,
    summary="List YouTube Channel Videos",
    operation_id="list_youtube_channel_videos",
    description="Fetches real 16:9 uploaded videos with durations, views, and watch URLs. Supports sort by 'latest' or 'views'/'popular'.",
)
async def get_live_channel_videos(
    handle: Optional[str] = None,
    channel_id: Optional[str] = None,
    query: Optional[str] = None,
    channel: Optional[str] = None,
    limit: int = 24,
    sort: str = "latest",
):
    target = _resolve_target(query, channel, channel_id, handle)
    try:
        if sort in ("popular", "views"):
            videos = fetch_channel_videos_sorted(target, sort="views", limit=limit)
        else:
            videos = fetch_channel_videos(target, limit=limit)
        logger.debug(f"Retrieved {len(videos)} videos for channel '{target}' (Limit: {limit}, Sort: {sort})")
        return {"success": True, "source": "youtube-official-live", "total": len(videos), "videos": videos}
    except Exception as e:
        logger.error(f"Error fetching videos for '{target}': {e}")
        raise HTTPException(status_code=400, detail=str(e))


@yt_router.get(
    "/api/youtube/channel/shorts",
    response_model=ChannelShortsResponse,
    summary="List YouTube Channel Shorts",
    operation_id="list_youtube_channel_shorts",
    description="Fetches validated 9:16 Shorts with verified direct shorts URLs.",
)
async def get_live_channel_shorts_route(handle: Optional[str] = None, channel_id: Optional[str] = None, query: Optional[str] = None, limit: int = 24):
    target = _resolve_target(query, channel_id=channel_id, handle=handle)
    try:
        shorts = fetch_channel_shorts(target, limit=limit)
        logger.debug(f"Retrieved {len(shorts)} YouTube Shorts for channel '{target}' (Limit: {limit})")
        return {"success": True, "source": "youtube-official-live", "total": len(shorts), "shorts": shorts}
    except Exception as e:
        logger.error(f"Error fetching shorts for '{target}': {e}")
        raise HTTPException(status_code=400, detail=str(e))


@yt_router.get(
    "/api/youtube/channel/playlists",
    response_model=ChannelPlaylistsResponse,
    summary="List YouTube Channel Playlists",
    operation_id="list_youtube_channel_playlists",
    description="Fetches public playlists created on the channel.",
)
async def get_live_channel_playlists_route(handle: Optional[str] = None, channel_id: Optional[str] = None, query: Optional[str] = None, channel: Optional[str] = None, limit: int = 20):
    target = _resolve_target(query, channel, channel_id, handle)
    try:
        playlists = fetch_channel_playlists(target, limit=limit)
        logger.debug(f"Retrieved {len(playlists)} playlists for channel '{target}'")
        return {"success": True, "source": "youtube-official-live", "playlists": playlists}
    except Exception as e:
        logger.error(f"Error fetching playlists for '{target}': {e}")
        raise HTTPException(status_code=400, detail=str(e))


# ==============================================================================
# Canonical Video Publish Operation (POST /api/youtube/publish)
# ==============================================================================

@yt_router.post(
    "/api/youtube/publish",
    response_model=PublishVideoResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Publish Video to YouTube",
    operation_id="publish_video_to_youtube",
    description="The canonical endpoint to render, assemble metadata, and publish an AI motivational Short directly to YouTube.",
)
async def post_publish_video(
    payload: PublishVideoRequest,
    authorization: Optional[str] = Header(None),
):
    try:
        user_id = _require_session_user_id(authorization)
        title_text = payload.title or "Untitled Short"
        quote_text = payload.quote or ""
        return publish_video_to_shorts(
            title=title_text,
            quote=quote_text,
            user_id=user_id,
            description=payload.description,
            tags=payload.tags,
            privacyStatus=payload.privacyStatus,
            voice=payload.voice or "Fenrir",
            category=payload.category or "Motivation",
            channel_id=payload.channelId,
            coverImageUrl=payload.coverImageUrl,
            visualTheme=payload.visualTheme,
            audioUrl=payload.audioUrl,
            videoUrl=payload.videoUrl,
            musicUrl=payload.musicUrl,
            duration=payload.duration,
            subtitles=payload.subtitles,
            videoClips=payload.videoClips,
            imageClips=payload.imageClips,
            aspectRatio=payload.aspectRatio,
        )
    except HTTPException:
        raise
    except YouTubeOAuthReauthorizationRequired as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
        ) from e
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Validation error in video payload: {ve}"
        )
    except Exception as e:
        logger.error(f"Error publishing video to YouTube: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to publish video: {e}"
        )


# ==============================================================================
# Domain 5: Google YouTube Channel Connect & OAuth Status
# ==============================================================================

@yt_connection_router.post(
    "/api/youtube/oauth/code",
    summary="Exchange YouTube OAuth Code",
    operation_id="exchange_youtube_oauth_code",
    description="Exchanges Google auth code for access & refresh tokens, enabling persistent live YouTube uploads.",
)
async def post_exchange_oauth_code(
    payload: CodeConnectRequest,
    authorization: Optional[str] = Header(None),
):
    try:
        redirect_uri = payload.redirectUri or "postmessage"
        resolved_user_id = _require_session_user_id(authorization)
        res = handle_oauth_callback(payload.code, redirect_uri, resolved_user_id)
        return {
            "success": True,
            "message": f"Successfully connected YouTube channel '{res.get('channel', {}).get('name', 'YouTube')}' with offline refresh token",
            "channel": res.get("channel"),
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error exchanging Google OAuth code: {e}")
        raise HTTPException(status_code=400, detail=f"Failed to authenticate YouTube channel: {str(e)}")


@yt_connection_router.post(
    "/api/youtube/connect",
    summary="Connect YouTube Channel",
    operation_id="connect_youtube_channel",
    description="Connect a YouTube channel using Google access token from client-side Google popup.",
)
async def post_connect_channel(
    payload: TokenConnectRequest,
    authorization: Optional[str] = Header(None),
):
    try:
        resolved_user_id = _require_session_user_id(authorization)
        channel_data = fetch_authenticated_channel_details(payload.accessToken)
        saved = save_oauth_channel(
            channel_id=channel_data["channel_id"],
            name=channel_data["title"],
            handle=channel_data["handle"],
            avatar_url=channel_data["avatar_url"],
            banner_url=channel_data.get("banner_url"),
            subscribers=channel_data["subscribers"],
            refresh_token="",
            access_token=payload.accessToken,
            videos_uploaded=channel_data.get("videos_uploaded", 0),
            user_id=resolved_user_id,
        )
        return {
            "success": True,
            "message": f"Successfully connected YouTube channel '{channel_data['title']}'",
            "channel": saved,
        }
    except HTTPException:
        raise
    except ValueError as ve:
        logger.warning(f"No YouTube channel on Google account: {ve}")
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error(f"Error connecting YouTube channel via access token: {e}")
        raise HTTPException(status_code=400, detail=f"Failed to connect YouTube channel: {str(e)}")


@yt_connection_router.get(
    "/api/youtube/status",
    summary="Get YouTube Channel Connection Status",
    operation_id="get_youtube_channel_connection_status",
)
async def get_oauth_status_route(
    authorization: Optional[str] = Header(None),
):
    resolved_user_id = _require_session_user_id(authorization)
    ch = get_oauth_channel(user_id=resolved_user_id)
    from backend.features.social.service import get_user_fleet

    accounts = [
        account for account in get_user_fleet(resolved_user_id)
        if account.get("platform") == "youtube"
    ]
    safe_channel = None
    if ch:
        safe_channel = {
            "id": ch.get("id"),
            "name": ch.get("name"),
            "handle": ch.get("handle"),
            "avatarUrl": ch.get("avatarUrl"),
            "bannerUrl": ch.get("bannerUrl"),
            "subscribers": ch.get("subscribers", 0),
            "videosUploaded": ch.get("videosUploaded", 0),
            "channelUrl": ch.get("channelUrl"),
            "connectedAt": ch.get("connected_at"),
        }
    return {
        "success": True,
        "isAuthorized": ch is not None,
        "connected": ch is not None,
        "activeChannelId": ch.get("id") if ch else None,
        "channel": safe_channel,
        "accounts": accounts,
    }


@yt_connection_router.post(
    "/api/youtube/disconnect",
    summary="Disconnect YouTube Channel",
    operation_id="disconnect_youtube_channel",
)
async def post_disconnect_oauth(
    payload: Optional[DisconnectYouTubeRequest] = None,
    authorization: Optional[str] = Header(None),
):
    resolved_user_id = _require_session_user_id(authorization)
    if payload and payload.accountId:
        from backend.features.social.service import get_user_fleet

        account = next(
            (
                item for item in get_user_fleet(resolved_user_id)
                if item.get("id") == payload.accountId
                and item.get("platform") == "youtube"
            ),
            None,
        )
        if not account or not delete_social_account(payload.accountId, user_id=resolved_user_id):
            raise HTTPException(status_code=404, detail="Connected YouTube account was not found.")
        return {
            "success": True,
            "message": f"Disconnected YouTube channel '{account.get('name', 'YouTube')}'.",
        }
    disconnect_youtube_channels(resolved_user_id)
    return {"success": True, "message": "Disconnected your YouTube channel and credentials."}


@yt_connection_router.get(
    "/api/youtube/channels",
    summary="List Connected YouTube Channels",
    operation_id="list_connected_youtube_channels",
    description="Returns all connected channels from the studio database.",
)
async def get_saved_channels(
    handle: Optional[str] = None,
    authorization: Optional[str] = Header(None),
):
    resolved_user_id = _require_session_user_id(authorization)
    db_channels = get_channels_by_user(resolved_user_id)
    return {
        "success": True,
        "activeChannelId": db_channels[0]["id"] if db_channels else None,
        "channels": db_channels,
        "videos": [],
    }


@yt_connection_router.post(
    "/api/youtube/channels/{channel_id}/active",
    summary="Select Active YouTube Channel",
    operation_id="select_active_youtube_channel",
    description="Selects one of the authenticated user's connected YouTube channels for publishing.",
)
async def set_active_youtube_channel_route(
    channel_id: str,
    authorization: Optional[str] = Header(None),
):
    resolved_user_id = _require_session_user_id(authorization)
    if not any(channel.get("id") == channel_id for channel in get_channels_by_user(resolved_user_id)):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "This YouTube channel is not connected to your signed-in account. "
                "Reconnect it with YouTube OAuth before selecting it."
            ),
        )
    set_user_active_channel(resolved_user_id, channel_id)
    return {"success": True, "activeChannelId": channel_id}


# ==============================================================================
router.include_router(yt_router)
router.include_router(yt_connection_router)


# Autonomous Video Production & Publishing Schedules Endpoints
# Primary: /api/schedules
# ==============================================================================

@router.get(
    "/api/schedules",
    tags=["Schedules"],
    summary="List Automation Schedules",
    description="Returns all active recurring automated video production and publishing schedules.",
)
async def list_automation_schedules_route(
    authorization: Optional[str] = Header(None),
):
    from backend.database.repository import get_automations
    resolved_uid = _require_session_user_id(authorization)
    return {"success": True, "data": get_automations(user_id=resolved_uid)}


@router.post(
    "/api/schedules",
    tags=["Schedules"],
    summary="Create Automation Schedule",
    description="Creates a recurring automated video generation, TTS narration, and publishing schedule.",
)
async def create_automation_schedule_route(
    payload: dict,
    authorization: Optional[str] = Header(None),
):
    from backend.database.repository import create_automation_job
    theme = payload.get("theme", "Stoic Mindset & Discipline")
    publish_time = payload.get("publishTime", "08:00")
    schedule = payload.get("schedule") or f"Daily at {publish_time}"
    voice = payload.get("voice", "Fenrir")
    music = payload.get("musicTrack", "Epic Cinematic")
    privacy = payload.get("privacyStatus", "public")
    channel_id = payload.get("channelId")
    active = payload.get("active", True)
    ai_model = payload.get("aiModel") or payload.get("ai_model") or DEFAULT_SCRIPT_MODEL
    aspect_ratio = payload.get("aspectRatio") or payload.get("aspect_ratio") or "9:16"
    length = payload.get("length") or "30 seconds"

    resolved_uid = _require_session_user_id(authorization)

    job = create_automation_job(
        theme=theme,
        schedule=schedule,
        voice=voice,
        music_track=music,
        channel_id=channel_id,
        privacy_status=privacy,
        publish_time=publish_time,
        active=active,
        ai_model=ai_model,
        aspect_ratio=aspect_ratio,
        length=length,
        user_id=resolved_uid,
    )
    return {"success": True, "data": job, "message": "Automation schedule created successfully."}


@router.patch(
    "/api/schedules/{job_id}/toggle",
    tags=["Schedules"],
    summary="Toggle Schedule Active State",
    description="Pauses or resumes an automated production schedule.",
)
async def toggle_automation_schedule_route(
    job_id: str,
    authorization: Optional[str] = Header(None),
):
    from backend.database.repository import get_automation_by_id, toggle_automation
    resolved_uid = _require_session_user_id(authorization)
    job = get_automation_by_id(job_id)
    if not job or job.get("userId") != resolved_uid:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Automation job not found.")
    jobs = toggle_automation(job_id, user_id=resolved_uid)
    return {"success": True, "data": jobs}


@router.delete(
    "/api/schedules/{job_id}",
    tags=["Schedules"],
    summary="Delete Automation Schedule",
    description="Deletes an automated schedule and purges its execution history.",
)
async def delete_automation_schedule_route(
    job_id: str,
    authorization: Optional[str] = Header(None),
):
    from backend.database.repository import delete_automation_job, get_automations
    resolved_uid = _require_session_user_id(authorization)
    deleted = delete_automation_job(job_id, user_id=resolved_uid)
    if not deleted:
        raise HTTPException(status_code=404, detail="Automation job not found.")
    return {"success": True, "data": get_automations(user_id=resolved_uid), "message": "Schedule deleted."}


@router.post(
    "/api/schedules/{job_id}/run-now",
    tags=["Schedules"],
    status_code=status.HTTP_202_ACCEPTED,
    summary="Execute Schedule Immediately",
    description="Queues the automated script generation, voice synthesis, and video render pipeline, then returns while it runs in the background.",
)
async def execute_schedule_immediately_route(
    job_id: str,
    payload: Optional[Dict[str, Any]] = Body(default=None),
    authorization: Optional[str] = Header(None),
):
    from .automation_service import start_automation_job
    from backend.database.repository import get_automation_by_id
    resolved_uid = _require_session_user_id(authorization)
    job = get_automation_by_id(job_id)
    if not job or job.get("userId") != resolved_uid:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Automation job not found.")
    try:
        started = start_automation_job(job_id, payload)
        message = "Automation pipeline started." if started else "Automation pipeline is already running."
        return {
            "success": True,
            "accepted": started,
            "jobId": job_id,
            "message": message,
        }
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except Exception as e:
        logger.error("Could not start manual automation job: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail="Could not start automation pipeline.")


@router.post(
    "/api/schedules/{job_id}/stop",
    tags=["Schedules"],
    summary="Stop Running Schedule Pipeline",
)
async def stop_schedule_execution_route(
    job_id: str,
    authorization: Optional[str] = Header(None),
):
    from .automation_service import stop_automation_job
    from backend.database.repository import get_automation_by_id
    resolved_uid = _require_session_user_id(authorization)
    job = get_automation_by_id(job_id)
    if not job or job.get("userId") != resolved_uid:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Automation job not found.")
    try:
        res = stop_automation_job(job_id)
        return {"success": True, "data": res, "message": "Pipeline execution stopped."}
    except Exception as e:
        logger.error(f"Stopping automation execution failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/api/schedules/{job_id}/history",
    tags=["Schedules"],
    summary="Get Schedule Execution History",
    description="Retrieves chronological execution logs, video titles, rendered MP4 links, and published Shorts links.",
)
async def get_schedule_history_route(
    job_id: str,
    limit: int = 100,
    authorization: Optional[str] = Header(None),
):
    from backend.database.repository import get_automation_history, get_automation_by_id
    resolved_uid = _require_session_user_id(authorization)
    job = get_automation_by_id(job_id)
    if not job or job.get("userId") != resolved_uid:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Automation job not found.")
    history = get_automation_history(job_id, limit=limit, user_id=resolved_uid)
    return {"success": True, "data": history}


@router.delete(
    "/api/schedules/{job_id}/history",
    tags=["Schedules"],
    summary="Clear Schedule Execution History",
    description="Clears all recorded run history entries for a given schedule.",
)
async def clear_schedule_history_route(
    job_id: str,
    authorization: Optional[str] = Header(None),
):
    from backend.database.repository import clear_automation_history, get_automation_by_id
    resolved_uid = _require_session_user_id(authorization)
    job = get_automation_by_id(job_id)
    if not job or job.get("userId") != resolved_uid:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Automation job not found.")
    cleared = clear_automation_history(job_id, user_id=resolved_uid)
    return {"success": True, "cleared": cleared}
