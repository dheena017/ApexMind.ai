"""
backend/features/workspace/automation/youtube/service.py
Autonomous YouTube Shorts Production Pipeline:
Executes the 6-stage video creation pipeline:
Stage 1: Script Writing (Gemini AI + Quote Memory)
Stage 2: Voiceover Synthesis (Neural Voice TTS)
Stage 3: B-Roll Media Resolution (Pexels, Pixabay)
Stage 4: Syllable Captions Alignment (Karaoke Aligner)
Stage 5: Full HD MP4 Video Render (FFmpeg)
Stage 6: YouTube Live Shorts Publication (YouTube Data API v3)
"""

import base64
from datetime import datetime, timedelta, timezone
import logging
from pathlib import Path
import re
import time
from typing import Any, Dict, Optional

from backend.database.repository import (
    add_automation_history,
    get_automation_by_id,
    update_automation_run_state,
)
from backend.features.notifications.service import create_notification
from backend.features.workspace.script_ai import run_studio_script
from backend.features.workspace.studio import (
    run_studio_captions,
    run_studio_media,
    run_studio_voice,
)
from backend.features.youtube.repository import insert_video
from backend.features.youtube.youtube_live_service import (
    get_authenticated_youtube_client,
    upload_video_to_live_youtube,
)
from backend.shared.ai_models import DEFAULT_SCRIPT_MODEL, resolve_script_model
from backend.shared.job import (
    calculate_next_run_iso,
    is_job_running,
    is_stop_requested,
    mark_job_finished,
    mark_job_running,
    register_job_executor,
)
from backend.shared.video_renderer import render_studio_video

logger = logging.getLogger("ApexMind.Workspace.Automation.YouTube")


