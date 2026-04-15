"""
logger.py — Structured logging configuration for CropSense API.

Provides a pre-configured logger instance that writes structured, colour-coded
log output to stdout.  Import `logger` anywhere in the backend:

    from logger import logger
    logger.info("Model loaded", extra={"model": "ensemble"})
"""

import logging
import sys

# ─── Formatter ────────────────────────────────────────────────────────────────
LOG_FORMAT = "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s"
DATE_FORMAT = "%Y-%m-%d %H:%M:%S"


def get_logger(name: str = "cropsense", level: int = logging.INFO) -> logging.Logger:
    """Create and return a configured logger instance."""
    _logger = logging.getLogger(name)

    if not _logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setLevel(level)
        formatter = logging.Formatter(LOG_FORMAT, datefmt=DATE_FORMAT)
        handler.setFormatter(formatter)
        _logger.addHandler(handler)
        _logger.setLevel(level)
        _logger.propagate = False

    return _logger


# Default application logger
logger = get_logger()
