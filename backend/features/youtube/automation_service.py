"""
backend/features/youtube/automation_service.py
Autonomous Daily YouTube Shorts Pipeline Engine:
Generates Gemini 3.8 scripts, synthesizes voiceovers, renders vertical FFmpeg MP4s,
and publishes or schedules directly to YouTube at configured times.
"""

import asyncio
from concurrent.futures import Future, ThreadPoolExecutor
import logging
import re
import threading
import time
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Dict, Any, Optional

from backend.database.repository import (
    get_automation_by_id,
    get_automations,
    update_automation_run_state,
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

_RUNNING_JOB_IDS: set[str] = set()
_STOP_REQUESTED_JOB_IDS: set[str] = set()
_JOB_LOCK = threading.Lock()
_MANUAL_EXECUTOR = ThreadPoolExecutor(max_workers=1, thread_name_prefix="manual-automation")
_MANUAL_FUTURES: set[Future] = set()


def _log_manual_job_result(future: Future) -> None:
    with _JOB_LOCK:
        _MANUAL_FUTURES.discard(future)
    try:
        future.result()
    except Exception as exc:
        logger.exception("Manual automation background task failed: %s", exc)


def _execute_registered_automation_job(
    job_id: str,
    override_data: Optional[Dict[str, Any]],
) -> Dict[str, Any]:
    try:
        return execute_automation_job(job_id, override_data, True)
    finally:
        with _JOB_LOCK:
            _RUNNING_JOB_IDS.discard(job_id)


def start_automation_job(
    job_id: str,
    override_data: Optional[Dict[str, Any]] = None,
) -> bool:
    """Queue a manual pipeline run and return without waiting for its stages."""
    job = get_automation_by_id(job_id)
    if not job:
        raise ValueError(f"Automation job '{job_id}' not found.")

    with _JOB_LOCK:
        if job_id in _RUNNING_JOB_IDS:
            return False
        _RUNNING_JOB_IDS.add(job_id)

    try:
        next_run = calculate_next_run_iso(
            job.get("publishTime", "08:00"),
            job.get("schedule"),
        )
        update_automation_run_state(
            job_id,
            last_status="running",
            next_run=next_run,
            last_run_message="Stage 1/6: Generating viral script & multi-scene storyboard with Gemini AI...",
        )
        future = _MANUAL_EXECUTOR.submit(
            _execute_registered_automation_job,
            job_id,
            override_data,
        )
        with _JOB_LOCK:
            _MANUAL_FUTURES.add(future)
        future.add_done_callback(_log_manual_job_result)
    except Exception:
        with _JOB_LOCK:
            _RUNNING_JOB_IDS.discard(job_id)
        raise

    return True


def stop_automation_job(job_id: str) -> Dict[str, Any]:
    """Stops an active executing pipeline job and resets its state."""
    job = get_automation_by_id(job_id)
    with _JOB_LOCK:
        _STOP_REQUESTED_JOB_IDS.add(job_id)
        _RUNNING_JOB_IDS.discard(job_id)

    # Recalculate next upcoming schedule so the background scheduler NEVER immediately re-triggers
    publish_time = job.get("publishTime", "08:00") if job else "08:00"
    schedule = job.get("schedule") if job else None
    next_run = calculate_next_run_iso(publish_time, schedule)

    update_automation_run_state(
        job_id,
        last_status="idle",
        next_run=next_run,
        last_run_message="Pipeline execution stopped by user.",
    )
    try:
        from backend.database.repository import add_automation_history
        add_automation_history(
            job_id=job_id,
            status="stopped",
            video_title=job.get("theme") or "Autonomous Video Pipeline",
            message="Pipeline execution stopped by user.",
            duration_seconds=0.0,
        )
    except Exception as e:
        logger.debug(f"[Automation/Stop] History write error: {e}")
    logger.info(f"[Automation/Stop] Job '{job_id}' marked as stopped. Next scheduled run: {next_run}")
    return {"success": True, "jobId": job_id, "nextRun": next_run, "message": "Pipeline run stopped."}


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

    # 4. Specific daily time: parse HH:MM (e.g. "08:00", "08:00 AM", "Daily at 08:00 UTC", "at 14:30")
    m_time = re.search(r'(\d{1,2}):(\d{2})', publish_time or combined)
    if m_time:
        hour = int(m_time.group(1))
        minute = int(m_time.group(2))
        # Handle 12-hour AM/PM if present
        if 'pm' in combined and hour < 12:
            hour += 12
        elif 'am' in combined and hour == 12:
            hour = 0
        candidate = now_utc.replace(hour=hour, minute=minute, second=0, microsecond=0)
        if candidate <= now_utc:
            candidate += timedelta(days=1)
        return candidate.isoformat()

    return (now_utc + timedelta(days=1)).isoformat()


import re
import time
from pathlib import Path
from typing import Dict, Any, Optional

def execute_automation_job(
    job_id: str,
    override_data: Optional[Dict[str, Any]] = None,
    already_registered: bool = False,
) -> Dict[str, Any]:
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
    ai_model = job.get("aiModel") or job.get("ai_model") or "gemini-2.5-flash"
    aspect_ratio = job.get("aspectRatio") or job.get("aspect_ratio") or "9:16"
    length_str = job.get("length") or "30 seconds"
    m_sec = re.search(r'(\d+)', length_str)
    target_sec = float(m_sec.group(1)) if m_sec else 30.0

    with _JOB_LOCK:
        if job_id in _RUNNING_JOB_IDS:
            if not already_registered:
                logger.warning(f"[Automation/6-Stage] Job '{job_id}' is already executing! Skipping duplicate trigger.")
                return job
        else:
            _RUNNING_JOB_IDS.add(job_id)

    # Immediately calculate and persist advanced nextRun so scheduler does not consider it due
    next_run = calculate_next_run_iso(publish_time, job.get("schedule"))
    update_automation_run_state(
        job_id,
        last_status="running",
        next_run=next_run,
        last_run_message="Stage 1/6: Generating viral script & multi-scene storyboard with Gemini AI...",
    )

    logger.info(f"[Automation/6-Stage] Starting pipeline for Job '{job_id}' | Theme: '{theme}' | Voice: '{voice}'")
    start_time = time.perf_counter()

    def check_stop_requested():
        with _JOB_LOCK:
            return job_id in _STOP_REQUESTED_JOB_IDS

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
            if check_stop_requested():
                logger.info(f"[Automation/6-Stage] Job '{job_id}' stop requested before Stage 1. Halting.")
                return {"success": False, "jobId": job_id, "message": "Pipeline execution stopped by user.", "stopped": True}

            # ── STAGE 1: SCRIPT WRITING (POST /api/studio/generate-script) ──
            update_automation_run_state(
                job_id,
                last_status="running",
                last_run_message=f"Stage 1/6: Generating viral script with {ai_model}...",
            )
            logger.info(f"[Automation/Stage-1] Writing script for '{theme}' with model '{ai_model}'")
            script_resp = run_studio_script(
                category=theme,
                topic=theme,
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

            if check_stop_requested():
                logger.info(f"[Automation/6-Stage] Job '{job_id}' stop requested before Stage 2. Halting.")
                return {"success": False, "jobId": job_id, "message": "Pipeline execution stopped by user.", "stopped": True}

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
                target_duration_seconds=target_sec,
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

            if check_stop_requested():
                logger.info(f"[Automation/6-Stage] Job '{job_id}' stop requested before Stage 3. Halting.")
                return {"success": False, "jobId": job_id, "message": "Pipeline execution stopped by user.", "stopped": True}

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
                logger.error(f"[Automation/Stage-3] Media resolution failed: {media_err}")
                raise RuntimeError(f"Stage 3 (B-Roll) Error: Media resolution failed: {media_err}")

            if not video_clips and not image_clips:
                raise RuntimeError(
                    f"Stage 3 (B-Roll) Error: No video or image clips could be resolved for '{theme}'. "
                    f"Please verify Pexels / Pixabay stock media configuration or queries."
                )

            if check_stop_requested():
                logger.info(f"[Automation/6-Stage] Job '{job_id}' stop requested before Stage 4. Halting.")
                return {"success": False, "jobId": job_id, "message": "Pipeline execution stopped by user.", "stopped": True}

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
                    aspect_ratio=aspect_ratio,
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

        if check_stop_requested():
            logger.info(f"[Automation/6-Stage] Job '{job_id}' stop requested before Stage 5. Halting.")
            return {"success": False, "jobId": job_id, "message": "Pipeline execution stopped by user.", "stopped": True}

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
                logger.info(f"[Automation/Stage-5] Studio video successfully rendered: {video_path}")
        except Exception as studio_err:
            logger.error(f"[Automation/Stage-5] Studio render engine failed: {studio_err}")
            raise RuntimeError(f"Stage 5 (Render) Error: FFmpeg video rendering failed: {studio_err}")

        if not video_path or not Path(video_path).exists():
            raise RuntimeError("Stage 5 (Render) Error: FFmpeg failed to produce 1080x1920 MP4 file.")

        if check_stop_requested():
            logger.info(f"[Automation/6-Stage] Job '{job_id}' stop requested before Stage 6. Halting.")
            return {"success": False, "jobId": job_id, "message": "Pipeline execution stopped by user.", "stopped": True}

        # ── STAGE 6: YOUTUBE LIVE SHORTS PUBLISH (POST /api/youtube/publish) ──
        update_automation_run_state(
            job_id,
            last_status="running",
            last_run_message="Stage 6/6: Uploading and publishing Short to YouTube...",
        )
        logger.info(f"[Automation/Stage-6] Publishing video to YouTube")
        user_id = job.get("userId")
        yt_client = get_authenticated_youtube_client(user_id)
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
                )
                youtube_url = upload_res.get("videoUrl")
                logger.info(f"[Automation/Stage-6] YouTube upload success: {youtube_url} | Status: {upload_res.get('status')}")
            except Exception as up_err:
                logger.warning(f"[Automation/Stage-6] YouTube upload deferred: {up_err}")
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
        logger.info(f"[Automation/6-Stage] Pipeline completed in {elapsed}s for job '{job_id}' | Next run: {next_run} | Live: {is_live}")

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
                project_data=project_data,
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
        with _JOB_LOCK:
            was_stopped = job_id in _STOP_REQUESTED_JOB_IDS
        if was_stopped:
            logger.info(f"[Automation/6-Stage] Job '{job_id}' execution aborted due to stop request.")
            return {"success": False, "jobId": job_id, "message": "Pipeline execution stopped by user.", "stopped": True}

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
    finally:
        with _JOB_LOCK:
            _RUNNING_JOB_IDS.discard(job_id)
            _STOP_REQUESTED_JOB_IDS.discard(job_id)


async def _dispatch_scheduled_job(job_id: str):
    """Executes a scheduled automation job in a threadpool executor without blocking the event loop."""
    try:
        loop = asyncio.get_running_loop()
        await loop.run_in_executor(None, execute_automation_job, job_id)
    except Exception as exec_err:
        logger.error(f"[Automation Scheduler] Error executing job '{job_id}': {exec_err}", exc_info=True)


async def automation_scheduler_loop():
    """Background asyncio worker that periodically checks and triggers due automation jobs."""
    logger.info("[Automation Scheduler] Background scheduler initialized and running.")

    # Reset any stale orphan 'running' jobs from prior server sessions
    try:
        startup_jobs = get_automations(include_stale_running=True, include_all=True)
        for j in startup_jobs:
            if j.get("lastStatus") == "running":
                n_run = datetime.now(timezone.utc).isoformat()
                update_automation_run_state(
                    j["id"],
                    last_status="idle",
                    next_run=n_run,
                    last_run_message="Backend restarted during execution. Queued to retry.",
                )
                logger.info(f"[Automation Scheduler] Queued interrupted job '{j['id']}' for retry.")
    except Exception as boot_err:
        logger.warning(f"[Automation Scheduler] Startup cleanup note: {boot_err}")

    while True:
        try:
            await asyncio.sleep(60)  # Check every 60 seconds
            jobs = get_automations(include_all=True)
            now_utc = datetime.now(timezone.utc)

            for job in jobs:
                if not job.get("active"):
                    continue

                job_id = job["id"]

                # Never trigger if already executing
                with _JOB_LOCK:
                    if job_id in _RUNNING_JOB_IDS:
                        continue

                next_run_str = job.get("nextRun")
                if not next_run_str:
                    continue

                try:
                    next_run_dt = datetime.fromisoformat(next_run_str.replace("Z", "+00:00"))

                    # Run overdue jobs after a backend restart instead of silently skipping them.
                    if now_utc >= next_run_dt:
                        with _JOB_LOCK:
                            if job_id in _RUNNING_JOB_IDS:
                                continue

                        # Advance nextRun in DB immediately so it cannot be triggered again
                        adv_next = calculate_next_run_iso(job.get("publishTime", "08:00"), job.get("schedule"))
                        update_automation_run_state(
                            job_id,
                            last_status="running",
                            next_run=adv_next,
                            last_run_message="Stage 1/6: Generating viral script & multi-scene storyboard with Gemini AI...",
                        )

                        logger.info(f"[Automation Scheduler] Triggering job '{job_id}' at scheduled time (Scheduled: {next_run_str}, Next: {adv_next})")
                        asyncio.create_task(_dispatch_scheduled_job(job_id))

                except Exception as job_err:
                    logger.error(f"[Automation Scheduler] Error processing job '{job.get('id')}': {job_err}")

        except asyncio.CancelledError:
            logger.info("[Automation Scheduler] Background scheduler received cancellation signal.")
            break
        except Exception as e:
            logger.warning(f"[Automation Scheduler] Unexpected scheduler loop exception: {e}")
            await asyncio.sleep(10)
