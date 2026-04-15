# CropSense Backend — Multi-stage Dockerfile
# Build: docker build -t cropsense-backend .
# Run:   docker run -p 8000:8000 --env-file .env cropsense-backend

# ────────────────────────────────────────────────────────────────
# Stage 1: Dependencies
# ────────────────────────────────────────────────────────────────
FROM python:3.11-slim AS deps

WORKDIR /app

# System dependencies for scientific packages
RUN apt-get update && \
    apt-get install -y --no-install-recommends gcc g++ && \
    rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# ────────────────────────────────────────────────────────────────
# Stage 2: Application
# ────────────────────────────────────────────────────────────────
FROM python:3.11-slim AS runtime

WORKDIR /app

# Copy installed packages from deps stage
COPY --from=deps /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=deps /usr/local/bin /usr/local/bin

# Copy application code
COPY . .

# Expose API port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')" || exit 1

# Run with uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
