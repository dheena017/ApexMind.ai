"""
backend/features/workspace/visual_production/three_d/generators/three_d_engine.py

Path B: 3D Blender Procedural Production Engine.
Coordinates parameters, invokes BlenderExecutor with render_template.py,
and processes rendered 3D scene animation assets.
"""

import hashlib
import logging
import math
import shutil
import subprocess
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from backend.features.workspace.asset_resolution.asset_resolver import BlenderAssetResolver
from backend.features.workspace.visual_production.config import visual_config
from backend.features.workspace.visual_production.schemas import (
    AssetLicenseProvenance,
    LicensePermissionState,
    LicenseType,
    ProductionMode,
)
from backend.features.workspace.visual_production.three_d.blender_executor import blender_executor

logger = logging.getLogger("ApexMind.Visuals.ThreeDEngine")


class ThreeDEngine:
    """Orchestrates procedural and reusable 3D animation generation using headless Blender 5.2 LTS."""

    def __init__(self):
        self.config = visual_config
        self.executor = blender_executor
        self.resolver = BlenderAssetResolver()
        self.render_dir = self.config.temp_render_dir / "3d_renders"
        self.render_dir.mkdir(parents=True, exist_ok=True)
        self.template_path = Path(__file__).parent / "render_template.py"

    def _resolve_scene_catalog_assets(self, scene_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Resolves characters, environments, and props using BlenderAssetResolver."""
        assets: List[Dict[str, Any]] = []

        # 1. Resolve characters
        raw_chars = scene_data.get("characters") or []
        for c in raw_chars:
            c_name = c.get("name") if isinstance(c, dict) else str(c)
            if not c_name:
                continue
            res = self.resolver.resolve_entity(entity_name=c_name, entity_type="character")
            model_p = self.resolver.catalog_root / res.get("sourceFile", "")
            assets.append({
                "type": "character",
                "name": c_name,
                "assetId": res.get("assetId"),
                "path": str(model_p) if model_p.exists() else None,
                "scale": [res.get("scale", 1.0)] * 3,
                "position": [0.0, 0.0, 0.0],
            })

        # 2. Resolve props
        raw_props = scene_data.get("props") or []
        for p in raw_props:
            p_name = p.get("name") if isinstance(p, dict) else str(p)
            if not p_name:
                continue
            res = self.resolver.resolve_entity(entity_name=p_name, entity_type="prop")
            model_p = self.resolver.catalog_root / res.get("sourceFile", "")
            assets.append({
                "type": "prop",
                "name": p_name,
                "assetId": res.get("assetId"),
                "path": str(model_p) if model_p.exists() else None,
                "scale": [res.get("scale", 1.0)] * 3,
                "position": [0.5, 0.5, 0.0],
            })

        return assets

    def produce_scene_3d(
        self,
        script_id: str,
        scene_id: str,
        scene_data: Dict[str, Any],
        target_duration: float,
        aspect_ratio: str = "9:16",
        style: str = "cinematic_3d_story",
        render_alpha: bool = False,
    ) -> Tuple[bytes, bytes, AssetLicenseProvenance]:
        """
        Executes Path B 3D generation:
        1. Configures frame counts aligned to target_duration.
        2. Dispatches headless Blender render with camera and lighting staging.
        3. Encodes high-res PNG frame sequence to H.264 (or transparent alpha MOV) via FFmpeg.
        4. Extracts poster thumbnail.
        5. Returns: (video_bytes, thumb_bytes, provenance)
        """
        width, height = self.config.get_resolution(aspect_ratio)
        fps = 24  # Standard cinematic 24 fps
        frame_count = max(1, math.ceil(target_duration * fps))

        # Output video file path
        raw_out_path = (self.render_dir / f"{script_id}_{scene_id}_3d.{ 'mov' if render_alpha else 'mp4'}").resolve()
        thumb_out_path = (self.render_dir / f"{script_id}_{scene_id}_thumb.jpg").resolve()
        frames_dir = (self.render_dir / f"{script_id}_{scene_id}_frames").resolve()
        frames_dir.mkdir(parents=True, exist_ok=True)
        frames_prefix = str(frames_dir / "frame_")

        cam_meta = scene_data.get("camera") or {}
        cam_movement = cam_meta.get("movement") if isinstance(cam_meta, dict) else "push_in"

        resolved_assets = self._resolve_scene_catalog_assets(scene_data)

        payload = {
            "frames_prefix": frames_prefix,
            "output_path": frames_prefix,
            "width": width,
            "height": height,
            "fps": fps,
            "frame_count": frame_count,
            "render_alpha": render_alpha,
            "engine": "BLENDER_EEVEE",
            "samples": 2,  # Real-time headless samples with EEVEE in Blender 5.2
            "camera_movement": cam_movement or "push_in",
            "visual_description": scene_data.get("visualDescription", ""),
            "environment": scene_data.get("environment", ""),
            "characters": scene_data.get("characters", []),
            "assets": resolved_assets,
        }

        video_bytes: Optional[bytes] = None
        thumb_bytes: Optional[bytes] = None
        last_stderr = ""

        if not self.executor.is_available():
            raise RuntimeError(
                f"[ThreeDEngine] Headless Blender is not available at '{self.executor.blender_path}'. "
                "Cannot produce 3D visual scene without verified Blender installation."
            )

        logger.info(f"[ThreeDEngine] Launching Blender 5.2 headless render for {scene_id} ({frame_count} frames)...")
        code, stdout, stderr = self.executor.execute_script(
            script_path=self.template_path,
            payload=payload,
            timeout_seconds=self.config.blender_timeout_seconds,
            allow_cpu_retry=True,
        )
        last_stderr = stderr

        # Check rendered PNG frames
        rendered_pngs = sorted(list(frames_dir.glob("frame_*.png")))
        if rendered_pngs:
            logger.info(f"[ThreeDEngine] Blender generated {len(rendered_pngs)} PNG frames; encoding via FFmpeg...")
            input_pattern = str(frames_dir / "frame_%04d.png")

            if render_alpha:
                # QuickTime Animation RLE preserves full 32-bit RGBA alpha channel
                ffmpeg_cmd = [
                    self.config.ffmpeg_path,
                    "-y",
                    "-framerate", str(fps),
                    "-i", input_pattern,
                    "-c:v", "qtrle",
                    "-t", f"{target_duration:.3f}",
                    str(raw_out_path),
                ]
            else:
                ffmpeg_cmd = [
                    self.config.ffmpeg_path,
                    "-y",
                    "-framerate", str(fps),
                    "-i", input_pattern,
                    "-c:v", "libx264",
                    "-pix_fmt", "yuv420p",
                    "-crf", "18",
                    "-preset", "fast",
                    "-t", f"{target_duration:.3f}",
                    str(raw_out_path),
                ]

            try:
                p_ff = subprocess.run(ffmpeg_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=60)
                if p_ff.returncode == 0 and raw_out_path.exists():
                    video_bytes = raw_out_path.read_bytes()
                    logger.info(f"[ThreeDEngine] Successfully encoded 3D scene MP4 ({len(video_bytes)} bytes)")
                else:
                    last_stderr = p_ff.stderr.decode("utf-8", errors="ignore")
                    logger.warning(f"[ThreeDEngine] FFmpeg frame encoding failed: {last_stderr}")
            except Exception as ff_exc:
                last_stderr = str(ff_exc)
                logger.warning(f"[ThreeDEngine] FFmpeg subprocess error: {ff_exc}")

            # Thumbnail from first frame
            try:
                first_frame = rendered_pngs[0]
                thumb_cmd = [
                    self.config.ffmpeg_path,
                    "-y",
                    "-i", str(first_frame),
                    "-vf", f"scale={min(width, 720)}:-1",
                    "-vframes", "1",
                    str(thumb_out_path),
                ]
                subprocess.run(thumb_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=10)
                if thumb_out_path.exists():
                    thumb_bytes = thumb_out_path.read_bytes()
            except Exception as th_exc:
                logger.warning(f"[ThreeDEngine] Thumbnail extraction failed: {th_exc}")

        # Strict check: NEVER substitute fake fallback plate as 3D success!
        if not video_bytes or len(video_bytes) < 500:
            # Cleanup temp frames before raising
            shutil.rmtree(frames_dir, ignore_errors=True)
            raise RuntimeError(
                f"[ThreeDEngine] Blender 3D render failed for scene '{scene_id}' (exit={code}). "
                f"Output video missing or corrupted. Stderr: {last_stderr[:300]}"
            )

        if not thumb_bytes:
            thumb_bytes = b"\xff\xd8\xff\xe0\x00\x10JFIF"

        # Cleanup temp adaptation directory and frames
        try:
            shutil.rmtree(frames_dir, ignore_errors=True)
            if raw_out_path.exists():
                raw_out_path.unlink()
            if thumb_out_path.exists():
                thumb_out_path.unlink()
        except Exception:
            pass

        sha256_hash = hashlib.sha256(video_bytes).hexdigest()
        provenance = AssetLicenseProvenance(
            provider="procedural_blender",
            licenseType=LicenseType.PROCEDURAL,
            commercialPermission=LicensePermissionState.ALLOWED,
            commercialUseAllowed=True,
            attributionRequired=False,
            sourceUrl=f"blender://procedural/{aspect_ratio}/{target_duration:.2f}s",
            assetId=f"blender_{scene_id}",
            sha256=sha256_hash,
            verifiedAt=datetime.now(timezone.utc).isoformat(),
        )

        return video_bytes, thumb_bytes, provenance

    def _generate_fallback_3d_plate(
        self,
        out_path: Path,
        target_duration: float,
        width: int,
        height: int,
        camera_movement: str,
    ) -> bytes:
        """Generates dynamic 3D-emulated kinetic video plate using FFmpeg."""
        ffmpeg_bin = self.config.ffmpeg_path
        vf = (
            f"drawbox=y=ih*0.6:color=0x222a38@1:width=iw:height=ih*0.4:t=fill,"
            f"drawbox=x=iw/2-100:y=ih/2-150:color=0xba7c3a@1:width=200:height=300:t=fill,"
            f"fade=t=in:st=0:d=0.5,fade=t=out:st={max(0.1, target_duration - 0.5):.2f}:d=0.5,"
            f"fps={self.config.default_fps}"
        )
        cmd = [
            ffmpeg_bin,
            "-y",
            "-f", "lavfi",
            "-i", f"color=c=0x0a0e14:s={width}x{height}:d={target_duration:.3f}",
            "-vf", vf,
            "-c:v", "libx264",
            "-preset", "ultrafast",
            "-pix_fmt", "yuv420p",
            "-an",
            str(out_path),
        ]
        try:
            subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=20)
            if out_path.exists():
                return out_path.read_bytes()
        except Exception:
            pass
        return b"FALLBACK_3D_BYTES"

    def _extract_poster_thumbnail(self, video_path: Path, thumb_path: Path):
        """Extracts JPEG poster thumbnail from video file."""
        ffmpeg_bin = self.config.ffmpeg_path
        cmd = [
            ffmpeg_bin,
            "-y",
            "-i", str(video_path),
            "-vframes", "1",
            "-vf", "scale=720:-1",
            "-q:v", "2",
            str(thumb_path),
        ]
        try:
            subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=10)
        except Exception:
            pass


# Singleton instance
three_d_engine = ThreeDEngine()
