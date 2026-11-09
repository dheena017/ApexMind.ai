"""
backend/shared/job.py
Shared Job Management, Scheduling, Concurrency Locks, and Background Worker Engine.

Manages:
- Concurrency locks and active job execution sets
- Stop request tracking
- Next run schedule computation (intervals, cron-like expressions, daily HH:MM)
- Worker thread pool execution for asynchronous manual jobs
- Central background scheduler worker loop for automated pipeline dispatches
- Pluggable job executor registry
"""

import asyncio
from concurrent.futures import Future, ThreadPoolExecutor
from datetime import datetime, timedelta, timezone
import logging
import re
import threading
from typing import Any, Callable, Dict, Optional, Set

logger = logging.getLogger("ApexMind.Shared.Job")

# ── THREAD CONCURRENCY & JOB STATE ─────────────────────────────────────────────
_RUNNING_JOB_IDS: Set[str] = set()
_STOP_REQUESTED_JOB_IDS: Set[str] = set()
_JOB_LOCK = threading.Lock()
_MANUAL_EXECUTOR = ThreadPoolExecutor(max_workers=2, thread_name_prefix="shared-jobs")
_MANUAL_FUTURES: Set[Future] = set()

# Pluggable job executor callback type: (job_id, override_data, already_registered) -> Dict
JobExecutor = Callable[[str, Optional[Dict[str, Any]], bool], Dict[str, Any]]
_DEFAULT_JOB_EXECUTOR: Optional[JobExecutor] = None


# ── REGISTRATION & RESOLUTION ──────────────────────────────────────────────────
def register_job_executor(executor: JobExecutor) -> None:
    """Registers the primary job execution handler (e.g. YouTube automation pipeline)."""
    global _DEFAULT_JOB_EXECUTOR
    _DEFAULT_JOB_EXECUTOR = executor
    logger.debug("[Shared.Job] Registered default job executor.")


def get_job_executor() -> Optional[JobExecutor]:
    """Retrieves the registered job executor, lazily binding to YouTube automation if unassigned."""
    global _DEFAULT_JOB_EXECUTOR
    if _DEFAULT_JOB_EXECUTOR is None:
        try:
            from backend.features.workspace.automation.youtube import execute_automation_job
            _DEFAULT_JOB_EXECUTOR = execute_automation_job
            logger.debug("[Shared.Job] Lazily bound execute_automation_job as executor.")
        except Exception as err:
            logger.warning(f"[Shared.Job] Could not lazily resolve execute_automation_job: {err}")
    return _DEFAULT_JOB_EXECUTOR


# ── RUNTIME STATE QUERY HELPERS ────────────────────────────────────────────────
def is_job_running(job_id: str) -> bool:
    """Checks whether a job is currently executing."""
    with _JOB_LOCK:
        return job_id in _RUNNING_JOB_IDS


def get_running_job_ids() -> Set[str]:
    """Returns a snapshot copy of all active running job IDs."""
    with _JOB_LOCK:
        return set(_RUNNING_JOB_IDS)


def is_stop_requested(job_id: str) -> bool:
    """Checks if a cancellation or stop has been requested for this job."""
    with _JOB_LOCK:
        return job_id in _STOP_REQUESTED_JOB_IDS


def request_job_stop(job_id: str) -> None:
    """Signals a cancellation/stop request for a specific job."""
    with _JOB_LOCK:
        _STOP_REQUESTED_JOB_IDS.add(job_id)


def clear_job_stop(job_id: str) -> None:
    """Clears any pending stop request flag for a specific job."""
    with _JOB_LOCK:
        _STOP_REQUESTED_JOB_IDS.discard(job_id)


def mark_job_running(job_id: str) -> bool:
    """
    Attempts to mark a job as actively running.
    Returns True if successfully marked, or False if already running.
    """
    with _JOB_LOCK:
        if job_id in _RUNNING_JOB_IDS:
            return False
        _RUNNING_JOB_IDS.add(job_id)
        _STOP_REQUESTED_JOB_IDS.discard(job_id)
        return True


def mark_job_finished(job_id: str) -> None:
    """Removes a job from the active running and stop-requested sets."""
    with _JOB_LOCK:
        _RUNNING_JOB_IDS.discard(job_id)
        _STOP_REQUESTED_JOB_IDS.discard(job_id)


# ── SCHEDULE COMPUTATION ───────────────────────────────────────────────────────
def calculate_next_run_iso(
    publish_time: str = "08:00",
    schedule: Optional[str] = None,
) -> str:
    """
    Calculates the next upcoming UTC timestamp for a specific daily HH:MM string or recurring interval.
    Supports:
    - Minutes: 'every 15 min', 'every 30 minutes', '15 mins'
    - Hours: 'every 2 hours', 'every 4 hr'
    - Interval shorthand: 'every_2h', 'every_30m'
    - Specific daily time: '08:00', '08:00 AM', '14:30', 'Daily at 08:00 UTC'
    """
    now_utc = datetime.now(timezone.utc)
    combined = f"{schedule or ''} {publish_time or ''}".lower()

    # 1. Minutes pattern: "every X min", "every X minutes", "X mins"
    m_min = re.search(r'every\s+(\d+)\s*(?:min|minute)', combined)
    if m_min:
        mins = int(m_min.group(1))
        return (now_utc + timedelta(minutes=max(1, mins))).isoformat()

    # 2. Hours pattern: "every X hour", "every X hr", "every X hours"
    m_hr = re.search(r'every\s+(\d+)\s*(?:hr|hour)', combined)
    if m_hr:
        hrs = int(m_hr.group(1))
        return (now_utc + timedelta(hours=max(1, hrs))).isoformat()

    # 3. Interval code: every_Xh or every_Xm
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


