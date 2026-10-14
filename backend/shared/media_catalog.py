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

CURATED_STOCK_IMAGES: List[Dict[str, Any]] = [
    {
        "id": "img-stoic-1",
        "title": "Dark Misty Mountain Solitude",
        "category": "stoic",
        "url": "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1080&q=85",
        "thumbnail": "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=400&q=80",
        "author": "Kalen Emsley",
        "resolution": "1080x1920 HD",
        "tags": ["mountain", "fog", "solitude", "stoic"],
    },
    {
        "id": "img-stoic-2",
        "title": "Lone Figure in Rain-Slicked Street",
        "category": "stoic",
        "url": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1080&q=85",
        "thumbnail": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=400&q=80",
        "author": "Austin Neill",
        "resolution": "1080x1920 HD",
        "tags": ["rain", "solitude", "night", "street"],
    },
    {
        "id": "img-lux-1",
        "title": "Penthouse Balcony Midnight Metropolis",
        "category": "luxury",
        "url": "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1080&q=85",
        "thumbnail": "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=400&q=80",
        "author": "Alexandre Chambon",
        "resolution": "1080x1920 HD",
        "tags": ["penthouse", "city", "night", "wealth"],
    },
    {
        "id": "img-gym-1",
        "title": "Chalked Hands Gripping Heavy Barbell",
        "category": "gym",
        "url": "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1080&q=85",
        "thumbnail": "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=400&q=80",
        "author": "Sven Mieke",
        "resolution": "1080x1920 HD",
        "tags": ["chalk", "barbell", "weights", "gym"],
    },
    {
        "id": "img-cyber-1",
        "title": "Cyberpunk Neon Corridor Tokyo",
        "category": "cyber",
        "url": "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1080&q=85",
        "thumbnail": "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=400&q=80",
        "author": "Lorenzo Herrera",
        "resolution": "1080x1920 HD",
        "tags": ["cyberpunk", "neon", "tokyo", "tech"],
    },
]

CURATED_STOCK_VIDEOS: List[Dict[str, Any]] = [
    {
        "id": "vid-clouds-drone",
        "title": "Cinematic Clouds & Mountain Drone",
        "category": "atmospheric",
        "videoUrl": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
        "posterUrl": "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=400&q=80",
        "duration": "15s Loop",
        "resolution": "1080x1920",
    },
    {
        "id": "vid-gym-deadlift",
        "title": "Heavy Barbell Gym Deadlift Grit",
        "category": "grit",
        "videoUrl": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4",
        "posterUrl": "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=400&q=80",
        "duration": "20s Loop",
        "resolution": "1080x1920",
    },
    {
        "id": "vid-night-highway",
        "title": "Neon Highway Light Trails Timelapse",
        "category": "urban",
        "videoUrl": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
        "posterUrl": "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=400&q=80",
        "duration": "15s Loop",
        "resolution": "1080x1920",
    },
]

CURATED_SFX: List[Dict[str, Any]] = [
    {
        "id": "sfx-whoosh-fast",
        "name": "Fast Cinematic Whoosh",
        "category": "whoosh",
        "duration": "0.8s",
        "audioUrl": "https://cdn.pixabay.com/download/audio/2022/03/15/audio_27529fa22a.mp3?filename=fast-whoosh-10901.mp3",
    },
    {
        "id": "sfx-impact-subdrop",
        "name": "Cinematic Sub Bass Drop",
        "category": "impact",
        "duration": "2.5s",
        "audioUrl": "https://cdn.pixabay.com/download/audio/2022/03/15/audio_40df037703.mp3?filename=bass-drop-10902.mp3",
    },
    {
        "id": "sfx-notif-cash",
        "name": "Cash Register Cha-Ching",
        "category": "notification",
        "duration": "1.1s",
        "audioUrl": "https://cdn.pixabay.com/download/audio/2021/08/09/audio_732a101292.mp3?filename=cash-register-98214.mp3",
    },
    {
        "id": "sfx-click-camera",
        "name": "Camera Shutter Mechanical Snap",
        "category": "click",
        "duration": "0.4s",
        "audioUrl": "https://cdn.pixabay.com/download/audio/2021/08/04/audio_349d9c79d1.mp3?filename=camera-shutter-6305.mp3",
    },
]

def get_static_media_catalog() -> Dict[str, Any]:
    return {
        "musicTracks": MEDIA_TRACKS,
        "visualBackdrops": VISUAL_BACKDROPS,
        "voiceProfiles": VOICE_PROFILES,
        "stockImages": CURATED_STOCK_IMAGES,
        "stockVideos": CURATED_STOCK_VIDEOS,
        "soundEffects": CURATED_SFX,
    }
