"""
backend/features/youtube/service.py
Service for publishing automated Shorts directly to YouTube.
"""

import logging
import re
from pathlib import Path
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
    Renders and publishes a broadcast-quality video short to a connected YouTube channel
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
    upload_error = None

    # Clean up broken ANSI escape codes like 97m from title
    clean_title = re.sub(r'(\x1b\[[0-9;]*[a-zA-Z]|[0-9]{1,2}m)', '', str(title)).strip() or "Untitled Short"

    # Check if Google OAuth authorized YouTube channel is active
    yt_client = get_authenticated_youtube_client()
    if yt_client:
        try:
            logger.info(f"Rendering broadcast-quality vertical 9:16 video for live YouTube upload: '{clean_title}'")
            
            # 1. Prefer already rendered studio MP4 if available
            direct_video = kwargs.get("videoUrl") or kwargs.get("video_url")
            video_file = None
            if direct_video and isinstance(direct_video, str):
                if direct_video.startswith("/api/videos/"):
                    cand = Path("backend/data/rendered_shorts") / direct_video.rsplit("/", 1)[-1]
                    if cand.exists():
                        video_file = str(cand.resolve())
                elif Path(direct_video).exists():
                    video_file = str(Path(direct_video).resolve())

            # 2. Render broadcast-quality video using server-side Studio Video Render Engine
            if not video_file:
                try:
                    from backend.features.workspace.video_render_service import render_studio_video

                    # Resolve narration audio; synthesize if not provided
                    audio_cand = kwargs.get("audioUrl") or kwargs.get("audio_url")
                    if not audio_cand and quote:
                        try:
                            from backend.features.workspace.service import synthesize_voiceover
                            synth_res = synthesize_voiceover(text=quote, voice_name=voice or "Fenrir")
                            if synth_res and synth_res.get("audioUrl"):
                                audio_cand = synth_res.get("audioUrl")
                        except Exception as synth_err:
                            logger.warning(f"Live voiceover synthesis fallback: {synth_err}")

                    # Resolve backdrop media
                    backdrop_cand = (
                        direct_video
                        or kwargs.get("coverImageUrl")
                        or kwargs.get("cover_image_url")
                    )
                    backdrop_url = None
                    if isinstance(backdrop_cand, str) and (
                        backdrop_cand.startswith("http://")
                        or backdrop_cand.startswith("https://")
                        or backdrop_cand.startswith("/api/")
                        or Path(backdrop_cand).exists()
                    ):
                        backdrop_url = backdrop_cand

                    # Build kinetic subtitles if not explicitly passed
                    subtitles = kwargs.get("subtitles")
                    if not subtitles or not isinstance(subtitles, list) or len(subtitles) == 0:
                        subtitles = []
                        if clean_title:
                            subtitles.append({"start": 0.0, "duration": 3.5, "text": clean_title})
                        if quote:
                            subtitles.append({"start": 3.5, "duration": 8.0, "text": quote[:140]})

                    req_dur = float(kwargs.get("duration") or 15.0)

                    rendered = render_studio_video(
                        title=clean_title,
                        aspect_ratio=kwargs.get("aspectRatio") or "9:16",
                        duration=req_dur,
                        exact_duration=req_dur if audio_cand else None,
                        audio_url=audio_cand,
                        music_url=kwargs.get("musicUrl") or kwargs.get("music_url"),
                        backdrop_url=backdrop_url,
                        backdrop_type="video" if (backdrop_url and any(backdrop_url.lower().endswith(ext) for ext in [".mp4", ".webm", ".mov"])) else "image",
                        video_clips=kwargs.get("videoClips"),
                        image_clips=kwargs.get("imageClips"),
                        subtitles=subtitles,
                        caption_color="#FACC15",
                        caption_font="Impact",
                        caption_transform="uppercase",
                    )
                    cand_path = rendered.get("video_path") or rendered.get("videoPath")
                    if not cand_path and rendered.get("filename"):
                        cand_path = str((Path("backend/data/rendered_shorts") / rendered["filename"]).resolve())
                    if not cand_path and rendered.get("videoUrl"):
                        fname = rendered["videoUrl"].split("/")[-1]
                        cand_path = str((Path("backend/data/rendered_shorts") / fname).resolve())

                    if cand_path and Path(cand_path).exists():
                        video_file = cand_path
                        logger.info(f"Studio video successfully rendered for YouTube: {video_file}")
                except Exception as studio_err:
                    logger.warning(f"Studio render engine exception ({studio_err}), falling back to direct vertical renderer.")

            # 3. Fallback to direct vertical renderer if studio engine was unavailable
            if not video_file or not Path(video_file).exists():
                video_file = render_vertical_short(
                    title=clean_title,
                    quote=quote,
                    cover_image_url=kwargs.get("coverImageUrl") or kwargs.get("visualTheme"),
                    duration_seconds=int(kwargs.get("duration") or 15),
                )

            desc_text = kwargs.get("description") or quote
            tags_val = kwargs.get("tags")
            privacy_val = kwargs.get("privacyStatus") or kwargs.get("privacy_status") or kwargs.get("privacy") or "public"

            upload_result = upload_video_to_live_youtube(
                video_path=video_file,
                title=clean_title,
                description=desc_text,
                tags=tags_val,
                privacy_status=privacy_val,
            )
            real_video_id = upload_result.get("videoId") or upload_result.get("id")
            real_video_url = upload_result.get("videoUrl")
            live_uploaded = True
            logger.info(f"Live YouTube Short published successfully: {real_video_url}")
        except Exception as e:
            upload_error = str(e)
            logger.error(f"Live YouTube upload error ({e}), storing in studio catalog with fallback link.")

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
    created["videoUrl"] = real_video_url
    created["shortsUrl"] = f"https://www.youtube.com/shorts/{real_video_id}" if real_video_id else real_video_url
    created["videoId"] = real_video_id
    if upload_error:
        created["error"] = upload_error

    return {
        "success": True,
        "video": created,
        "videoId": real_video_id,
        "videoUrl": real_video_url,
        "shortsUrl": f"https://www.youtube.com/shorts/{real_video_id}" if real_video_id else real_video_url,
        "liveUploaded": live_uploaded,
        "error": upload_error,
        "message": "Video successfully uploaded to YouTube Shorts!" if live_uploaded else (upload_error or "Video saved to Studio library."),
    }
