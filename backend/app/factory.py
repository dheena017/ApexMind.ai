import logging
from contextlib import asynccontextmanager
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
    dashboard_router,
    auth_router,
    settings_router,
    videos_router,
)

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
    logger.info("Features active: Workspace • Videos • YouTube • Notifications • Dashboard • Auth")
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
    app.include_router(videos_router, prefix="/api/videos")
    app.include_router(youtube_router)
    app.include_router(notifications_router)
    app.include_router(dashboard_router)
    app.include_router(settings_router)



    @app.get("/api/health", tags=["Health"])
    def health_check():
        return {
            "status": "healthy",
            "framework": "FastAPI (Python)",
            "version": "2.0.0",
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
