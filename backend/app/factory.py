import logging
import os
import platform
import time
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from backend.database.schema import init_db
from backend.openapi.docs import custom_openapi
from backend.shared.config import settings
from backend.shared.ai_models import DEFAULT_SCRIPT_MODEL
from backend.shared.logger import (
    setup_colored_logging,
    RequestLoggingMiddleware,
    print_startup_banner,
)
from backend.features import (
    workspace_router,
    youtube_router,
    notifications_router,
    auth_router,
    settings_router,
    videos_router,
    dashboard_router,
    social_router,
    social_platform_router,
)

SERVER_START_TIME = time.time()

# Initialize colorful log formatting
setup_colored_logging()
logger = logging.getLogger("ApexMind.App")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Print glowing startup banner
    print_startup_banner(settings.HOST, settings.PORT)
    # Initialize SQLite tables on startup
    init_db()
    logger.info("SQLite DB connected: backend/data/apexmind.db")

    # Launch background autonomous daily YouTube Shorts scheduler
    import asyncio
    from backend.shared.job import automation_scheduler_loop
    scheduler_task = asyncio.create_task(automation_scheduler_loop())

    yield

    scheduler_task.cancel()
    logger.info("ApexMind Studio stopped gracefully.")

def create_app() -> FastAPI:
    """FastAPI Application Factory."""
    app = FastAPI(
        title="ApexMind Studio AI API",
        version="2.0.0",
        docs_url="/api/docs",
        redoc_url="/api/redoc",
        openapi_url="/api/openapi.json",
        lifespan=lifespan,
    )

    # HTTP Colored Request Logging Middleware
    app.add_middleware(RequestLoggingMiddleware)

    # CORS configuration
    app.add_middleware(
        CORSMiddleware,
        allow_origin_regex=r"https?://.*",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Register Feature Routers matching frontend modules exactly
    app.include_router(dashboard_router)
    app.include_router(auth_router)
    app.include_router(workspace_router)
    app.include_router(videos_router)
    app.include_router(youtube_router)
    app.include_router(social_router)
    app.include_router(social_platform_router)
    app.include_router(notifications_router)
    app.include_router(settings_router)

    @app.get(
        "/api/health",
        tags=["Health"],
        summary="Health status",
        description="Comprehensive application health check returning system telemetry, database status, AI engine availability, audio cache metrics, and active module routes."
    )
    def health_check():
        now = datetime.now(timezone.utc)
        uptime_sec = time.time() - SERVER_START_TIME

        # 1. Database Connectivity & Metrics
        db_health = {"status": "unknown"}
        try:
            t0 = time.perf_counter()
            from backend.database.connection import get_connection
            with get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
                tables = [r[0] for r in cursor.fetchall()]
            latency_ms = round((time.perf_counter() - t0) * 1000, 2)
            db_health = {
                "status": "connected",
                "engine": "SQLite",
                "latency_ms": latency_ms,
                "tables_count": len(tables),
                "database_file": "backend/data/apexmind.db",
            }
        except Exception as e:
            db_health = {
                "status": "disconnected",
                "engine": "SQLite",
                "error": str(e),
            }

        # 2. Audio Cache Directory
        audio_dir = Path("backend/data/audio")
        audio_health = {
            "status": "ready" if audio_dir.exists() else "not_found",
            "path": str(audio_dir),
            "cached_files": len(list(audio_dir.glob("*.wav"))) if audio_dir.exists() else 0,
        }

        # 3. Gemini AI Engine Configuration
        gemini_configured = bool(settings.GEMINI_API_KEY and settings.GEMINI_API_KEY.strip())
        gemini_health = {
            "status": "configured" if gemini_configured else "unconfigured",
            "default_model": DEFAULT_SCRIPT_MODEL or "auto-selected from available Gemini models",
            "script_generation": "ready" if gemini_configured else "offline",
            "tts_voiceover": "ready" if gemini_configured else "offline",
        }

        # 4. YouTube & Omnichannel Fleet Engine
        youtube_health = {
            "status": "operational",
            "engine": "Omnichannel Social Fleet & Cross-Platform Syndication",
            "platforms": ["youtube", "instagram", "facebook"],
            "live_sync": True,
        }

        # Overall Status
        is_healthy = db_health.get("status") == "connected"
        overall_status = "healthy" if is_healthy else "degraded"

        return {
            "status": overall_status,
            "version": "2.0.0",
            "framework": "FastAPI (Python)",
            "environment": getattr(settings, "ENV", "development"),
            "timestamp": now.isoformat(),
            "uptime": {
                "seconds": round(uptime_sec, 1),
                "formatted": f"{int(uptime_sec // 3600)}h {int((uptime_sec % 3600) // 60)}m {int(uptime_sec % 60)}s",
            },
            "system": {
                "python_version": platform.python_version(),
                "os": f"{platform.system()} {platform.release()}",
                "architecture": platform.machine(),
                "process_id": os.getpid(),
                "cpu_count": os.cpu_count(),
            },
            "services": {
                "database": db_health,
                "gemini_ai": gemini_health,
                "audio_cache": audio_health,
                "youtube": youtube_health,
            },
            "modules": {
                "active": ["auth", "workspace", "videos", "youtube", "social", "notifications", "settings"],
                "total_routes": len(app.routes),
            },
        }

    @app.get(
        "/api/audio/{filename}",
        tags=["Media Files"],
        summary="Stream Audio File",
    )
    def get_audio_file(filename: str):
        from fastapi.responses import FileResponse
        from pathlib import Path
        file_path = Path("backend/data/audio") / filename
        if file_path.exists():
            return FileResponse(file_path, media_type="audio/wav")
        raise HTTPException(status_code=404, detail="Audio file not found")

    @app.get(
        "/api/videos/{filename}",
        tags=["Media Files"],
        summary="Stream Rendered Video",
    )
    @app.get(
        "/api/media/{filename}",
        tags=["Media Files"],
        summary="Stream Rendered Video (alias)",
        include_in_schema=False,
    )
    def get_video_file(filename: str):
        from fastapi.responses import FileResponse
        from pathlib import Path
        import urllib.parse
        clean_name = urllib.parse.unquote(filename)
        for folder in ["backend/data/rendered_shorts", "backend/data/media", "backend/data"]:
            for candidate in [clean_name, filename]:
                file_path = Path(folder) / candidate
                if file_path.exists() and file_path.is_file():
                    ext = candidate.lower()
                    if ext.endswith(".png"):
                        media_type = "image/png"
                    elif ext.endswith(".jpg") or ext.endswith(".jpeg"):
                        media_type = "image/jpeg"
                    elif ext.endswith(".svg"):
                        media_type = "image/svg+xml"
                    elif ext.endswith(".mp4"):
                        media_type = "video/mp4"
                    else:
                        media_type = "video/webm"
                    return FileResponse(file_path, media_type=media_type)
        raise HTTPException(status_code=404, detail="Media file not found")

    # Set custom OpenAPI schema
    app.openapi = lambda: custom_openapi(app)

    return app
