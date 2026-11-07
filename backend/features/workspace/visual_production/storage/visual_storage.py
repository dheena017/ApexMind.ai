"""
backend/features/workspace/visual_production/storage/visual_storage.py

Versioned video file persistence, poster thumbnail management,
and atomic filesystem operations for Stage 3: Visual Production.
"""

import json
import logging
import os
import shutil
import subprocess
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from backend.features.workspace.visual_production.config import visual_config

logger = logging.getLogger("ApexMind.Visuals.Storage")


class VisualStorageManager:
    """Manages scene MP4s, thumbnails, sidecar manifests, and master video previews."""

    def __init__(self, base_media_dir: Optional[str] = None):
        self.base_dir = (Path(base_media_dir or os.environ.get("MEDIA_DIR", "media")) / "visuals").resolve()
        self.base_dir.mkdir(parents=True, exist_ok=True)

    def get_script_dir(self, script_id: str) -> Path:
        """Returns and creates the isolated directory for a given script."""
        s_dir = self.base_dir / script_id
        s_dir.mkdir(parents=True, exist_ok=True)
        return s_dir

    def get_next_scene_version(self, script_id: str, scene_id: str) -> int:
        """Computes the next incremental version integer for a scene."""
        s_dir = self.get_script_dir(script_id)
        existing = list(s_dir.glob(f"{scene_id}_v*.mp4"))
        if not existing:
            return 1
        versions: List[int] = []
        for p in existing:
            try:
                # Expects pattern {scene_id}_v{version}.mp4
                v_part = p.stem.split("_v")[-1]
                versions.append(int(v_part))
            except ValueError:
                pass
        return (max(versions) + 1) if versions else 1

    def get_active_scene_version(self, script_id: str, scene_id: str) -> int:
        """Finds the latest available version integer for a scene."""
        s_dir = self.get_script_dir(script_id)
        existing = list(s_dir.glob(f"{scene_id}_v*.mp4"))
        if not existing:
            return 1
        versions: List[int] = []
        for p in existing:
            try:
                v_part = p.stem.split("_v")[-1]
                versions.append(int(v_part))
            except ValueError:
                pass
        return max(versions) if versions else 1

    def save_scene_video(
        self,
        script_id: str,
        scene_id: str,
        video_bytes: bytes,
        version: Optional[int] = None,
        ext: str = "mp4",
    ) -> Tuple[Path, str, int]:
        """
        Atomically saves a versioned scene video file.
        Returns: (file_path, public_url, version)
        """
        s_dir = self.get_script_dir(script_id)
        v = version if version is not None else self.get_next_scene_version(script_id, scene_id)
        filename = f"{scene_id}_v{v}.{ext}"
        file_path = s_dir / filename

        # Atomic write via hidden temp file
        temp_path = s_dir / f".tmp_{filename}"
        with open(temp_path, "wb") as f:
            f.write(video_bytes)

        shutil.move(str(temp_path), str(file_path))

        rel_path = f"{script_id}/{filename}"
        public_url = f"/media/visuals/{rel_path}"

        logger.info(f"[VisualStorage] Saved scene video: {file_path} (v{v})")
        return file_path, public_url, v

    def save_scene_thumbnail(
        self,
        script_id: str,
        scene_id: str,
        image_bytes: bytes,
        version: Optional[int] = None,
        ext: str = "jpg",
    ) -> Tuple[Path, str, int]:
        """
        Atomically saves a versioned poster thumbnail image.
        Returns: (file_path, public_url, version)
        """
        s_dir = self.get_script_dir(script_id)
        v = version if version is not None else self.get_active_scene_version(script_id, scene_id)
        filename = f"{scene_id}_v{v}_thumb.{ext}"
        file_path = s_dir / filename

        temp_path = s_dir / f".tmp_{filename}"
        with open(temp_path, "wb") as f:
            f.write(image_bytes)

        shutil.move(str(temp_path), str(file_path))

        rel_path = f"{script_id}/{filename}"
        public_url = f"/media/visuals/{rel_path}"

        logger.info(f"[VisualStorage] Saved thumbnail: {file_path} (v{v})")
        return file_path, public_url, v

    def extract_and_save_thumbnail(
        self,
        script_id: str,
        scene_id: str,
        video_path: Path,
        version: int,
        time_offset: float = 0.5,
    ) -> Tuple[Optional[Path], Optional[str]]:
        """
        Uses FFmpeg to extract a high-quality JPEG poster frame from the video.
        Falls back gracefully if FFmpeg extraction fails.
        """
        s_dir = self.get_script_dir(script_id)
        filename = f"{scene_id}_v{version}_thumb.jpg"
        target_path = s_dir / filename
        temp_path = s_dir / f".tmp_{filename}"

        ffmpeg_bin = visual_config.ffmpeg_path
        cmd = [
            ffmpeg_bin,
            "-y",
            "-ss", str(time_offset),
            "-i", str(video_path),
            "-frames:v", "1",
            "-q:v", "2",
            str(temp_path),
        ]

        try:
            res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=15)
            if res.returncode == 0 and temp_path.exists():
                shutil.move(str(temp_path), str(target_path))
                rel_path = f"{script_id}/{filename}"
                return target_path, f"/media/visuals/{rel_path}"
            else:
                logger.warning(f"[VisualStorage] FFmpeg thumbnail extraction returned {res.returncode}")
        except Exception as exc:
            logger.warning(f"[VisualStorage] Could not extract thumbnail via FFmpeg: {exc}")
        finally:
            if temp_path.exists():
                try:
                    temp_path.unlink()
                except Exception:
                    pass

        return None, None

    def save_master_preview(
        self,
        script_id: str,
        video_bytes: bytes,
        version: Optional[int] = None,
    ) -> Tuple[Path, str, int]:
        """
        Atomically saves and promotes visual_master_vN.mp4 and visual_master.mp4.
        """
        s_dir = self.get_script_dir(script_id)
        existing_masters = list(s_dir.glob("visual_master_v*.mp4"))
        v_list: List[int] = []
        for p in existing_masters:
            try:
                v_list.append(int(p.stem.split("_v")[-1]))
            except ValueError:
                pass
        v = version if version is not None else ((max(v_list) + 1) if v_list else 1)

        versioned_filename = f"visual_master_v{v}.mp4"
        versioned_path = s_dir / versioned_filename
        active_master_path = s_dir / "visual_master.mp4"

        # Atomic write
        temp_path = s_dir / f".tmp_{versioned_filename}"
        with open(temp_path, "wb") as f:
            f.write(video_bytes)

        shutil.move(str(temp_path), str(versioned_path))
        shutil.copyfile(str(versioned_path), str(active_master_path))

        public_url = f"/media/visuals/{script_id}/visual_master.mp4"
        logger.info(f"[VisualStorage] Promoted master preview: {active_master_path} (v{v})")
        return active_master_path, public_url, v

    def load_manifest(self, script_id: str) -> Dict[str, Any]:
        """Loads the metadata sidecar manifest.json for the script."""
        manifest_path = self.get_script_dir(script_id) / "manifest.json"
        if manifest_path.exists():
            try:
                with open(manifest_path, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception as exc:
                logger.warning(f"[VisualStorage] Failed reading manifest for {script_id}: {exc}")
        return {"scriptId": script_id, "scenes": {}, "updatedAt": datetime.now(timezone.utc).isoformat()}

    def save_manifest(self, script_id: str, manifest_data: Dict[str, Any]):
        """Atomically saves the metadata sidecar manifest.json."""
        s_dir = self.get_script_dir(script_id)
        manifest_path = s_dir / "manifest.json"
        temp_path = s_dir / ".tmp_manifest.json"

        manifest_data["updatedAt"] = datetime.now(timezone.utc).isoformat()
        with open(temp_path, "w", encoding="utf-8") as f:
            json.dump(manifest_data, f, indent=2)

        shutil.move(str(temp_path), str(manifest_path))

    def rollback_failed_regeneration(self, script_id: str, scene_id: str, failed_version: int):
        """
        Removes broken partial artifacts from a failed regeneration attempt,
        ensuring previous active version remains untouched.
        """
        s_dir = self.get_script_dir(script_id)
        failed_files = [
            s_dir / f"{scene_id}_v{failed_version}.mp4",
            s_dir / f"{scene_id}_v{failed_version}_thumb.jpg",
            s_dir / f".tmp_{scene_id}_v{failed_version}.mp4",
            s_dir / f".tmp_{scene_id}_v{failed_version}_thumb.jpg",
        ]
        for p in failed_files:
            if p.exists():
                try:
                    p.unlink()
                    logger.info(f"[VisualStorage] Rolled back failed file: {p.name}")
                except Exception as exc:
                    logger.warning(f"[VisualStorage] Error deleting {p.name}: {exc}")


# Singleton instance
visual_storage = VisualStorageManager()

