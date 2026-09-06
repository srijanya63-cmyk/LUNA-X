from enum import Enum
from typing import List, Tuple, Dict, Any, Optional
from pydantic import BaseModel, Field, model_validator


class MissionObjective(str, Enum):
    MAX_SCIENCE = "max_science"
    MAX_ICE = "max_ice"
    MAX_SAFETY = "max_safety"
    MIN_ENERGY = "min_energy"
    MIN_DISTANCE = "min_distance"
    BALANCED = "balanced"


class RiskTolerance(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class MissionStatus(str, Enum):
    PLANNED = "planned"
    READY = "ready"
    RUNNING = "running"
    PAUSED = "paused"
    BLOCKED = "blocked"
    REPLANNING = "replanning"
    COMPLETED = "completed"
    FAILED = "failed"


class FeasibilityStatus(str, Enum):
    FEASIBLE = "feasible"
    INFEASIBLE = "infeasible"
    NO_ROUTE = "no_route"
    INSUFFICIENT_ENERGY = "insufficient_energy"
    EXCESSIVE_RISK = "excessive_risk"
    INVALID_CONFIGURATION = "invalid_configuration"


class RoverParameters(BaseModel):
    """Rover mechanical and power parameters."""
    mass_kg: float = Field(default=150.0, gt=0.0, description="Rover mass in kilograms")
    velocity_m_s: float = Field(default=0.05, gt=0.0, description="Rover nominal speed in m/s")
    base_power_w: float = Field(default=50.0, ge=0.0, description="Base electronics/instrument power draw in Watts")
    rolling_resistance_coeff: float = Field(default=0.15, gt=0.0, description="Lunar regolith rolling resistance coefficient")
    lunar_gravity_m_s2: float = Field(default=1.62, gt=0.0, description="Lunar surface gravitational acceleration in m/s^2")


class GridPoint(BaseModel):
    """Grid coordinate point."""
    x: int = Field(ge=0, description="Grid row index")
    y: int = Field(ge=0, description="Grid column index")


class MissionConfig(BaseModel):
    """Validated mission execution configuration."""
    start_pos: Tuple[int, int] = Field(description="Start grid coordinate (x, y)")
    target_pos: Tuple[int, int] = Field(description="Target grid coordinate (x, y)")
    energy_budget_wh: float = Field(default=500.0, gt=0.0, description="Total energy budget in Watt-hours")
    risk_tolerance: RiskTolerance = Field(default=RiskTolerance.MEDIUM, description="Mission risk tolerance preset")
    objective: MissionObjective = Field(default=MissionObjective.BALANCED, description="Primary mission optimization objective")
    max_allowed_slope_deg: float = Field(default=15.0, ge=0.0, le=30.0, description="Maximum traversable slope in degrees")
    max_allowed_hazard: float = Field(default=0.70, ge=0.0, le=1.0, description="Maximum traversable terrain hazard index")
    
    # Cost function weights (must sum to 1.0)
    risk_weight: float = Field(default=0.35, ge=0.0, le=1.0)
    energy_weight: float = Field(default=0.35, ge=0.0, le=1.0)
    distance_weight: float = Field(default=0.30, ge=0.0, le=1.0)

    rover_params: RoverParameters = Field(default_factory=RoverParameters)

    @model_validator(mode='after')
    def validate_weights_and_positions(self) -> 'MissionConfig':
        total_w = self.risk_weight + self.energy_weight + self.distance_weight
        if abs(total_w - 1.0) > 1e-4:
            raise ValueError(f"Mission weights (risk, energy, distance) must sum to 1.0 (got {total_w:.4f})")
        
        if self.start_pos[0] < 0 or self.start_pos[1] < 0 or self.target_pos[0] < 0 or self.target_pos[1] < 0:
            raise ValueError("Coordinates must be non-negative integers")
            
        return self


class PathfindingResult(BaseModel):
    """Structured pathfinding result payload."""
    success: bool = Field(description="Whether a feasible route was successfully found")
    path: List[Tuple[int, int]] = Field(default_factory=list, description="Ordered grid cell coordinate path [(x0,y0), (x1,y1)...]")
    total_distance_m: float = Field(default=0.0, ge=0.0, description="Total traversal path length in meters")
    estimated_energy_wh: float = Field(default=0.0, ge=0.0, description="Estimated total energy consumed in Watt-hours")
    estimated_energy_joules: float = Field(default=0.0, ge=0.0, description="Estimated total energy consumed in Joules")
    average_hazard: float = Field(default=0.0, ge=0.0, le=1.0, description="Mean hazard index across path")
    max_hazard: float = Field(default=0.0, ge=0.0, le=1.0, description="Maximum hazard index encountered on path")
    max_slope_deg: float = Field(default=0.0, ge=0.0, description="Maximum slope incline encountered on path")
    nodes_explored: int = Field(default=0, ge=0, description="Total graph nodes expanded during A* search")
    path_cost: float = Field(default=0.0, ge=0.0, description="Total path cost value")
    feasibility: FeasibilityStatus = Field(default=FeasibilityStatus.NO_ROUTE)
    reason: str = Field(default="", description="Explanatory text for status or failure")


class ReplanningResult(BaseModel):
    """Structured result for dynamic route replanning events."""
    replanned: bool = Field(description="Whether route was replanned successfully")
    reason: str = Field(description="Event cause (e.g. Route blockage, Energy reduction, Hazard increase)")
    old_path: List[Tuple[int, int]] = Field(default_factory=list)
    new_path: List[Tuple[int, int]] = Field(default_factory=list)
    additional_distance_m: float = Field(default=0.0, description="Delta distance compared to remaining original route")
    additional_energy_wh: float = Field(default=0.0, description="Delta energy compared to remaining original route")
    new_risk_score: float = Field(default=0.0, description="New average path hazard risk score")
    mission_feasible: bool = Field(description="Whether the mission remains feasible under updated route")


class MissionState(BaseModel):
    """Live state representation of active rover mission."""
    status: MissionStatus = Field(default=MissionStatus.PLANNED)
    current_position: Tuple[int, int]
    target_position: Tuple[int, int]
    current_route: List[Tuple[int, int]] = Field(default_factory=list)
    visited_nodes: List[Tuple[int, int]] = Field(default_factory=list)
    remaining_energy_wh: float
    consumed_energy_wh: float = 0.0
    distance_traveled_m: float = 0.0
    mission_events: List[Dict[str, Any]] = Field(default_factory=list)
