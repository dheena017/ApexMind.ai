"""
backend/features/workspace/visual_production/engine/approval_manager.py

Scene preview approval lifecycle and master video preview assembly.
Promotes approved scene visual outputs into a unified master timeline preview.
"""

import logging
import subprocess
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

from backend.features.workspace.visual_production.config import visual_config
from backend.features.workspace.visual_production.schemas import SceneVisualStatus
from backend.features.workspace.visual_production.storage.visual_storage import (
    VisualStorageManager,
    visual_storage,
)

logger = logging.getLogger("ApexMind.Visuals.ApprovalManager")


class ApprovalManager:
    """Manages scene preview approval state transitions and master preview compilation."""

    def __init__(self):
        self.config = visual_config
        self.storage = visual_storage

    def approve_scene(
        self,
        script_id: str,
        scene_id: str,
        approved: bool,
        rejection_reason: Optional[str] = None,
        storage: Optional[VisualStorageManager] = None,
    ) -> Dict[str, Any]:
        """Updates scene status in the manifest to approved or rejected."""
        st = storage or self.storage
        manifest = st.load_manifest(script_id)
        if scene_id not in manifest.get("scenes", {}):
            manifest.setdefault("scenes", {})[scene_id] = {
                "sceneNumber": 1,
                "activeVersion": st.get_active_scene_version(script_id, scene_id),
            }

        new_status = SceneVisualStatus.APPROVED if approved else SceneVisualStatus.REJECTED
        manifest["scenes"][scene_id]["status"] = new_status.value
        if rejection_reason and not approved:
            manifest["scenes"][scene_id]["rejectionReason"] = rejection_reason
        elif approved and "rejectionReason" in manifest["scenes"][scene_id]:
            del manifest["scenes"][scene_id]["rejectionReason"]

        manifest["updatedAt"] = datetime.now(timezone.utc).isoformat()
        st.save_manifest(script_id, manifest)

        # Check if all scenes are approved to trigger master video assembly
        master_url = self.assemble_master_preview_if_all_approved(script_id, storage=st)

        return {
            "sceneId": scene_id,
            "status": new_status.value,
            "rejectionReason": rejection_reason,
            "masterPreviewUrl": master_url,
            "updatedAt": manifest["updatedAt"],
        }

    def assemble_master_preview_if_all_approved(
        self, script_id: str, storage: Optional[VisualStorageManager] = None
    ) -> Optional[str]:
        """
        If all storyboard scenes in the script have been approved by the user,
        concatenates their active MP4 video clips into the master preview video.
        """
        st = storage or self.storage
        manifest = st.load_manifest(script_id)
        scenes_dict = manifest.get("scenes", {})
        if not scenes_dict:
            return None

        # Verify every scene is in APPROVED status
        all_approved = all(s.get("status") == SceneVisualStatus.APPROVED.value for s in scenes_dict.values())
        if not all_approved:
            return None

        s_dir = st.get_script_dir(script_id)
        # Sort scenes by sceneNumber
        sorted_scenes = sorted(scenes_dict.items(), key=lambda kv: kv[1].get("sceneNumber", 0))

        clip_paths: List[Path] = []
        for sid, sdata in sorted_scenes:
            v = sdata.get("activeVersion") or st.get_active_scene_version(script_id, sid)
            clip_p = s_dir / f"{sid}_v{v}.mp4"
            if clip_p.exists():
                clip_paths.append(clip_p)
            else:
                logger.warning(f"[ApprovalManager] Missing video file for scene {sid} at {clip_p}")

        if not clip_paths:
            return None

        # Build FFmpeg concat list
        temp_concat_file = tempfile.NamedTemporaryFile(mode="w", suffix=".txt", delete=False, encoding="utf-8")
        try:
            for cp in clip_paths:
                # Format: file 'path' with escaped backslashes for FFmpeg
                formatted_path = str(cp.resolve()).replace("\\", "/")
                temp_concat_file.write(f"file '{formatted_path}'\n")
            temp_concat_file.close()

            temp_out = s_dir / ".tmp_master_assembled.mp4"
            ffmpeg_bin = self.config.ffmpeg_path
            cmd = [
                ffmpeg_bin,
                "-y",
                "-f", "concat",
                "-safe", "0",
                "-i", temp_concat_file.name,
                "-c", "copy",
                str(temp_out),
            ]

            res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=45)
            if res.returncode == 0 and temp_out.exists():
                master_bytes = temp_out.read_bytes()
                _, public_url, _ = st.save_master_preview(script_id, master_bytes)
                temp_out.unlink()
                manifest["masterPreviewUrl"] = public_url
                st.save_manifest(script_id, manifest)
                logger.info(f"[ApprovalManager] Assembled master preview: {public_url}")
                return public_url
            else:
                logger.warning(f"[ApprovalManager] FFmpeg concat failed: {res.stderr.decode()[:200]}")
        except Exception as exc:
            logger.warning(f"[ApprovalManager] Could not assemble master preview: {exc}")
        finally:
            import os
            if os.path.exists(temp_concat_file.name):
                try:
                    os.unlink(temp_concat_file.name)
                except Exception:
                    pass

        return None


# Singleton instance
approval_manager = ApprovalManager()
