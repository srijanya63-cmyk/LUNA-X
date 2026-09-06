from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, model_validator


class ScientificWeights(BaseModel):
    """Configuration weights for ice likelihood estimation heuristic model."""
    w_cpr: float = Field(default=0.35, ge=0.0, le=1.0, description="Radar CPR weight")
    w_psr: float = Field(default=0.35, ge=0.0, le=1.0, description="Thermal PSR boundary weight")
    w_albedo: float = Field(default=0.20, ge=0.0, le=1.0, description="FUV Albedo weight")
    w_slope: float = Field(default=0.10, ge=0.0, le=1.0, description="Slope stability penalty weight")

    @model_validator(mode='after')
    def validate_sum(self) -> 'ScientificWeights':
        total = self.w_cpr + self.w_psr + self.w_albedo + self.w_slope
        if abs(total - 1.0) > 1e-4:
            raise ValueError(f"Scientific weights must sum to 1.0 (got {total:.4f})")
        return self


class LandingSiteWeights(BaseModel):
    """Configuration weights for candidate landing site composite scoring."""
    w_ice: float = Field(default=0.35, ge=0.0, le=1.0, description="Ice likelihood weight")
    w_safety: float = Field(default=0.35, ge=0.0, le=1.0, description="Terrain safety weight (1 - Hazard)")
    w_solar: float = Field(default=0.20, ge=0.0, le=1.0, description="Solar illumination access weight")
    w_comm: float = Field(default=0.10, ge=0.0, le=1.0, description="Earth direct line-of-sight communication weight")

    @model_validator(mode='after')
    def validate_sum(self) -> 'LandingSiteWeights':
        total = self.w_ice + self.w_safety + self.w_solar + self.w_comm
        if abs(total - 1.0) > 1e-4:
            raise ValueError(f"Landing site weights must sum to 1.0 (got {total:.4f})")
        return self


class IceLikelihoodResult(BaseModel):
    """Result payload for ice likelihood and uncertainty calculation."""
    ice_likelihood_mean: float = Field(description="Mean estimated ice likelihood score across grid [0.0 - 1.0]")
    ice_likelihood_max: float = Field(description="Maximum ice likelihood score in grid")
    confidence_mean: float = Field(description="Mean estimation confidence across grid [0.0 - 1.0]")
    high_likelihood_area_pct: float = Field(description="Percentage of grid area with ice likelihood > 0.7")
    grid_shape: List[int] = Field(description="Spatial grid dimensions [rows, cols]")
    data_mode: str = Field(default="DEMO / SIMULATION DATA", description="Data provenance label")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional model parameters used")


class LandingCandidate(BaseModel):
    """Candidate landing zone evaluation detail."""
    id: str = Field(description="Unique candidate identifier")
    name: str = Field(description="Human-readable candidate name")
    grid_x: int = Field(description="Grid row index")
    grid_y: int = Field(description="Grid column index")
    lat: float = Field(description="Latitude in degrees")
    lon: float = Field(description="Longitude in degrees")
    elevation_m: float = Field(description="Elevation in meters")
    composite_score: float = Field(ge=0.0, le=1.0, description="Overall multi-criteria suitability score")
    ice_likelihood_score: float = Field(ge=0.0, le=1.0, description="Local ice likelihood score")
    safety_score: float = Field(ge=0.0, le=1.0, description="Local terrain safety score (1 - Hazard)")
    illumination_score: float = Field(ge=0.0, le=1.0, description="Local annual solar illumination fraction")
    comm_score: float = Field(ge=0.0, le=1.0, description="Earth line-of-sight communications fraction")
    hazard_score: float = Field(ge=0.0, le=1.0, description="Local terrain hazard index")
    rank: int = Field(default=1, ge=1, description="Rank position among evaluated sites")
    data_mode: str = Field(default="DEMO / SIMULATION DATA", description="Data provenance disclosure")
    description: Optional[str] = Field(default=None, description="Site geological description")
