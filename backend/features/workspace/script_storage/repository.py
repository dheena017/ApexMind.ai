"""
backend/features/workspace/script_storage/repository.py

Persistence and version management repository for Script Generation Architecture v2 (Milestone 7).
Manages scripts, immutable script_versions, scene_versions, and script_approvals in SQLite.
"""

import json
import logging
import os
import sqlite3
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from uuid import uuid4

from backend.database.connection import get_connection
from .approvals import ApprovalManager, ApprovalState, ApprovalStage
from .versioning import compute_script_diff

logger = logging.getLogger("ApexMind.ScriptStorage.Repository")

_MIGRATION_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))),
    "database",
    "migrations",
    "002_script_generation_v2.sql",
)


def init_script_storage_schema():
    """Applies migration 002_script_generation_v2.sql if tables do not exist."""
    conn = get_connection()
    try:
        conn.execute("PRAGMA foreign_keys = ON;")
        if os.path.exists(_MIGRATION_PATH):
            with open(_MIGRATION_PATH, "r", encoding="utf-8") as f:
                sql = f.read()
            conn.executescript(sql)
            conn.commit()
            logger.info("[ScriptStorage] Schema verified successfully.")
    except Exception as exc:
        logger.error(f"[ScriptStorage] Failed to initialize schema: {exc}")
    finally:
        conn.close()


# Auto-run schema check upon import
init_script_storage_schema()


