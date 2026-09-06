import os
import json
import numpy as np
from typing import List, Dict, Any, Optional, Tuple
from app.services.terrain_service import terrain_service
from app.scientific.ice_model import IceLikelihoodModel
from app.scientific.confidence_model import ConfidenceModel
from app.scientific.terrain_analysis import TerrainAnalyzer
from app.scientific.landing_sites import LandingSiteOptimizer
from app.models.scientific import (
    ScientificWeights,
    LandingSiteWeights,
    IceLikelihoodResult,
    LandingCandidate
)


class IntelligenceService:
    """Service layer coordinating Phase 1 scientific calculations."""

    def __init__(self):
        self.ice_model = IceLikelihoodModel()
        self.confidence_model = ConfidenceModel()
        self.terrain_analyzer = TerrainAnalyzer()
        self.site_optimizer = LandingSiteOptimizer()

    def get_ice_intelligence(
        self,
        weights: Optional[ScientificWeights] = None
    ) -> Tuple[np.ndarray, np.ndarray, np.ndarray, IceLikelihoodResult]:
        """
        Calculates spatial ice likelihood matrix, confidence matrix, and hazard matrix.
        Returns: (ice_grid, confidence_grid, hazard_grid, summary_object)
        """
        dem, cpr, temp, fuv, illum, comm = terrain_service.get_grids()
        slope_deg, roughness_m, hazard, _ = self.terrain_analyzer.analyze_terrain(dem)

        if weights:
            model = IceLikelihoodModel(weights)
        else:
            model = self.ice_model

        ice_grid, summary = model.calculate_likelihood_grid(temp, cpr, fuv, slope_deg)
        conf_grid, mean_conf = self.confidence_model.calculate_confidence_grid([cpr, temp, fuv])

        summary.confidence_mean = mean_conf
        return ice_grid, conf_grid, hazard, summary

    def rank_landing_sites(
        self,
        weights: Optional[LandingSiteWeights] = None,
        candidates_override: Optional[List[Dict[str, Any]]] = None
    ) -> List[LandingCandidate]:
        """
        Calculates multi-criteria composite landing site rankings.
        """
        dem, cpr, temp, fuv, illum, comm = terrain_service.get_grids()
        ice_grid, conf_grid, hazard, _ = self.get_ice_intelligence()

        if candidates_override:
            candidates_raw = candidates_override
        else:
            candidates_file = os.path.join(terrain_service.data_dir, "candidate_sites.json")
            if os.path.exists(candidates_file):
                with open(candidates_file, "r") as f:
                    candidates_raw = json.load(f)
            else:
                candidates_raw = [
                    {"id": "site-alpha", "name": "South Pole Plain Alpha", "grid_x": 20, "grid_y": 20},
                    {"id": "site-beta", "name": "Connecting Ridge Beta", "grid_x": 42, "grid_y": 42}
                ]

        optimizer = LandingSiteOptimizer(weights) if weights else self.site_optimizer
        ranked = optimizer.rank_landing_sites(candidates_raw, ice_grid, hazard, illum, comm, dem)
        return ranked


intelligence_service = IntelligenceService()
