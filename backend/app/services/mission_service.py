import uuid
import logging
from typing import Dict, Any, Optional, Tuple, List
from app.services.terrain_service import terrain_service
from app.scientific.terrain_analysis import TerrainAnalyzer
from app.mission.pathfinding import RoverPathfinder
from app.mission.dynamic_replanning import DynamicReplanner
from app.models.mission import (
    MissionConfig,
    PathfindingResult,
    ReplanningResult,
    MissionState,
    MissionStatus,
    FeasibilityStatus
)

logger = logging.getLogger("luna_x.mission_service")


class MissionService:
    """Service layer managing mission execution, state storage, and dynamic event replanning."""

    def __init__(self):
        self.pathfinder = RoverPathfinder()
        self.replanner = DynamicReplanner(self.pathfinder)
        self.terrain_analyzer = TerrainAnalyzer()
        
        # In-memory mission store (Dict[mission_id -> MissionState])
        self._missions: Dict[str, MissionState] = {}
        self._mission_configs: Dict[str, MissionConfig] = {}

    def plan_mission(self, config: MissionConfig) -> Tuple[str, PathfindingResult]:
        """
        Calculates optimal path for MissionConfig, generates a unique mission_id,
        and stores initial MissionState in memory.
        """
        dem, cpr, temp, fuv, illum, comm = terrain_service.get_grids()
        slope_deg, roughness_m, hazard, _ = self.terrain_analyzer.analyze_terrain(dem)

        res = self.pathfinder.find_path(
            dem_grid=dem,
            hazard_grid=hazard,
            slope_grid=slope_deg,
            config=config
        )

        mission_id = f"mission_{uuid.uuid4().hex[:8]}"

        status = MissionStatus.PLANNED if res.success else MissionStatus.FAILED
        state = MissionState(
            status=status,
            current_position=config.start_pos,
            target_position=config.target_pos,
            current_route=res.path if res.success else [],
            visited_nodes=[config.start_pos] if res.success else [],
            remaining_energy_wh=config.energy_budget_wh - res.estimated_energy_wh if res.success else config.energy_budget_wh,
            consumed_energy_wh=res.estimated_energy_wh if res.success else 0.0,
            distance_traveled_m=0.0,
            mission_events=[{"event": "mission_planned", "success": res.success, "reason": res.reason}]
        )

        self._missions[mission_id] = state
        self._mission_configs[mission_id] = config

        return mission_id, res

    def get_mission_state(self, mission_id: str) -> Optional[MissionState]:
        """Retrieves active MissionState by mission_id."""
        return self._missions.get(mission_id)

    def get_mission_config(self, mission_id: str) -> Optional[MissionConfig]:
        """Retrieves MissionConfig by mission_id."""
        return self._mission_configs.get(mission_id)

    def handle_mission_event(
        self,
        mission_id: str,
        event_type: str,
        payload: Dict[str, Any]
    ) -> ReplanningResult:
        """
        Routes incoming simulated events to DynamicReplanner and updates MissionState.
        """
        state = self.get_mission_state(mission_id)
        config = self.get_mission_config(mission_id)

        if not state or not config:
            raise KeyError(f"Mission '{mission_id}' not found")

        dem, cpr, temp, fuv, illum, comm = terrain_service.get_grids()
        slope_deg, roughness_m, hazard, _ = self.terrain_analyzer.analyze_terrain(dem)

        raw_curr = payload.get("current_position", state.current_position)
        current_pos: Tuple[int, int] = (int(raw_curr[0]), int(raw_curr[1]))
        target_pos: Tuple[int, int] = (int(state.target_position[0]), int(state.target_position[1]))

        if event_type == "route_blockage":
            blocked = payload.get("blocked_nodes", [])
            blocked_nodes = [(int(b[0]), int(b[1])) if isinstance(b, (list, tuple)) else (int(b["x"]), int(b["y"])) for b in blocked]
            
            res = self.replanner.handle_route_blockage(
                current_pos=current_pos,
                target_pos=target_pos,
                blocked_nodes=blocked_nodes,
                dem_grid=dem,
                hazard_grid=hazard,
                slope_grid=slope_deg,
                config=config,
                old_remaining_path=state.current_route
            )

        elif event_type == "energy_reduction":
            new_budget = float(payload.get("new_energy_budget_wh", state.remaining_energy_wh * 0.5))
            res = self.replanner.handle_energy_reduction(
                current_pos=current_pos,
                target_pos=target_pos,
                new_energy_budget_wh=new_budget,
                dem_grid=dem,
                hazard_grid=hazard,
                slope_grid=slope_deg,
                config=config,
                old_remaining_path=state.current_route
            )

        elif event_type == "hazard_increase":
            region = payload.get("hazard_spike_region", [])
            region_nodes = [(int(r[0]), int(r[1])) if isinstance(r, (list, tuple)) else (int(r["x"]), int(r["y"])) for r in region]
            increase = float(payload.get("hazard_increase_amount", 0.3))

            res = self.replanner.handle_hazard_increase(
                current_pos=current_pos,
                target_pos=target_pos,
                hazard_spike_region=region_nodes,
                hazard_increase_amount=increase,
                dem_grid=dem,
                hazard_grid=hazard,
                slope_grid=slope_deg,
                config=config,
                old_remaining_path=state.current_route
            )

        else:
            raise ValueError(f"Unsupported event_type '{event_type}'")

        # Update MissionState
        if res.replanned:
            state.status = MissionStatus.RUNNING if res.mission_feasible else MissionStatus.BLOCKED
            state.current_route = res.new_path
        else:
            state.status = MissionStatus.BLOCKED if not res.mission_feasible else state.status

        state.mission_events.append({
            "event_type": event_type,
            "replanned": res.replanned,
            "feasible": res.mission_feasible,
            "reason": res.reason
        })

        return res


mission_service = MissionService()