class ScriptStorageRepository:
    """Repository handling ACID persistence for scripts, versions, scenes, and approvals."""

    @staticmethod
    def save_script(
        script_data: Dict[str, Any],
        project_id: str = "default_project",
        generation_profile: str = "motivational_reel",
        user_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Creates a new script and its initial version 1."""
        conn = get_connection()
        conn.execute("PRAGMA foreign_keys = ON;")
        now = datetime.now(timezone.utc).isoformat()
        script_id = script_data.get("id") or f"scr_{uuid4().hex[:12]}"
        version_id = f"ver_{uuid4().hex[:12]}"

        title = script_data.get("title") or "Untitled Story"
        aspect_ratio = script_data.get("aspectRatio") or "9:16"
        total_duration = float(script_data.get("totalDuration", 30.0))
        scenes = script_data.get("scenes", [])
        manifest = script_data.get("assetManifest", {})

        try:
            with conn:
                # 1. Insert parent script
                conn.execute(
                    """
                    INSERT INTO scripts (
                        id, project_id, generation_profile, title,
                        aspect_ratio, total_duration, status, current_version_id,
                        created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        script_id,
                        project_id,
                        generation_profile,
                        title,
                        aspect_ratio,
                        total_duration,
                        "draft",
                        version_id,
                        now,
                        now,
                    ),
                )

                # 2. Insert Version 1
                conn.execute(
                    """
                    INSERT INTO script_versions (
                        id, script_id, version_number, generation_profile,
                        title, description, total_duration, aspect_ratio,
                        document_payload, asset_manifest, change_summary,
                        created_by, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        version_id,
                        script_id,
                        1,
                        generation_profile,
                        title,
                        script_data.get("description", ""),
                        total_duration,
                        aspect_ratio,
                        json.dumps(script_data),
                        json.dumps(manifest),
                        "Initial AI script generation",
                        user_id or "ai_agent",
                        now,
                    ),
                )

                # 3. Insert Scene Versions
                for idx, sc in enumerate(scenes):
                    scene_id = sc.get("sceneId") or f"scn_{uuid4().hex[:8]}"
                    scene_num = sc.get("sceneNumber", idx + 1)
                    conn.execute(
                        """
                        INSERT INTO scene_versions (
                            id, script_version_id, scene_number, scene_id,
                            start_time, end_time, duration, narration,
                            visual_description, scene_payload
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        """,
                        (
                            f"scv_{uuid4().hex[:10]}",
                            version_id,
                            scene_num,
                            scene_id,
                            float(sc.get("startTime", 0.0)),
                            float(sc.get("endTime", 0.0)),
                            float(sc.get("duration", 0.0)),
                            sc.get("narration", ""),
                            sc.get("visualDescription", ""),
                            json.dumps(sc),
                        ),
                    )

            logger.info(f"[ScriptStorage] Saved script '{script_id}' v1 with {len(scenes)} scenes")
            return {
                "scriptId": script_id,
                "versionId": version_id,
                "versionNumber": 1,
                "title": title,
                "createdAt": now,
            }
        finally:
            conn.close()

    @staticmethod
    def create_version(
        script_id: str,
        script_data: Dict[str, Any],
        change_summary: str = "Script update",
        created_by: str = "user",
    ) -> Dict[str, Any]:
        """Creates an immutable new version for an existing script."""
        conn = get_connection()
        conn.execute("PRAGMA foreign_keys = ON;")
        now = datetime.now(timezone.utc).isoformat()
        version_id = f"ver_{uuid4().hex[:12]}"

        try:
            with conn:
                # Get current max version number
                row = conn.execute(
                    "SELECT MAX(version_number) as max_ver FROM script_versions WHERE script_id = ?",
                    (script_id,),
                ).fetchone()
                next_ver = (row["max_ver"] or 0) + 1

                title = script_data.get("title") or "Untitled Story"
                aspect_ratio = script_data.get("aspectRatio") or "9:16"
                total_duration = float(script_data.get("totalDuration", 30.0))
                scenes = script_data.get("scenes", [])
                manifest = script_data.get("assetManifest", {})
                profile = script_data.get("generationProfile") or "motivational_reel"

                # Insert new version
                conn.execute(
                    """
                    INSERT INTO script_versions (
                        id, script_id, version_number, generation_profile,
                        title, description, total_duration, aspect_ratio,
                        document_payload, asset_manifest, change_summary,
                        created_by, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        version_id,
                        script_id,
                        next_ver,
                        profile,
                        title,
                        script_data.get("description", ""),
                        total_duration,
                        aspect_ratio,
                        json.dumps(script_data),
                        json.dumps(manifest),
                        change_summary,
                        created_by,
                        now,
                    ),
                )

                # Insert scenes for this version
                for idx, sc in enumerate(scenes):
                    scene_id = sc.get("sceneId") or f"scn_{uuid4().hex[:8]}"
                    scene_num = sc.get("sceneNumber", idx + 1)
                    conn.execute(
                        """
                        INSERT INTO scene_versions (
                            id, script_version_id, scene_number, scene_id,
                            start_time, end_time, duration, narration,
                            visual_description, scene_payload
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        """,
                        (
                            f"scv_{uuid4().hex[:10]}",
                            version_id,
                            scene_num,
                            scene_id,
                            float(sc.get("startTime", 0.0)),
                            float(sc.get("endTime", 0.0)),
                            float(sc.get("duration", 0.0)),
                            sc.get("narration", ""),
                            sc.get("visualDescription", ""),
                            json.dumps(sc),
                        ),
                    )

                # Update current_version_id on parent script
                conn.execute(
                    """
                    UPDATE scripts
                    SET current_version_id = ?, title = ?, total_duration = ?, updated_at = ?
                    WHERE id = ?
                    """,
                    (version_id, title, total_duration, now, script_id),
                )

            logger.info(f"[ScriptStorage] Created script '{script_id}' v{next_ver}")
            return {
                "scriptId": script_id,
                "versionId": version_id,
                "versionNumber": next_ver,
                "title": title,
                "createdAt": now,
            }
        finally:
            conn.close()

    @staticmethod
    def get_script(script_id: str) -> Optional[Dict[str, Any]]:
        conn = get_connection()
        try:
            row = conn.execute("SELECT * FROM scripts WHERE id = ?", (script_id,)).fetchone()
            if not row:
                return None
            script = dict(row)

            # Fetch current version details if available
            if script.get("current_version_id"):
                ver_row = conn.execute(
                    "SELECT * FROM script_versions WHERE id = ?",
                    (script["current_version_id"],),
                ).fetchone()
                if ver_row:
                    script["currentVersion"] = {
                        "versionNumber": ver_row["version_number"],
                        "payload": json.loads(ver_row["document_payload"]),
                        "assetManifest": json.loads(ver_row["asset_manifest"] or "{}"),
                        "changeSummary": ver_row["change_summary"],
                        "createdAt": ver_row["created_at"],
                    }
            return script
        finally:
            conn.close()

    @staticmethod
    def list_versions(script_id: str) -> List[Dict[str, Any]]:
        conn = get_connection()
        try:
            rows = conn.execute(
                """
                SELECT id, version_number, title, total_duration, change_summary, created_by, created_at
                FROM script_versions
                WHERE script_id = ?
                ORDER BY version_number ASC
                """,
                (script_id,),
            ).fetchall()
            return [dict(r) for r in rows]
        finally:
            conn.close()

    @staticmethod
    def submit_approval(
        script_version_id: str,
        stage: str,
        status: str = "approved",
        approved_by: str = "user",
        comments: str = "",
    ) -> Dict[str, Any]:
        conn = get_connection()
        now = datetime.now(timezone.utc).isoformat()
        approval_id = f"appr_{uuid4().hex[:10]}"
        try:
            with conn:
                conn.execute(
                    """
                    INSERT INTO script_approvals (
                        id, script_version_id, stage, status, approved_by, approved_at, comments
                    ) VALUES (?, ?, ?, ?, ?, ?, ?)
                    """,
                    (approval_id, script_version_id, stage, status, approved_by, now, comments),
                )
            return {
                "approvalId": approval_id,
                "scriptVersionId": script_version_id,
                "stage": stage,
                "status": status,
                "approvedBy": approved_by,
                "approvedAt": now,
            }
        finally:
            conn.close()

