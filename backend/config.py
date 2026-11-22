import os
from typing import List
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))


class Config:
    """Application configuration for KK-SCANNER PRO."""

    SECRET_KEY = os.getenv("SECRET_KEY", "kk-scanner-local-dev-secret-key-2024")
    FLASK_ENV = os.getenv("FLASK_ENV", "development")
    DEBUG = FLASK_ENV == "development"

    # Default to local SQLite (kk.db) for 100% offline local execution
    raw_db_url = os.getenv("DATABASE_URL", "").strip()
    if not raw_db_url:
        SQLALCHEMY_DATABASE_URI = f"sqlite:///{os.path.join(BASE_DIR, 'kk.db')}"
    else:
        if raw_db_url.startswith("postgres://"):
            raw_db_url = raw_db_url.replace("postgres://", "postgresql+psycopg2://", 1)
        elif raw_db_url.startswith("postgresql://") and not raw_db_url.startswith("postgresql+psycopg2://"):
            raw_db_url = raw_db_url.replace("postgresql://", "postgresql+psycopg2://", 1)
        SQLALCHEMY_DATABASE_URI = raw_db_url

    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_pre_ping": True,
    }

    # Uploads directory
    UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)

    # Max upload limit: 10MB
    MAX_CONTENT_LENGTH = 10 * 1024 * 1024

    # CORS origins
    raw_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000")
    ALLOWED_ORIGINS: List[str] = [
        origin.strip() for origin in raw_origins.split(",") if origin.strip()
    ]

    # OCR Settings
    DEBUG_OCR = os.getenv("DEBUG_OCR", "0").lower() in ("1", "true", "yes")
    TESSERACT_CMD = os.getenv("TESSERACT_CMD", "")
    KK_CLAUDE_MODEL = os.getenv("KK_CLAUDE_MODEL", "claude-opus-5-5")
