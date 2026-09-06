from typing import Dict, Any, List, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from app.services.mission_service import mission_service
from app.models.mission import (
    MissionConfig,
    PathfindingResult,
    ReplanningResult,
    MissionState
)

router = APIRouter(prefix="/mission", tags=["Mission"])


class MissionPlanResponsePayload(BaseModel):
    mission_id: str
    status: str
    success: bool
    path: List[List[int]]
    metrics: Dict[str, Any]
    explanation: Dict[str, Any]


class MissionEventRequest(BaseModel):
    event_type: str = Field(description="'route_blockage', 'energy_reduction', or 'hazard_increase'")
    payload: Dict[str, Any] = Field(default_factory=dict)


@router.post("/plan", response_model=MissionPlanResponsePayload, summary="Plan New Rover Route")
async def plan_mission(config: MissionConfig):
    """
    Plans optimal rover path using Weighted 3D Surface Grid A* search matching input constraints.
    Returns mission_id, metrics, path coordinates, and factor explanations.
    """
    try:
        mission_id, res = mission_service.plan_mission(config)
        
        path_coords = [[x, y] for x, y in res.path]
        
        metrics = {
            "distance_m": res.total_distance_m,
            "estimated_energy_wh": res.estimated_energy_wh,
            "estimated_energy_joules": res.estimated_energy_joules,
            "average_hazard": res.average_hazard,
            "max_hazard": res.max_hazard,
            "max_slope_deg": res.max_slope_deg,
            "nodes_explored": res.nodes_explored,
            "feasibility": res.feasibility.value
        }
        
        explanation = {
            "objective": config.objective.value,
            "risk_tolerance": config.risk_tolerance.value,
            "reason": res.reason,
            "major_factors": [
                f"Distance weight: {config.distance_weight}",
                f"Energy weight: {config.energy_weight}",
                f"Risk weight: {config.risk_weight}"
            ]
        }
        
        return MissionPlanResponsePayload(
            mission_id=mission_id,
            status="planned" if res.success else "failed",
            success=res.success,
            path=path_coords,
            metrics=metrics,
            explanation=explanation
        )
    except ValueError as err:
        raise HTTPException(status_code=422, detail=str(err))
    except Exception as err:
        raise HTTPException(status_code=500, detail=f"Failed to plan mission: {err}")


@router.get("/{mission_id}", response_model=MissionState, summary="Get Active Mission State")
async def get_mission_state(mission_id: str):
    """Retrieves live state and event history for a planned mission."""
    state = mission_service.get_mission_state(mission_id)
    if not state:
        raise HTTPException(status_code=404, detail=f"Mission '{mission_id}' not found")
    return state


@router.post("/{mission_id}/events", response_model=ReplanningResult, summary="Simulate Mission Event & Re-plan")
async def handle_mission_event(mission_id: str, request: MissionEventRequest):
    """
    Simulates in-flight mission events (route blockage, energy loss, hazard spike)
    and passes event payload to DynamicReplanner.
    """
    try:
        result = mission_service.handle_mission_event(
            mission_id=mission_id,
            event_type=request.event_type,
            payload=request.payload
        )
        return result
    except KeyError as err:
        raise HTTPException(status_code=404, detail=str(err))
    except ValueError as err:
        raise HTTPException(status_code=400, detail=str(err))
    except Exception as err:
        raise HTTPException(status_code=500, detail=f"Failed to process mission event: {err}")


@router.post("/replan", response_model=ReplanningResult, summary="Direct Re-plan Route")
async def direct_replan(mission_id: str, request: MissionEventRequest):
    """Direct alias endpoint for triggering dynamic replanning."""
    return await handle_mission_event(mission_id, request)
