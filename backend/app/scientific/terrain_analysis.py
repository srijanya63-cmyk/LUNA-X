"""
LUNA-X Scientific Engine — Terrain Analysis & Hazard Scoring

Computes surface morphology and hazard metrics from Digital Elevation Models (DEM):
- Slope incline in degrees (via 2nd-order central finite differences)
- Surface roughness (via spatial standard deviation in 3x3 sliding neighborhood using pure NumPy)
- Traversability fraction
- Terrain Hazard Index H in [0.0 - 1.0]
"""

from typing import Tuple, Dict, Any, Optional
import numpy as np
from app.models.terrain import TerrainSummary, GridMetadata


class TerrainAnalyzer:
    """Calculates surface gradients, micro-roughness, traversability, and hazard maps."""

    def __init__(self, resolution_m: float = 78.125):
        self.resolution_m = resolution_m

    def calculate_slope(self, dem: np.ndarray, resolution_m: float = 78.125) -> np.ndarray:
        """
        Calculates terrain slope in degrees using 2nd-order central finite differences.
        dz/dx and dz/dy are divided by pixel resolution in meters.
        """
        if dem.ndim != 2 or dem.shape[0] < 2 or dem.shape[1] < 2:
            raise ValueError("DEM array must be a 2D numpy array with dimensions >= 2x2")

        dem_clean = np.nan_to_num(dem, nan=0.0, posinf=0.0, neginf=0.0)

        # Gradient along y (axis 0) and x (axis 1)
        gy, gx = np.gradient(dem_clean, resolution_m)

        # Slope magnitude formula
        slope_rad = np.arctan(np.sqrt(gx**2 + gy**2))
        slope_deg = np.degrees(slope_rad).astype(np.float32)

        return slope_deg

    def calculate_roughness(self, dem: np.ndarray) -> np.ndarray:
        """
        Calculates micro-surface roughness in meters as the standard deviation 
        of elevation values in a 3x3 sliding neighborhood using pure vectorized NumPy.
        """
        if dem.ndim != 2 or dem.shape[0] < 3 or dem.shape[1] < 3:
            raise ValueError("DEM array must be a 2D numpy array with dimensions >= 3x3")

        dem_clean = np.nan_to_num(dem, nan=0.0, posinf=0.0, neginf=0.0)

        # Edge padding (1 pixel reflect padding)
        padded = np.pad(dem_clean, pad_width=1, mode='edge')

        # Create 3x3 sliding window view (shape: N, M, 3, 3)
        windows = np.lib.stride_tricks.sliding_window_view(padded, (3, 3))

        # Standard deviation across the 3x3 sub-arrays
        roughness = np.std(windows, axis=(-2, -1)).astype(np.float32)
        return roughness

    def calculate_hazard_map(
        self,
        slope_deg: np.ndarray,
        roughness_m: np.ndarray,
        slope_cutoff: float = 20.0,
        roughness_cutoff: float = 2.5
    ) -> Tuple[np.ndarray, np.ndarray]:
        """
        Calculates Hazard Index H [0.0 - 1.0] and Traversability Index T [0.0 - 1.0].
        
        Rules:
        - If slope > slope_cutoff (default 20 deg), hazard = 1.0 (impassable).
        - Otherwise, hazard = 0.6 * (slope / slope_cutoff) + 0.4 * min(1.0, roughness / roughness_cutoff).
        - Traversability = 1.0 - Hazard.
        """
        if slope_deg.shape != roughness_m.shape:
            raise ValueError(f"Shape mismatch between slope {slope_deg.shape} and roughness {roughness_m.shape}")

        slope_clean = np.nan_to_num(slope_deg, nan=45.0)
        rough_clean = np.nan_to_num(roughness_m, nan=5.0)

        hazard = np.zeros_like(slope_clean, dtype=np.float32)

        # Impassable condition (slope > 20 deg)
        impassable_mask = slope_clean >= slope_cutoff
        hazard[impassable_mask] = 1.0

        # Normal condition
        normal_mask = ~impassable_mask
        slope_component = slope_clean[normal_mask] / slope_cutoff
        rough_component = np.clip(rough_clean[normal_mask] / roughness_cutoff, 0.0, 1.0)

        hazard[normal_mask] = 0.6 * slope_component + 0.4 * rough_component
        hazard = np.clip(hazard, 0.0, 1.0).astype(np.float32)

        traversability = (1.0 - hazard).astype(np.float32)

        return hazard, traversability

    def analyze_terrain(
        self,
        dem: np.ndarray,
        resolution_m: float = 78.125,
        metadata: Optional[GridMetadata] = None
    ) -> Tuple[np.ndarray, np.ndarray, np.ndarray, TerrainSummary]:
        """
        Performs complete terrain analysis pipeline on DEM grid.
        Returns: (slope_grid, roughness_grid, hazard_grid, summary_object)
        """
        slope_deg = self.calculate_slope(dem, resolution_m)
        roughness_m = self.calculate_roughness(dem)
        hazard, _ = self.calculate_hazard_map(slope_deg, roughness_m)

        high_hazard_count = np.sum(hazard > 0.6)
        high_hazard_pct = float((high_hazard_count / hazard.size) * 100.0)

        if metadata is None:
            shape = list(dem.shape)
            metadata = GridMetadata(
                grid_shape=shape,
                pixel_resolution_m=resolution_m,
                bounding_box_meters={
                    "x_min": -shape[1] * resolution_m / 2.0,
                    "x_max": shape[1] * resolution_m / 2.0,
                    "y_min": -shape[0] * resolution_m / 2.0,
                    "y_max": shape[0] * resolution_m / 2.0
                },
                reference_frame="Polar Stereographic",
                data_mode="DEMO / SIMULATION DATA"
            )

        summary = TerrainSummary(
            min_elevation_m=float(np.min(dem)),
            max_elevation_m=float(np.max(dem)),
            mean_elevation_m=float(np.mean(dem)),
            max_slope_deg=float(np.max(slope_deg)),
            mean_slope_deg=float(np.mean(slope_deg)),
            high_hazard_area_pct=high_hazard_pct,
            metadata=metadata
        )

        return slope_deg, roughness_m, hazard, summary
