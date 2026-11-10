#!/usr/bin/env python3
"""
script/render_video_from_json.py
ApexMind Studio - Render Master 3D Video from Script JSON.

Reads the generated script and 3D storyboard JSON (e.g. cli_3d_pipeline_output.json),
renders the 3D visual scenes using the specified 3D engine (Blender 5.2 / Motion Loops),
synthesizes the voiceover track, and assembles the final 1080x1920 (9:16) MP4 video.

Usage:
  python script/render_video_from_json.py
  python script/render_video_from_json.py -i backend/data/rendered_shorts/cli_3d_pipeline_output.json
  python script/render_video_from_json.py --engine motion_loop --max-scenes 3
  python script/render_video_from_json.py --engine blender_hybrid
"""

from __future__ import annotations

import argparse
import base64
import json
import logging
import os
from pathlib import Path
import subprocess
import sys
import time
import warnings

# Suppress harmless Google GenAI warnings
warnings.filterwarnings("ignore", category=FutureWarning)
warnings.filterwarnings("ignore", category=UserWarning, module="google.genai")
warnings.filterwarnings("ignore", message=".*automatic function calling.*")
warnings.filterwarnings("ignore", message=".*AFC.*")
os.environ["PYTHONWARNINGS"] = "ignore::FutureWarning"

# Ensure project root is at head of sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

# Load .env if present
env_file = PROJECT_ROOT / ".env"
if env_file.exists():
    try:
        from dotenv import load_dotenv
        load_dotenv(env_file)
    except ImportError:
        pass

FFMPEG_EXE = (
    r"C:\Users\dheen\AppData\Local\Microsoft\WinGet\Links\ffmpeg.exe"
    if Path(r"C:\Users\dheen\AppData\Local\Microsoft\WinGet\Links\ffmpeg.exe").exists()
    else "ffmpeg"
)
OUTPUT_DIR = PROJECT_ROOT / "backend" / "data" / "rendered_shorts" / "3d_scenes"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


class Ansi:
    RESET = "\033[0m"
    BOLD = "\033[1m"
    RED = "\033[91m"
    GREEN = "\033[92m"
    YELLOW = "\033[93m"
    BLUE = "\033[94m"
    MAGENTA = "\033[95m"
    CYAN = "\033[96m"
    WHITE = "\033[97m"
    GRAY = "\033[90m"
    BG_BLUE = "\033[44m"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Render Master 3D Video from Script JSON",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument(
        "-i", "--input",
        type=str,
        default="backend/data/rendered_shorts/cli_3d_pipeline_output.json",
        help="Path to script JSON file (default: backend/data/rendered_shorts/cli_3d_pipeline_output.json)",
    )
    parser.add_argument(
        "-o", "--output",
        type=str,
        default=None,
        help="Path for final assembled master MP4 (default: auto-generated in rendered_shorts/)",
    )
    parser.add_argument(
        "-e", "--engine",
        choices=["blender_hybrid", "blender_full", "motion_loop", "webgl"],
        default=None,
        help="Override 3D Render Engine (defaults to engine specified in JSON)",
    )
    parser.add_argument(
        "--max-scenes",
        type=int,
        default=None,
        help="Limit number of storyboard scenes to render (for quick testing)",
    )
    parser.add_argument(
        "--skip-voice",
        action="store_true",
        help="Skip Gemini voiceover synthesis",
    )
    return parser.parse_args()


def synthesize_voice_track(full_script: str, voice_name: str, out_wav_path: Path) -> bool:
    """Synthesizes voiceover narration using Gemini Neural TTS."""
    print(f"{Ansi.CYAN}[Stage 1/3]{Ansi.RESET} Synthesizing Voiceover Audio with voice: '{voice_name}'...")
    try:
        from backend.features.workspace.studio.voice_service import synthesize_voice_audio

        tts_res = synthesize_voice_audio(
            voice_name=voice_name,
            text=full_script,
        )
        audio_url = tts_res.get("audioUrl", "")
        if audio_url.startswith("data:audio/wav;base64,"):
            b64_data = audio_url.split(",", 1)[1]
            wav_bytes = base64.b64decode(b64_data)
            out_wav_path.write_bytes(wav_bytes)
            print(f"  {Ansi.GREEN}[Voice OK]{Ansi.RESET} Rendered {tts_res.get('rawDurationSeconds', 0):.2f}s audio track -> {out_wav_path.name}")
            return True
        elif Path(audio_url).exists():
            out_wav_path.write_bytes(Path(audio_url).read_bytes())
            return True
    except Exception as exc:
        print(f"  {Ansi.YELLOW}[Voice Notice]{Ansi.RESET} Voice synthesis skipped or unavailable: {exc}")
    return False


