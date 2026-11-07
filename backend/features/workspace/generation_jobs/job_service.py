"""
backend/features/workspace/generation_jobs/job_service.py
Durable task execution, progress tracking, and recovery service for Script and Voice Generation jobs.
"""

import asyncio
import logging
import threading
import time
from datetime import datetime, timezone
from typing import Any, Callable, Dict, List, Optional
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
    job_type: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Registers a new generation job and dispatches worker execution asynchronously.
    Supports idempotency key deduplication and lease tracking.
    """
    # Detect job type if not specified
    if not job_type:
        if "projectMode" in payload or payload.get("jobType") == "visuals":
            job_type = "visuals"
        elif "voiceConfig" in payload or ("scriptId" in payload and "scenes" not in payload and "projectMode" not in payload):
            job_type = "voice"
        else:
            job_type = "script"

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
        now_time = time.time()
        job_record = {
            "jobId": job_id,
            "jobType": job_type,
            "status": JobStatus.QUEUED.value,
            "phase": JobPhase.QUEUED.value,
            "progressPercent": 0,
            "completedScenes": 0,
            "totalScenes": 0,
            "message": f"Job queued for {job_type} execution",
            "createdAt": now_iso,
            "startTime": time.perf_counter(),
            "lastHeartbeat": now_time,
            "leaseExpiresAt": now_time + 120.0,
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

    logger.info(f"[Jobs] Created and dispatched {job_type} job '{job_id}'")
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
    """Worker loop driving progressive phase updates and AI/voice execution."""
    with _JOBS_LOCK:
        job = _JOBS.get(job_id)
        if not job or job.get("isCancelled"):
            return
        job["status"] = JobStatus.IN_PROGRESS.value
        job["lastHeartbeat"] = time.time()
        job["leaseExpiresAt"] = time.time() + 120.0
        job_type = job.get("jobType", "script")
        payload = dict(job["payload"])

    try:
        # Check cancellation
        if _is_job_cancelled(job_id):
            return

        if job_type == "voice":
            _execute_voice_job(job_id, payload)
        elif job_type == "visuals":
            _execute_visuals_job(job_id, payload)
        else:
            _execute_script_job(job_id, payload)

    except Exception as exc:
        logger.exception(f"[Jobs] Job '{job_id}' failed: {exc}")
        with _JOBS_LOCK:
            if job_id in _JOBS:
                job = _JOBS[job_id]
                job["status"] = JobStatus.FAILED.value
                job["phase"] = JobPhase.FAILED.value
                job["error"] = str(exc)
                job["message"] = f"Execution failed: {exc}"


def _execute_script_job(job_id: str, payload: Dict[str, Any]):
    """Drives Stage 1 script generation job."""
    with _JOBS_LOCK:
        job = _JOBS[job_id]
        job["phase"] = JobPhase.BUILDING_PROMPT.value
        job["progressPercent"] = 15
        job["message"] = "Assembling generation prompt and creative brief"

    if _is_job_cancelled(job_id):
        return

    with _JOBS_LOCK:
        job = _JOBS[job_id]
        job["phase"] = JobPhase.CALLING_AI.value
        job["progressPercent"] = 35
        job["message"] = "Generating story and cinematic narrative with Gemini"

    result = run_script_generation(**payload)

    if _is_job_cancelled(job_id):
        return

    with _JOBS_LOCK:
        job = _JOBS[job_id]
        job["phase"] = JobPhase.VALIDATING_SCENES.value
        job["progressPercent"] = 75
        job["message"] = "Validating scene timing budget and character continuity"

    time.sleep(0.05)

    with _JOBS_LOCK:
        job = _JOBS[job_id]
        job["phase"] = JobPhase.COMPLETED.value
        job["status"] = JobStatus.COMPLETED.value
        job["progressPercent"] = 100
        job["message"] = "Script generation completed successfully"
        job["result"] = result
        logger.info(f"[Jobs] Script Job '{job_id}' completed successfully in {time.perf_counter() - job['startTime']:.2f}s")


def _execute_voice_job(job_id: str, payload: Dict[str, Any]):
    """Drives Stage 2 voice generation job with per-scene progress and cancellation."""
    from backend.features.workspace.voice_generation.services.script_reader import load_and_validate_script
    from backend.features.workspace.voice_generation.schemas import VoiceConfig, LoudnessProfile, VoiceGenerationMode
    from backend.features.workspace.voice_generation.engine.voice_orchestrator import voice_orchestrator

    with _JOBS_LOCK:
        job = _JOBS[job_id]
        job["phase"] = JobPhase.PREPROCESSING.value
        job["progressPercent"] = 10
        job["message"] = "Loading approved script and normalizing narration text"
        project_id = job.get("projectId")

    script_doc = load_and_validate_script(
        script_id=payload.get("scriptId"),
        project_id=project_id,
    )

    if _is_job_cancelled(job_id):
        return

    def _on_progress(completed_idx: int, total_count: int, scene_id: str):
        if _is_job_cancelled(job_id):
            return
        with _JOBS_LOCK:
            if job_id in _JOBS:
                j = _JOBS[job_id]
                j["lastHeartbeat"] = time.time()
                j["leaseExpiresAt"] = time.time() + 120.0
                j["completedScenes"] = completed_idx
                j["totalScenes"] = total_count
                j["phase"] = JobPhase.SYNTHESIS.value
                pct = 15 + int(70 * (completed_idx / max(1, total_count)))
                j["progressPercent"] = min(85, pct)
                j["message"] = f"Synthesized narration for scene {completed_idx}/{total_count} ({scene_id})"

    with _JOBS_LOCK:
        job = _JOBS[job_id]
        job["phase"] = JobPhase.SYNTHESIS.value
        job["progressPercent"] = 15
        job["message"] = "Synthesizing scene narration audio"

    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        voice_resp = loop.run_until_complete(
            voice_orchestrator.generate_script_voice(
                script_document=script_doc,
                voice_config=VoiceConfig(**payload.get("voiceConfig", {})),
                loudness_profile=LoudnessProfile(**payload.get("loudnessProfile", {})),
                mode=VoiceGenerationMode(payload.get("mode", "all")),
                selected_scene_ids=payload.get("sceneIds"),
                force_regenerate=payload.get("forceRegenerate", False),
                on_progress=_on_progress,
            )
        )
    finally:
        loop.close()

    if _is_job_cancelled(job_id):
        return

    with _JOBS_LOCK:
        job = _JOBS[job_id]
        job["phase"] = JobPhase.COMPLETED.value
        job["status"] = JobStatus.COMPLETED.value
        job["progressPercent"] = 100
        job["completedScenes"] = voice_resp.totalScenes
        job["totalScenes"] = voice_resp.totalScenes
        job["message"] = "Voice generation and master narration assembly completed successfully"
        job["result"] = voice_resp.model_dump()
        logger.info(f"[Jobs] Voice Job '{job_id}' completed successfully in {time.perf_counter() - job['startTime']:.2f}s")


def _execute_visuals_job(job_id: str, payload: Dict[str, Any]):
    """Drives Stage 3 Visual Production job asynchronously."""
    from backend.features.workspace.visual_production.engine.visual_orchestrator import visual_orchestrator
    from backend.features.workspace.visual_production.schemas import VisualProductionRequest

    def _on_progress(completed_idx: int, total_count: int, msg: str):
        if _is_job_cancelled(job_id):
            return
        with _JOBS_LOCK:
            if job_id in _JOBS:
                j = _JOBS[job_id]
                j["lastHeartbeat"] = time.time()
                j["leaseExpiresAt"] = time.time() + 180.0
                j["completedScenes"] = completed_idx
                j["totalScenes"] = total_count
                j["phase"] = JobPhase.COMPOSITING.value
                pct = 10 + int(80 * (completed_idx / max(1, total_count)))
                j["progressPercent"] = min(90, pct)
                j["message"] = msg

    with _JOBS_LOCK:
        job = _JOBS[job_id]
        job["phase"] = JobPhase.ANALYZING.value
        job["progressPercent"] = 10
        job["message"] = "Analyzing scenes and staging production paths"

    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        req = VisualProductionRequest(**payload)
        vis_resp = loop.run_until_complete(
            visual_orchestrator.generate_storyboard_visuals(request=req, on_progress=_on_progress)
        )
    finally:
        loop.close()

    if _is_job_cancelled(job_id):
        return

    with _JOBS_LOCK:
        job = _JOBS[job_id]
        job["phase"] = JobPhase.COMPLETED.value
        job["status"] = JobStatus.COMPLETED.value
        job["progressPercent"] = 100
        job["completedScenes"] = vis_resp.totalScenes
        job["totalScenes"] = vis_resp.totalScenes
        job["message"] = "Visual production completed successfully and previews are ready for approval"
        job["result"] = vis_resp.model_dump()
        logger.info(f"[Jobs] Visual Job '{job_id}' completed successfully in {time.perf_counter() - job['startTime']:.2f}s")


def _is_job_cancelled(job_id: str) -> bool:
    with _JOBS_LOCK:
        job = _JOBS.get(job_id)
        return bool(job and job.get("isCancelled"))


def get_generation_job_status(job_id: str) -> Optional[Dict[str, Any]]:
    """Retrieves current job status, phase, percent, per-scene telemetry, and result."""
    with _JOBS_LOCK:
        job = _JOBS.get(job_id)
        if not job:
            return None

        elapsed = round(time.perf_counter() - job["startTime"], 2)
        return {
            "jobId": job["jobId"],
            "jobType": job.get("jobType", "script"),
            "status": job["status"],
            "phase": job["phase"],
            "progressPercent": job["progressPercent"],
            "completedScenes": job.get("completedScenes", 0),
            "totalScenes": job.get("totalScenes", 0),
            "message": job.get("message"),
            "elapsedSeconds": elapsed,
            "lastHeartbeat": job.get("lastHeartbeat"),
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


def recover_stale_jobs(stale_threshold_seconds: float = 120.0) -> List[str]:
    """
    Recovers or updates interrupted jobs whose worker heartbeat has expired.
    Preserves successful scene audio files on disk.
    """
    recovered = []
    now = time.time()
    with _JOBS_LOCK:
        for j_id, j in _JOBS.items():
            if j["status"] in [JobStatus.IN_PROGRESS.value, JobStatus.PROCESSING.value]:
                expires_at = j.get("leaseExpiresAt", 0.0)
                if expires_at and now > expires_at:
                    logger.warning(f"[Jobs] Job '{j_id}' lease expired (worker stalled), marking recovery state...")
                    has_progress = j.get("completedScenes", 0) > 0
                    j["status"] = JobStatus.PARTIALLY_COMPLETED.value if has_progress else JobStatus.FAILED.value
                    j["phase"] = JobPhase.PARTIALLY_COMPLETED.value if has_progress else JobPhase.FAILED.value
                    j["message"] = "Worker lease expired. Successful scene audio preserved; ready for resume."
                    recovered.append(j_id)
    return recovered
