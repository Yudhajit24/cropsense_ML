"""
config.py — Centralised application settings for CropSense API.

Reads environment variables (with .env support) and exposes them as typed
attributes.  Import `settings` anywhere:

    from config import settings
    print(settings.API_VERSION)
"""

import os
from dataclasses import dataclass, field
from typing import List

from dotenv import load_dotenv

load_dotenv()

# ─── Base paths ───────────────────────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))


@dataclass(frozen=True)
class Settings:
    """Immutable application-wide configuration."""

    # API
    API_TITLE: str = "CropSense API v2"
    API_VERSION: str = "2.0"
    PORT: int = int(os.getenv("PORT", "8000"))

    # Paths
    BASE_DIR: str = BASE_DIR
    DATA_PATH: str = os.path.join(BASE_DIR, "data", "crop_data.csv")
    SAVED_MODELS_DIR: str = os.path.join(BASE_DIR, "models", "saved")

    # CORS
    CORS_ORIGINS: List[str] = field(default_factory=lambda: ["*"])

    # Image upload constraints
    ALLOWED_CONTENT_TYPES: frozenset = frozenset(
        {"image/jpeg", "image/jpg", "image/png"}
    )
    MAX_IMAGE_SIZE_BYTES: int = 10 * 1024 * 1024  # 10 MB

    # GenAI
    HUGGINGFACE_API_KEY: str = os.getenv("HUGGINGFACE_API_KEY", "")
    LLM_MODEL_ID: str = "meta-llama/Meta-Llama-3-8B-Instruct"
    LLM_MAX_TOKENS: int = 1024
    LLM_TEMPERATURE: float = 0.7


# Singleton
settings = Settings()
