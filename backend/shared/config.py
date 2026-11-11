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
    # Server Networking
    PORT: int = int(os.environ.get("PORT", "8000"))
    HOST: str = os.environ.get("HOST", "0.0.0.0")
    APP_URL: str = os.environ.get("APP_URL", "http://localhost:5173")
    ENV: str = os.environ.get("NODE_ENV", "development")

    # Security & JWT Session Signing
    JWT_SECRET_KEY: str = os.environ.get("JWT_SECRET_KEY", "apexmind-studio-secret-key-2026")

    # Google Gemini API credentials
    @property
    def GEMINI_API_KEY(self) -> str:
        return os.environ.get("GEMINI_API_KEY", "").strip()

    @property
    def DEFAULT_SCRIPT_MODEL(self) -> str:
        return os.environ.get("DEFAULT_SCRIPT_MODEL", "").strip()

    @property
    def DEFAULT_TTS_MODEL(self) -> str:
        return os.environ.get("DEFAULT_TTS_MODEL", "").strip()

    # Google Cloud Project & Quotas API
    @property
    def GCP_PROJECT_ID(self) -> str:
        return (os.environ.get("GCP_PROJECT_ID") or os.environ.get("GOOGLE_CLOUD_PROJECT") or "").strip()

    @property
    def GOOGLE_APPLICATION_CREDENTIALS(self) -> str:
        return os.environ.get("GOOGLE_APPLICATION_CREDENTIALS", "").strip()

    # Google Auth & Search
    @property
    def GOOGLE_CLIENT_ID(self) -> str:
        return os.environ.get("GOOGLE_CLIENT_ID", "").strip().strip("\"'")

    @property
    def GOOGLE_CLIENT_SECRET(self) -> str:
        return os.environ.get("GOOGLE_CLIENT_SECRET", "").strip().strip("\"'")
    GOOGLE_SEARCH_API_KEY: str = os.environ.get("GOOGLE_SEARCH_API_KEY", "")
    GOOGLE_CSE_ID: str = os.environ.get("GOOGLE_CSE_ID", "")

    # Facebook and Instagram OAuth
    FACEBOOK_APP_ID: str = os.environ.get("FACEBOOK_APP_ID", "")
    FACEBOOK_APP_SECRET: str = os.environ.get("FACEBOOK_APP_SECRET", "")
    FACEBOOK_REDIRECT_URI: str = os.environ.get("FACEBOOK_REDIRECT_URI", "http://localhost:5173/social-accounts")
    FACEBOOK_AUTH_REDIRECT_URI: str = os.environ.get(
        "FACEBOOK_AUTH_REDIRECT_URI",
        f"{os.environ.get('APP_URL', 'http://localhost:5173').rstrip('/')}/login",
    )
    INSTAGRAM_APP_ID: str = os.environ.get("INSTAGRAM_APP_ID", "")
    INSTAGRAM_APP_SECRET: str = os.environ.get("INSTAGRAM_APP_SECRET", "")
    INSTAGRAM_REDIRECT_URI: str = os.environ.get("INSTAGRAM_REDIRECT_URI", "http://localhost:5173/social-accounts")
    INSTAGRAM_AUTH_REDIRECT_URI: str = os.environ.get("INSTAGRAM_AUTH_REDIRECT_URI", "http://localhost:5173/login")

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
