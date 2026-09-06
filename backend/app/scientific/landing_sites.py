"""
LUNA-X Scientific Engine — Landing Site Intelligence & Ranking

Evaluates and ranks candidate lunar landing zones using multi-criteria decision scoring:
- Ice likelihood score (S_ice)
- Terrain safety score (1.0 - Hazard Index H)
- Annual solar illumination fraction (S_solar)
- Earth direct line-of-sight communications fraction (S_comm)

DISCLOSURE: Scores represent multi-criteria engineering rankings for simulation,
NOT guaranteed landing clearance.
"""

from typing import List, Dict, Any, Optional
import numpy as np
from app.models.scientific import LandingSiteWeights, LandingCandidate


class LandingSiteOptimizer:
    """Evaluates candidate landing zones and generates composite suitability rankings."""

    def __init__(self, weights: Optional[LandingSiteWeights] = None):
        self.weights = weights or LandingSiteWeights()

    def evaluate_candidate(
        self,
        site_meta: Dict[str, Any],
        ice_grid: np.ndarray,
        hazard_grid: np.ndarray,
        illum_grid: np.ndarray,
        comm_grid: np.ndarray,
        dem_grid: np.ndarray
    ) -> LandingCandidate:
        """
        Samples observation grids at candidate grid coordinates and calculates composite score.
        """
        gx = site_meta["grid_x"]
        gy = site_meta["grid_y"]
        rows, cols = ice_grid.shape

        # Bounds check
        if not (0 <= gx < rows and 0 <= gy < cols):
            raise ValueError(f"Candidate grid coordinate ({gx}, {gy}) out of grid bounds ({rows}, {cols})")

        ice_score = float(ice_grid[gx, gy])
        hazard_score = float(hazard_grid[gx, gy])
        safety_score = float(1.0 - hazard_score)
        illum_score = float(illum_grid[gx, gy])
        comm_score = float(comm_grid[gx, gy])
        elev_m = float(dem_grid[gx, gy])

        # Composite weighted score equation
        composite_score = (
            self.weights.w_ice * ice_score +
            self.weights.w_safety * safety_score +
            self.weights.w_solar * illum_score +
            self.weights.w_comm * comm_score
        )

        composite_score = float(np.clip(composite_score, 0.0, 1.0))

        return LandingCandidate(
            id=site_meta["id"],
            name=site_meta["name"],
            grid_x=gx,
            grid_y=gy,
            lat=site_meta.get("lat", -89.8),
            lon=site_meta.get("lon", 0.0),
            elevation_m=elev_m,
            composite_score=composite_score,
            ice_likelihood_score=ice_score,
            safety_score=safety_score,
            illumination_score=illum_score,
            comm_score=comm_score,
            hazard_score=hazard_score,
            rank=1,  # Temporary rank before full sorting
            data_mode=site_meta.get("data_type", "DEMO / SIMULATION DATA"),
            description=site_meta.get("description", "")
        )

    def rank_landing_sites(
        self,
        candidates_raw: List[Dict[str, Any]],
        ice_grid: np.ndarray,
        hazard_grid: np.ndarray,
        illum_grid: np.ndarray,
        comm_grid: np.ndarray,
        dem_grid: np.ndarray
    ) -> List[LandingCandidate]:
        """
        Evaluates a list of candidate landing site dictionaries, ranks them by composite score,
        and assigns ordinal rank values (Rank 1 = Highest score).
        """
        if not candidates_raw:
            raise ValueError("Candidate site list cannot be empty")

        grid_shape = ice_grid.shape
        if not (hazard_grid.shape == grid_shape and illum_grid.shape == grid_shape and
                comm_grid.shape == grid_shape and dem_grid.shape == grid_shape):
            raise ValueError("All input observation grids must have identical spatial dimensions")

        evaluated: List[LandingCandidate] = []
        for candidate_meta in candidates_raw:
            candidate = self.evaluate_candidate(
                candidate_meta, ice_grid, hazard_grid, illum_grid, comm_grid, dem_grid
            )
            evaluated.append(candidate)

        # Sort descending by composite_score
        evaluated.sort(key=lambda c: c.composite_score, reverse=True)

        # Assign ranks
        for idx, candidate in enumerate(evaluated):
            candidate.rank = idx + 1

        return evaluated
