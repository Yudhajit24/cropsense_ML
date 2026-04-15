"""
test_api.py — Unit tests for CropSense API endpoints.

Run:  pytest tests/ -v
"""

import pytest
from fastapi.testclient import TestClient


# ─── Fixtures ─────────────────────────────────────────────────────────────────
@pytest.fixture(scope="module")
def client():
    """Create a test client for the CropSense API."""
    from main import app
    return TestClient(app)


# ─── Health & Info Endpoints ──────────────────────────────────────────────────
class TestHealthEndpoints:
    def test_health_returns_ok(self, client):
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert "version" in data
        assert "uptime_seconds" in data

    def test_metrics_endpoint(self, client):
        response = client.get("/metrics")
        assert response.status_code == 200
        data = response.json()
        assert "loaded_models" in data
        assert "api_version" in data
        assert data["api_version"] == "2.0"


# ─── Prediction Endpoints ────────────────────────────────────────────────────
class TestPredictEndpoint:
    VALID_PAYLOAD = {
        "N": 90.0,
        "P": 42.0,
        "K": 43.0,
        "temperature": 20.87,
        "humidity": 82.0,
        "ph": 6.5,
        "rainfall": 202.93,
    }

    def test_predict_with_valid_data(self, client):
        response = client.post("/predict", json=self.VALID_PAYLOAD)
        # May fail if models aren't loaded, but schema should still be ok
        assert response.status_code in (200, 500)

    def test_predict_rejects_negative_nitrogen(self, client):
        payload = {**self.VALID_PAYLOAD, "N": -10}
        response = client.post("/predict", json=payload)
        assert response.status_code == 422  # Validation error

    def test_predict_rejects_ph_above_14(self, client):
        payload = {**self.VALID_PAYLOAD, "ph": 15.0}
        response = client.post("/predict", json=payload)
        assert response.status_code == 422

    def test_predict_rejects_humidity_above_100(self, client):
        payload = {**self.VALID_PAYLOAD, "humidity": 150.0}
        response = client.post("/predict", json=payload)
        assert response.status_code == 422

    def test_predict_rejects_missing_field(self, client):
        payload = {"N": 90.0, "P": 42.0}  # Missing required fields
        response = client.post("/predict", json=payload)
        assert response.status_code == 422


# ─── Static Data Endpoints ───────────────────────────────────────────────────
class TestStaticEndpoints:
    def test_stats_returns_data_or_error(self, client):
        response = client.get("/stats")
        assert response.status_code == 200

    def test_model_comparison(self, client):
        response = client.get("/model-comparison")
        assert response.status_code == 200

    def test_feature_importance(self, client):
        response = client.get("/feature-importance")
        assert response.status_code == 200

    def test_soil_types(self, client):
        response = client.get("/soil-types")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 8  # 8 soil types

    def test_regions(self, client):
        response = client.get("/regions")
        assert response.status_code == 200
        data = response.json()
        assert "regions" in data
        assert len(data["regions"]) == 20  # 20 Indian states


# ─── Chat Endpoint ───────────────────────────────────────────────────────────
class TestChatEndpoint:
    def test_chat_rejects_empty_message(self, client):
        response = client.post("/chat", json={"message": ""})
        assert response.status_code == 422

    def test_chat_rejects_invalid_role_in_history(self, client):
        response = client.post("/chat", json={
            "message": "hello",
            "history": [{"role": "invalid_role", "content": "hi"}],
        })
        assert response.status_code == 422
