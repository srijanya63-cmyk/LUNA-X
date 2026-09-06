from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class GridMetadata(BaseModel):
    """Spatial grid dimensions and coordinate system parameters."""
    grid_shape: List[int] = Field(description="Dimensions [rows, cols]")
    pixel_resolution_m: float = Field(description="Spatial resolution per pixel in meters")
    bounding_box_meters: Dict[str, float] = Field(description="Bounding box dict with x_min, x_max, y_min, y_max")
    reference_frame: str = Field(default="Polar Stereographic", description="Coordinate reference system")
    data_mode: str = Field(default="DEMO / SIMULATION DATA", description="Explicit data provenance disclosure")


class TerrainSummary(BaseModel):
    """Statistical summary of terrain morphology."""
    min_elevation_m: float
    max_elevation_m: float
    mean_elevation_m: float
    max_slope_deg: float
    mean_slope_deg: float
    high_hazard_area_pct: float = Field(description="Percentage of terrain with slope > 15 deg or high roughness")
    metadata: GridMetadata
