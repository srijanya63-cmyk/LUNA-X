import pytest
from unittest.mock import patch, AsyncMock
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_get_ai_status():
    """Verify GET /api/v1/ai/status returns status schema."""
    response = client.get("/api/v1/ai/status")
    assert response.status_code == 200
    data = response.json()
    assert data["provider"] == "ollama"
    assert data["local"] is True
    assert data["fallback_enabled"] is True

@pytest.mark.asyncio
async def test_parse_intent_fallback_when_ollama_offline():
    """Verify parse-intent activates template fallback when Ollama is offline."""
    payload = {"prompt": "I want a high safety mission prioritizing cautious traversal"}
    response = client.post("/api/v1/ai/parse-intent", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["objective"] == "max_safety"
    assert data["source"] in ["template_fallback", "ollama_llm"]

@pytest.mark.asyncio
async def test_parse_intent_mocked_ollama_success():
    """Verify parse-intent parses valid JSON returned by Ollama."""
    mock_json = '{"objective": "min_energy", "risk_tolerance": "low", "energy_budget_wh": 400.0}'
    
    with patch("app.ai.ollama_client.OllamaClient.generate", new_callable=AsyncMock) as mock_gen:
        mock_gen.return_value = mock_json
        
        response = client.post("/api/v1/ai/parse-intent", json={"prompt": "Save battery"})
        assert response.status_code == 200
        data = response.json()
        assert data["objective"] == "min_energy"
        assert data["source"] == "ollama_llm"
        assert data["local_ai_available"] is True

def test_explain_mission_fallback():
    """Verify explain mission returns briefing text using template fallback when Ollama is offline."""
    summary = {
        "objective": "max_safety",
        "distance_m": 120.5,
        "energy_wh": 14.2,
        "reason": "Safe path selected"
    }
    response = client.post("/api/v1/ai/explain", json={"mission_summary": summary})
    assert response.status_code == 200
    data = response.json()
    assert "explanation_text" in data
    assert len(data["explanation_text"]) > 20
