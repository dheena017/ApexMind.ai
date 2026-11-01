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
)
from backend.features.youtube.repository import insert_video
from backend.features.notifications.service import create_notification
from backend.features.workspace.studio_script_service import run_studio_script
from backend.features.workspace.studio_voice_service import run_studio_voice
from backend.features.workspace.studio_media_service import run_studio_media
from backend.features.workspace.studio_captions_service import run_studio_captions
from backend.features.workspace.video_render_service import render_studio_video
from .youtube_live_service import (
    get_authenticated_youtube_client,
    upload_video_to_live_youtube,
)

logger = logging.getLogger("ApexMind.YouTube.Automation")


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


import re
import time
from pathlib import Path
from typing import Dict, Any, Optional

def execute_automation_job(job_id: str, override_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Executes the autonomous 6-stage production pipeline:
    Stage 1: Script Writing (POST /api/studio/generate-script via Gemini AI + Quote Memory)
    Stage 2: Voiceover Synthesis (POST /api/studio/synthesize-voice via Neural Voice TTS)
    Stage 3: B-Roll Media Resolution (POST /api/studio/resolve-media via Pexels and Pixabay)
    Stage 4: Syllable Captions Alignment (POST /api/studio/generate-captions via Acoustic Aligner)
    Stage 5: Full HD MP4 Video Render (POST /api/workspace/render-video via native FFmpeg)
    Stage 6: YouTube Live Shorts Publication (POST /api/youtube/publish via YouTube Data API v3)
    """
    job = get_automation_by_id(job_id)
    if not job:
        raise ValueError(f"Automation job '{job_id}' not found.")

    theme = job.get("theme", "Stoic Mindset & Discipline")
    voice = job.get("voice", "Fenrir")
    privacy = job.get("privacyStatus", "public")
    publish_time = job.get("publishTime", "08:00")
    channel_id = job.get("channelId")

    logger.info(f"[Automation/6-Stage] Starting pipeline for Job '{job_id}' | Theme: '{theme}' | Voice: '{voice}'")
    start_time = time.perf_counter()

    try:
        title = None
        quote_text = None
        hook_text = None
        cta_text = "Execute today without excuses."
        audio_path = None
        video_clips = []
        image_clips = []
        sfx_clips = []
        subtitles = []
        music_url = None
        actual_duration = 20.0
        storyboard = []

        # Check if caller supplied active workspace timeline clips
        has_custom_clips = override_data and (
            (override_data.get("videoClips") and len(override_data["videoClips"]) > 0) or
            (override_data.get("imageClips") and len(override_data["imageClips"]) > 0)
        )

        if has_custom_clips:
            logger.info(f"[Automation/6-Stage] Using active workspace timeline clips ({len(override_data.get('videoClips', []))} videos, {len(override_data.get('imageClips', []))} images)")
            video_clips = override_data.get("videoClips") or []
            image_clips = override_data.get("imageClips") or []
            title = override_data.get("title") or f"Daily {theme} Short"
            quote_text = override_data.get("quote") or "Discipline equals freedom."
            subtitles = override_data.get("subtitles") or []
            audio_path = override_data.get("audioUrl")
            music_url = override_data.get("musicUrl")
            actual_duration = float(override_data.get("duration") or 20.0)
        else:
            # ── STAGE 1: SCRIPT WRITING (POST /api/studio/generate-script) ──
            update_automation_run_state(
                job_id,
                last_status="running",
                last_run_message="Stage 1/6: Generating viral script & multi-scene storyboard with Gemini AI...",
            )
            logger.info(f"[Automation/Stage-1] Writing script for '{theme}'")
            script_resp = run_studio_script(
                category=theme,
                topic=theme,
                tone="motivational",
                length="30 seconds",
                model="gemini-2.5-flash",
                aspect_ratio="9:16",
                voice_name=voice,
            )
            script_data = script_resp.get("data") or {}
            title = script_data.get("title") or f"Daily {theme} Short"
            quote_text = script_data.get("quote") or script_data.get("fullScript") or "Discipline equals freedom."
            hook_text = script_data.get("hook") or "Wake up with intent."
            cta_text = script_data.get("cta") or "Execute today without excuses."
            storyboard = script_data.get("storyboard") or []
            if not storyboard:
                raise RuntimeError(f"Stage 1 (Script) Error: Gemini failed to generate storyboard scenes for '{theme}'.")

            music_url = script_data.get("soundDesign", {}).get("audioUrl") or None
            sfx_events = script_data.get("soundDesign", {}).get("sfxEvents") or []

            # ── STAGE 2: VOICEOVER SYNTHESIS (POST /api/studio/synthesize-voice) ──
            update_automation_run_state(
                job_id,
                last_status="running",
                last_run_message=f"Stage 2/6: Synthesizing Neural Voiceover with '{voice}'...",
            )
            logger.info(f"[Automation/Stage-2] Synthesizing voiceover with '{voice}'")
            full_narration = f"{hook_text} {quote_text} {cta_text}"
            voice_resp = run_studio_voice(
                voice_name=voice,
                storyboard=storyboard,
                full_narration_text=full_narration,
                target_duration_seconds=25.0,
            )
            actual_duration = float(voice_resp.get("durationSeconds") or 20.0)

            # Persist WAV file to disk for FFmpeg
            audio_path = None
            audio_b64 = voice_resp.get("audioBase64")
            if audio_b64:
                import base64
                raw_bytes = base64.b64decode(audio_b64)
                audio_dir = Path("backend/data/audio")
                audio_dir.mkdir(parents=True, exist_ok=True)
                audio_path = str((audio_dir / f"auto_voice_{int(time.time() * 1000)}.wav").resolve())
                with open(audio_path, "wb") as f:
                    f.write(raw_bytes)
            elif voice_resp.get("audioUrl"):
                raw_u = voice_resp["audioUrl"]
                if not raw_u.startswith("data:"):
                    audio_path = raw_u

            if not audio_path or not Path(audio_path).exists():
                raise RuntimeError(
                    f"Stage 2 (Voice) Error: Neural Voice synthesis failed to produce an audio file for voice '{voice}'."
                )

            # Use audio-aligned storyboard if available
            aligned_sb = voice_resp.get("alignedStoryboard")
            if aligned_sb and len(aligned_sb) > 0:
                storyboard = aligned_sb

            # ── STAGE 3: B-ROLL MEDIA RESOLUTION (POST /api/studio/resolve-media) ──
            update_automation_run_state(
                job_id,
                last_status="running",
                last_run_message=f"Stage 3/6: Resolving 4K stock B-Roll for {len(storyboard)} scenes...",
            )
            logger.info(f"[Automation/Stage-3] Resolving stock media for {len(storyboard)} scenes")
            try:
                media_resp = run_studio_media(
                    scenes=storyboard,
                    aspect_ratio="9:16",
                    sfx_events=sfx_events,
                )
                media_data = media_resp.get("data") or {}
                resolved_scenes = media_data.get("scenes") or []

                for sc_res, sc_orig in zip(resolved_scenes, storyboard):
                    m = sc_res.get("media")
                    if m and m.get("url"):
                        clip = {
                            "id": f"clip_{sc_res.get('sceneNumber', 1)}",
                            "url": m["url"],
                            "start": float(sc_orig.get("start", 0.0)),
                            "duration": float(sc_orig.get("duration", 4.0)),
                            "transition": sc_orig.get("transition", "fade"),
                            "title": m.get("title") or f"Scene {sc_res.get('sceneNumber')}",
                            "type": sc_res.get("mediaType", "video"),
                        }
                        if sc_res.get("mediaType") == "image":
                            image_clips.append(clip)
                        else:
                            video_clips.append(clip)

                # Process resolved SFX
                for sfx in media_data.get("sfxEvents") or []:
                    if sfx.get("sfxUrl"):
                        sfx_clips.append({
                            "url": sfx["sfxUrl"],
                            "start": float(sfx.get("start", 0.0)),
                            "duration": float(sfx.get("duration", 1.5)),
                            "volume": float(sfx.get("volume", 0.85)),
                        })
            except Exception as media_err:
                logger.error(f"[Automation/Stage-3] Media resolution failed: {media_err}")
                raise RuntimeError(f"Stage 3 (B-Roll) Error: Media resolution failed: {media_err}")

            if not video_clips and not image_clips:
                raise RuntimeError(
                    f"Stage 3 (B-Roll) Error: No video or image clips could be resolved for '{theme}'. "
                    f"Please verify Pexels / Pixabay stock media configuration or queries."
                )

            # ── STAGE 4: SYLLABLE CAPTIONS ALIGNMENT (POST /api/studio/generate-captions) ──
            update_automation_run_state(
                job_id,
                last_status="running",
                last_run_message="Stage 4/6: Aligning word-timed kinetic karaoke captions...",
            )
            logger.info(f"[Automation/Stage-4] Generating aligned karaoke captions for {actual_duration:.1f}s")
            try:
                captions_resp = run_studio_captions(
                    storyboard_scenes=storyboard,
                    duration_seconds=actual_duration,
                    full_narration_text=full_narration,
                    style_preset="yellow_pop",
                    aspect_ratio="9:16",
                    caption_color="#FACC15",
                    caption_font_family="Impact",
                )
                c_data = captions_resp.get("data") or {}
                subtitles = c_data.get("timelineClips") or c_data.get("segments") or []
            except Exception as cap_err:
                logger.error(f"[Automation/Stage-4] Captions generation failed: {cap_err}")
                raise RuntimeError(f"Stage 4 (Captions) Error: Captions generation failed: {cap_err}")

            if not subtitles:
                raise RuntimeError("Stage 4 (Captions) Error: No subtitles generated for video.")

        # ── STAGE 5: FULL HD MP4 VIDEO RENDER (POST /api/workspace/render-video) ──
        update_automation_run_state(
            job_id,
            last_status="running",
            last_run_message="Stage 5/6: Rendering 1080x1920 MP4 with audio ducking and kinetic captions...",
        )
        logger.info(f"[Automation/Stage-5] Rendering studio video '{title}' via FFmpeg")
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
                sfx_clips=sfx_clips if sfx_clips else None,
                backdrop_url=video_clips[0]["url"] if video_clips else (image_clips[0]["url"] if image_clips else None),
                backdrop_type="video" if video_clips else "image",
                subtitles=subtitles,
                caption_color="#FACC15",
                caption_font="Impact",
                caption_transform="uppercase",
                ducking_settings={
                    "enabled": True,
                    "reductionDb": 14.0,
                    "attackMs": 150,
                    "releaseMs": 350,
                },
                music_volume=0.45,
                voice_volume=1.0,
            )
            cand = rendered.get("video_path") or rendered.get("videoPath")
            if not cand and rendered.get("filename"):
                cand = str((Path("backend/data/rendered_shorts") / rendered["filename"]).resolve())
            if not cand and rendered.get("videoUrl"):
                fname = rendered["videoUrl"].split("/")[-1]
                cand = str((Path("backend/data/rendered_shorts") / fname).resolve())
            if cand and Path(cand).exists():
                video_path = cand
                logger.info(f"[Automation/Stage-5] Studio video successfully rendered: {video_path}")
        except Exception as studio_err:
            logger.error(f"[Automation/Stage-5] Studio render engine failed: {studio_err}")
            raise RuntimeError(f"Stage 5 (Render) Error: FFmpeg video rendering failed: {studio_err}")

        if not video_path or not Path(video_path).exists():
            raise RuntimeError("Stage 5 (Render) Error: FFmpeg failed to produce 1080x1920 MP4 file.")

        # ── STAGE 6: YOUTUBE LIVE SHORTS PUBLISH (POST /api/youtube/publish) ──
        update_automation_run_state(
            job_id,
            last_status="running",
            last_run_message="Stage 6/6: Uploading and publishing Short to YouTube...",
        )
        logger.info(f"[Automation/Stage-6] Publishing video to YouTube")
        yt_client = get_authenticated_youtube_client()
        upload_res = None
        youtube_url = None
        is_scheduled = privacy == "scheduled"
        publish_at_iso = None

        # Build viral hashtags and rich description
        theme_tag = re.sub(r'[^a-zA-Z0-9]', '', theme)
        viral_tags = ["#Shorts", "#Motivation", "#Discipline", f"#{theme_tag}", "#ViralShorts", "#DailyMindset"]
        clean_desc = f"{quote_text}\n\n{cta_text}\n\n{' '.join(viral_tags)}\n\nGenerated autonomously with ApexMind Studio AI."

        if yt_client:
            if is_scheduled:
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
                    description=clean_desc,
                    tags=["#Shorts", "#Motivation", "#Discipline", f"#{theme_tag}"],
                    privacy_status="private" if is_scheduled else "public",
                    publish_at=publish_at_iso,
                )
                youtube_url = upload_res.get("videoUrl")
                logger.info(f"[Automation/Stage-6] YouTube upload success: {youtube_url} | Status: {upload_res.get('status')}")
            except Exception as up_err:
                logger.error(f"[Automation/Stage-6] YouTube upload failed: {up_err}")
                raise RuntimeError(f"Stage 6 (Publish) Error: YouTube upload failed: {up_err}")

        # Catalog in local database
        rel_video_url = f"/api/videos/{Path(video_path).name}"
        insert_video(
            title=title,
            quote=quote_text,
            views=0,
            likes=0,
            duration=f"00:{int(actual_duration):02d}",
            channel_id=channel_id,
            video_url=youtube_url or rel_video_url,
            category=theme,
            voice=voice,
        )

        # Create activity notification
        if youtube_url:
            status_label = f"Scheduled on YouTube for {publish_time}" if is_scheduled else "Published to YouTube Shorts"
            notif_type = "success"
        elif yt_client:
            status_label = "Generated in Studio (Ready to publish manually)"
            notif_type = "warning"
        else:
            status_label = "Generated & Ready in Studio Library"
            notif_type = "success"

        create_notification(
            title="6-Stage Automation Complete",
            message=f"'{title}' was automatically rendered and {status_label.lower()}.",
            type=notif_type,
            category="youtube",
            action_url=youtube_url or "/videos",
            priority="high",
        )

        # Calculate next scheduled run
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
        logger.info(f"[Automation/6-Stage] Pipeline completed in {elapsed}s for job '{job_id}' | Next run: {next_run} | Live: {is_live}")

        # Persist entry to execution history log
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
        logger.error(f"[Automation/6-Stage] Execution failed for job '{job_id}': {e}", exc_info=True)
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
            title="Automation Pipeline Failed",
            message=f"Pipeline error for '{theme}': {str(e)}",
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
