"""
scripts/produce_every_10_years_video.py

Produces the complete, broadcast-quality final video for:
"Every 10 Years, The Sky Gives Back"

Pipeline:
1. Stage 1: Narrative Storyboard (8 scenes with characters Cooper & Maya, sky anomaly).
2. Stage 2: Master Narration Audio (voice narration with exact timeline offsets).
3. Stage 3: Multi-Mode Visual Production (Automatic path routing: 3D, Hybrid, Media).
4. Final Assembly: Muxing all 8 scenes + master audio track into 1080x1920 MP4.
"""

import asyncio
import json
import logging
import os
import subprocess
import sys
from pathlib import Path

# Setup logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("ApexMind.Production")

ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR))

from backend.features.workspace.voice_generation.engine.voice_orchestrator import voice_orchestrator
from backend.features.workspace.voice_generation.schemas import VoiceConfig
from backend.features.workspace.visual_production.engine.visual_orchestrator import visual_orchestrator
from backend.features.workspace.visual_production.schemas import VisualProductionRequest, ProductionMode
from backend.features.workspace.visual_production.config import visual_config


async def main():
    logger.info("================================================================================")
    logger.info("PRODUCING FINAL VIDEO: 'Every 10 Years, The Sky Gives Back'")
    logger.info("================================================================================")

    # 1. Load Storyboard from reference fixture
    fixture_path = ROOT_DIR / "scratch" / "cinematic_3d_story_response.json"
    with open(fixture_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    storyboard = data.get("script", {})
    script_id = storyboard.get("id", "scr_8f716fa53031")
    storyboard["title"] = "Every 10 Years, The Sky Gives Back"
    scenes = storyboard.get("scenes", [])
    logger.info(f"Loaded {len(scenes)} storyboard scenes for script '{script_id}'")

    # 2. Stage 2: Voice Generation / Timing Resolution
    logger.info("\n--- [STAGE 2] Resolving narration voiceover and timing alignment ---")
    v_cfg = VoiceConfig(provider="edge-tts", voiceId="en-US-ChristopherNeural", speed=1.0)
    try:
        voice_res = await voice_orchestrator.generate_script_voice(
            script_document=storyboard,
            voice_config=v_cfg,
            delivery_preset="cinematic_narrator",
        )
    except Exception as exc:
        logger.warning(f"Online Edge-TTS voice synthesis fallback ({exc}), using local narrator...")
        v_cfg_local = VoiceConfig(provider="pyttsx3", speed=1.0)
        voice_res = await voice_orchestrator.generate_script_voice(
            script_document=storyboard,
            voice_config=v_cfg_local,
            delivery_preset="cinematic_narrator",
        )

    logger.info(f"Stage 2 Voice ready: {voice_res.masterAudioUrl} (duration={voice_res.masterDuration:.2f}s)")
    for s_meta in voice_res.scenes:
        logger.info(f"  - Scene {s_meta.sceneId}: dur={s_meta.actualDuration:.2f}s [{s_meta.timelineStart:.2f}s -> {s_meta.timelineEnd:.2f}s]")

    # 3. Stage 3: Visual Production with Automatic Path Routing (3D, Hybrid, Media)
    logger.info("\n--- [STAGE 3] Executing Visual Production (Automatic Path Routing) ---")
    vis_req = VisualProductionRequest(
        scriptId=script_id,
        projectMode=ProductionMode.MEDIA,
        aspectRatio="9:16",
        autoRoute=True,
    )
    vis_res = await visual_orchestrator.generate_storyboard_visuals(vis_req)
    logger.info(f"Stage 3 completed: {len(vis_res.scenes)} visual scenes generated | avg_score={vis_res.overallQualityScore:.2f}")
    for scn_out in vis_res.scenes:
        logger.info(f"  - Scene {scn_out.sceneNumber} ({scn_out.sceneId}): mode={scn_out.modeUsed.value} | path={scn_out.videoPath}")

    # 4. Final Assembly: Muxing 8 Scene MP4s with Master Narration Track
    logger.info("\n--- [FINAL ASSEMBLY] Concatenating 8 scenes and muxing master audio track ---")
    output_dir = ROOT_DIR / "backend" / "data" / "rendered_shorts"
    output_dir.mkdir(parents=True, exist_ok=True)
    final_output_path = output_dir / "Every_10_Years_The_Sky_Gives_Back_Final.mp4"

    # Create demuxer concat list
    concat_list_path = ROOT_DIR / "media" / f"{script_id}_final_concat.txt"
    concat_lines = []
    for scn_out in vis_res.scenes:
        p = Path(scn_out.videoPath).resolve()
        concat_lines.append(f"file '{str(p).replace(chr(92), '/')}'")
    concat_list_path.write_text("\n".join(concat_lines), encoding="utf-8")

    master_audio_path = (ROOT_DIR / voice_res.masterAudioUrl.lstrip("/")).resolve()
    ffmpeg_bin = visual_config.ffmpeg_path

    final_cmd = [
        ffmpeg_bin,
        "-y",
        "-f", "concat",
        "-safe", "0",
        "-i", str(concat_list_path),
        "-i", str(master_audio_path),
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        "-preset", "medium",
        "-crf", "18",
        "-c:a", "aac",
        "-b:a", "192k",
        "-shortest",
        str(final_output_path),
    ]

    logger.info(f"Executing final assembly command -> {final_output_path.name}")
    proc = subprocess.run(final_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if proc.returncode != 0:
        logger.error(f"Final assembly failed: {proc.stderr.decode('utf-8', errors='ignore')}")
        sys.exit(1)

    # Clean up concat list
    try:
        concat_list_path.unlink()
    except Exception:
        pass

    # Extract final poster thumbnail
    thumb_path = output_dir / "Every_10_Years_The_Sky_Gives_Back_Final_thumb.jpg"
    thumb_cmd = [
        ffmpeg_bin,
        "-y",
        "-i", str(final_output_path),
        "-vframes", "1",
        "-vf", "scale=1080:-1",
        "-q:v", "2",
        str(thumb_path),
    ]
    subprocess.run(thumb_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

    file_size_mb = final_output_path.stat().st_size / (1024 * 1024)
    logger.info("================================================================================")
    logger.info("FINAL VIDEO PRODUCTION COMPLETE!")
    logger.info(f"Location: {final_output_path}")
    logger.info(f"File Size: {file_size_mb:.2f} MB")
    logger.info(f"Thumbnail: {thumb_path}")
    logger.info("================================================================================")


if __name__ == "__main__":
    asyncio.run(main())

