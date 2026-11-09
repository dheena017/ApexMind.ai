"""
backend/features/workspace/automation/service.py
Central Workspace Automation & Schedules Service:
Orchestrates autonomous video generation schedules, immediate triggers,
cancellations, and execution histories across supported platforms.
"""

import logging
from typing import Any, Dict, List, Optional

from backend.database.repository import (
    clear_automation_history,
    create_automation_job,
    delete_automation_job,
    get_automation_by_id,
    get_automation_history,
    get_automations,
    toggle_automation,
)
from backend.shared.ai_models import DEFAULT_SCRIPT_MODEL
from backend.shared.job import start_automation_job, stop_automation_job

logger = logging.getLogger("ApexMind.Workspace.Automation")


def list_schedules(user_id: Optional[str] = None) -> List[Dict[str, Any]]:
    """Returns all active and configured automation schedules for the user."""
    return get_automations(user_id=user_id)


def create_schedule(
    payload: Dict[str, Any],
    user_id: str,
) -> Dict[str, Any]:
    """Creates a new recurring automated production and publishing schedule."""
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
        user_id=user_id,
    )
    return job


def toggle_schedule(job_id: str, user_id: str) -> List[Dict[str, Any]]:
    """Pauses or resumes an automated production schedule."""
    job = get_automation_by_id(job_id)
    if not job or job.get("userId") != user_id:
        raise ValueError(f"Automation schedule '{job_id}' not found.")
    return toggle_automation(job_id, user_id=user_id)


def delete_schedule(job_id: str, user_id: str) -> List[Dict[str, Any]]:
    """Deletes an automated production schedule and returns the updated schedule list."""
    job = get_automation_by_id(job_id)
    if not job or job.get("userId") != user_id:
        raise ValueError(f"Automation schedule '{job_id}' not found.")
    deleted = delete_automation_job(job_id, user_id=user_id)
    if not deleted:
        raise ValueError(f"Could not delete schedule '{job_id}'.")
    return get_automations(user_id=user_id)


def run_schedule_now(
    job_id: str,
    payload: Optional[Dict[str, Any]] = None,
    user_id: Optional[str] = None,
) -> bool:
    """Queues immediate execution of a schedule pipeline run in the background."""
    job = get_automation_by_id(job_id)
    if not job or (user_id and job.get("userId") != user_id):
        raise ValueError(f"Automation schedule '{job_id}' not found.")
    return start_automation_job(job_id, payload)


def stop_schedule(
    job_id: str,
    user_id: Optional[str] = None,
) -> Dict[str, Any]:
    """Stops an actively executing schedule pipeline."""
    job = get_automation_by_id(job_id)
    if not job or (user_id and job.get("userId") != user_id):
        raise ValueError(f"Automation schedule '{job_id}' not found.")
    return stop_automation_job(job_id)


def get_schedule_history_records(
    job_id: str,
    user_id: Optional[str] = None,
    limit: int = 50,
) -> List[Dict[str, Any]]:
    """Fetches execution history logs for a specific schedule."""
    job = get_automation_by_id(job_id)
    if not job or (user_id and job.get("userId") != user_id):
        raise ValueError(f"Automation schedule '{job_id}' not found.")
    return get_automation_history(job_id, limit=limit, user_id=user_id)


def clear_schedule_history_records(
    job_id: str,
    user_id: Optional[str] = None,
) -> bool:
    """Clears execution history logs for a specific schedule."""
    job = get_automation_by_id(job_id)
    if not job or (user_id and job.get("userId") != user_id):
        raise ValueError(f"Automation schedule '{job_id}' not found.")
    return clear_automation_history(job_id, user_id=user_id)

