"""
ApexMind Studio - Python Backend Entrypoint
Powered by FastAPI, Uvicorn, SQLite, and Google Gemini
"""

from backend.app.factory import create_app
from backend.shared.config import settings

app = create_app()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "backend.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=True,
    )
