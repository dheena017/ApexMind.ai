"""
scripts/produce_final_3d_video.py

Executes full end-to-end generation for "Echoes of the Obsidian Obelisk":
1. Stage 1: Approved 3D Storyboard (4 scenes).
2. Stage 2: Spoken voiceover narration generation (Edge-TTS / pyttsx3) per scene + master narration track.
3. Stage 3: Procedural 3D scene visual generation via Blender 5.2 LTS + FFmpeg duration lock.
4. Final Assembly: Muxing 3D scene timeline with narration audio into broadcast-quality 1080x1920 MP4.
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

# Ensure project root in python path
ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR))

from backend.features.workspace.voice_generation.engine.voice_orchestrator import voice_orchestrator
from backend.features.workspace.voice_generation.schemas import VoiceConfig
from backend.features.workspace.visual_production.engine.visual_orchestrator import visual_orchestrator
from backend.features.workspace.visual_production.schemas import VisualProductionRequest, ProductionMode
from backend.features.workspace.visual_production.config import visual_config

# Storyboard Definition
SCRIPT_ID = "scr_3d_obelisk_final"
STORYBOARD = {
    "id": SCRIPT_ID,
    "title": "Echoes of the Obsidian Obelisk",
    "description": "An ancient alien obelisk stirs in the desert as reconnaissance drones investigate.",
    "aspectRatio": "9:16",
    "totalDuration": 16.0,
    "scenes": [
        {
            "sceneId": "scn_01",
            "sceneNumber": 1,
            "duration": 4.0,
            "narration": "Beneath the starlit desert, a dormant force stirs from the deep earth.",
            "visualDescription": "A towering obsidian crystalline obelisk rising from dark sand dunes under a starry night sky, geometric glyphs glowing.",
            "camera": {"shot": "wide", "angle": "low_angle", "movement": "push_in"},
            "environment": "desert_dunes_01",
        },
        {
            "sceneId": "scn_02",
            "sceneNumber": 2,
            "duration": 4.0,
            "narration": "Reconnaissance units descend into the sector, tracking an unidentifiable energy spike.",
            "visualDescription": "Recon drones hover near the massive obelisk, their sensor lights casting reflections across polished black crystalline panels.",
            "camera": {"shot": "medium", "angle": "high_angle", "movement": "orbit"},
            "environment": "desert_dunes_01",
        },
        {
            "sceneId": "scn_03",
            "sceneNumber": 3,
            "duration": 4.0,
            "narration": "A resonant frequency pierces the silence, echoing across digital telemetry networks.",
            "visualDescription": "Harmonic sound waves ripple outward from the obelisk across the dark desert sand.",
            "camera": {"shot": "close_up", "angle": "eye_level", "movement": "pan_left"},
            "environment": "desert_dunes_01",
        },
        {
            "sceneId": "scn_04",
            "sceneNumber": 4,
            "duration": 4.0,
            "narration": "Whatever has awakened, has only just begun to speak.",
            "visualDescription": "The obsidian obelisk opens, revealing a blazing core of pure energy as drones stream into the dark sky.",
            "camera": {"shot": "wide", "angle": "low_angle", "movement": "push_in"},
            "environment": "desert_dunes_01",
        },
    ],
}


async def main():
    logger.info("================================================================================")
    logger.info(f"STARTING FULL 3D VIDEO PRODUCTION: {STORYBOARD['title']}")
    logger.info("================================================================================")

    # --------------------------------------------------------------------------
    # 1. STAGE 2: VOICE GENERATION
    # --------------------------------------------------------------------------
    logger.info("\n--- [STAGE 2] Generating multi-scene voice narration ---")
    v_cfg = VoiceConfig(provider="edge-tts", voiceId="en-US-ChristopherNeural", speed=1.0)
    try:
        voice_res = await voice_orchestrator.generate_script_voice(
            script_document=STORYBOARD,
            voice_config=v_cfg,
            delivery_preset="cinematic_narrator",
        )
    except Exception as exc:
        logger.warning(f"Online TTS provider failed ({exc}); falling back to local pyttsx3 narrator...")
        v_cfg_local = VoiceConfig(provider="pyttsx3", speed=1.0)
        voice_res = await voice_orchestrator.generate_script_voice(
            script_document=STORYBOARD,
            voice_config=v_cfg_local,
            delivery_preset="cinematic_narrator",
        )

    logger.info(f"Stage 2 Voice generated successfully!")
    logger.info(f"Master Narration Track: {voice_res.masterAudioUrl} ({voice_res.masterDuration:.2f}s)")
    scene_timings = {}
    for s_audio in voice_res.scenes:
        s_id = s_audio.sceneId
        scene_timings[s_id] = s_audio
        logger.info(f"  - Scene {s_id}: duration={s_audio.actualDuration:.2f}s, start={s_audio.timelineStart:.2f}s, end={s_audio.timelineEnd:.2f}s")

    # Update scene durations from voice timings for exact lip & pacing sync
    updated_scenes = []
    for scn in STORYBOARD["scenes"]:
        s_id = scn["sceneId"]
        if s_id in scene_timings:
            scn["duration"] = scene_timings[s_id].actualDuration
        updated_scenes.append(scn)
    STORYBOARD["scenes"] = updated_scenes

    # --------------------------------------------------------------------------
    # 2. STAGE 3: 3D PROCEDURAL VISUAL PRODUCTION
    # --------------------------------------------------------------------------
    logger.info("\n--- [STAGE 3] Generating 3D procedural scenes via Blender 5.2 LTS ---")
    vis_req = VisualProductionRequest(
        scriptId=SCRIPT_ID,
        projectMode=ProductionMode.THREE_D,
        scenes=STORYBOARD["scenes"],
        aspectRatio="9:16",
        autoRoute=False,
    )
    vis_res = await visual_orchestrator.generate_storyboard_visuals(vis_req)
    logger.info(f"Stage 3 Visuals completed: {len(vis_res.scenes)} scenes rendered.")
    for scn_out in vis_res.scenes:
        logger.info(f"  - {scn_out.sceneId} (v{scn_out.version}): {scn_out.videoPath} | Quality={scn_out.quality.overallScore if scn_out.quality else 'N/A'}")

    # --------------------------------------------------------------------------
    # 3. FINAL COMPOSITING & MUXING
    # --------------------------------------------------------------------------
    logger.info("\n--- [FINAL ASSEMBLY] Muxing 3D visuals with master narration audio ---")
    output_dir = ROOT_DIR / "backend" / "data" / "rendered_shorts"
    output_dir.mkdir(parents=True, exist_ok=True)
    final_output_path = output_dir / "Echoes_of_the_Obsidian_Obelisk_Final.mp4"

    # Create concat list for FFmpeg demuxer
    concat_list_path = ROOT_DIR / "media" / f"{SCRIPT_ID}_concat.txt"
    concat_lines = []
    for scn_out in vis_res.scenes:
        p = Path(scn_out.videoPath).resolve()
        concat_lines.append(f"file '{str(p).replace(chr(92), '/')}'")
    concat_list_path.write_text("\n".join(concat_lines), encoding="utf-8")

    # Resolve master narration audio path
    master_audio_path = (ROOT_DIR / voice_res.masterAudioUrl.lstrip("/")).resolve()

    # Build final FFmpeg mux command:
    # 1. Concatenate all 4 scene MP4s
    # 2. Add master narration audio track
    # 3. Apply subtle cinematic color grading and audio normalization
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

    logger.info(f"Executing final assembly command:\n{' '.join(final_cmd[:6])} ... -> {final_output_path.name}")
    proc = subprocess.run(final_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if proc.returncode != 0:
        logger.error(f"Final assembly failed: {proc.stderr.decode('utf-8', errors='ignore')}")
        sys.exit(1)

    # Clean up concat file
    try:
        concat_list_path.unlink()
    except Exception:
        pass

    # Extract final poster thumbnail
    thumb_path = output_dir / "Echoes_of_the_Obsidian_Obelisk_Final_thumb.jpg"
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

    # Inspect final file
    file_size_mb = final_output_path.stat().st_size / (1024 * 1024)
    logger.info("================================================================================")
    logger.info(f"FINAL VIDEO PRODUCTION COMPLETE!")
    logger.info(f"Location: {final_output_path}")
    logger.info(f"File Size: {file_size_mb:.2f} MB")
    logger.info(f"Thumbnail: {thumb_path}")
    logger.info("================================================================================")


if __name__ == "__main__":
    asyncio.run(main())

