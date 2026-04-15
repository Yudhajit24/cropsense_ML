"""
predict.py — CropSense v2 prediction module.

v2 additions:
  - load_models() now also loads soil_cnn.h5 + class_indices.json (non-fatal if absent)
  - predict_from_image() — full image-to-recommendation pipeline:
      Image → CNN → soil_type → NPK/pH lookup → climate lookup → ensemble recommender

CNN trained from scratch per CSE3231 Session 10 lab requirement (no pretrained weights).
"""

import os
import json
import io
import numpy as np

import joblib
from huggingface_hub import InferenceClient
from dotenv import load_dotenv

from logger import logger

# PIL for image preprocessing (must match CNN training preprocessing exactly)
try:
    from PIL import Image as PILImage
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False

# TensorFlow — optional at import time; only required for /predict-image
try:
    import tensorflow as tf
    TF_AVAILABLE = True
except ImportError:
    TF_AVAILABLE = False

from models.soil_lookup import soil_to_features, get_soil_label
from models.region_lookup import get_region_climate

# ─── Paths ───────────────────────────────────────────────────────────────────
BASE_DIR        = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SAVED_MODELS_DIR = os.path.join(BASE_DIR, 'models', 'saved')
CNN_MODEL_PATH  = os.path.join(SAVED_MODELS_DIR, 'soil_cnn.h5')
CLASS_IDX_PATH  = os.path.join(SAVED_MODELS_DIR, 'class_indices.json')

# ─── Global model cache ───────────────────────────────────────────────────────
models = {}

CLUSTER_LABELS = {
    0: "Dry Alkaline Plains",
    1: "Tropical High-Humidity",
    2: "Temperate Acidic Soil",
    3: "Nutrient-Rich Alluvial",
    4: "Arid Low-Nutrient",
}


# ─── Model Loading ────────────────────────────────────────────────────────────
def load_models():
    """
    Load all saved models into memory at startup.
    CNN loading is non-fatal — the v1 /predict endpoint works even if soil_cnn.h5
    is absent (i.e., before train_cnn.py has been run).
    """
    global models

    # ── v1 Ensemble models (required) ────────────────────────────
    required_files = [
        'scaler.pkl', 'label_encoder.pkl', 'yield_scaler.pkl',
        'yield_model.pkl', 'kmeans_model.pkl', 'voting_ensemble.pkl',
    ]
    for req in required_files:
        path = os.path.join(SAVED_MODELS_DIR, req)
        if not os.path.exists(path):
            logger.warning("Model file %s not found. Run train.py first.", req)
            return False

    try:
        models['scaler']        = joblib.load(os.path.join(SAVED_MODELS_DIR, 'scaler.pkl'))
        models['label_encoder'] = joblib.load(os.path.join(SAVED_MODELS_DIR, 'label_encoder.pkl'))
        models['yield_scaler']  = joblib.load(os.path.join(SAVED_MODELS_DIR, 'yield_scaler.pkl'))
        models['yield_model']   = joblib.load(os.path.join(SAVED_MODELS_DIR, 'yield_model.pkl'))
        models['kmeans']        = joblib.load(os.path.join(SAVED_MODELS_DIR, 'kmeans_model.pkl'))
        models['classifier']    = joblib.load(os.path.join(SAVED_MODELS_DIR, 'voting_ensemble.pkl'))

        with open(os.path.join(SAVED_MODELS_DIR, 'feature_importance.json'), 'r') as f:
            models['feature_importance'] = json.load(f)

        logger.info("✅ Ensemble models loaded successfully.")
    except Exception as e:
        logger.error("Error loading ensemble models: %s", e)
        return False

    # ── v2 CNN model (optional — non-fatal) ──────────────────────
    _load_cnn()
    return True


