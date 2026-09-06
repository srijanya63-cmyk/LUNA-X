"""
LUNA-X Mission Engine — Rover Pathfinder

Implements a Weighted 3D Surface Grid A* pathfinder for autonomous lunar rovers.
Evaluates terrain elevation, slope inclines, hazard indices, energy consumption,
and user-configured mission priorities (safety, energy, distance, balanced).

DISCLOSURE: This algorithm evaluates discrete 8-neighbor grid graphs and does not
draw direct straight lines unless flat, hazard-free terrain makes it optimal.
"""

import math
import heapq
import numpy as np
from typing import List, Tuple, Dict, Set, Optional
from app.models.mission import (
    MissionConfig,
    PathfindingResult,
    FeasibilityStatus,
    MissionObjective
)
from app.mission.energy_model import EnergyModel


class RoverPathfinder:
    """Weighted A* Surface Grid Pathfinder for Lunar Rovers."""

    def __init__(self, energy_model: Optional[EnergyModel] = None):
        self.energy_model = energy_model or EnergyModel()

    def _get_neighbors(self, x: int, y: int, rows: int, cols: int) -> List[Tuple[int, int, float]]:
        """Returns valid 8-neighborhood cell coordinates and Euclidean step distance factors."""
        neighbors = []
        for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1), (-1, -1), (-1, 1), (1, -1), (1, 1)]:
            nx, ny = x + dx, y + dy
            if 0 <= nx < rows and 0 <= ny < cols:
                dist_factor = math.sqrt(2.0) if (dx != 0 and dy != 0) else 1.0
                neighbors.append((nx, ny, dist_factor))
        return neighbors

    def find_path(
        self,
        dem_grid: np.ndarray,
        hazard_grid: np.ndarray,
        slope_grid: np.ndarray,
        config: MissionConfig,
        resolution_m: float = 78.125
    ) -> PathfindingResult:
        """
        Executes A* search across terrain matrices matching MissionConfig parameters.
        """
        rows, cols = dem_grid.shape
        start = config.start_pos
        target = config.target_pos

        # Validation checks
        if not (0 <= start[0] < rows and 0 <= start[1] < cols):
            return PathfindingResult(
                success=False,
                feasibility=FeasibilityStatus.INVALID_CONFIGURATION,
                reason=f"Start coordinate {start} out of grid bounds ({rows}, {cols})"
            )
        if not (0 <= target[0] < rows and 0 <= target[1] < cols):
            return PathfindingResult(
                success=False,
                feasibility=FeasibilityStatus.INVALID_CONFIGURATION,
                reason=f"Target coordinate {target} out of grid bounds ({rows}, {cols})"
            )

        if start == target:
            return PathfindingResult(
                success=True,
                path=[start],
                total_distance_m=0.0,
                estimated_energy_wh=0.0,
                estimated_energy_joules=0.0,
                average_hazard=float(hazard_grid[start[0], start[1]]),
                max_hazard=float(hazard_grid[start[0], start[1]]),
                max_slope_deg=float(slope_grid[start[0], start[1]]),
                nodes_explored=0,
                path_cost=0.0,
                feasibility=FeasibilityStatus.FEASIBLE,
                reason="Start and target coordinates are identical"
            )

        # Check start and target traversability
        if slope_grid[start[0], start[1]] > config.max_allowed_slope_deg or hazard_grid[start[0], start[1]] > config.max_allowed_hazard:
            return PathfindingResult(
                success=False,
                feasibility=FeasibilityStatus.EXCESSIVE_RISK,
                reason=f"Start position exceeds maximum allowed slope ({slope_grid[start[0], start[1]]:.1f} deg) or hazard limit ({hazard_grid[start[0], start[1]]:.2f})"
            )
        if slope_grid[target[0], target[1]] > config.max_allowed_slope_deg or hazard_grid[target[0], target[1]] > config.max_allowed_hazard:
            return PathfindingResult(
                success=False,
                feasibility=FeasibilityStatus.EXCESSIVE_RISK,
                reason=f"Target position exceeds maximum allowed slope ({slope_grid[target[0], target[1]]:.1f} deg) or hazard limit ({hazard_grid[target[0], target[1]]:.2f})"
            )

        # Adjust weights based on objective presets if set
        w_dist = config.distance_weight
        w_energy = config.energy_weight
        w_risk = config.risk_weight

        if config.objective == MissionObjective.MAX_SAFETY:
            w_risk = 0.80
            w_energy = 0.10
            w_dist = 0.10
        elif config.objective == MissionObjective.MIN_ENERGY:
            w_risk = 0.10
            w_energy = 0.80
            w_dist = 0.10
        elif config.objective == MissionObjective.MIN_DISTANCE:
            w_risk = 0.10
            w_energy = 0.10
            w_dist = 0.80

        # A* Data Structures
        open_set = []
        heapq.heappush(open_set, (0.0, 0.0, start))

        came_from: Dict[Tuple[int, int], Tuple[int, int]] = {}
        g_score: Dict[Tuple[int, int], float] = {start: 0.0}

        nodes_explored = 0

        # Heuristic function (Euclidean distance * distance cost scale)
        def heuristic(cell: Tuple[int, int]) -> float:
            dx = (cell[0] - target[0]) * resolution_m
            dy = (cell[1] - target[1]) * resolution_m
            return math.sqrt(dx * dx + dy * dy) / resolution_m * w_dist

        while open_set:
            _, current_g, current = heapq.heappop(open_set)
            nodes_explored += 1

            if current == target:
                # Reconstruct Path
                path = [current]
                while current in came_from:
                    current = came_from[current]
                    path.append(current)
                path.reverse()

                # Calculate Path Statistics
                total_dist = 0.0
                total_energy_j = 0.0
                total_energy_wh = 0.0
                hazards = []
                slopes = []

                for i in range(len(path)):
                    cx, cy = path[i]
                    hazards.append(float(hazard_grid[cx, cy]))
                    slopes.append(float(slope_grid[cx, cy]))

                    if i > 0:
                        px, py = path[i - 1]
                        step_d = math.sqrt((cx - px)**2 + (cy - py)**2) * resolution_m
                        dz = dem_grid[cx, cy] - dem_grid[px, py]
                        step_slope = math.degrees(math.atan2(dz, step_d))
                        
                        j, wh = self.energy_model.calculate_step_energy(step_d, step_slope)
                        total_dist += step_d
                        total_energy_j += j
                        total_energy_wh += wh

                avg_hazard = float(np.mean(hazards))
                max_h = float(np.max(hazards))
                max_s = float(np.max(slopes))

                # Feasibility check against energy budget
                if total_energy_wh > config.energy_budget_wh:
                    return PathfindingResult(
                        success=False,
                        path=path,
                        total_distance_m=total_dist,
                        estimated_energy_wh=total_energy_wh,
                        estimated_energy_joules=total_energy_j,
                        average_hazard=avg_hazard,
                        max_hazard=max_h,
                        max_slope_deg=max_s,
                        nodes_explored=nodes_explored,
                        path_cost=g_score[target],
                        feasibility=FeasibilityStatus.INSUFFICIENT_ENERGY,
                        reason=f"Route requires {total_energy_wh:.2f} Wh which exceeds budget of {config.energy_budget_wh:.2f} Wh"
                    )

                return PathfindingResult(
                    success=True,
                    path=path,
                    total_distance_m=total_dist,
                    estimated_energy_wh=total_energy_wh,
                    estimated_energy_joules=total_energy_j,
                    average_hazard=avg_hazard,
                    max_hazard=max_h,
                    max_slope_deg=max_s,
                    nodes_explored=nodes_explored,
                    path_cost=g_score[target],
                    feasibility=FeasibilityStatus.FEASIBLE,
                    reason="Optimal route successfully computed"
                )

            # Explore Neighbors
            for nx, ny, dist_factor in self._get_neighbors(current[0], current[1], rows, cols):
                neighbor = (nx, ny)
                n_slope = slope_grid[nx, ny]
                n_hazard = hazard_grid[nx, ny]

                # Hard constraints check
                if n_slope > config.max_allowed_slope_deg or n_hazard > config.max_allowed_hazard:
                    continue

                # Step Metrics
                step_dist = dist_factor * resolution_m
                dz = dem_grid[nx, ny] - dem_grid[current[0], current[1]]
                step_slope = math.degrees(math.atan2(dz, step_dist))
                
                _, step_wh = self.energy_model.calculate_step_energy(step_dist, step_slope)

                # Cost Step Function
                c_dist = (step_dist / resolution_m) * w_dist
                c_energy = (step_wh / 0.1) * w_energy
                # Non-linear hazard risk cost: approaches infinity as hazard approaches 1.0
                c_risk = (n_hazard / (1.01 - n_hazard)) * 25.0 * w_risk

                step_cost = c_dist + c_energy + c_risk
                tentative_g = current_g + step_cost

                if neighbor not in g_score or tentative_g < g_score[neighbor]:
                    came_from[neighbor] = current
                    g_score[neighbor] = tentative_g
                    f_score = tentative_g + heuristic(neighbor)
                    heapq.heappush(open_set, (f_score, tentative_g, neighbor))

        # Open set exhausted without reaching target
        return PathfindingResult(
            success=False,
            path=[],
            total_distance_m=0.0,
            estimated_energy_wh=0.0,
            estimated_energy_joules=0.0,
            average_hazard=0.0,
            max_hazard=0.0,
            max_slope_deg=0.0,
            nodes_explored=nodes_explored,
            path_cost=0.0,
            feasibility=FeasibilityStatus.NO_ROUTE,
            reason="No feasible route under current terrain hazard and slope constraints"
        )
