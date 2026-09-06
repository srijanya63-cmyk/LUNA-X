import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check_root():
    """Verify GET /health returns 200 OK and status JSON."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["scientific_engine"] == "available"
    assert data["mission_engine"] == "available"
    assert "ollama" in data

def test_health_check_v1():
    """Verify GET /api/v1/health returns 200 OK."""
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
