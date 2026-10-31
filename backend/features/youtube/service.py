"""
backend/features/youtube/service.py
Service for publishing automated Shorts directly to YouTube.
"""

import logging
from typing import Dict, Any, Optional

from .repository import insert_video
from .youtube_live_service import (
    get_authenticated_youtube_client,
    render_vertical_short,
    upload_video_to_live_youtube,
)

logger = logging.getLogger("ApexMind.YouTube")


def publish_video_to_shorts(
    title: Any = None,
    quote: str = "",
    voice: str = "Fenrir",
    category: str = "Motivation",
    channel_id: Optional[str] = None,
    **kwargs,
) -> Dict[str, Any]:
    """
    Renders and publishes a video short to a connected YouTube channel
    or catalogs it in local studio storage.
    """
    if isinstance(title, dict):
        d = title
        title = d.get("title", "Untitled Short")
        quote = d.get("quote", "")
        voice = d.get("voice", "Fenrir")
        category = d.get("category", "Motivation")
        channel_id = d.get("channel_id") or d.get("channelId")
    elif not title:
        title = kwargs.get("title", "Untitled Short")
        quote = kwargs.get("quote", quote)
        voice = kwargs.get("voice", voice)
        category = kwargs.get("category", category)
        channel_id = kwargs.get("channel_id") or kwargs.get("channelId") or channel_id

    real_video_url = None
    real_video_id = None
    live_uploaded = False

    # Clean up broken ANSI escape codes like 97m from title
    clean_title = re.sub(r'(\x1b\[[0-9;]*[a-zA-Z]|[0-9]{1,2}m)', '', str(title)).strip() or "Untitled Short"

    # Check if Google OAuth authorized YouTube channel is active
    yt_client = get_authenticated_youtube_client()
    if yt_client:
        try:
            logger.info(f"Rendering vertical 9:16 video for live YouTube upload: '{clean_title}'")
            
            # Prefer already rendered studio MP4 if available
            direct_video = kwargs.get("videoUrl") or kwargs.get("video_url")
            video_file = None
            if direct_video and isinstance(direct_video, str):
                if direct_video.startswith("/api/videos/"):
                    cand = Path("backend/data/rendered_shorts") / direct_video.rsplit("/", 1)[-1]
                    if cand.exists():
                        video_file = str(cand.resolve())
                elif Path(direct_video).exists():
                    video_file = str(Path(direct_video).resolve())

            if not video_file:
                video_file = render_vertical_short(
                    title=clean_title,
                    quote=quote,
                    cover_image_url=kwargs.get("coverImageUrl") or kwargs.get("visualTheme"),
                    duration_seconds=15,
                )

            upload_result = upload_video_to_live_youtube(
                video_path=video_file,
                title=clean_title,
                description=quote,
                tags=kwargs.get("tags"),
            )
            real_video_id = upload_result.get("videoId") or upload_result.get("id")
            real_video_url = upload_result.get("videoUrl")
            live_uploaded = True
            logger.info(f"Live YouTube Short published successfully: {real_video_url}")
        except Exception as e:
            logger.error(f"Live YouTube upload encounter error ({e}), storing in studio catalog with fallback link.")

    created = insert_video(
        title=clean_title,
        quote=quote,
        voice=voice,
        category=category,
        channel_id=channel_id,
        video_url=real_video_url,
        custom_id=real_video_id,
    )
    created["liveUploaded"] = live_uploaded
    return {
        "success": True,
        "video": created,
        "liveUploaded": live_uploaded,
    }
