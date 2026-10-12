"""
backend/features/workspace/media_catalog.py
Curated, high-fidelity royalty-free media library assets:
- 24kHz Gemini AI Vocal Profiles
- Dynamic 9:16 Video Visual Backdrops
- Royalty-Free Background Audio Soundtracks
"""

from typing import Dict, Any, List

VOICE_PROFILES: List[Dict[str, Any]] = [
    {
        "id": "Kore",
        "name": "Kore",
        "gender": "Female",
        "style": "Clear, Inspiring, Authoritative",
        "speed": "1.0x",
    },
    {
        "id": "Fenrir",
        "name": "Fenrir",
        "gender": "Male",
        "style": "Deep, Powerful, Stoic Leader",
        "speed": "0.95x",
    },
    {
        "id": "Puck",
        "name": "Puck",
        "gender": "Male",
        "style": "Energetic, High-Octane Motivational",
        "speed": "1.05x",
    },
    {
        "id": "Zephyr",
        "name": "Zephyr",
        "gender": "Female",
        "style": "Smooth, Calming Wisdom & Meditation",
        "speed": "0.9x",
    },
    {
        "id": "Charon",
        "name": "Charon",
        "gender": "Male",
        "style": "Grit & Relentless Focus",
        "speed": "1.0x",
    },
]

VISUAL_BACKDROPS: List[Dict[str, Any]] = [
    {
        "id": "v1",
        "name": "Dark Mountain Dawn",
        "category": "Nature & Solitude",
        "aspectRatio": "9:16",
        "previewColor": "from-slate-900 via-indigo-950 to-purple-950",
        "textColor": "#FFFFFF",
        "particleEffect": "glowing-dust",
    },
    {
        "id": "v2",
        "name": "Cyberpunk Workspace",
        "category": "Futuristic Studio",
        "aspectRatio": "9:16",
        "previewColor": "from-slate-950 via-purple-950 to-cyan-950",
        "textColor": "#38BDF8",
        "particleEffect": "neon-grid",
    },
    {
        "id": "v3",
        "name": "Dramatic Gym Shadows",
        "category": "Fitness & Power",
        "aspectRatio": "9:16",
        "previewColor": "from-neutral-950 via-stone-900 to-amber-950",
        "textColor": "#F59E0B",
        "particleEffect": "smoke-sparks",
    },
    {
        "id": "v4",
        "name": "Deep Ocean Mindset",
        "category": "Calm & Resilience",
        "aspectRatio": "9:16",
        "previewColor": "from-slate-950 via-blue-950 to-teal-950",
        "textColor": "#2DD4BF",
        "particleEffect": "water-ripples",
    },
]

MEDIA_TRACKS: List[Dict[str, Any]] = [
    {
        "id": "m1",
        "title": "Ambient Motivation",
        "genre": "Cinematic Ambient",
        "duration": "02:15",
        "bpm": 78,
        "copyrightFree": True,
        "license": "ApexMind Free Commercial License",
        "frequencyData": [20, 35, 50, 75, 90, 60, 45, 80, 95, 70, 40, 60, 85, 90, 50],
    },
    {
        "id": "m2",
        "title": "Cinematic Triumph",
        "genre": "Orchestral Hybrid",
        "duration": "01:50",
        "bpm": 95,
        "copyrightFree": True,
        "license": "ApexMind Free Commercial License",
        "frequencyData": [30, 45, 85, 95, 100, 80, 65, 90, 95, 85, 60, 75, 90, 80, 40],
    },
    {
        "id": "m3",
        "title": "Epic Growth",
        "genre": "Deep Synthwave",
        "duration": "02:04",
        "bpm": 110,
        "copyrightFree": True,
        "license": "ApexMind Free Commercial License",
        "frequencyData": [40, 60, 70, 80, 90, 95, 80, 70, 85, 90, 100, 85, 70, 60, 30],
    },
    {
        "id": "m4",
        "title": "Lo-Fi Chill Discipline",
        "genre": "Lo-Fi Beats",
        "duration": "01:45",
        "bpm": 82,
        "copyrightFree": True,
        "license": "ApexMind Free Commercial License",
        "frequencyData": [15, 25, 40, 55, 60, 50, 45, 65, 70, 55, 40, 50, 60, 40, 20],
    },
]

def get_static_media_catalog() -> Dict[str, Any]:
    return {
        "musicTracks": MEDIA_TRACKS,
        "visualBackdrops": VISUAL_BACKDROPS,
        "voiceProfiles": VOICE_PROFILES,
    }