def _load_cnn():
    """Load soil CNN and class indices. Safe to call; logs warning if absent."""
    global models

    if not TF_AVAILABLE:
        logger.warning("TensorFlow not installed. /predict-image endpoint unavailable.")
        return

    if not os.path.exists(CNN_MODEL_PATH):
        logger.info("soil_cnn.h5 not found at %s.", CNN_MODEL_PATH)
        logger.info("      Run: python models/train_cnn.py  (after downloading Kaggle dataset)")
        logger.info("      The /predict-image endpoint will use mock fallback until then.")
        return

    try:
        models['cnn'] = tf.keras.models.load_model(CNN_MODEL_PATH)
        with open(CLASS_IDX_PATH, 'r') as f:
            raw = json.load(f)
        # class_indices.json stores {normalised_name: int_index}
        # Invert to {int_index: normalised_name} for argmax lookup
        models['cnn_idx_to_class'] = {int(v): k for k, v in raw.items()}
        logger.info("✅ Soil CNN loaded (%d classes): %s", len(models['cnn_idx_to_class']), list(models['cnn_idx_to_class'].values()))
    except Exception as e:
        logger.warning("Could not load soil CNN: %s", e)


# ─── v1 Prediction Functions (unchanged) ─────────────────────────────────────
def predict_crop(N, P, K, temp, humidity, ph, rainfall):
    """Predict crop and return top 3 with probabilities."""
    if 'classifier' not in models:
        return {"error": "Models not loaded. Call load_models() first."}

    features = np.array([[N, P, K, temp, humidity, ph, rainfall]])
    features_scaled = models['scaler'].transform(features)

    probas = models['classifier'].predict_proba(features_scaled)[0]
    top3_idx = np.argsort(probas)[-3:][::-1]

    top3_crops = [
        {
            "crop": models['label_encoder'].inverse_transform([idx])[0].capitalize(),
            "probability": float(f"{float(probas[idx] * 100):.1f}"),
        }
        for idx in top3_idx
    ]

    return {
        "crop": top3_crops[0]["crop"],
        "confidence": top3_crops[0]["probability"],
        "top3": top3_crops,
        "shap_values": models.get('feature_importance', []),
    }


def predict_yield(N, P, K, temp, humidity, ph, rainfall):
    """Predict estimated yield using Linear Regression."""
    if 'yield_model' not in models:
        return 0.0
    features = np.array([[N, P, K, temp, humidity, ph, rainfall]])
    features_scaled = models['yield_scaler'].transform(features)
    predicted_yield = models['yield_model'].predict(features_scaled)[0]
    return float(f"{float(predicted_yield):.2f}")


def predict_cluster(N, P, K, temp, humidity, ph, rainfall):
    """Predict soil profile cluster and logical label."""
    if 'kmeans' not in models:
        return {"cluster_id": 0, "soil_profile_label": "Unknown"}
    features = np.array([[N, P, K, temp, humidity, ph, rainfall]])
    features_scaled = models['scaler'].transform(features)
    cluster_id = int(models['kmeans'].predict(features_scaled)[0])
    return {
        "cluster_id": cluster_id,
        "soil_profile_label": CLUSTER_LABELS.get(cluster_id, "Unknown Profile"),
    }


# ─── v2 Image Prediction Pipeline ────────────────────────────────────────────
def _preprocess_image(image_bytes: bytes) -> np.ndarray:
    """
    Preprocess raw image bytes to CNN input tensor.
    Must match train_cnn.py preprocessing exactly:
      - Convert to RGB
      - Resize to 224×224
      - Normalise to [0, 1]
      - Add batch dimension → shape (1, 224, 224, 3)
    """
    if not PIL_AVAILABLE:
        raise RuntimeError("Pillow not installed. Run: pip install pillow")
    img = PILImage.open(io.BytesIO(image_bytes)).convert('RGB').resize((224, 224))
    arr = np.array(img) / 255.0
    arr = np.expand_dims(arr, axis=0)   # (1, 224, 224, 3)
    return arr.astype(np.float32)


