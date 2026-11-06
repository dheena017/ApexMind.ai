from fastapi.openapi.utils import get_openapi
from fastapi import FastAPI

def custom_openapi(app: FastAPI):
    if app.openapi_schema:
        return app.openapi_schema
    openapi_schema = get_openapi(
        title="ApexMind Studio AI API",
        version="2.0.0",
        description="Comprehensive Python FastAPI backend for AI motivational YouTube Shorts automation, Gemini scriptwriting, and YouTube publishing.",
        routes=app.routes,
        tags=[
            {
                "name": "Health",
                "description": "Service health and uptime.",
            },
            {
                "name": "Dashboard",
                "description": "Creator dashboard summary.",
            },
            {
                "name": "Auth",
                "description": "Sign-in and account identity.",
            },
            {
                "name": "Studio",
                "description": "Create scripts, voiceovers, and videos.",
            },
            {
                "name": "Presets",
                "description": "Built-in Studio presets.",
            },
            {
                "name": "Stock Media",
                "description": "Search stock videos and images.",
            },
            {
                "name": "Audio",
                "description": "Search music and sound effects.",
            },
            {
                "name": "Providers",
                "description": "Check media provider status.",
            },
            {
                "name": "Elements",
                "description": "Create Studio badges and overlays.",
            },
            {
                "name": "Videos",
                "description": "Browse saved Studio videos.",
            },
            {
                "name": "YouTube",
                "description": "Connect and publish to YouTube.",
            },
            {
                "name": "Schedules",
                "description": "Manage scheduled jobs.",
            },
            {
                "name": "Social",
                "description": "Connect accounts and publish across platforms.",
            },
            {
                "name": "Notifications",
                "description": "Manage notifications.",
            },
            {
                "name": "Settings",
                "description": "View app settings.",
            },
            {
                "name": "Media Files",
                "description": "Serve generated audio and video.",
            },
            {
                "name": "Content Tools",
                "description": "Generate titles and descriptions.",
            },
        ],
    )
    openapi_schema["info"]["x-logo"] = {
        "url": "https://api.dicebear.com/7.x/initials/svg?seed=ApexMind"
    }
    app.openapi_schema = openapi_schema
    return app.openapi_schema