# ── MANUAL JOB DISPATCH ────────────────────────────────────────────────────────
def _log_manual_job_result(future: Future) -> None:
    with _JOB_LOCK:
        _MANUAL_FUTURES.discard(future)
    try:
        future.result()
    except Exception as exc:
        logger.exception("[Shared.Job] Manual background job failed: %s", exc)


def _execute_registered_job(
    job_id: str,
    override_data: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    try:
        executor = get_job_executor()
        if not executor:
            raise RuntimeError(f"No job executor registered to handle job '{job_id}'.")
        return executor(job_id, override_data, True)
    finally:
        mark_job_finished(job_id)


def start_automation_job(
    job_id: str,
    override_data: Optional[Dict[str, Any]] = None,
) -> bool:
    """Queue an asynchronous pipeline run in the background worker thread pool."""
    from backend.database.repository import get_automation_by_id, update_automation_run_state

    job = get_automation_by_id(job_id)
    if not job:
        raise ValueError(f"Automation job '{job_id}' not found.")

    if not mark_job_running(job_id):
        return False

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
            _execute_registered_job,
            job_id,
            override_data,
        )
        with _JOB_LOCK:
            _MANUAL_FUTURES.add(future)
        future.add_done_callback(_log_manual_job_result)
    except Exception:
        mark_job_finished(job_id)
        raise

    return True


def stop_automation_job(job_id: str) -> Dict[str, Any]:
    """Signals cancellation to an active executing job and resets its database run state to idle."""
    from backend.database.repository import (
        add_automation_history,
        get_automation_by_id,
        update_automation_run_state,
    )

    job = get_automation_by_id(job_id)
    request_job_stop(job_id)
    mark_job_finished(job_id)

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
        add_automation_history(
            job_id=job_id,
            status="stopped",
            video_title=job.get("theme") or "Autonomous Video Pipeline" if job else "Autonomous Video Pipeline",
            message="Pipeline execution stopped by user.",
            duration_seconds=0.0,
        )
    except Exception as e:
        logger.debug(f"[Shared.Job/Stop] History write error: {e}")

    logger.info(f"[Shared.Job/Stop] Job '{job_id}' marked as stopped. Next scheduled run: {next_run}")
    return {
        "success": True,
        "jobId": job_id,
        "nextRun": next_run,
        "message": "Pipeline run stopped.",
    }


# ── BACKGROUND SCHEDULER WORKER ────────────────────────────────────────────────
async def _dispatch_scheduled_job(job_id: str) -> None:
    """Executes a scheduled automation job in a threadpool executor without blocking the event loop."""
    try:
        loop = asyncio.get_running_loop()
        executor = get_job_executor()
        if not executor:
            logger.error(f"[Shared.Job Scheduler] No executor registered for job '{job_id}'")
            return
        await loop.run_in_executor(None, executor, job_id, None, True)
    except Exception as exec_err:
        logger.error(f"[Shared.Job Scheduler] Error executing job '{job_id}': {exec_err}", exc_info=True)
    finally:
        mark_job_finished(job_id)


async def automation_scheduler_loop() -> None:
    """Background asyncio worker that periodically checks and triggers due automation jobs."""
    from backend.database.repository import get_automations, update_automation_run_state

    logger.info("[Shared.Job Scheduler] Background scheduler initialized and running.")

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
                logger.info(f"[Shared.Job Scheduler] Queued interrupted job '{j['id']}' for retry.")
    except Exception as boot_err:
        logger.warning(f"[Shared.Job Scheduler] Startup cleanup note: {boot_err}")

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
                if is_job_running(job_id):
                    continue

                next_run_str = job.get("nextRun")
                if not next_run_str:
                    continue

                try:
                    next_run_dt = datetime.fromisoformat(next_run_str.replace("Z", "+00:00"))

                    # Run overdue jobs after a backend restart instead of silently skipping them
                    if now_utc >= next_run_dt:
                        if is_job_running(job_id):
                            continue

                        # Mark running in memory before submitting
                        if not mark_job_running(job_id):
                            continue

                        # Advance nextRun in DB immediately so it cannot be triggered again
                        adv_next = calculate_next_run_iso(
                            job.get("publishTime", "08:00"),
                            job.get("schedule"),
                        )
                        update_automation_run_state(
                            job_id,
                            last_status="running",
                            next_run=adv_next,
                            last_run_message="Stage 1/6: Generating viral script & multi-scene storyboard with Gemini AI...",
                        )

                        logger.info(
                            f"[Shared.Job Scheduler] Triggering job '{job_id}' at scheduled time "
                            f"(Scheduled: {next_run_str}, Next: {adv_next})"
                        )
                        asyncio.create_task(_dispatch_scheduled_job(job_id))

                except Exception as job_err:
                    mark_job_finished(job_id)
                    logger.error(f"[Shared.Job Scheduler] Error processing job '{job.get('id')}': {job_err}")

        except asyncio.CancelledError:
            logger.info("[Shared.Job Scheduler] Background scheduler received cancellation signal.")
            break
        except Exception as e:
            logger.warning(f"[Shared.Job Scheduler] Unexpected scheduler loop exception: {e}")
            await asyncio.sleep(10)