def predict_from_image(image_bytes: bytes, region: str) -> dict:
    """
    Full image-to-crop-recommendation pipeline (v2 endpoint).

    Steps:
      1. Preprocess image → CNN input tensor
      2. CNN inference → soil_type (argmax) + confidence (softmax probability)
      3. Soil-to-NPK/pH lookup (midpoint, deterministic)
      4. Region-to-climate lookup
      5. Merge → 7-feature vector {N, P, K, ph, temperature, humidity, rainfall}
      6. Existing predict_crop() + predict_yield() + predict_cluster()
      7. Return combined result dict

    Falls back to mock CNN output (loamy, 0.91) if soil_cnn.h5 is not loaded,
    so the full UI pipeline is demonstrable before training completes.

    Args:
        image_bytes: Raw bytes of the uploaded JPEG/PNG image.
        region:      Indian state name (must be in region_lookup.REGION_CLIMATE).

    Returns:
        {
            soil_type:             str,
            soil_type_confidence:  float (0–1),
            soil_label:            str,
            soil_features:         dict {N, P, K, ph, temperature, humidity, rainfall},
            crop_recommendation:   dict (from predict_crop),
            yield_estimate:        float,
            cluster:               dict (from predict_cluster),
            shap_values:           list,
            mock_cnn:              bool  (True when CNN not loaded — for UI indicator)
        }
    """
    # ── Step 1 & 2: CNN inference ─────────────────────────────────
    mock_cnn = False

    if 'cnn' in models and TF_AVAILABLE:
        arr = _preprocess_image(image_bytes)
        probs = models['cnn'].predict(arr, verbose=0)[0]   # (num_classes,)
        top_idx = int(np.argmax(probs))
        confidence = float(probs[top_idx])
        soil_type = models['cnn_idx_to_class'].get(top_idx, 'loamy')
    else:
        # Mock fallback — safe for viva demo before CNN is trained
        soil_type  = 'loamy'
        confidence = 0.91
        mock_cnn   = True

    # ── Step 3: Soil → NPK/pH ─────────────────────────────────────
    soil_npk = soil_to_features(soil_type)   # {N, P, K, ph}
    soil_lbl = get_soil_label(soil_type)

    # ── Step 4: Region → Climate ──────────────────────────────────
    climate = get_region_climate(region)     # {temperature, humidity, rainfall}

    # ── Step 5: Merge feature vector ─────────────────────────────
    features = {**soil_npk, **climate}
    N, P, K  = features['N'], features['P'], features['K']
    ph       = features['ph']
    temp     = features['temperature']
    hum      = features['humidity']
    rain     = features['rainfall']

    # ── Step 6: Existing models ───────────────────────────────────
    crop_res    = predict_crop(N, P, K, temp, hum, ph, rain)
    yield_res   = predict_yield(N, P, K, temp, hum, ph, rain)
    cluster_res = predict_cluster(N, P, K, temp, hum, ph, rain)

    if isinstance(cluster_res, tuple):
        cluster_res = {"cluster_id": 0, "soil_profile_label": "Unknown"}

    # ── Step 7: Return ───────────────────────────────────────────
    return {
        "soil_type":            soil_type,
        "soil_type_confidence": round(confidence, 4),
        "soil_label":           soil_lbl,
        "soil_features":        features,
        "crop_recommendation":  crop_res,
        "yield_estimate":       yield_res,
        "cluster":              cluster_res,
        "shap_values":          models.get('feature_importance', []),
        "mock_cnn":             mock_cnn,
    }


# ─── NLP Chatbot ─────────────────────────────────────────────────────────────
def chat(user_message, conversation_history):
    """Farm expert chatbot using Hugging Face (LLaMA 3 8B)."""
    load_dotenv()
    api_key = os.getenv("HUGGINGFACE_API_KEY")
    if not api_key or api_key == "your_hf_api_key_here":
        return "System notice: Hugging Face API key is not configured. Please add it to the .env file."

    try:
        client = InferenceClient("meta-llama/Meta-Llama-3-8B-Instruct", token=api_key)

        system_prompt = (
            "You are an expert Indian agricultural scientist with 20 years of experience "
            "advising smallholder farmers. You give practical, actionable advice in simple "
            "language. When users provide soil parameters, give crop-specific guidance."
        )

        messages = [{"role": "system", "content": system_prompt}]
        for msg in conversation_history:
            messages.append({"role": msg.get("role", "user"), "content": msg.get("content", "")})
        messages.append({"role": "user", "content": user_message})

        response = client.chat_completion(
            messages=messages,
            temperature=0.7,
            max_tokens=1024,
        )
        return response.choices[0].message.content
    except Exception as e:
        logger.error("Hugging Face error: %s", e)
        return "I'm having trouble connecting to my knowledge base right now. Please try again later."
