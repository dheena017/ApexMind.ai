import os
import sys
import json
from pathlib import Path
from dotenv import load_dotenv

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')
load_dotenv()

from backend.features.workspace.service import generate_script, synthesize_voiceover
from backend.database.repository import add_website_video

print("=== 1. GENERATING AI SCRIPT & MULTI-SCENE STORYBOARD ===")
gen_res = generate_script(
    category="Stoic Mindset & Discipline",
    topic="Silence your excuses, master your mornings",
    voice_name="Fenrir",
    aspect_ratio="9:16"
)
script_data = gen_res.get("data", {})
title = script_data.get("title")
hook = script_data.get("hook")
quote = script_data.get("quote")
cta = script_data.get("cta")
storyboard = script_data.get("storyboard", [])
sound_design = script_data.get("soundDesign", {})
hooks = script_data.get("hooks", [])

print(f"Title: {title}")
print(f"Selected Hook: {hook}")
print(f"Quote: {quote}")
print(f"CTA: {cta}")
print(f"Total Scenes: {len(storyboard)}")
st_title = sound_design.get('soundtrackTitle', 'Phonk Titan')
st_genre = sound_design.get('genre', 'phonk')
print(f"Soundtrack: {st_title} ({st_genre})")

print("\n=== 2. SYNTHESIZING 24KHZ VOICEOVER ===")
full_script_text = f"{hook} {quote} {cta}"
voice_res = synthesize_voiceover(text=full_script_text, voice_name="Fenrir")
print(f"Voiceover Synthesized: {voice_res.get('success')} (Mime: {voice_res.get('mimeType')})")

print("\n=== 3. SAVING FINAL STUDIO VIDEO ===")
first_scene_video = storyboard[0].get("mediaUrl") if storyboard else ""
first_scene_name = storyboard[0].get("mediaName") if storyboard else ""
video_record = add_website_video({
    "title": title,
    "quote": quote,
    "hook": hook,
    "cta": cta,
    "category": "Stoic Mindset & Discipline",
    "coverImageUrl": "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1080&q=85",
    "videoUrl": first_scene_video,
    "audioUrl": voice_res.get("audioUrl", "") or "https://api.apexmind.ai/audio/preview.wav",
    "voice": "Fenrir",
    "aspectRatio": "9:16",
    "duration": "00:25",
    "visualTheme": "v1",
    "subtitles": script_data.get("subtitles", []),
    "tags": script_data.get("tags", ["#Shorts", "#Motivation"]),
    "status": "ready"
})
print(f"Video Created in Database ID: {video_record.get('id')}")

print("\n=== 4. FINAL VIDEO STORYBOARD SCENES & KARAOKE WORDS ===")
for sc in storyboard:
    words = sc.get("words", [])
    word_count = len(words)
    sc_num = sc.get('sceneNumber')
    beat = str(sc.get('beat', '')).upper()
    dur = sc.get('duration')
    m_name = sc.get('mediaName')
    sfx = sc.get('sfx')
    print(f"Scene {sc_num}: [{beat}] ({dur}s) | Video: {m_name} | SFX: {sfx} | Karaoke Words: {word_count}")

print("\n=== 5. VIRAL HOOK OPTIONS ===")
for h in hooks:
    print(f"- [{h.get('angle')} | Virality: {h.get('viralityScore')}%] \"{h.get('text')}\"")
