import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    GEMINI_API_KEY: str = os.environ.get("GEMINI_API_KEY", "")
    PORT: int = int(os.environ.get("PORT", "8000"))
    HOST: str = os.environ.get("HOST", "0.0.0.0")
    APP_URL: str = os.environ.get("APP_URL", "http://localhost:3000")
    ENV: str = os.environ.get("NODE_ENV", "development")
    GOOGLE_CLIENT_ID: str = os.environ.get("GOOGLE_CLIENT_ID", os.environ.get("VITE_GOOGLE_CLIENT_ID", ""))


settings = Settings()
