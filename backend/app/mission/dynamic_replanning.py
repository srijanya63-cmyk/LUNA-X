"""
LUNA-X Mission Engine — Dynamic Replanner

Executes real-time route re-planning when simulated mission events occur:
- Route Blockages (rock fall / impassable obstacle injection)
- Sudden Energy Reductions (battery degradation / solar shadowing)
- Increased Regional Terrain Hazards (slope instability / dust storm)
"""

import numpy as np
from typing import List, Tuple, Dict, Any, Optional
from app.models.mission import (
    MissionConfig,
    PathfindingResult,
    ReplanningResult,
    MissionState,
    MissionStatus
)
from app.mission.pathfinding import RoverPathfinder


class DynamicReplanner:
    """Handles dynamic route recalculations for active rover missions."""

    def __init__(self, pathfinder: Optional[RoverPathfinder] = None):
        self.pathfinder = pathfinder or RoverPathfinder()

    def handle_route_blockage(
        self,
        current_pos: Tuple[int, int],
        target_pos: Tuple[int, int],
        blocked_nodes: List[Tuple[int, int]],
        dem_grid: np.ndarray,
        hazard_grid: np.ndarray,
        slope_grid: np.ndarray,
        config: MissionConfig,
        old_remaining_path: List[Tuple[int, int]],
        resolution_m: float = 78.125
    ) -> ReplanningResult:
        """
        Injects impassable obstacles at `blocked_nodes` and recalculates route from `current_pos`.
        """
        # Create modified hazard grid copy
        mod_hazard = hazard_grid.copy()
        for bx, by in blocked_nodes:
            if 0 <= bx < mod_hazard.shape[0] and 0 <= by < mod_hazard.shape[1]:
                mod_hazard[bx, by] = 1.0  # Set to maximum hazard (impassable)

        # Create updated config starting at current_pos
        updated_config = config.model_copy(update={"start_pos": current_pos, "target_pos": target_pos})

        # Recalculate path
        new_result = self.pathfinder.find_path(
            dem_grid=dem_grid,
            hazard_grid=mod_hazard,
            slope_grid=slope_grid,
            config=updated_config,
            resolution_m=resolution_m
        )

        if not new_result.success:
            return ReplanningResult(
                replanned=False,
                reason=f"Route blockage at {blocked_nodes}: {new_result.reason}",
                old_path=old_remaining_path,
                new_path=[],
                additional_distance_m=0.0,
                additional_energy_wh=0.0,
                new_risk_score=0.0,
                mission_feasible=False
            )

        # Calculate delta distance and energy
        # Estimate old remaining path distance/energy
        old_dist = 0.0
        for i in range(1, len(old_remaining_path)):
            p1, p2 = old_remaining_path[i - 1], old_remaining_path[i]
            old_dist += np.sqrt((p2[0] - p1[0])**2 + (p2[1] - p1[1])**2) * resolution_m

        delta_dist = new_result.total_distance_m - old_dist
        delta_energy = new_result.estimated_energy_wh - (old_dist / 1000.0 * 10.0)  # Approx baseline

        return ReplanningResult(
            replanned=True,
            reason=f"Route blockage detected at {len(blocked_nodes)} nodes: Rerouted successfully",
            old_path=old_remaining_path,
            new_path=new_result.path,
            additional_distance_m=float(max(0.0, delta_dist)),
            additional_energy_wh=float(max(0.0, delta_energy)),
            new_risk_score=new_result.average_hazard,
            mission_feasible=new_result.success
        )

    def handle_energy_reduction(
        self,
        current_pos: Tuple[int, int],
        target_pos: Tuple[int, int],
        new_energy_budget_wh: float,
        dem_grid: np.ndarray,
        hazard_grid: np.ndarray,
        slope_grid: np.ndarray,
        config: MissionConfig,
        old_remaining_path: List[Tuple[int, int]],
        resolution_m: float = 78.125
    ) -> ReplanningResult:
        """
        Re-evaluates feasibility under a reduced energy budget.
        """
        updated_config = config.model_copy(
            update={
                "start_pos": current_pos,
                "target_pos": target_pos,
                "energy_budget_wh": new_energy_budget_wh
            }
        )

        new_result = self.pathfinder.find_path(
            dem_grid=dem_grid,
            hazard_grid=hazard_grid,
            slope_grid=slope_grid,
            config=updated_config,
            resolution_m=resolution_m
        )

        if not new_result.success:
            return ReplanningResult(
                replanned=False,
                reason=f"Energy reduced to {new_energy_budget_wh:.1f} Wh: {new_result.reason}",
                old_path=old_remaining_path,
                new_path=[],
                additional_distance_m=0.0,
                additional_energy_wh=0.0,
                new_risk_score=0.0,
                mission_feasible=False
            )

        return ReplanningResult(
            replanned=True,
            reason=f"Energy budget reduced to {new_energy_budget_wh:.1f} Wh: Updated route confirmed",
            old_path=old_remaining_path,
            new_path=new_result.path,
            additional_distance_m=0.0,
            additional_energy_wh=0.0,
            new_risk_score=new_result.average_hazard,
            mission_feasible=True
        )

    def handle_hazard_increase(
        self,
        current_pos: Tuple[int, int],
        target_pos: Tuple[int, int],
        hazard_spike_region: List[Tuple[int, int]],
        hazard_increase_amount: float,
        dem_grid: np.ndarray,
        hazard_grid: np.ndarray,
        slope_grid: np.ndarray,
        config: MissionConfig,
        old_remaining_path: List[Tuple[int, int]],
        resolution_m: float = 78.125
    ) -> ReplanningResult:
        """
        Increases hazard scores in `hazard_spike_region` and recalculates route if required.
        """
        mod_hazard = hazard_grid.copy()
        for hx, hy in hazard_spike_region:
            if 0 <= hx < mod_hazard.shape[0] and 0 <= hy < mod_hazard.shape[1]:
                mod_hazard[hx, hy] = min(1.0, mod_hazard[hx, hy] + hazard_increase_amount)

        updated_config = config.model_copy(update={"start_pos": current_pos, "target_pos": target_pos})

        new_result = self.pathfinder.find_path(
            dem_grid=dem_grid,
            hazard_grid=mod_hazard,
            slope_grid=slope_grid,
            config=updated_config,
            resolution_m=resolution_m
        )

        return ReplanningResult(
            replanned=new_result.success,
            reason=f"Terrain hazard increased in region: Rerouted around hazard spike",
            old_path=old_remaining_path,
            new_path=new_result.path,
            additional_distance_m=max(0.0, new_result.total_distance_m),
            additional_energy_wh=max(0.0, new_result.estimated_energy_wh),
            new_risk_score=new_result.average_hazard,
            mission_feasible=new_result.success
        )
