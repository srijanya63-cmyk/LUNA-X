import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_get_terrain_summary():
    """Verify GET /api/v1/terrain returns terrain summary metadata."""
    response = client.get("/api/v1/terrain")
    assert response.status_code == 200
    data = response.json()
    assert "min_elevation_m" in data
    assert "max_elevation_m" in data
    assert "mean_slope_deg" in data
    assert "metadata" in data
    assert "DEMO / SIMULATION DATA" in data["metadata"]["data_mode"]
