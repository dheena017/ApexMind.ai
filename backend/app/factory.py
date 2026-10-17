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
    logger.info("Features active: Workspace • Videos • YouTube • Notifications • Auth • Settings")
    yield
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
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


    # Register Feature Routers matching frontend modules exactly
    app.include_router(auth_router)
    app.include_router(workspace_router)
    app.include_router(videos_router)
    app.include_router(youtube_router)
    app.include_router(notifications_router)
    app.include_router(settings_router)



    @app.get(
        "/api/health",
        tags=["Health"],
        summary="System Health & Diagnostic Telemetry",
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
            "default_model": "gemini-2.5-flash",
            "script_generation": "ready" if gemini_configured else "offline",
            "tts_voiceover": "ready" if gemini_configured else "offline",
        }

        # 4. YouTube Engine
        youtube_health = {
            "status": "operational",
            "engine": "Dual-Engine Official (Google OAuth + Live Feed Resolver)",
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
                "active": ["auth", "workspace", "videos", "youtube", "notifications", "settings"],
                "total_routes": len(app.routes),
            },
        }

    @app.get("/api/audio/{filename}", tags=["Audio"])
    def get_audio_file(filename: str):
        from fastapi.responses import FileResponse
        from pathlib import Path
        file_path = Path("backend/data/audio") / filename
        if file_path.exists():
            return FileResponse(file_path, media_type="audio/wav")
        raise HTTPException(status_code=404, detail="Audio file not found")

    # Set custom OpenAPI schema
    app.openapi = lambda: custom_openapi(app)

    return app