def execute_automation_job(
    job_id: str,
    override_data: Optional[Dict[str, Any]] = None,
    already_registered: bool = False,
) -> Dict[str, Any]:
    """
    Executes the autonomous 6-stage production pipeline for YouTube Shorts:
    Stage 1: Script Writing (via Gemini AI + Quote Memory)
    Stage 2: Voiceover Synthesis (via Neural Voice TTS)
    Stage 3: B-Roll Media Resolution (via Pexels and Pixabay)
    Stage 4: Syllable Captions Alignment (via Acoustic Aligner)
    Stage 5: Full HD MP4 Video Render (via native FFmpeg)
    Stage 6: YouTube Live Shorts Publication (via YouTube Data API v3)
    """
    job = get_automation_by_id(job_id)
    if not job:
        raise ValueError(f"Automation job '{job_id}' not found.")

    theme = job.get("theme", "Stoic Mindset & Discipline")
    voice = job.get("voice", "Fenrir")
    privacy = job.get("privacyStatus", "public")
    publish_time = job.get("publishTime", "08:00")
    channel_id = job.get("channelId")
    raw_model = job.get("aiModel") or job.get("ai_model") or DEFAULT_SCRIPT_MODEL
    ai_model = resolve_script_model(raw_model)
    aspect_ratio = job.get("aspectRatio") or job.get("aspect_ratio") or "9:16"
    length_str = job.get("length") or "30 seconds"
    m_sec = re.search(r'(\d+)', length_str)
    target_sec = float(m_sec.group(1)) if m_sec else 30.0

    if not already_registered:
        if not mark_job_running(job_id):
            logger.warning(f"[YouTube Automation] Job '{job_id}' is already executing! Skipping duplicate trigger.")
            return job

    # Immediately calculate and persist advanced nextRun so scheduler does not consider it due
    next_run = calculate_next_run_iso(publish_time, job.get("schedule"))
    update_automation_run_state(
        job_id,
        last_status="running",
        next_run=next_run,
        last_run_message="Stage 1/6: Generating viral script & multi-scene storyboard with Gemini AI...",
    )

    logger.info(f"[YouTube Automation] Starting pipeline for Job '{job_id}' | Theme: '{theme}' | Voice: '{voice}'")
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
            logger.info(
                f"[YouTube Automation] Using active workspace timeline clips "
                f"({len(override_data.get('videoClips', []))} videos, {len(override_data.get('imageClips', []))} images)"
            )
            video_clips = override_data.get("videoClips") or []
            image_clips = override_data.get("imageClips") or []
            title = override_data.get("title") or f"Daily {theme} Short"
            quote_text = override_data.get("quote") or "Discipline equals freedom."
            subtitles = override_data.get("subtitles") or []
            audio_path = override_data.get("audioUrl")
            music_url = override_data.get("musicUrl")
            actual_duration = float(override_data.get("duration") or 20.0)
        else:
            if is_stop_requested(job_id):
                logger.info(f"[YouTube Automation] Job '{job_id}' stop requested before Stage 1. Halting.")
                return {"success": False, "jobId": job_id, "message": "Pipeline execution stopped by user.", "stopped": True}

            # ── STAGE 1: SCRIPT WRITING ────────────────────────────────────────
            update_automation_run_state(
                job_id,
                last_status="running",
                last_run_message=f"Stage 1/6: Generating viral script with {ai_model}...",
            )
            logger.info(f"[YouTube Automation/Stage-1] Writing script for '{theme}' with model '{ai_model}'")
            script_resp = run_studio_script(
                category=theme,
                topic=f"{theme} (cinematic faceless B-roll)",
                tone="motivational",
                length=length_str,
                model=ai_model,
                aspect_ratio=aspect_ratio,
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

            if is_stop_requested(job_id):
                logger.info(f"[YouTube Automation] Job '{job_id}' stop requested before Stage 2. Halting.")
                return {"success": False, "jobId": job_id, "message": "Pipeline execution stopped by user.", "stopped": True}

            # ── STAGE 2: VOICEOVER SYNTHESIS ───────────────────────────────────
            update_automation_run_state(
                job_id,
                last_status="running",
                last_run_message=f"Stage 2/6: Synthesizing Neural Voiceover with '{voice}'...",
            )
            logger.info(f"[YouTube Automation/Stage-2] Synthesizing voiceover with '{voice}'")
            full_narration = f"{hook_text} {quote_text} {cta_text}"
            voice_resp = run_studio_voice(
                voice_name=voice,
                storyboard=storyboard,
                full_narration_text=full_narration,
                target_duration_seconds=target_sec,
            )
            actual_duration = float(voice_resp.get("durationSeconds") or 20.0)

            # Persist WAV file to disk for FFmpeg
            audio_path = None
            audio_b64 = voice_resp.get("audioBase64")
            if audio_b64:
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

            if is_stop_requested(job_id):
                logger.info(f"[YouTube Automation] Job '{job_id}' stop requested before Stage 3. Halting.")
                return {"success": False, "jobId": job_id, "message": "Pipeline execution stopped by user.", "stopped": True}

            # ── STAGE 3: B-ROLL MEDIA RESOLUTION ───────────────────────────────
            update_automation_run_state(
                job_id,
                last_status="running",
                last_run_message=f"Stage 3/6: Resolving 4K stock B-Roll for {len(storyboard)} scenes...",
            )
            logger.info(f"[YouTube Automation/Stage-3] Resolving stock media for {len(storyboard)} scenes")
            try:
                media_resp = run_studio_media(
                    scenes=storyboard,
                    aspect_ratio=aspect_ratio,
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
                        if clip["type"] == "video":
                            preview_url = m.get("thumbnailUrl") or m.get("previewUrl")
                            if preview_url and preview_url != m["url"]:
                                clip["fallbackUrl"] = preview_url
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
                logger.error(f"[YouTube Automation/Stage-3] Media resolution failed: {media_err}")
                raise RuntimeError(f"Stage 3 (B-Roll) Error: Media resolution failed: {media_err}")

            if not video_clips and not image_clips:
                raise RuntimeError(
                    f"Stage 3 (B-Roll) Error: No video or image clips could be resolved for '{theme}'. "
                    f"Please verify Pexels / Pixabay stock media configuration or queries."
                )

            if is_stop_requested(job_id):
                logger.info(f"[YouTube Automation] Job '{job_id}' stop requested before Stage 4. Halting.")
                return {"success": False, "jobId": job_id, "message": "Pipeline execution stopped by user.", "stopped": True}

            # ── STAGE 4: SYLLABLE CAPTIONS ALIGNMENT ───────────────────────────
            update_automation_run_state(
                job_id,
                last_status="running",
                last_run_message="Stage 4/6: Aligning word-timed kinetic karaoke captions...",
            )
            logger.info(f"[YouTube Automation/Stage-4] Generating aligned karaoke captions for {actual_duration:.1f}s")
            try:
                captions_resp = run_studio_captions(
                    storyboard_scenes=storyboard,
                    duration_seconds=actual_duration,
                    full_narration_text=full_narration,
                    style_preset="yellow_pop",
                    aspect_ratio=aspect_ratio,
                    caption_color="#FACC15",
                    caption_font_family="Impact",
                )
                c_data = captions_resp.get("data") or {}
                subtitles = c_data.get("timelineClips") or c_data.get("segments") or []
            except Exception as cap_err:
                logger.error(f"[YouTube Automation/Stage-4] Captions generation failed: {cap_err}")
                raise RuntimeError(f"Stage 4 (Captions) Error: Captions generation failed: {cap_err}")

            if not subtitles:
                raise RuntimeError("Stage 4 (Captions) Error: No subtitles generated for video.")

        if is_stop_requested(job_id):
            logger.info(f"[YouTube Automation] Job '{job_id}' stop requested before Stage 5. Halting.")
            return {"success": False, "jobId": job_id, "message": "Pipeline execution stopped by user.", "stopped": True}

        # ── STAGE 5: FULL HD MP4 VIDEO RENDER ──────────────────────────────────
        update_automation_run_state(
            job_id,
            last_status="running",
            last_run_message="Stage 5/6: Rendering 1080x1920 MP4 with audio ducking and kinetic captions...",
        )
        logger.info(f"[YouTube Automation/Stage-5] Rendering studio video '{title}' via FFmpeg")
        video_path = None
        try:
            rendered = render_studio_video(
                title=title or theme,
                aspect_ratio=aspect_ratio,
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
                logger.info(f"[YouTube Automation/Stage-5] Studio video successfully rendered: {video_path}")
        except Exception as studio_err:
            logger.error(f"[YouTube Automation/Stage-5] Studio render engine failed: {studio_err}")
            raise RuntimeError(f"Stage 5 (Render) Error: FFmpeg video rendering failed: {studio_err}")

        if not video_path or not Path(video_path).exists():
            raise RuntimeError("Stage 5 (Render) Error: FFmpeg failed to produce 1080x1920 MP4 file.")

        if is_stop_requested(job_id):
            logger.info(f"[YouTube Automation] Job '{job_id}' stop requested before Stage 6. Halting.")
            return {"success": False, "jobId": job_id, "message": "Pipeline execution stopped by user.", "stopped": True}

        # ── STAGE 6: YOUTUBE LIVE SHORTS PUBLISH ───────────────────────────────
        update_automation_run_state(
            job_id,
            last_status="running",
            last_run_message="Stage 6/6: Uploading and publishing Short to YouTube...",
        )
        logger.info("[YouTube Automation/Stage-6] Publishing video to YouTube")
        user_id = job.get("userId")
        yt_client = get_authenticated_youtube_client(user_id, channel_id)
        upload_res = None
        youtube_url = None
        is_scheduled = privacy == "scheduled"
        publish_at_iso = None

        # Build viral hashtags and rich description with AI disclosure
        theme_tag = re.sub(r'[^a-zA-Z0-9]', '', theme)
        viral_tags = ["#Shorts", "#Motivation", "#Discipline", f"#{theme_tag}", "#AI", "#AIGenerated", "#ViralShorts", "#DailyMindset"]
        clean_desc = f"{quote_text}\n\n{cta_text}\n\n🤖 AI Content Disclosure: This video and audio were created with AI (ApexMind AI).\n\n{' '.join(viral_tags)}"

        upload_warning = None
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
                    user_id=user_id,
                    channel_id=channel_id,
                )
                youtube_url = upload_res.get("videoUrl")
                logger.info(f"[YouTube Automation/Stage-6] YouTube upload success: {youtube_url} | Status: {upload_res.get('status')}")
            except Exception as up_err:
                logger.warning(f"[YouTube Automation/Stage-6] YouTube upload deferred: {up_err}")
                upload_warning = str(up_err)
                youtube_url = None

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
        elif upload_warning:
            status_label = f"1080p MP4 Ready in Studio (YouTube upload deferred: {upload_warning[:80]}...)"
            notif_type = "warning"
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
            else f"1080p Video Saved in Library (YouTube deferred: {upload_warning[:80]}...)" if upload_warning
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
        logger.info(
            f"[YouTube Automation] Pipeline completed in {elapsed}s for job '{job_id}' | "
            f"Next run: {next_run} | Live: {is_live}"
        )

        # Persist entry to execution history log with full timeline restoration metadata
        try:
            rel_audio_url = f"/api/audio/{Path(audio_path).name}" if audio_path and Path(audio_path).exists() else None
            project_data = {
                "title": title,
                "quote": quote_text,
                "hook": hook_text,
                "cta": cta_text,
                "storyboard": storyboard,
                "subtitles": subtitles,
                "audioUrl": rel_audio_url,
                "videoUrl": rel_video_url,
                "musicUrl": music_url,
                "duration": actual_duration,
                "voice": voice,
                "aspectRatio": aspect_ratio,
            }
            add_automation_history(
                job_id=job_id,
                status="success",
                video_title=title,
                video_url=rel_video_url,
                youtube_url=youtube_url,
                is_live=is_live,
                duration_seconds=elapsed,
                message=run_msg,
                project_data=project_data,
            )
        except Exception as hist_err:
            logger.debug(f"[YouTube Automation] History log error: {hist_err}")

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
        was_stopped = is_stop_requested(job_id)
        if was_stopped:
            logger.info(f"[YouTube Automation] Job '{job_id}' execution aborted due to stop request.")
            return {"success": False, "jobId": job_id, "message": "Pipeline execution stopped by user.", "stopped": True}

        logger.error(f"[YouTube Automation] Execution failed for job '{job_id}': {e}", exc_info=True)
        update_automation_run_state(
            job_id,
            last_status="failed",
            last_run_message=str(e),
            last_is_live=False,
        )
        try:
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
    finally:
        mark_job_finished(job_id)


# Register this pipeline as the default executor with the shared job system
register_job_executor(execute_automation_job)

