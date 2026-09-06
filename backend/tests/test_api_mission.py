import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_plan_mission_valid():
    """Verify POST /api/v1/mission/plan returns mission_id and path."""
    payload = {
        "start_pos": [15, 15],
        "target_pos": [30, 30],
        "objective": "balanced",
        "energy_budget_wh": 500.0,
        "max_allowed_slope_deg": 20.0,
        "max_allowed_hazard": 0.80
    }
    response = client.post("/api/v1/mission/plan", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "mission_id" in data
    assert data["success"] is True
    assert len(data["path"]) > 1

def test_get_mission_state():
    """Verify GET /api/v1/mission/{mission_id} retrieves state."""
    # Plan first
    payload = {
        "start_pos": [15, 15],
        "target_pos": [30, 30],
        "max_allowed_slope_deg": 20.0,
        "max_allowed_hazard": 0.80
    }
    plan_res = client.post("/api/v1/mission/plan", json=payload).json()
    mission_id = plan_res["mission_id"]

    # Fetch state
    response = client.get(f"/api/v1/mission/{mission_id}")
    assert response.status_code == 200
    state = response.json()
    assert state["status"] == "planned"
    assert state["current_position"] == [15, 15]

def test_mission_event_route_blockage():
    """Verify POST /api/v1/mission/{mission_id}/events handles blockage replanning."""
    payload = {
        "start_pos": [15, 15],
        "target_pos": [30, 30],
        "max_allowed_slope_deg": 20.0,
        "max_allowed_hazard": 0.80
    }
    plan_res = client.post("/api/v1/mission/plan", json=payload).json()
    mission_id = plan_res["mission_id"]
    path = plan_res["path"]

    # Blockage event at 4th node
    blocked_node = path[4]
    event_payload = {
        "event_type": "route_blockage",
        "payload": {
            "current_position": path[2],
            "blocked_nodes": [blocked_node]
        }
    }
    response = client.post(f"/api/v1/mission/{mission_id}/events", json=event_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["replanned"] is True
    assert data["mission_feasible"] is True
    assert blocked_node not in data["new_path"]
