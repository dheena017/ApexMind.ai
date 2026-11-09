"""
backend/features/workspace/automation/__init__.py
Workspace Automation & Multi-Platform Pipeline Scheduling Package.
"""

from .router import router as automation_router
from .service import (
    clear_schedule_history_records,
    create_schedule,
    delete_schedule,
    get_schedule_history_records,
    list_schedules,
    run_schedule_now,
    stop_schedule,
    toggle_schedule,
)
from .youtube import execute_automation_job as execute_youtube_automation_job

__all__ = [
    "automation_router",
    "list_schedules",
    "create_schedule",
    "toggle_schedule",
    "delete_schedule",
    "run_schedule_now",
    "stop_schedule",
    "get_schedule_history_records",
    "clear_schedule_history_records",
    "execute_youtube_automation_job",
]

