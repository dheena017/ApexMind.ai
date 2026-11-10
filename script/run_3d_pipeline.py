#!/usr/bin/env python3
"""
script/run_3d_pipeline.py
ApexMind Studio - Standalone 3D Script & Visuals CLI Pipeline.

Allows developers to generate AI scripts, 3D scene storyboards, and render 3D visuals
directly from the terminal without opening the web UI.

Usage:
  python script/run_3d_pipeline.py
  python script/run_3d_pipeline.py --genre roblox_story --topic "Brookhaven 3AM Ghost" --render
  python script/run_3d_pipeline.py --genre odd_one_out --length "5 seconds" --engine motion_loop
  python script/run_3d_pipeline.py --genre motivation --engine blender_hybrid --provider poly_haven
"""

from __future__ import annotations

import argparse
import json
import logging
import os
from pathlib import Path
import sys
import time
import warnings

# Suppress harmless Google GenAI AFC warnings
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

# Resolve default script model dynamically from project configuration
try:
    from backend.shared.ai_models import get_default_script_model
    DEFAULT_CLI_MODEL = get_default_script_model()
except Exception:
    DEFAULT_CLI_MODEL = "gemini-3.8-flash"

# Terminal colors
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


SAMPLE_PROMPTS = {
    "roblox_story": {
        "category": "Surreal Lore & Sky Myths (Volze Style)",
        "topic": "Every 10 Years, The Sky Gives Back",
        "prompt": (
            "Every ten years, a massive glowing black hole opens in the sky above our town, and it rains down "
            "everything humanity has lost over the past decade. Car keys, wedding rings, old letters, and childhood memories "
            "tumble down from the clouds like a cosmic storm. But there is one rule everyone whispers: whatever hits the "
            "ground and isn't claimed before sunset gets sucked back into the void forever. Today, I looked up and saw a "
            "handwritten letter falling straight toward me..."
        ),
        "engine": "blender_hybrid",
        "provider": "roblox_creator_store",
        "tone": "Cinematic Storyteller",
        "voice": "Puck",
    },
    "odd_one_out": {
        "category": "Roblox Avatar Spot the Difference",
        "topic": "Spot the Glitched Blade",
        "prompt": (
            "Show four Roblox avatars lined up side by side with a prominent 5-second ticking countdown timer on the screen. "
            "Avatars 1, 2, and 4 are holding glowing blue katanas, but Avatar 3 has a glitched red dark blade with an inverted aura. "
            "Start with a viral voiceover challenge: 'Only 1% of Roblox players can spot the fake in five seconds!' "
            "Build intense ticking audio suspense, then freeze-frame flash highlight on Avatar 3 on the buzzer."
        ),
        "engine": "blender_hybrid",
        "provider": "roblox_creator_store",
        "tone": "High-Energy Quiz Host",
        "voice": "Aoede",
    },
    "motivation": {
        "category": "Stoic Mindset & Discipline",
        "topic": "The 4:00 AM Rule of Unstoppable Men",
        "prompt": (
            "Focus on waking up at 4:00 AM in pitch black silence while the rest of the world is asleep. "
            "Speak with raw, stoic discipline. Explain that talking about your goals destroys your dopamine, "
            "and why 6 months of silent compounding gym work and study will shock everyone who ever doubted you. "
            "End with Marcus Aurelius wisdom."
        ),
        "engine": "blender_hybrid",
        "provider": "poly_haven",
        "tone": "Aggressive Discipline",
        "voice": "Fenrir",
    },
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="ApexMind 3D Script & Visuals CLI Pipeline",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python script/run_3d_pipeline.py --genre roblox_story --render
  python script/run_3d_pipeline.py --genre odd_one_out --length "5 seconds"
  python script/run_3d_pipeline.py --genre motivation --engine blender_hybrid --provider poly_haven
        """,
    )
    parser.add_argument(
        "--genre",
        choices=["roblox_story", "odd_one_out", "motivation"],
        default="roblox_story",
        help="Content genre pipeline (default: roblox_story)",
    )
    parser.add_argument(
        "--category",
        type=str,
        default=None,
        help="Sub-category / niche (defaults to genre standard)",
    )
    parser.add_argument(
        "--topic",
        type=str,
        default=None,
        help="Specific topic or title concept",
    )
    parser.add_argument(
        "-p", "--prompt",
        type=str,
        default=None,
        help="Story plot or creative direction from the user",
    )
    parser.add_argument(
        "-l", "--length",
        type=str,
        default="15 seconds",
        help="Target duration: '5 seconds', '15 seconds', '30 seconds', '1 minute', '2 minutes', '3 minutes' (default: 15 seconds)",
    )
    parser.add_argument(
        "-e", "--engine",
        choices=["blender_hybrid", "blender_full", "motion_loop", "webgl"],
        default=None,
        help="3D Render Engine (default: blender_hybrid)",
    )
    parser.add_argument(
        "--provider",
        choices=["roblox_creator_store", "sloyd_ai", "sketchfab", "poly_pizza", "poly_haven"],
        default=None,
        help="3D Model Catalog / Asset Provider (default: roblox_creator_store for roblox/odd, poly_haven for motivation)",
    )
    parser.add_argument(
        "-t", "--tone",
        type=str,
        default=None,
        help="Vocal tone delivery",
    )
    parser.add_argument(
        "-v", "--voice",
        type=str,
        default=None,
        help="Voice ID (e.g. Puck, Fenrir, Aoede)",
    )
    parser.add_argument(
        "--model",
        type=str,
        default=None,
        help=f"AI Script Model (default: {DEFAULT_CLI_MODEL})",
    )
    parser.add_argument(
        "--render",
        action="store_true",
        help="Trigger the 3D Render Engine to build the actual 3D video scene files",
    )
    parser.add_argument(
        "-o", "--output",
        type=str,
        default="backend/data/rendered_shorts/cli_3d_pipeline_output.json",
        help="File path to save the generated JSON script & storyboard",
    )
    raw_args = sys.argv[1:]
    if "--" in raw_args:
        raw_args = raw_args[raw_args.index("--") + 1:]
    return parser.parse_args(raw_args)


def main() -> int:
    args = parse_args()
    sample = SAMPLE_PROMPTS.get(args.genre, SAMPLE_PROMPTS["roblox_story"])

    category = args.category or sample["category"]
    topic = args.topic or sample["topic"]
    user_prompt = args.prompt or sample["prompt"]
    engine = args.engine or sample["engine"]
    provider = args.provider or sample["provider"]
    tone = args.tone or sample["tone"]
    voice = args.voice or sample["voice"]
    length = args.length
    selected_model = args.model or DEFAULT_CLI_MODEL

    print(f"\n{Ansi.BG_BLUE}{Ansi.BOLD}  ApexMind 3D Video Studio - Backend CLI Pipeline  {Ansi.RESET}\n")
    print(f"{Ansi.CYAN}[Configuration]{Ansi.RESET}")
    print(f"  • Genre:               {Ansi.BOLD}{args.genre}{Ansi.RESET}")
    print(f"  • Category:            {category}")
    print(f"  • Topic:               {topic}")
    print(f"  • Target Length:       {length}")
    print(f"  • 3D Render Engine:    {Ansi.YELLOW}{engine}{Ansi.RESET} (backend/features/workspace/visuals_3d/engines)")
    print(f"  • 3D Model Catalog:    {Ansi.MAGENTA}{provider}{Ansi.RESET} (backend/features/workspace/visuals_3d/providers)")
    print(f"  • Voice / Tone:        {voice} ({tone})")
    print(f"  • AI Model:            {selected_model}")
    print(f"  • Render 3D Scenes:    {'YES (--render)' if args.render else 'NO (script & storyboard only)'}\n")

    print(f"{Ansi.GRAY}User Prompt:{Ansi.RESET} \"{user_prompt[:140]}...\"\n")

    # 1. Execute Script & Storyboard Generation
    print(f"{Ansi.CYAN}[Stage 1/2]{Ansi.RESET} Calling AI Script Engine & 3D Scene Director...")
    t0 = time.time()

    try:
        from backend.features.workspace.studio.script_service import orchestrate_stage1_script

        script_envelope = orchestrate_stage1_script(
            genre=args.genre,
            category=category,
            topic=topic,
            user_prompt=user_prompt,
            tone=tone,
            length=length,
            model=selected_model,
            voice_name=voice,
            render_3d_engine=engine,
            suggested_3d_provider=provider,
        )
    except Exception as exc:
        print(f"\n{Ansi.RED}{Ansi.BOLD}[ERROR]{Ansi.RESET} Failed to generate script: {exc}")
        import traceback
        traceback.print_exc()
        return 1

    dt = time.time() - t0
    data = script_envelope.get("data", {})
    storyboard = data.get("storyboard", [])

    print(f"{Ansi.GREEN}[OK]{Ansi.RESET} Script generated in {dt:.2f}s!\n")
    print(f"{Ansi.BOLD}================================================================================{Ansi.RESET}")
    print(f"{Ansi.BOLD}TITLE:{Ansi.RESET}       {Ansi.GREEN}{data.get('title')}{Ansi.RESET}")
    print(f"{Ansi.BOLD}HOOK:{Ansi.RESET}        \"{data.get('hook')}\"")
    print(f"{Ansi.BOLD}CTA:{Ansi.RESET}         \"{data.get('cta')}\"")
    print(f"{Ansi.BOLD}WORDS / DURATION:{Ansi.RESET} {data.get('totalWords')} words (~{data.get('targetDurationSeconds')}s)")
    print(f"{Ansi.BOLD}================================================================================{Ansi.RESET}\n")

    print(f"{Ansi.CYAN}[Stage 2/2]{Ansi.RESET} 3D Scene Storyboard Breakdown ({len(storyboard)} scenes):")
    for idx, sc in enumerate(storyboard):
        sc_num = sc.get("sceneNumber", idx + 1)
        start = sc.get("startTime", 0.0)
        dur = sc.get("duration", 2.0)
        end = start + dur
        sub_text = sc.get("subtitleText", "")
        visual_query = sc.get("visualQuery") or sc.get("searchQuery", "")
        camera_motion = sc.get("cameraMotion", "slow push in")
        scene_prompt = sc.get("scenePrompt3D", "")
        sc_engine = sc.get("render3DEngine", engine)
        sc_provider = sc.get("suggested3DProvider", provider)

        print(f"\n  {Ansi.BOLD}--- SCENE #{sc_num} [{start:.1f}s → {end:.1f}s ({dur:.1f}s)] ---{Ansi.RESET}")
        print(f"  {Ansi.BOLD}Spoken Text:{Ansi.RESET}      \"{sub_text}\"")
        print(f"  {Ansi.BOLD}3D Visual Query:{Ansi.RESET}  {Ansi.YELLOW}{visual_query}{Ansi.RESET}")
        if scene_prompt:
            print(f"  {Ansi.BOLD}3D Directive:{Ansi.RESET}     {Ansi.CYAN}{scene_prompt}{Ansi.RESET}")
        print(f"  {Ansi.BOLD}Tags:{Ansi.RESET}             Engine: [{sc_engine}] | Catalog: [{sc_provider}] | Camera: [{camera_motion}]")

    # 2. Render 3D Scenes if --render flag is passed
    if args.render:
        print(f"\n{Ansi.CYAN}[3D Visual Render Engine Execution]{Ansi.RESET}")
        from backend.features.workspace.visuals_3d.engines import get_engine

        render_engine = get_engine(engine)
        if not render_engine:
            print(f"{Ansi.YELLOW}[Warning]{Ansi.RESET} Engine '{engine}' not found, falling back to 'motion_loop'")
            render_engine = get_engine("motion_loop")

        if render_engine and render_engine.is_available():
            print(f"  Executing {render_engine.display_name}...")
            hero_scene = storyboard[0] if storyboard else {}
            render_payload = {
                "sceneId": f"cli_{int(time.time())}",
                "sceneNumber": 1,
                "query": hero_scene.get("visualQuery") or topic,
                "scenePrompt3D": hero_scene.get("scenePrompt3D", ""),
                "cameraMotion": hero_scene.get("cameraMotion", ""),
                "topic": topic,
                "genre": args.genre,
                "durationSeconds": float(hero_scene.get("duration", 3.0)),
                "aspectRatio": "9:16",
                "shadingStyle": "nebula",
                "subtitles": {
                    "text": hero_scene.get("subtitleText") or data.get("hook", ""),
                    "preset": "sub-hormozi",
                },
            }
            try:
                render_res = render_engine.render_scene(render_payload)
                print(f"{Ansi.GREEN}[Render Complete]{Ansi.RESET}")
                print(f"  Output Video URL: {render_res.get('videoUrl') or render_res.get('clipUrl')}")
                print(f"  Render Time:      {render_res.get('renderTimeSec', 0):.2f}s")
                print(f"  Format / Codec:   {render_res.get('codec', 'h264')} (9:16 vertical MP4)")
            except Exception as rend_err:
                print(f"{Ansi.YELLOW}[Render Notice]{Ansi.RESET} {rend_err}")
        else:
            print(f"{Ansi.YELLOW}[Notice]{Ansi.RESET} Engine '{engine}' requires local binaries (Blender 5.2 / FFmpeg).")
            print(f"  Check binary availability or use '--engine motion_loop'.")

    # 3. Export JSON Artifact
    out_path = Path(args.output)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(script_envelope, f, indent=2, ensure_ascii=False)

    print(f"\n{Ansi.GREEN}{Ansi.BOLD}[Done]{Ansi.RESET} Pipeline output written to: {Ansi.WHITE}{out_path.resolve()}{Ansi.RESET}\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())

