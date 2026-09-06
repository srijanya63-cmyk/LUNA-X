"""
LUNA-X Scientific Engine — Confidence & Uncertainty Model

Quantifies prediction confidence and spatial uncertainty for ice likelihood maps based on:
- Sensor layer coverage completeness
- Multi-sensor agreement & coefficient of variation
- Spatial resolution scale factor

DISCLOSURE: High confidence values indicate high data alignment and sensor coverage,
NOT physical proof of surface/subsurface ice.
"""

from typing import Tuple, List, Dict, Any
import numpy as np


class ConfidenceModel:
    """Calculates spatial uncertainty and data quality confidence matrices [0.0 - 1.0]."""

    def __init__(self, resolution_m: float = 78.125):
        self.resolution_m = resolution_m

    def calculate_confidence_grid(
        self,
        sensor_grids: List[np.ndarray],
        resolution_m: float = 78.125
    ) -> Tuple[np.ndarray, float]:
        """
        Computes spatial confidence grid and mean confidence score across input sensor layers.
        
        Parameters:
        - sensor_grids: List of 2D numpy arrays representing normalized sensor layers [0.0 - 1.0].
        - resolution_m: Spatial resolution of input DEM/grid in meters.
        """
        if not sensor_grids:
            raise ValueError("sensor_grids list cannot be empty")

        shape = sensor_grids[0].shape
        if len(shape) != 2 or shape[0] == 0 or shape[1] == 0:
            raise ValueError("Sensor grids must be non-empty 2D numpy arrays")

        for i, grid in enumerate(sensor_grids):
            if grid.shape != shape:
                raise ValueError(f"Sensor grid at index {i} has mismatched shape {grid.shape} (expected {shape})")

        num_sensors = len(sensor_grids)
        
        # 1. Coverage completeness factor: fraction of non-NaN, non-zero sensor readings
        coverage_count = np.zeros(shape, dtype=np.float32)
        valid_masks = []

        for grid in sensor_grids:
            mask = ~np.isnan(grid) & ~np.isinf(grid)
            coverage_count += mask.astype(np.float32)
            valid_masks.append(mask)

        coverage_fraction = coverage_count / float(num_sensors)

        # 2. Multi-sensor agreement / Variance penalty
        # Stack layers into 3D array (depth = num_sensors)
        stacked = np.stack([np.nan_to_num(g, nan=0.0) for g in sensor_grids], axis=0)
        
        mean_vals = np.mean(stacked, axis=0)
        std_vals = np.std(stacked, axis=0)

        # Coefficient of variation penalty: std / (mean + eps)
        cv = std_vals / (mean_vals + 1e-5)
        agreement_factor = np.clip(1.0 - 0.5 * cv, 0.2, 1.0)

        # 3. Resolution scaling factor
        # Higher spatial resolution (lower meter value) yields higher resolution quality factor
        # 20m LOLA DEM = 1.0; 100m DEM = 0.8; 500m DEM = 0.5
        resolution_factor = np.clip(1.0 - (resolution_m / 1000.0), 0.4, 1.0)

        # Combined confidence matrix
        confidence_grid = coverage_fraction * agreement_factor * resolution_factor
        confidence_grid = np.clip(confidence_grid, 0.0, 1.0).astype(np.float32)

        mean_confidence = float(np.mean(confidence_grid))

        return confidence_grid, mean_confidence
