import os
import json
import numpy as np
from typing import Tuple, Dict, Any, Optional
from app.core.config import settings
from app.scientific.terrain_analysis import TerrainAnalyzer
from app.models.terrain import TerrainSummary, GridMetadata


class TerrainService:
    """Service layer for loading, caching, and serving lunar DEM terrain data."""

    def __init__(self, data_dir: str = settings.DATA_DIR):
        self.data_dir = data_dir
        self.analyzer = TerrainAnalyzer()
        
        # In-memory cached matrices
        self._dem: Optional[np.ndarray] = None
        self._cpr: Optional[np.ndarray] = None
        self._temp: Optional[np.ndarray] = None
        self._fuv: Optional[np.ndarray] = None
        self._illum: Optional[np.ndarray] = None
        self._comm: Optional[np.ndarray] = None
        self._metadata: Optional[Dict[str, Any]] = None

    def _ensure_loaded(self):
        """Loads numpy matrices from disk on first access."""
        if self._dem is None:
            dem_path = os.path.join(self.data_dir, "dem_south_pole.npy")
            if not os.path.exists(dem_path):
                raise FileNotFoundError(f"Demo terrain dataset missing at '{dem_path}'")
                
            self._dem = np.load(dem_path)
            self._cpr = np.load(os.path.join(self.data_dir, "cpr_south_pole.npy"))
            self._temp = np.load(os.path.join(self.data_dir, "temp_south_pole.npy"))
            self._fuv = np.load(os.path.join(self.data_dir, "fuv_albedo_south_pole.npy"))
            self._illum = np.load(os.path.join(self.data_dir, "illumination_south_pole.npy"))
            self._comm = np.load(os.path.join(self.data_dir, "earth_comm_south_pole.npy"))

            meta_path = os.path.join(self.data_dir, "metadata.json")
            if os.path.exists(meta_path):
                with open(meta_path, "r") as f:
                    self._metadata = json.load(f)
            else:
                self._metadata = {
                    "dataset_name": "South Pole Shackleton Grid",
                    "mode": "DEMO / SIMULATION DATA MODE",
                    "grid_shape": list(self._dem.shape),
                    "pixel_resolution_m": 78.125
                }

    def get_grids(self) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
        """Returns all 6 observation matrices (dem, cpr, temp, fuv, illum, comm)."""
        self._ensure_loaded()
        return self._dem, self._cpr, self._temp, self._fuv, self._illum, self._comm

    def get_terrain_summary(self) -> TerrainSummary:
        """Returns statistical summary of elevation, slope, and hazard ranges."""
        self._ensure_loaded()
        slope_deg, roughness_m, hazard, summary = self.analyzer.analyze_terrain(
            self._dem,
            resolution_m=self._metadata.get("pixel_resolution_m", 78.125)
        )
        return summary


terrain_service = TerrainService()
