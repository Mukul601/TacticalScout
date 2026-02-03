"""Application configuration with environment variable support."""

from pathlib import Path

from dotenv import load_dotenv

# Load .env from project root
_env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=_env_path)


def get_env(key: str, default: str | None = None) -> str | None:
    """Get an environment variable."""
    import os
    return os.environ.get(key, default)


# Example config values (extend as needed)
APP_ENV = get_env("APP_ENV", "development")
DEBUG = get_env("DEBUG", "false").lower() in ("true", "1", "yes")

# CORS: comma-separated origins for production (e.g. Vercel frontend URL)
# Set CORS_ORIGINS=https://your-app.vercel.app for deploy
CORS_ORIGINS_EXTRA = get_env("CORS_ORIGINS", "") or None
