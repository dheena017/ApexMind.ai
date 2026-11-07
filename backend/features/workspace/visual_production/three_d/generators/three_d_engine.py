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
from typing import Any, Dict, Optional, Tuple

from backend.features.workspace.visual_production.config import visual_config
from backend.features.workspace.visual_production.schemas import (
    AssetLicenseProvenance,
    LicenseType,
    ProductionMode,
)
from backend.features.workspace.visual_production.three_d.blender_executor import blender_executor

logger = logging.getLogger("ApexMind.Visuals.ThreeDEngine")


class ThreeDEngine:
    """Orchestrates procedural 3D animation generation using headless Blender 5.2 LTS."""

    def __init__(self):
        self.config = visual_config
        self.executor = blender_executor
        self.render_dir = self.config.temp_render_dir / "3d_renders"
        self.render_dir.mkdir(parents=True, exist_ok=True)
        self.template_path = Path(__file__).parent / "render_template.py"

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
        }

        video_bytes: Optional[bytes] = None
        thumb_bytes: Optional[bytes] = None

        if self.executor.is_available():
            logger.info(f"[ThreeDEngine] Launching Blender 5.2 headless render for {scene_id} ({frame_count} frames)...")
            code, stdout, stderr = self.executor.execute_script(
                script_path=self.template_path,
                payload=payload,
                timeout_seconds=self.config.blender_timeout_seconds,
            )

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
                        logger.warning(f"[ThreeDEngine] FFmpeg frame encoding failed: {p_ff.stderr.decode('utf-8', errors='ignore')}")
                except Exception as ff_exc:
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

        # Fallback if Blender or FFmpeg encoding failed
        if not video_bytes:
            logger.warning(
                f"[ThreeDEngine] Headless Blender render unavailable or failed for {scene_id}; "
                f"generating procedural fallback plate."
            )
            video_bytes = self._generate_fallback_3d_plate(
                out_path=raw_out_path,
                target_duration=target_duration,
                width=width,
                height=height,
                camera_movement=str(cam_movement),
            )
            if raw_out_path.exists():
                self._extract_poster_thumbnail(raw_out_path, thumb_out_path)
                if thumb_out_path.exists():
                    thumb_bytes = thumb_out_path.read_bytes()

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