def main() -> int:
    args = parse_args()
    input_path = Path(args.input)

    if not input_path.exists():
        print(f"{Ansi.RED}[Error]{Ansi.RESET} Input script JSON not found: {input_path}")
        print("Run 'python script/run_3d_pipeline.py' first to generate a script JSON.")
        return 1

    print(f"\n{Ansi.BG_BLUE}{Ansi.BOLD}  ApexMind 3D Video Renderer - Build Video from JSON  {Ansi.RESET}\n")
    print(f"Reading script manifest from: {Ansi.WHITE}{input_path.resolve()}{Ansi.RESET}")

    with open(input_path, "r", encoding="utf-8") as f:
        raw_json = json.load(f)

    data = raw_json.get("data", raw_json)
    title = data.get("title", "Null Locked Us In Brookhaven")
    storyboard = data.get("storyboard", [])
    full_script = data.get("fullScript") or data.get("quote") or data.get("hook", "")
    voice_name = data.get("recommendedVoice", "Puck")
    engine_name = args.engine or data.get("render3DEngine", "blender_hybrid")
    provider_name = data.get("suggested3DProvider", "roblox_creator_store")

    if args.max_scenes and args.max_scenes > 0:
        storyboard = storyboard[:args.max_scenes]

    print(f"\n{Ansi.CYAN}[Video Specifications]{Ansi.RESET}")
    print(f"  • Title:            {Ansi.BOLD}{title}{Ansi.RESET}")
    print(f"  • Total Scenes:     {len(storyboard)}")
    print(f"  • 3D Engine:        {Ansi.YELLOW}{engine_name}{Ansi.RESET}")
    print(f"  • Asset Catalog:    {Ansi.MAGENTA}{provider_name}{Ansi.RESET}")
    print(f"  • Output Format:    1080x1920 (9:16 Vertical Video)")
    print(f"  • Voice Track:      {voice_name}\n")

    # 1. Synthesize Voiceover Audio
    voice_file = OUTPUT_DIR / f"voice_{int(time.time())}.wav"
    has_voice = False
    if not args.skip_voice and full_script:
        has_voice = synthesize_voice_track(full_script, voice_name, voice_file)

    # 2. Render each 3D Scene
    print(f"\n{Ansi.CYAN}[Stage 2/3]{Ansi.RESET} Rendering {len(storyboard)} 3D visual scenes using engine '{engine_name}'...")
    from backend.features.workspace.visuals_3d.engines import get_engine

    engine = get_engine(engine_name)
    if not engine or not engine.is_available():
        print(f"  {Ansi.YELLOW}[Notice]{Ansi.RESET} Engine '{engine_name}' not available, falling back to 'motion_loop'")
        engine = get_engine("motion_loop")

    rendered_scene_paths: list[Path] = []
    t_start = time.time()

    for idx, sc in enumerate(storyboard):
        sc_num = sc.get("sceneNumber", idx + 1)
        dur = float(sc.get("duration", 2.0))
        sub_text = sc.get("subtitleText", "")
        visual_query = sc.get("visualQuery") or sc.get("searchQuery", "roblox 3d")
        scene_prompt = sc.get("scenePrompt3D", "")

        print(f"\n  {Ansi.BOLD}Rendering Scene #{sc_num}/{len(storyboard)}{Ansi.RESET} ({dur:.1f}s)")
        print(f"    Dialogue:    \"{sub_text}\"")
        print(f"    3D Query:    {Ansi.YELLOW}{visual_query}{Ansi.RESET}")
        if scene_prompt:
            print(f"    Camera/Dir:  {Ansi.GRAY}{scene_prompt[:90]}...{Ansi.RESET}")

        sc_payload = {
            "sceneId": f"scene_{sc_num}_{int(time.time())}",
            "query": visual_query,
            "durationSeconds": dur,
            "aspectRatio": "9:16",
            "shadingStyle": "nebula",
            "subtitles": {
                "text": sub_text,
                "preset": "sub-hormozi",
            },
        }

        try:
            t0 = time.time()
            res = engine.render_scene(sc_payload)
            clip_path = res.get("localVideoPath") or res.get("localFilePath") or res.get("videoUrl") or res.get("clipUrl")
            local_p = None
            if clip_path:
                if Path(clip_path).exists():
                    local_p = Path(clip_path).resolve()
                else:
                    cand = OUTPUT_DIR / Path(clip_path).name
                    if cand.exists():
                        local_p = cand.resolve()
            if not local_p or not local_p.exists():
                candidate = OUTPUT_DIR / f"{sc_payload['sceneId']}_3d_short.mp4"
                if candidate.exists():
                    local_p = candidate.resolve()

            if local_p and local_p.exists():
                rendered_scene_paths.append(local_p)
                print(f"    {Ansi.GREEN}[Scene OK]{Ansi.RESET} Rendered in {time.time() - t0:.2f}s -> {local_p.name}")
            else:
                print(f"    {Ansi.YELLOW}[Scene Warning]{Ansi.RESET} Clip file missing, skipping scene #{sc_num}")
        except Exception as sc_err:
            print(f"    {Ansi.RED}[Scene Failed]{Ansi.RESET} {sc_err}")

    if not rendered_scene_paths:
        print(f"\n{Ansi.RED}[Error]{Ansi.RESET} No 3D scene MP4 clips were successfully rendered.")
        return 1

    # 3. Assemble Master Video
    print(f"\n{Ansi.CYAN}[Stage 3/3]{Ansi.RESET} Assembling final master MP4 video ({len(rendered_scene_paths)} clips)...")
    clean_title = "".join(c if c.isalnum() else "_" for c in title.lower())[:30]
    out_master = (
        Path(args.output).resolve()
        if args.output
        else (OUTPUT_DIR / f"{clean_title}_{int(time.time())}_master.mp4").resolve()
    )

    concat_list = OUTPUT_DIR / f"concat_{int(time.time())}.txt"
    with open(concat_list, "w", encoding="utf-8") as f:
        for p in rendered_scene_paths:
            norm_path = str(p.resolve()).replace("\\", "/")
            f.write(f"file '{norm_path}'\n")

    cmd = [
        FFMPEG_EXE,
        "-f", "concat",
        "-safe", "0",
        "-i", str(concat_list),
    ]

    # If voice track exists, multiplex audio
    if has_voice and voice_file.exists():
        cmd.extend([
            "-i", str(voice_file.resolve()),
            "-c:v", "libx264",
            "-pix_fmt", "yuv420p",
            "-c:a", "aac",
            "-b:a", "192k",
            "-shortest",
        ])
    else:
        cmd.extend([
            "-c", "copy",
        ])

    cmd.extend(["-y", str(out_master)])

    try:
        subprocess.run(cmd, check=True, capture_output=True)
    finally:
        if concat_list.exists():
            try: concat_list.unlink()
            except Exception: pass

    total_time = time.time() - t_start
    file_size_mb = out_master.stat().st_size / (1024 * 1024) if out_master.exists() else 0

    print(f"\n{Ansi.GREEN}{Ansi.BOLD}================================================================================{Ansi.RESET}")
    print(f"{Ansi.GREEN}{Ansi.BOLD}  3D VIDEO CREATION COMPLETE!  {Ansi.RESET}")
    print(f"  • Master Video:    {Ansi.BOLD}{Ansi.WHITE}{out_master}{Ansi.RESET}")
    print(f"  • Resolution:      1080x1920 (9:16 Vertical Short)")
    print(f"  • Scenes Joined:   {len(rendered_scene_paths)}")
    print(f"  • File Size:       {file_size_mb:.2f} MB")
    print(f"  • Total Duration:  ~{len(rendered_scene_paths) * 2.0:.1f}s")
    print(f"  • Total Render:    {total_time:.2f}s")
    print(f"{Ansi.GREEN}{Ansi.BOLD}================================================================================{Ansi.RESET}\n")

    return 0


if __name__ == "__main__":
    sys.exit(main())
