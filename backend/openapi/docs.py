from fastapi import FastAPI
from fastapi.openapi.utils import get_openapi


def custom_openapi(app: FastAPI):
    if app.openapi_schema:
        return app.openapi_schema
    openapi_schema = get_openapi(
        title="ApexMind Studio AI API",
        version="2.0.0",
        description="Comprehensive Python FastAPI backend for AI motivational YouTube Shorts automation, Gemini scriptwriting, neural voiceovers, media resolution, and multi-platform publishing.",
        routes=app.routes,
        tags=[
            {
                "name": "Health",
                "description": "Service health, telemetry, and uptime status.",
            },
            {
                "name": "Dashboard",
                "description": "Creator dashboard summary and performance metrics.",
            },
            {
                "name": "Auth",
                "description": "User sign-in, OAuth, and account identity.",
            },
            {
                "name": "Studio - Stage 1: Script & Storyboard",
                "description": "Stage 1: Generate viral scripts, mobile safe-zone subtitles, faceless B-roll queries, sound design, and SEO metadata.",
            },
            {
                "name": "Studio - Stage 2: Voiceover",
                "description": "Stage 2: 24kHz neural TTS voiceover synthesis and timeline synchronization.",
            },
            {
                "name": "Studio - Stage 3: Media Resolution",
                "description": "Stage 3: Live stock video resolution, AI image frames, sound effects, and background soundtracks.",
            },
            {
                "name": "Studio - Stage 4: Captions",
                "description": "Stage 4: Word-timed captions, visual style presets (Hormozi, Beast, Minimal), and SRT/VTT exports.",
            },
            {
                "name": "Studio - Video Production",
                "description": "FFmpeg timeline video rendering to Full HD MP4 and browser recording transcoding.",
            },
            {
                "name": "Studio - AI & Discovery",
                "description": "Gemini AI models listing, connectivity status, and content generation tools.",
            },
            {
                "name": "Studio Tools 1: Audio",
                "description": "Live search across modular soundtrack and sound effect libraries.",
            },
            {
                "name": "Studio Tools 2: Stock Videos",
                "description": "Live search across stock video providers (Pexels, Pixabay, Mixkit, Coverr, Wikimedia).",
            },
            {
                "name": "Studio Tools 3: Stock Images",
                "description": "Live search across stock photography providers (Unsplash, Pexels, Pixabay, Openverse, Flickr, Wikimedia).",
            },
            {
                "name": "Studio Tools 4: Elements",
                "description": "Studio visual elements, dynamic badges, and overlays.",
            },
            {
                "name": "Studio Tools 5: Typography",
                "description": "Live open-source font search across Google Fonts, Fontshare, Fontsource, and Bunny Fonts.",
            },
            {
                "name": "Studio Tools 6: Canvas",
                "description": "Canvas dimensions, platform aspect ratios, color LUTs, and gradient presets.",
            },
            {
                "name": "Studio Tools 7: Videos",
                "description": "Browse, manage, and retrieve saved Studio video projects.",
            },
            {
                "name": "Studio Tools 8: YouTube",
                "description": "Connect YouTube channels, fetch analytics, and publish videos.",
            },
            {
                "name": "Studio Tools 9: Social",
                "description": "Omnichannel publishing and account management for YouTube, Instagram, and Facebook.",
            },
            {
                "name": "Studio Tools 10: Schedules",
                "description": "Manage scheduled background video automation jobs and execution history.",
            },
            {
                "name": "Studio - Media Streaming",
                "description": "Direct streaming and playback of synthesized audio and rendered videos.",
            },
            {
                "name": "Notifications",
                "description": "Manage user notifications and system activity alerts.",
            },
            {
                "name": "Settings",
                "description": "View and manage app settings and API credentials.",
            },
        ],
    )
    openapi_schema["info"]["x-logo"] = {
        "url": "https://api.dicebear.com/7.x/initials/svg?seed=ApexMind"
    }
    app.openapi_schema = openapi_schema
    return app.openapi_schema
