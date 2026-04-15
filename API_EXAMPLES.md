# CropSense API — Usage Examples

Quick reference for interacting with the CropSense API using `curl`.

---

## Health Check

```bash
curl http://localhost:8000/health
```

**Response:**
```json
{
  "status": "ok",
  "version": "2.0",
  "uptime_seconds": 123.4,
  "python_version": "3.11.9",
  "models_loaded": 7,
  "ensemble_ready": true,
  "cnn_ready": false
}
```

---

## Crop Prediction (v1 — manual parameters)

```bash
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "N": 90,
    "P": 42,
    "K": 43,
    "temperature": 20.87,
    "humidity": 82.0,
    "ph": 6.5,
    "rainfall": 202.93
  }'
```

**Response:**
```json
{
  "crop_recommendation": {
    "crop": "Rice",
    "confidence": 98.7,
    "top3": [
      {"crop": "Rice", "probability": 98.7},
      {"crop": "Jute", "probability": 0.8},
      {"crop": "Coffee", "probability": 0.3}
    ]
  },
  "estimated_yield_kg_ha": 48.23,
  "soil_cluster": {
    "cluster_id": 3,
    "soil_profile_label": "Nutrient-Rich Alluvial"
  }
}
```

---

## Soil Image Prediction (v2 — image upload)

```bash
curl -X POST http://localhost:8000/predict-image \
  -F "file=@soil_photo.jpg" \
  -F "region=Maharashtra"
```

---

## List Soil Types

```bash
curl http://localhost:8000/soil-types
```

---

## List Regions

```bash
curl http://localhost:8000/regions
```

---

## Chat with AI Assistant

```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What crops grow best in clay soil?",
    "history": []
  }'
```

---

## Model Metrics

```bash
curl http://localhost:8000/metrics
```

---

## Dataset Stats

```bash
curl http://localhost:8000/stats
```

---

## Model Comparison

```bash
curl http://localhost:8000/model-comparison
```

---

## Feature Importance (SHAP)

```bash
curl http://localhost:8000/feature-importance
```
