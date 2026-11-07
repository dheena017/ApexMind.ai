"""
backend/tests/test_visual_production_p7.py

Integration test suite for Stage 3 Milestone P7:
Public REST API, Async Jobs & Studio Integration.
"""

import pytest
import time
from fastapi.testclient import TestClient

from backend.main import app
from backend.features.workspace.generation_jobs.job_service import get_generation_job_status

client = TestClient(app)


def test_fastapi_generate_visuals_sync():
    """Verify POST /api/studio/generate-visuals synchronous batch production."""
    payload = {
        "scriptId": "scr_8f716fa53031",
        "projectMode": "media",
        "aspectRatio": "9:16",
        "scenes": [
            {
                "sceneId": "scn_01_api",
                "sceneNumber": 1,
                "duration": 2.0,
                "visualDescription": "Misty autumn landscape with falling leaves",
                "narration": "The sky opens once every decade.",
            }
        ],
    }
    resp = client.post("/api/studio/generate-visuals", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    assert data["scriptId"] == "scr_8f716fa53031"
    assert len(data["scenes"]) == 1
    assert data["scenes"][0]["sceneId"] == "scn_01_api"
    assert data["scenes"][0]["status"] == "preview_ready"
    assert data["scenes"][0]["videoUrl"] is not None


def test_fastapi_generate_visuals_async_and_idempotency():
    """Verify POST /api/studio/generate-visuals/async job creation and idempotency."""
    idem_key = f"idem_vis_{int(time.time() * 1000)}"
    payload = {
        "scriptId": "scr_8f716fa53031",
        "projectMode": "media",
        "aspectRatio": "9:16",
        "scenes": [
            {
                "sceneId": "scn_01_async",
                "sceneNumber": 1,
                "duration": 1.0,
                "visualDescription": "Golden hour sunbeam hitting the earth",
            }
        ],
    }

    # 1. First async dispatch
    resp1 = client.post(
        "/api/studio/generate-visuals/async",
        json=payload,
        headers={"X-Idempotency-Key": idem_key},
    )
    assert resp1.status_code == 200
    job1 = resp1.json()
    job_id = job1["jobId"]
    assert job1["success"] is True
    assert job_id.startswith("job_")

    # 2. Second request with same idempotency key returns identical jobId
    resp2 = client.post(
        "/api/studio/generate-visuals/async",
        json=payload,
        headers={"X-Idempotency-Key": idem_key},
    )
    assert resp2.status_code == 200
    job2 = resp2.json()
    assert job2["jobId"] == job_id

    # 3. Poll job status
    poll_resp = client.get(f"/api/studio/jobs/{job_id}")
    assert poll_resp.status_code == 200
    status_data = poll_resp.json()
    assert status_data["jobId"] == job_id
    assert status_data["status"] in {"queued", "processing", "in_progress", "completed"}


def test_fastapi_scene_regeneration_and_approval():
    """Verify regeneration and approval endpoints on scene preview."""
    script_id = "scr_8f716fa53031"
    scene_id = "scn_01_test_route"

    # 1. Regenerate endpoint
    regen_payload = {
        "modeOverride": "media",
        "promptOverride": "High dynamic range sunset over ocean",
        "aspectRatio": "9:16",
    }
    r_resp = client.post(
        f"/api/studio/scripts/{script_id}/visuals/scenes/{scene_id}/regenerate",
        json=regen_payload,
    )
    assert r_resp.status_code == 200
    r_data = r_resp.json()
    assert r_data["sceneId"] == scene_id
    assert r_data["status"] == "preview_ready"
    assert r_data["version"] >= 1

    # 2. Approve endpoint
    appr_payload = {"approved": True}
    a_resp = client.post(
        f"/api/studio/scripts/{script_id}/visuals/scenes/{scene_id}/approve",
        json=appr_payload,
    )
    assert a_resp.status_code == 200
    a_data = a_resp.json()
    assert a_data["status"] == "approved"

    # 3. Get visual metadata endpoint
    meta_resp = client.get(f"/api/studio/scripts/{script_id}/visuals")
    assert meta_resp.status_code == 200
    meta_data = meta_resp.json()
    assert meta_data["success"] is True
    assert meta_data["scriptId"] == script_id
    assert "manifest" in meta_data

