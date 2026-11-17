import os
from typing import List
from dotenv import load_dotenv

load_dotenv()


class Config:
    """Base application configuration."""

    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key-kk-scanner-2024")
    FLASK_ENV = os.getenv("FLASK_ENV", "development")
    DEBUG = FLASK_ENV == "development"

    # Database URL normalizer for SQLAlchemy & psycopg2
    raw_db_url = os.getenv("DATABASE_URL", "").strip()
    if raw_db_url.startswith("postgres://"):
        raw_db_url = raw_db_url.replace("postgres://", "postgresql+psycopg2://", 1)
    elif raw_db_url.startswith("postgresql://") and not raw_db_url.startswith("postgresql+psycopg2://"):
        raw_db_url = raw_db_url.replace("postgresql://", "postgresql+psycopg2://", 1)

    # Fallback to local SQLite if DATABASE_URL is not provided (convenient for offline dev)
    if not raw_db_url:
        SQLALCHEMY_DATABASE_URI = "sqlite:///kk_scanner.db"
    else:
        SQLALCHEMY_DATABASE_URI = raw_db_url

    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_pre_ping": True,
        "pool_recycle": 300,
        "pool_size": 5,
        "max_overflow": 10,
    }

    # Max upload limit: 8MB
    MAX_CONTENT_LENGTH = 8 * 1024 * 1024

    # CORS origins
    raw_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000")
    ALLOWED_ORIGINS: List[str] = [
        origin.strip() for origin in raw_origins.split(",") if origin.strip()
    ]

    # OCR Settings
    DEBUG_OCR = os.getenv("DEBUG_OCR", "0").lower() in ("1", "true", "yes")
    TESSERACT_CMD = os.getenv("TESSERACT_CMD", "")
