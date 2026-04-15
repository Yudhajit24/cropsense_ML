import time
from functools import lru_cache

from fastapi import FastAPI, HTTPException, Request, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict, Any
import pandas as pd
import os
import json

from logger import logger
from models.predict import load_models, predict_crop, predict_yield, predict_cluster, chat, predict_from_image
from models.soil_lookup import get_all_soil_info
from models.region_lookup import get_all_regions

app = FastAPI(title="CropSense API v2")

# Setup CORS for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_DIR, 'data', 'crop_data.csv')
SAVED_MODELS_DIR = os.path.join(BASE_DIR, 'models', 'saved')

# Allowed image MIME types
ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/jpg", "image/png"}
MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB

class CropInput(BaseModel):
    """Soil and climate parameters for crop recommendation."""
    N: float = Field(..., ge=0, le=300, description="Nitrogen content (mg/kg)")
    P: float = Field(..., ge=0, le=300, description="Phosphorus content (mg/kg)")
    K: float = Field(..., ge=0, le=300, description="Potassium content (mg/kg)")
    temperature: float = Field(..., ge=-10, le=60, description="Temperature (°C)")
    humidity: float = Field(..., ge=0, le=100, description="Relative humidity (%)")
    ph: float = Field(..., ge=0, le=14, description="Soil pH value")
    rainfall: float = Field(..., ge=0, le=5000, description="Annual rainfall (mm)")

class ChatMessage(BaseModel):
    """Single message in conversation history."""
    role: str = Field(..., pattern="^(user|assistant|system)$", description="Message role")
    content: str = Field(..., min_length=1, max_length=10000, description="Message content")

class ChatInput(BaseModel):
    """Chat request payload."""
    message: str = Field(..., min_length=1, max_length=5000, description="User message")
    history: List[ChatMessage] = Field(default=[], description="Conversation history")


@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log every incoming request with method, path, and response time."""
    start = time.time()
    response = await call_next(request)
    duration_ms = (time.time() - start) * 1000
    logger.info(
        "%s %s → %d (%.1fms)",
        request.method,
        request.url.path,
        response.status_code,
        duration_ms,
    )
    return response


@app.on_event("startup")
async def startup_event():
    logger.info("Starting up CropSense API v2...")
    load_models()


@app.get("/health")
def health_check():
    return {"status": "ok", "version": "2.0"}


@app.get("/metrics")
def get_metrics():
    """Return model metadata and system diagnostics for monitoring."""
    from models.predict import models as loaded_models
    model_names = [k for k in loaded_models.keys() if k != "feature_importance"]
    return {
        "loaded_models": model_names,
        "model_count": len(model_names),
        "cnn_available": "cnn" in loaded_models,
        "ensemble_available": "classifier" in loaded_models,
        "api_version": "2.0",
    }


# ─── v1 Endpoints (unchanged) ─────────────────────────────────────────────────

@app.post("/predict")
def predict(data: CropInput):
    crop_res = predict_crop(data.N, data.P, data.K, data.temperature, data.humidity, data.ph, data.rainfall)
    if isinstance(crop_res, dict) and "error" in crop_res:
        raise HTTPException(status_code=500, detail=crop_res["error"])

    yield_res = predict_yield(data.N, data.P, data.K, data.temperature, data.humidity, data.ph, data.rainfall)

    cluster_res = predict_cluster(data.N, data.P, data.K, data.temperature, data.humidity, data.ph, data.rainfall)
    if isinstance(cluster_res, tuple):
        cluster_res = {"cluster_id": 0, "soil_profile_label": "Unknown"}

    return {
        "crop_recommendation": crop_res,
        "estimated_yield_kg_ha": yield_res,
        "soil_cluster": cluster_res,
    }


@app.get("/stats")
def get_stats():
    return _cached_stats()


@lru_cache(maxsize=1)
def _cached_stats():
    """Cache dataset statistics — CSV is only re-read on server restart."""
    if not os.path.exists(DATA_PATH):
        return {"error": "Dataset not found. Please place crop_data.csv in data/ directory or run train.py to generate mock data."}

    df = pd.read_csv(DATA_PATH)
    stats = {}
    stats['total_samples'] = len(df)
    stats['num_features'] = len(df.columns) - 1
    stats['num_crops'] = df['label'].nunique()
    crop_means = df.groupby('label').mean().to_dict(orient='index')
    stats['crop_profiles'] = crop_means
    return stats


@app.get("/model-comparison")
def get_model_comparison():
    return _cached_model_comparison()


@lru_cache(maxsize=1)
def _cached_model_comparison():
    """Cache model comparison CSV — only re-read on server restart."""
    path = os.path.join(SAVED_MODELS_DIR, 'model_comparison.csv')
    if not os.path.exists(path):
        return {"error": "Comparison not found. Train models first."}
    df = pd.read_csv(path)
    return df.to_dict(orient='records')


@app.get("/feature-importance")
def get_feature_importance():
    return _cached_feature_importance()


@lru_cache(maxsize=1)
def _cached_feature_importance():
    """Cache feature importance JSON — only re-read on server restart."""
    path = os.path.join(SAVED_MODELS_DIR, 'feature_importance.json')
    if not os.path.exists(path):
        return {"error": "Feature importance not found."}
    with open(path, 'r') as f:
        data = json.load(f)
    return data


@app.post("/chat")
def chat_endpoint(data: ChatInput):
    history = [{"role": msg.role, "content": msg.content} for msg in data.history]
    response = chat(data.message, history)
    return {"response": response}


# ─── v2 Endpoints ─────────────────────────────────────────────────────────────

@app.post("/predict-image")
async def predict_image(
    file: UploadFile = File(...),
    region: str = Form(...),
):
    """
    POST /predict-image
    Multipart form: file (JPEG/PNG soil image, max 10MB) + region (Indian state name).
    Runs CNN classification → NPK/pH lookup → climate lookup → ensemble recommender.
    Returns full prediction response identical in shape to /predict plus soil CNN fields.
    """
    # ── Validate region ───────────────────────────────────────────
    supported_regions = get_all_regions()
    if region not in supported_regions:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported region '{region}'. Supported regions: {supported_regions}",
        )

    # ── Validate file type ────────────────────────────────────────
    content_type = (file.content_type or "").lower()
    if content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type '{content_type}'. Please upload a JPEG or PNG image.",
        )

    # ── Read and validate file size ───────────────────────────────
    image_bytes = await file.read()
    if len(image_bytes) > MAX_IMAGE_SIZE_BYTES:
        raise HTTPException(
            status_code=400,
            detail=f"File too large ({len(image_bytes) / (1024*1024):.1f} MB). Maximum allowed size is 10 MB.",
        )
    if len(image_bytes) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    # ── Run prediction pipeline ───────────────────────────────────
    try:
        result = predict_from_image(image_bytes, region)
    except KeyError as e:
        raise HTTPException(status_code=400, detail=f"Invalid region or soil type: {str(e)}")
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

    return result


@app.get("/soil-types")
def get_soil_types():
    """
    GET /soil-types
    Returns all 8 supported soil types with their NPK/pH ranges and descriptions.
    Used by the frontend to display soil info cards.
    """
    return get_all_soil_info()


@app.get("/regions")
def get_regions():
    """
    GET /regions
    Returns list of all 20 supported Indian state/region names.
    Used to populate the frontend region dropdown.
    """
    return {"regions": get_all_regions()}
