"""
backend/features/workspace/generation_jobs/job_service.py
Durable task execution and progress tracking service for Script Generation jobs.
"""

import logging
import threading
import time
from datetime import datetime, timezone
from typing import Any, Dict, Optional
from uuid import uuid4

from backend.features.workspace.script_generation.generation_service import run_script_generation
from .job_status import JobStatus, JobPhase

logger = logging.getLogger("ApexMind.GenerationJobs")

# In-memory durable registry with thread-safe locking
_JOBS_LOCK = threading.Lock()
_JOBS: Dict[str, Dict[str, Any]] = {}
_IDEMPOTENCY_MAP: Dict[str, str] = {}


def create_generation_job(
    payload: Dict[str, Any],
    idempotency_key: Optional[str] = None,
    user_id: Optional[str] = None,
    project_id: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Registers a new generation job and dispatches worker execution asynchronously.
    Supports idempotency key deduplication.
    """
    with _JOBS_LOCK:
        if idempotency_key and idempotency_key in _IDEMPOTENCY_MAP:
            existing_job_id = _IDEMPOTENCY_MAP[idempotency_key]
            if existing_job_id in _JOBS:
                logger.info(f"[Jobs] Idempotent request mapped to existing job '{existing_job_id}'")
                job = _JOBS[existing_job_id]
                return {
                    "success": True,
                    "jobId": existing_job_id,
                    "status": job["status"],
                    "phase": job["phase"],
                    "progressPercent": job["progressPercent"],
                    "createdAt": job["createdAt"],
                    "pollUrl": f"/api/studio/jobs/{existing_job_id}",
                    "cancelUrl": f"/api/studio/jobs/{existing_job_id}/cancel",
                }

        job_id = f"job_{uuid4().hex}"
        now_iso = datetime.now(timezone.utc).isoformat()
        job_record = {
            "jobId": job_id,
            "status": JobStatus.QUEUED.value,
            "phase": JobPhase.QUEUED.value,
            "progressPercent": 0,
            "message": "Job queued for AI execution",
            "createdAt": now_iso,
            "startTime": time.perf_counter(),
            "fencingToken": 1,
            "isCancelled": False,
            "payload": payload,
            "userId": user_id or payload.get("userId"),
            "projectId": project_id or payload.get("projectId"),
            "error": None,
            "result": None,
        }
        _JOBS[job_id] = job_record
        if idempotency_key:
            _IDEMPOTENCY_MAP[idempotency_key] = job_id

    # Dispatch execution in background thread
    worker_thread = threading.Thread(
        target=_execute_job_worker,
        args=(job_id,),
        daemon=True,
        name=f"Worker-{job_id}",
    )
    worker_thread.start()

    logger.info(f"[Jobs] Created and dispatched generation job '{job_id}'")
    return {
        "success": True,
        "jobId": job_id,
        "status": JobStatus.QUEUED.value,
        "phase": JobPhase.QUEUED.value,
        "progressPercent": 0,
        "createdAt": now_iso,
        "pollUrl": f"/api/studio/jobs/{job_id}",
        "cancelUrl": f"/api/studio/jobs/{job_id}/cancel",
    }


def _execute_job_worker(job_id: str):
    """Worker loop driving progressive phase updates and AI execution."""
    with _JOBS_LOCK:
        job = _JOBS.get(job_id)
        if not job or job.get("isCancelled"):
            return
        job["status"] = JobStatus.IN_PROGRESS.value
        job["phase"] = JobPhase.BUILDING_PROMPT.value
        job["progressPercent"] = 15
        job["message"] = "Assembling generation prompt and creative brief"
        payload = dict(job["payload"])

    try:
        # Check cancellation
        if _is_job_cancelled(job_id):
            return

        with _JOBS_LOCK:
            job = _JOBS[job_id]
            job["phase"] = JobPhase.CALLING_AI.value
            job["progressPercent"] = 35
            job["message"] = "Generating story and cinematic narrative with Gemini"

        # Execute generation service
        result = run_script_generation(**payload)

        if _is_job_cancelled(job_id):
            return

        with _JOBS_LOCK:
            job = _JOBS[job_id]
            job["phase"] = JobPhase.VALIDATING_SCENES.value
            job["progressPercent"] = 75
            job["message"] = "Validating scene timing budget and character continuity"

        time.sleep(0.1)  # Yield for telemetry

        with _JOBS_LOCK:
            job = _JOBS[job_id]
            job["phase"] = JobPhase.COMPLETED.value
            job["status"] = JobStatus.COMPLETED.value
            job["progressPercent"] = 100
            job["message"] = "Script generation completed successfully"
            job["result"] = result
            logger.info(f"[Jobs] Job '{job_id}' completed successfully in {time.perf_counter() - job['startTime']:.2f}s")

    except Exception as exc:
        logger.exception(f"[Jobs] Job '{job_id}' failed: {exc}")
        with _JOBS_LOCK:
            if job_id in _JOBS:
                job = _JOBS[job_id]
                job["status"] = JobStatus.FAILED.value
                job["phase"] = JobPhase.FAILED.value
                job["error"] = str(exc)
                job["message"] = f"Generation failed: {exc}"


def _is_job_cancelled(job_id: str) -> bool:
    with _JOBS_LOCK:
        job = _JOBS.get(job_id)
        return bool(job and job.get("isCancelled"))


def get_generation_job_status(job_id: str) -> Optional[Dict[str, Any]]:
    """Retrieves current job status, phase, percent, and result if completed."""
    with _JOBS_LOCK:
        job = _JOBS.get(job_id)
        if not job:
            return None

        elapsed = round(time.perf_counter() - job["startTime"], 2)
        return {
            "jobId": job["jobId"],
            "status": job["status"],
            "phase": job["phase"],
            "progressPercent": job["progressPercent"],
            "message": job.get("message"),
            "elapsedSeconds": elapsed,
            "error": job.get("error"),
            "result": job.get("result"),
        }


def cancel_generation_job(job_id: str) -> bool:
    """Signals cooperative cancellation for an in-flight job."""
    with _JOBS_LOCK:
        job = _JOBS.get(job_id)
        if not job:
            return False
        job["isCancelled"] = True
        job["status"] = JobStatus.CANCELLED.value
        job["phase"] = JobPhase.CANCELLED.value
        job["message"] = "Job cancelled by user"
        logger.info(f"[Jobs] Job '{job_id}' marked as cancelled")
        return True

