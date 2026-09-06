import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_get_ice_likelihood():
    """Verify GET /api/v1/intelligence/ice-likelihood returns summary."""
    response = client.get("/api/v1/intelligence/ice-likelihood")
    assert response.status_code == 200
    data = response.json()
    assert "ice_likelihood_mean" in data
    assert "confidence_mean" in data
    assert data["data_mode"] == "DEMO / SIMULATION DATA"

def test_get_ice_likelihood_invalid_weights():
    """Verify weights sum != 1.0 returns 422 Unprocessable Entity."""
    response = client.get("/api/v1/intelligence/ice-likelihood?w_cpr=0.8&w_psr=0.8")
    assert response.status_code == 422

def test_post_landing_sites():
    """Verify POST /api/v1/intelligence/landing-sites ranks candidates."""
    response = client.post("/api/v1/intelligence/landing-sites", json={})
    assert response.status_code == 200
    candidates = response.json()
    assert isinstance(candidates, list)
    assert len(candidates) > 0
    assert candidates[0]["rank"] == 1
    assert candidates[0]["composite_score"] >= candidates[-1]["composite_score"]
