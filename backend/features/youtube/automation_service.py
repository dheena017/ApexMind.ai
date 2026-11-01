"""
backend/features/youtube/automation_service.py
Autonomous Daily YouTube Shorts Pipeline Engine:
Generates Gemini 3.8 scripts, synthesizes voiceovers, renders vertical FFmpeg MP4s,
and publishes or schedules directly to YouTube at configured times.
"""

import asyncio
import logging
import re
import time
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Dict, Any, Optional

from backend.database.repository import (
    get_automation_by_id,
    get_automations,
    update_automation_run_state,
    get_channels,
    add_quote_to_memory,
    get_quote_memory,
)
from backend.features.youtube.repository import insert_video
from backend.features.notifications.service import create_notification
from backend.shared.gemini import (
    generate_gemini_script,
    generate_gemini_voiceover,
)
from .youtube_live_service import (
    get_authenticated_youtube_client,
    render_vertical_short,
    upload_video_to_live_youtube,
)

logger = logging.getLogger("ApexMind.YouTube.Automation")

# Default background nature & stoic visual video loops
FALLBACK_VISUAL_LOOPS = [
    "https://cdn.pixabay.com/video/2020/04/18/36423-411516053_tiny.mp4",
    "https://cdn.pixabay.com/video/2021/08/13/84970-588390119_tiny.mp4",
    "https://cdn.pixabay.com/video/2020/07/04/43831-438459469_tiny.mp4",
    "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=720&q=80",
]


def calculate_next_run_iso(publish_time: str = "08:00", schedule: Optional[str] = None) -> str:
    """Calculate the next upcoming UTC timestamp for a specific daily HH:MM string or recurring interval."""
    now_utc = datetime.now(timezone.utc)
    combined = f"{schedule or ''} {publish_time or ''}".lower()

    # 1. Check for minutes: "every X min", "every X minutes", "X mins"
    m_min = re.search(r'every\s+(\d+)\s*(?:min|minute)', combined)
    if m_min:
        mins = int(m_min.group(1))
        return (now_utc + timedelta(minutes=max(1, mins))).isoformat()

    # 2. Check for hours: "every X hour", "every X hr", "every X hours"
    m_hr = re.search(r'every\s+(\d+)\s*(?:hr|hour)', combined)
    if m_hr:
        hrs = int(m_hr.group(1))
        return (now_utc + timedelta(hours=max(1, hrs))).isoformat()

    # 3. Check for every_Xh or every_Xm code
    m_code = re.search(r'every_(\d+)([hm])', combined)
    if m_code:
        val, unit = int(m_code.group(1)), m_code.group(2)
        if unit == 'h':
            return (now_utc + timedelta(hours=max(1, val))).isoformat()
        elif unit == 'm':
            return (now_utc + timedelta(minutes=max(1, val))).isoformat()

    # 4. Fallback: specific daily time HH:MM
    try:
        parts = publish_time.split(":")
        hour = int(parts[0])
        minute = int(parts[1]) if len(parts) > 1 else 0
        candidate = now_utc.replace(hour=hour, minute=minute, second=0, microsecond=0)
        if candidate <= now_utc:
            candidate += timedelta(days=1)
        return candidate.isoformat()
    except Exception:
        return (now_utc + timedelta(days=1)).isoformat()


