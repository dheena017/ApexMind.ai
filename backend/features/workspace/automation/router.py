"""
backend/features/workspace/automation/router.py
FastAPI router for Workspace Automation & Production Schedules.
Provides endpoints for creating, listing, toggling, deleting, running, and stopping automated video pipelines.
"""

import logging
from typing import Any, Dict, Optional

from fastapi import APIRouter, Body, Header, HTTPException, Query, status

from backend.features.auth.service import get_session_user_id
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

logger = logging.getLogger("ApexMind.Workspace.Automation.Router")
router = APIRouter(tags=["Schedules"])


def _require_session_user_id(
    authorization: Optional[str] = None,
    x_user_id: Optional[str] = None,
    user_id_query: Optional[str] = None,
) -> str:
    scheme, _, token = (authorization or "").partition(" ")
    user_id = get_session_user_id(token) if scheme.lower() == "bearer" and token else None
    if not user_id and (x_user_id or user_id_query):
        user_id = (x_user_id or user_id_query).strip()
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="A valid authenticated session is required.",
        )
    return user_id


@router.get(
    "/api/schedules",
    summary="List Automation Schedules",
    operation_id="workspace_list_automation_schedules",
    description="Returns all active recurring automated video production and publishing schedules.",
)
async def list_automation_schedules_route(
    userId: Optional[str] = Query(None),
    authorization: Optional[str] = Header(None),
    x_user_id: Optional[str] = Header(None, alias="X-User-Id"),
):
    resolved_uid = _require_session_user_id(authorization, x_user_id, userId)
    return {"success": True, "data": list_schedules(user_id=resolved_uid)}


@router.post(
    "/api/schedules",
    summary="Create Automation Schedule",
    operation_id="workspace_create_automation_schedule",
    description="Creates a recurring automated video generation, TTS narration, and publishing schedule.",
)
async def create_automation_schedule_route(
    payload: Dict[str, Any] = Body(...),
    authorization: Optional[str] = Header(None),
    x_user_id: Optional[str] = Header(None, alias="X-User-Id"),
):
    resolved_uid = _require_session_user_id(authorization, x_user_id, payload.get("userId"))
    job = create_schedule(payload=payload, user_id=resolved_uid)
    return {"success": True, "data": job, "message": "Automation schedule created successfully."}


@router.patch(
    "/api/schedules/{job_id}/toggle",
    summary="Toggle Schedule Active State",
    operation_id="workspace_toggle_automation_schedule",
    description="Pauses or resumes an automated production schedule.",
)
async def toggle_automation_schedule_route(
    job_id: str,
    userId: Optional[str] = Query(None),
    authorization: Optional[str] = Header(None),
    x_user_id: Optional[str] = Header(None, alias="X-User-Id"),
):
    resolved_uid = _require_session_user_id(authorization, x_user_id, userId)
    try:
        jobs = toggle_schedule(job_id=job_id, user_id=resolved_uid)
        return {"success": True, "data": jobs}
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.delete(
    "/api/schedules/{job_id}",
    summary="Delete Automation Schedule",
    operation_id="workspace_delete_automation_schedule",
    description="Deletes an automated schedule and purges its execution history.",
)
async def delete_automation_schedule_route(
    job_id: str,
    userId: Optional[str] = Query(None),
    authorization: Optional[str] = Header(None),
    x_user_id: Optional[str] = Header(None, alias="X-User-Id"),
):
    resolved_uid = _require_session_user_id(authorization, x_user_id, userId)
    try:
        remaining = delete_schedule(job_id=job_id, user_id=resolved_uid)
        return {"success": True, "data": remaining, "message": "Schedule deleted."}
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.post(
    "/api/schedules/{job_id}/run-now",
    status_code=status.HTTP_202_ACCEPTED,
    summary="Execute Schedule Immediately",
    operation_id="workspace_run_automation_schedule_now",
    description="Queues the automated video production pipeline immediately and runs in background.",
)
async def execute_schedule_immediately_route(
    job_id: str,
    payload: Optional[Dict[str, Any]] = Body(default=None),
    userId: Optional[str] = Query(None),
    authorization: Optional[str] = Header(None),
    x_user_id: Optional[str] = Header(None, alias="X-User-Id"),
):
    effective_uid = (payload.get("userId") if payload else None) or userId
    resolved_uid = _require_session_user_id(authorization, x_user_id, effective_uid)
    try:
        started = run_schedule_now(job_id=job_id, payload=payload, user_id=resolved_uid)
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
    summary="Stop Running Schedule Pipeline",
    operation_id="workspace_stop_automation_schedule",
)
async def stop_schedule_execution_route(
    job_id: str,
    userId: Optional[str] = Query(None),
    authorization: Optional[str] = Header(None),
    x_user_id: Optional[str] = Header(None, alias="X-User-Id"),
):
    resolved_uid = _require_session_user_id(authorization, x_user_id, userId)
    try:
        res = stop_schedule(job_id=job_id, user_id=resolved_uid)
        return {"success": True, "data": res, "message": "Pipeline execution stopped."}
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        logger.error(f"Stopping automation execution failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/api/schedules/{job_id}/history",
    summary="Get Schedule Execution History",
    operation_id="workspace_get_automation_schedule_history",
)
async def get_schedule_history_route(
    job_id: str,
    limit: int = Query(50, ge=1, le=100),
    userId: Optional[str] = Query(None),
    authorization: Optional[str] = Header(None),
    x_user_id: Optional[str] = Header(None, alias="X-User-Id"),
):
    resolved_uid = _require_session_user_id(authorization, x_user_id, userId)
    try:
        history = get_schedule_history_records(job_id=job_id, user_id=resolved_uid, limit=limit)
        return {"success": True, "data": history}
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.delete(
    "/api/schedules/{job_id}/history",
    summary="Clear Schedule Execution History",
    operation_id="workspace_clear_automation_schedule_history",
)
async def clear_schedule_history_route(
    job_id: str,
    userId: Optional[str] = Query(None),
    authorization: Optional[str] = Header(None),
    x_user_id: Optional[str] = Header(None, alias="X-User-Id"),
):
    resolved_uid = _require_session_user_id(authorization, x_user_id, userId)
    try:
        cleared = clear_schedule_history_records(job_id=job_id, user_id=resolved_uid)
        return {"success": True, "cleared": cleared, "message": "Schedule history cleared."}
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

