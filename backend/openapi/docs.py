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
    )
    openapi_schema["info"]["x-logo"] = {
        "url": "https://api.dicebear.com/7.x/initials/svg?seed=ApexMind"
    }
    app.openapi_schema = openapi_schema
    return app.openapi_schema
