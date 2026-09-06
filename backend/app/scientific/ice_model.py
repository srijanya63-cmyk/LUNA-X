"""
LUNA-X Scientific Engine — Ice Likelihood Module

Calculates multi-evidence ice likelihood score grids (0.0 to 1.0) by integrating:
- LRO Mini-RF Radar Circular Polarization Ratio (CPR)
- Thermal Permanently Shadowed Region (PSR) temperature maximums (< 110K)
- LRO LAMP Far-Ultraviolet (FUV) surface albedo proxies
- Topographic slope stability penalties

DISCLOSURE: This output represents an engineering model estimate based on 
multi-criteria weighted evidence overlay, NOT an absolute physical confirmation.
"""

from typing import Tuple, Dict, Any, Optional
import numpy as np
from app.models.scientific import ScientificWeights, IceLikelihoodResult


class IceLikelihoodModel:
    """Deterministic Multi-Criteria Ice Likelihood Estimator."""

    def __init__(self, weights: Optional[ScientificWeights] = None):
        self.weights = weights or ScientificWeights()

    def compute_temperature_factor(self, temp_grid: np.ndarray) -> np.ndarray:
        """
        Evaluates physical thermal stability of water ice.
        Literature threshold (Paige et al., 2010): T_max <= 110K.
        
        Factor = 1.0 at T <= 40K, linear degradation to 0.0 at T = 110K.
        Factor = 0.0 for T > 110K.
        """
        temp_factor = np.zeros_like(temp_grid, dtype=np.float32)
        valid_mask = temp_grid <= 110.0
        
        # Linear scaling between 40K (factor 1.0) and 110K (factor 0.0)
        scaled = 1.0 - (temp_grid[valid_mask] - 40.0) / (110.0 - 40.0)
        temp_factor[valid_mask] = np.clip(scaled, 0.0, 1.0)
        return temp_factor

    def compute_cpr_factor(self, cpr_grid: np.ndarray) -> np.ndarray:
        """
        Evaluates Mini-RF radar Circular Polarization Ratio.
        High CPR (> 1.0) inside PSRs indicates volumetric scattering consistent with ice.
        
        Scaled linearly from CPR=0.4 (factor 0.0) to CPR=1.6 (factor 1.0).
        """
        scaled = (cpr_grid - 0.4) / (1.6 - 0.4)
        return np.clip(scaled, 0.0, 1.0).astype(np.float32)

    def compute_albedo_factor(self, fuv_albedo_grid: np.ndarray) -> np.ndarray:
        """
        Evaluates LAMP Far-Ultraviolet albedo proxy.
        FUV albedo > 0.36 indicates surface frost exposure.
        
        Scaled linearly from 0.20 (factor 0.0) to 0.50 (factor 1.0).
        """
        scaled = (fuv_albedo_grid - 0.20) / (0.50 - 0.20)
        return np.clip(scaled, 0.0, 1.0).astype(np.float32)

    def compute_slope_penalty(self, slope_grid: np.ndarray) -> np.ndarray:
        """
        Slope stability penalty factor. High slopes (> 20 deg) experience mass wasting 
        which destabilizes regolith ice accumulation.
        
        Scaled linearly from 0 deg (0.0 penalty) to 30 deg (1.0 maximum penalty).
        """
        penalty = slope_grid / 30.0
        return np.clip(penalty, 0.0, 1.0).astype(np.float32)

    def calculate_likelihood_grid(
        self,
        temp_grid: np.ndarray,
        cpr_grid: np.ndarray,
        fuv_albedo_grid: np.ndarray,
        slope_grid: np.ndarray
    ) -> Tuple[np.ndarray, IceLikelihoodResult]:
        """
        Computes spatial ice likelihood matrix and statistical summary.
        
        Validates input grid shapes, handles NaNs, and applies multi-criteria formula.
        """
        # Shape validation
        shape = temp_grid.shape
        if not (cpr_grid.shape == shape and fuv_albedo_grid.shape == shape and slope_grid.shape == shape):
            raise ValueError(
                f"Input grid shape mismatch: temp={temp_grid.shape}, cpr={cpr_grid.shape}, "
                f"fuv={fuv_albedo_grid.shape}, slope={slope_grid.shape}"
            )
        
        if len(shape) != 2 or shape[0] == 0 or shape[1] == 0:
            raise ValueError("Input grids must be non-empty 2D numpy arrays")

        # Clean NaN or Inf values with fill defaults
        temp_clean = np.nan_to_num(temp_grid, nan=300.0, posinf=300.0, neginf=0.0)
        cpr_clean = np.nan_to_num(cpr_grid, nan=0.0, posinf=2.0, neginf=0.0)
        fuv_clean = np.nan_to_num(fuv_albedo_grid, nan=0.0, posinf=1.0, neginf=0.0)
        slope_clean = np.nan_to_num(slope_grid, nan=45.0, posinf=45.0, neginf=0.0)

        # Compute component factors
        f_temp = self.compute_temperature_factor(temp_clean)
        f_cpr = self.compute_cpr_factor(cpr_clean)
        f_alb = self.compute_albedo_factor(fuv_clean)
        f_slope = self.compute_slope_penalty(slope_clean)

        # Weighted combination
        likelihood_grid = (
            self.weights.w_psr * f_temp +
            self.weights.w_cpr * f_cpr +
            self.weights.w_albedo * f_alb -
            self.weights.w_slope * f_slope
        )
        
        likelihood_grid = np.clip(likelihood_grid, 0.0, 1.0).astype(np.float32)

        # Compute statistical summary
        high_ice_count = np.sum(likelihood_grid > 0.7)
        total_pixels = likelihood_grid.size

        summary = IceLikelihoodResult(
            ice_likelihood_mean=float(np.mean(likelihood_grid)),
            ice_likelihood_max=float(np.max(likelihood_grid)),
            confidence_mean=0.0,  # Will be populated when confidence model is combined
            high_likelihood_area_pct=float((high_ice_count / total_pixels) * 100.0),
            grid_shape=list(shape),
            data_mode="DEMO / SIMULATION DATA",
            metadata={
                "w_cpr": self.weights.w_cpr,
                "w_psr": self.weights.w_psr,
                "w_albedo": self.weights.w_albedo,
                "w_slope": self.weights.w_slope
            }
        )

        return likelihood_grid, summary
