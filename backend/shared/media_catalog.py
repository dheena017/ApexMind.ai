"""
backend/shared/media_catalog.py
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

VISUAL_BACKDROPS: List[Dict[str, Any]] = []

CURATED_STOCK_VIDEOS: List[Dict[str, Any]] = []


CURATED_TEXT_PRESETS: List[Dict[str, Any]] = [
    {
        "id": "sub-hormozi",
        "name": "Hormozi Viral Yellow",
        "category": "subtitles",
        "className": "font-black tracking-tight text-yellow-400 uppercase drop-shadow-[0_4px_12px_rgba(0,0,0,1)] bg-black/85 px-3 py-1 rounded-md border border-yellow-400/30",
        "color": "#FACC15",
        "fontFamily": "Impact, sans-serif",
        "styleDescription": "Iconic Alex Hormozi high-retention subtitle with solid dark pill",
    },
    {
        "id": "sub-mrbeast",
        "name": "MrBeast Pop Bold",
        "category": "subtitles",
        "className": "font-black tracking-tighter text-sky-400 uppercase drop-shadow-[0_4px_16px_rgba(0,0,0,1)] stroke-black",
        "color": "#38BDF8",
        "fontFamily": "Anton, sans-serif",
        "styleDescription": "High-energy condensed punch font for YouTube shorts pacing",
    },
    {
        "id": "sub-karaoke-gold",
        "name": "Karaoke Word Glow",
        "category": "subtitles",
        "className": "font-extrabold tracking-wide text-amber-400 uppercase drop-shadow-[0_2px_10px_rgba(245,158,11,0.5)]",
        "color": "#F59E0B",
        "fontFamily": "Montserrat, sans-serif",
        "styleDescription": "Active word illuminates gold while preceding text rests in silver",
    },
    {
        "id": "quote-stoic-roman",
        "name": "Stoic Roman Empire",
        "category": "quotes",
        "className": "font-serif tracking-widest text-stone-100 uppercase drop-shadow-[0_4px_20px_rgba(0,0,0,0.9)] italic border-y border-stone-500/30 py-2",
        "color": "#F5F5F4",
        "fontFamily": "Cinzel, Georgia, serif",
        "styleDescription": "Imperial marble serif for timeless stoic quotes and ancient wisdom",
    },
    {
        "id": "sub-cyber-glitch",
        "name": "Cyberpunk Neon HUD",
        "category": "subtitles",
        "className": "font-mono font-bold tracking-wider text-cyan-400 uppercase drop-shadow-[0_0_12px_rgba(6,182,212,0.8)] bg-zinc-950/80 px-3 py-1 rounded border border-cyan-500/40",
        "color": "#22D3EE",
        "fontFamily": "Space Grotesk, sans-serif",
        "styleDescription": "Futuristic neon interface callout for sci-fi and tech reels",
    },
    {
        "id": "sub-terminal-mono",
        "name": "Terminal Matrix Green",
        "category": "subtitles",
        "className": "font-mono text-emerald-400 bg-zinc-950 p-2 rounded border border-emerald-500/30 shadow-md",
        "color": "#34D399",
        "fontFamily": "JetBrains Mono, monospace",
        "styleDescription": "Monospace code style for engineering, deep focus, and hacker aesthetics",
    },
    {
        "id": "sub-minimal-white",
        "name": "Clean Modern Minimalist",
        "category": "subtitles",
        "className": "font-semibold tracking-tight text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]",
        "color": "#FFFFFF",
        "fontFamily": "Inter, sans-serif",
        "styleDescription": "Clean, crisp typography with zero distraction",
    },
    {
        "id": "hook-curiosity-banner",
        "name": "Curiosity Hook Banner",
        "category": "hooks",
        "className": "font-black tracking-tight text-yellow-400 uppercase bg-zinc-950/95 px-4 py-2 rounded-lg border border-yellow-400/50 text-center shadow-2xl",
        "color": "#FACC15",
        "fontFamily": "Impact, sans-serif",
        "styleDescription": "Immediate hook box designed to stop scrolling in first 1.5 seconds",
    },
    {
        "id": "cta-save-reel",
        "name": "Save Reel Bookmark CTA",
        "category": "cta",
        "className": "font-extrabold tracking-wide text-sky-400 uppercase bg-sky-950/60 px-5 py-2 rounded-xl border border-sky-500/40 text-center shadow-lg",
        "color": "#38BDF8",
        "fontFamily": "Montserrat, sans-serif",
        "styleDescription": "Algorithmic save booster maximizing Instagram & TikTok reach",
    },
]
MEDIA_TRACKS: List[Dict[str, Any]] = []

CURATED_SFX: List[Dict[str, Any]] = []


def get_static_media_catalog() -> Dict[str, Any]:
    return {
        "musicTracks": MEDIA_TRACKS,
        "visualBackdrops": VISUAL_BACKDROPS,
        "stockVideos": [],
        "textPresets": CURATED_TEXT_PRESETS,
        "voiceProfiles": VOICE_PROFILES,
        "soundEffects": CURATED_SFX,
    }

