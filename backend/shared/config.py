import os
from pathlib import Path
from dotenv import load_dotenv

# Search and load .env from root or current working directory
env_path = Path(__file__).resolve().parent.parent.parent / ".env"
if env_path.exists():
    load_dotenv(dotenv_path=env_path)
else:
    load_dotenv()


class Settings:
    # Google Gemini & AI Model Configuration
    GEMINI_API_KEY: str = os.environ.get("GEMINI_API_KEY", "")
    DEFAULT_SCRIPT_MODEL: str = os.environ.get("DEFAULT_SCRIPT_MODEL", "gemini-3.8-flash")
    DEFAULT_TTS_MODEL: str = os.environ.get("DEFAULT_TTS_MODEL", "gemini-3.8-flash-tts")

    # Server Networking
    PORT: int = int(os.environ.get("PORT", "8000"))
    HOST: str = os.environ.get("HOST", "0.0.0.0")
    APP_URL: str = os.environ.get("APP_URL", "http://localhost:3000")
    ENV: str = os.environ.get("NODE_ENV", "development")

    # Google Auth & Search
    GOOGLE_CLIENT_ID: str = os.environ.get("GOOGLE_CLIENT_ID", os.environ.get("VITE_GOOGLE_CLIENT_ID", ""))
    GOOGLE_SECRET: str = (
        os.environ.get("GOOGLE_SECRET")
        or os.environ.get("GOOGLE_CLIENT_SECRET")
        or os.environ.get("VITE_GOOGLE_CLIENT_SECRET", "")
    )
    GOOGLE_SEARCH_API_KEY: str = os.environ.get("GOOGLE_SEARCH_API_KEY", "")
    GOOGLE_CSE_ID: str = os.environ.get("GOOGLE_CSE_ID", "")

    # Stock Photography & Media Providers
    PEXELS_API_KEY: str = os.environ.get("PEXELS_API_KEY", "")
    PIXABAY_API_KEY: str = os.environ.get("PIXABAY_API_KEY", "")
    UNSPLASH_ACCESS_KEY: str = os.environ.get("UNSPLASH_ACCESS_KEY", "")

    @property
    def is_production(self) -> bool:
        return self.ENV.lower() == "production"

    @property
    def has_gemini_key(self) -> bool:
        return bool(self.GEMINI_API_KEY and self.GEMINI_API_KEY.strip())

    @property
    def has_pexels_key(self) -> bool:
        return bool(self.PEXELS_API_KEY and self.PEXELS_API_KEY.strip())

    @property
    def has_pixabay_key(self) -> bool:
        return bool(self.PIXABAY_API_KEY and self.PIXABAY_API_KEY.strip())

    @property
    def has_unsplash_key(self) -> bool:
        return bool(self.UNSPLASH_ACCESS_KEY and self.UNSPLASH_ACCESS_KEY.strip())


settings = Settings()
