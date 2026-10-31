"""
ApexMind Studio - Python Backend Entrypoint
Powered by FastAPI, Uvicorn, SQLite, and Google Gemini
"""

import os
import warnings

# Suppress harmless Google API Core Python EOL FutureWarnings
warnings.filterwarnings("ignore", category=FutureWarning)
os.environ.setdefault("PYTHONWARNINGS", "ignore::FutureWarning")

import uvicorn
from backend.app.factory import create_app
from backend.shared.config import settings
from backend.shared.logger import get_uvicorn_log_config

app = create_app()

if __name__ == "__main__":
    uvicorn.run(
        "backend.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=True,
        log_config=get_uvicorn_log_config(),
    )
