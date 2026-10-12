import uvicorn
from backend.shared.config import settings
from .factory import create_app

app = create_app()

def start():
    """Starts the Uvicorn ASGI server."""
    uvicorn.run(
        "backend.app.server:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=True if settings.ENV == "development" else False,
    )

if __name__ == "__main__":
    start()