def execute_automation_job(job_id: str, override_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Executes the complete autonomous daily video pipeline:
    1. AI Script Writing (Gemini 3.8 Flash with Memory Deduplication) or active workspace timeline
    2. Multi-Scene Visual Footage Resolution (Pexels, Pixabay, Wikimedia, Gemini AI Image)
    3. Voiceover Audio Generation (Gemini 3.8 Flash TTS)
    4. Full Broadcast Multi-Scene Video Rendering (1080x1920 MP4 via FFmpeg with transitions, zoom, and kinetic captions)
    5. YouTube Upload & Publish / Schedule (YouTube Data API v3)
    6. Dashboard Activity Logging & Notification
    """
    job = get_automation_by_id(job_id)
    if not job:
        raise ValueError(f"Automation job '{job_id}' not found.")

    theme = job.get("theme", "Stoic Mindset & Discipline")
    voice = job.get("voice", "Fenrir")
    privacy = job.get("privacyStatus", "public")
    publish_time = job.get("publishTime", "08:00")
    channel_id = job.get("channelId")

    logger.info(f"[Automation] Starting autonomous pipeline for Job '{job_id}' | Theme: '{theme}' | Voice: '{voice}'")
    update_automation_run_state(
        job_id,
        last_status="running",
        last_run_message="Crafting Multi-Scene Storyboard & Resolving Footage...",
    )
    start_time = time.perf_counter()

    try:
        from backend.features.workspace.video_render_service import render_studio_video
        from backend.features.media.schemas import SceneResolveItem
        from backend.features.media.service import resolve_scenes_batch

        title = None
        quote_text = None
        cta_text = "Execute today without excuses."
        audio_path = None
        video_clips = []
        image_clips = []
        subtitles = []
        music_url = None
        actual_duration = 20.0

        # Check if caller supplied active workspace timeline clips
        has_custom_clips = override_data and (
            (override_data.get("videoClips") and len(override_data["videoClips"]) > 0) or
            (override_data.get("imageClips") and len(override_data["imageClips"]) > 0)
        )

        if has_custom_clips:
            logger.info(f"[Automation] Using active workspace timeline clips ({len(override_data.get('videoClips', []))} videos, {len(override_data.get('imageClips', []))} images)")
            video_clips = override_data.get("videoClips") or []
            image_clips = override_data.get("imageClips") or []
            title = override_data.get("title") or f"Daily {theme} Short"
            quote_text = override_data.get("quote") or "Discipline equals freedom."
            subtitles = override_data.get("subtitles") or []
            audio_path = override_data.get("audioUrl")
            music_url = override_data.get("musicUrl")
            actual_duration = float(override_data.get("duration") or 20.0)
        else:
            # Step 1: Generate original motivational script with memory deduplication
            memory_quotes = get_quote_memory(limit=15)
            script_data = generate_gemini_script(
                category=theme,
                topic=theme,
                tone="motivational",
                length="30s",
                memory_quotes=memory_quotes,
            )

            title = script_data.get("title") or f"Daily {theme} Short"
            quote_text = script_data.get("quote") or script_data.get("fullScript") or "Discipline equals freedom."
            hook_text = script_data.get("hook") or "Wake up with intent."
            cta_text = script_data.get("cta") or "Execute today without excuses."
            storyboard = script_data.get("storyboard") or []

            # Record quote in memory to avoid future duplicates
            try:
                add_quote_to_memory(title=title, quote=quote_text, category=theme, hook=hook_text)
            except Exception as mem_err:
                logger.debug(f"[Automation] Memory record notice: {mem_err}")

            # Step 2: Synthesize voiceover audio using Gemini TTS
            update_automation_run_state(
                job_id,
                last_status="running",
                last_run_message=f"Synthesizing Voiceover with '{voice}'...",
            )
            narration_full = f"{hook_text} {quote_text} {cta_text}"
            voice_result = generate_gemini_voiceover(
                text=narration_full,
                voice_name=voice,
                storyboard=storyboard,
            )

            audio_bytes = None
            if voice_result.get("audioBase64"):
                import base64
                audio_bytes = base64.b64decode(voice_result["audioBase64"])

            if audio_bytes:
                audio_dir = Path("backend/data/audio")
                audio_dir.mkdir(parents=True, exist_ok=True)
                audio_path = str((audio_dir / f"auto_voice_{int(time.time() * 1000)}.wav").resolve())
                with open(audio_path, "wb") as f:
                    f.write(audio_bytes)

            actual_duration = float(voice_result.get("duration") or 20.0)
            subtitles = voice_result.get("subtitles") or script_data.get("subtitles") or []
            music_url = script_data.get("soundDesign", {}).get("audioUrl") or None

            # Step 3: Resolve high-definition footage for EVERY scene in the storyboard
            update_automation_run_state(
                job_id,
                last_status="running",
                last_run_message=f"Resolving cinematic visual scenes ({len(storyboard)} cuts)...",
            )
            if storyboard:
                scene_items = []
                for idx, sc in enumerate(storyboard):
                    q = sc.get("visualQuery") or sc.get("googleSearchQuery") or f"{theme} nature cinematic"
                    scene_items.append(SceneResolveItem(
                        sceneNumber=int(sc.get("sceneNumber", idx + 1)),
                        visualQuery=q,
                        mediaType=sc.get("mediaType", "video"),
                        fallbackQueries=sc.get("fallbackQueries") or [f"{theme} landscape 4k"],
                    ))

                try:
                    batch_res = resolve_scenes_batch(scene_items, aspect_ratio="9:16")
                    for sc, r in zip(storyboard, batch_res.scenes):
                        media = r.media
                        if media and media.url:
                            clip = {
                                "id": f"clip_{sc.get('sceneNumber', 1)}",
                                "url": media.url,
                                "start": float(sc.get("start", 0.0)),
                                "duration": float(sc.get("duration", 4.0)),
                                "transition": sc.get("transition", "fade"),
                                "title": sc.get("mediaName") or media.title or f"Scene {sc.get('sceneNumber')}",
                                "type": media.mediaType,
                            }
                            if media.mediaType == "video":
                                video_clips.append(clip)
                            else:
                                image_clips.append(clip)
                except Exception as res_err:
                    logger.warning(f"[Automation] Batch scene resolution error: {res_err}")

            if not subtitles and storyboard:
                subtitles = [
                    {
                        "start": float(sc.get("start", 0.0)),
                        "duration": float(sc.get("duration", 3.5)),
                        "text": sc.get("subtitleText", ""),
                    }
                    for sc in storyboard if sc.get("subtitleText")
                ]

        # Step 4: Render broadcast-quality multi-scene 9:16 MP4 video with FFmpeg
        update_automation_run_state(
            job_id,
            last_status="running",
            last_run_message="Rendering 1080x1920 MP4 with transitions and subtitles...",
        )
        video_path = None
        try:
            rendered = render_studio_video(
                title=title or theme,
                aspect_ratio="9:16",
                duration=actual_duration,
                exact_duration=actual_duration,
                audio_url=audio_path,
                music_url=music_url,
                video_clips=video_clips if video_clips else None,
                image_clips=image_clips if image_clips else None,
                backdrop_url=video_clips[0]["url"] if video_clips else (image_clips[0]["url"] if image_clips else None),
                backdrop_type="video" if video_clips else "image",
                subtitles=subtitles,
                caption_color="#FACC15",
                caption_font="Impact",
                caption_transform="uppercase",
            )
            cand = rendered.get("video_path") or rendered.get("videoPath")
            if not cand and rendered.get("filename"):
                cand = str((Path("backend/data/rendered_shorts") / rendered["filename"]).resolve())
            if not cand and rendered.get("videoUrl"):
                fname = rendered["videoUrl"].split("/")[-1]
                cand = str((Path("backend/data/rendered_shorts") / fname).resolve())
            if cand and Path(cand).exists():
                video_path = cand
                logger.info(f"[Automation] Studio multi-scene video successfully rendered: {video_path}")
        except Exception as studio_err:
            logger.warning(f"[Automation] Studio render engine failed ({studio_err}), falling back to direct vertical renderer.")

        if not video_path or not Path(video_path).exists():
            chosen_visual = FALLBACK_VISUAL_LOOPS[int(time.time()) % len(FALLBACK_VISUAL_LOOPS)]
            video_path = render_vertical_short(
                title=title or theme,
                quote=quote_text or "Discipline equals freedom.",
                cover_image_url=chosen_visual,
                audio_path=audio_path,
                duration_seconds=int(actual_duration) or 20,
            )

        # Step 5: Publish or Schedule to YouTube
        yt_client = get_authenticated_youtube_client()
        upload_res = None
        youtube_url = None
        is_scheduled = privacy == "scheduled"
        publish_at_iso = None

        if yt_client:
            if is_scheduled:
                # Schedule publication for upcoming target time
                now_utc = datetime.now(timezone.utc)
                parts = publish_time.split(":")
                h, m = int(parts[0]), int(parts[1]) if len(parts) > 1 else 0
                sched_target = now_utc.replace(hour=h, minute=m, second=0, microsecond=0)
                if sched_target <= now_utc:
                    sched_target += timedelta(days=1)
                publish_at_iso = sched_target.isoformat().replace("+00:00", "Z")

            try:
                upload_res = upload_video_to_live_youtube(
                    video_path=video_path,
                    title=f"{title} #Shorts",
                    description=f"{quote_text}\n\n{cta_text}\n\n#ApexMind #Shorts #{theme.replace(' ', '')}",
                    tags=["#Shorts", "#Motivation", "#Discipline", f"#{theme.replace(' ', '')}"],
                    privacy_status="private" if is_scheduled else "public",
                    publish_at=publish_at_iso,
                )
                youtube_url = upload_res.get("videoUrl")
                logger.info(f"[Automation] YouTube upload success: {youtube_url} | Status: {upload_res.get('status')}")
            except Exception as up_err:
                logger.warning(f"[Automation] Direct YouTube upload encountered network error: {up_err}. Cataloging video locally in Studio.")

        # Step 5: Catalog video in local studio database
        rel_video_url = f"/api/videos/{Path(video_path).name}"
        insert_video(
            title=title,
            quote=quote_text,
            views=0,
            likes=0,
            duration=f"00:{int(voice_result.get('duration', 20)):02d}",
            channel_id=channel_id,
            video_url=youtube_url or rel_video_url,
            category=theme,
            voice=voice,
        )

        # Step 6: Create high-priority activity notification
        if youtube_url:
            status_label = f"Scheduled on YouTube for {publish_time}" if is_scheduled else "Published to YouTube Shorts"
            notif_type = "success"
        elif yt_client:
            status_label = "Generated in Studio (YouTube network upload timed out, ready to publish manually)"
            notif_type = "warning"
        else:
            status_label = "Generated & Ready in Studio (Connect YouTube to Auto-Publish)"
            notif_type = "success"

        create_notification(
            title="Daily Automation Complete",
            message=f"'{title}' was automatically rendered and {status_label.lower()}.",
            type=notif_type,
            category="youtube",
            action_url=youtube_url or "/videos",
            priority="high",
        )

        # Step 7: Calculate next scheduled run and update detailed execution state
        job_schedule = job.get("schedule", "")
        next_run = calculate_next_run_iso(publish_time, job_schedule)
        is_live = bool(youtube_url)
        run_msg = (
            f"Scheduled for {publish_time} on YouTube" if is_scheduled
            else "Published Live to YouTube Shorts" if is_live
            else "Saved to Studio Library (Connect YouTube channel to publish live)"
        )
        update_automation_run_state(
            job_id,
            last_status="success",
            next_run=next_run,
            last_video_title=title,
            last_video_url=youtube_url or rel_video_url,
            last_run_message=run_msg,
            last_is_live=is_live,
        )

        elapsed = round(time.perf_counter() - start_time, 2)
        logger.info(f"[Automation] Pipeline completed in {elapsed}s for job '{job_id}' | Next run: {next_run} | Live: {is_live}")

        # Step 8: Persist detailed entry to execution history log
        try:
            from backend.database.repository import add_automation_history
            add_automation_history(
                job_id=job_id,
                status="success",
                video_title=title,
                video_url=rel_video_url,
                youtube_url=youtube_url,
                is_live=is_live,
                duration_seconds=elapsed,
                message=run_msg,
            )
        except Exception as hist_err:
            logger.debug(f"[Automation] History log error: {hist_err}")

        return {
            "success": True,
            "jobId": job_id,
            "title": title,
            "quote": quote_text,
            "videoUrl": youtube_url or rel_video_url,
            "youtubeStatus": upload_res.get("status") if upload_res else "local_cataloged",
            "publishAt": publish_at_iso,
            "durationSeconds": elapsed,
            "nextRun": next_run,
            "isLive": is_live,
            "statusMessage": run_msg,
        }

    except Exception as e:
        logger.error(f"[Automation] Pipeline execution failed for job '{job_id}': {e}", exc_info=True)
        update_automation_run_state(
            job_id,
            last_status="failed",
            last_run_message=str(e),
            last_is_live=False,
        )
        try:
            from backend.database.repository import add_automation_history
            add_automation_history(
                job_id=job_id,
                status="failed",
                video_title=title if 'title' in locals() and title else theme,
                is_live=False,
                duration_seconds=round(time.perf_counter() - start_time, 2),
                message=str(e),
            )
        except Exception:
            pass
        create_notification(
            title="Daily Automation Failed",
            message=f"Pipeline error for theme '{theme}': {str(e)}",
            type="error",
            category="youtube",
            priority="high",
        )
        raise RuntimeError(f"Automation pipeline failed: {str(e)}")


async def automation_scheduler_loop():
    """Background asyncio worker that periodically checks and triggers due automation jobs."""
    logger.info("[Automation Scheduler] Background scheduler initialized and running.")
    while True:
        try:
            await asyncio.sleep(60)  # Check every 60 seconds
            jobs = get_automations()
            now_utc = datetime.now(timezone.utc)

            for job in jobs:
                if not job.get("active"):
                    continue
                next_run_str = job.get("nextRun")
                if not next_run_str:
                    continue

                try:
                    next_run_dt = datetime.fromisoformat(next_run_str.replace("Z", "+00:00"))
                    if now_utc >= next_run_dt:
                        logger.info(f"[Automation Scheduler] Job '{job['id']}' is due (Scheduled: {next_run_str}, Now: {now_utc.isoformat()}). Triggering...")
                        # Run pipeline in a background thread so async loop isn't blocked by FFmpeg
                        loop = asyncio.get_running_loop()
                        await loop.run_in_executor(None, execute_automation_job, job["id"])
                except Exception as job_err:
                    logger.error(f"[Automation Scheduler] Error processing job '{job.get('id')}': {job_err}")

        except asyncio.CancelledError:
            logger.info("[Automation Scheduler] Background scheduler received cancellation signal.")
            break
        except Exception as e:
            logger.warning(f"[Automation Scheduler] Unexpected scheduler loop exception: {e}")
            await asyncio.sleep(10)
