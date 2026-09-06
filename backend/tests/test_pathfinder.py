import pytest
import numpy as np
from app.mission.pathfinding import RoverPathfinder
from app.models.mission import MissionConfig, MissionObjective, FeasibilityStatus, RiskTolerance

def test_start_equals_target():
    """Verify pathfinder handles start == target position."""
    pathfinder = RoverPathfinder()
    dem = np.zeros((10, 10))
    hazard = np.zeros((10, 10))
    slope = np.zeros((10, 10))
    
    config = MissionConfig(start_pos=(2, 2), target_pos=(2, 2))
    res = pathfinder.find_path(dem, hazard, slope, config)
    
    assert res.success is True
    assert res.path == [(2, 2)]
    assert res.total_distance_m == 0.0

def test_out_of_bounds_coordinate():
    """Verify out-of-bounds start or target returns invalid configuration."""
    pathfinder = RoverPathfinder()
    dem = np.zeros((5, 5))
    hazard = np.zeros((5, 5))
    slope = np.zeros((5, 5))
    
    config = MissionConfig(start_pos=(10, 10), target_pos=(1, 1))
    res = pathfinder.find_path(dem, hazard, slope, config)
    
    assert res.success is False
    assert res.feasibility == FeasibilityStatus.INVALID_CONFIGURATION

def test_no_feasible_route_wall_blocked():
    """Verify completely blocked wall surrounding target returns NO_ROUTE."""
    pathfinder = RoverPathfinder()
    dem = np.zeros((10, 10))
    hazard = np.zeros((10, 10))
    slope = np.zeros((10, 10))
    
    # Wall around target (5, 5) with hazard = 1.0
    for dx in [-1, 0, 1]:
        for dy in [-1, 0, 1]:
            if not (dx == 0 and dy == 0):
                hazard[5 + dx, 5 + dy] = 1.0
                
    config = MissionConfig(start_pos=(0, 0), target_pos=(5, 5))
    res = pathfinder.find_path(dem, hazard, slope, config)
    
    assert res.success is False
    assert res.feasibility == FeasibilityStatus.NO_ROUTE

def test_insufficient_energy_budget():
    """Verify route exceeding energy budget returns INSUFFICIENT_ENERGY."""
    pathfinder = RoverPathfinder()
    dem = np.zeros((20, 20))
    hazard = np.zeros((20, 20))
    slope = np.zeros((20, 20))
    
    # Very small energy budget (0.01 Wh) for 20-cell distance
    config = MissionConfig(start_pos=(0, 0), target_pos=(19, 19), energy_budget_wh=0.01)
    res = pathfinder.find_path(dem, hazard, slope, config)
    
    assert res.success is False
    assert res.feasibility == FeasibilityStatus.INSUFFICIENT_ENERGY

def test_safety_first_detour_over_short_dangerous_path():
    """
    CRITICAL ALGORITHM TEST: Proves pathfinder prefers a longer safe path (Path B) 
    over a geometrically shorter dangerous path (Path A) under MAX_SAFETY objective.
    """
    pathfinder = RoverPathfinder()
    grid_size = 15
    dem = np.zeros((grid_size, grid_size))
    hazard = np.zeros((grid_size, grid_size))
    slope = np.zeros((grid_size, grid_size))
    
    # Place a high hazard wall (hazard = 0.65) directly between start (0, 7) and target (14, 7)
    # Direct straight line path must cross (7, 7) which has hazard 0.65
    hazard[6:9, 5:10] = 0.65
    
    # Safety-First Configuration
    config_safe = MissionConfig(
        start_pos=(0, 7),
        target_pos=(14, 7),
        objective=MissionObjective.MAX_SAFETY,
        max_allowed_hazard=0.80
    )
    
    res_safe = pathfinder.find_path(dem, hazard, slope, config_safe)
    assert res_safe.success is True
    # The max hazard encountered on safety-first route must be < 0.65 (detoured around hazard block!)
    assert res_safe.max_hazard < 0.65
    
    # Shortest-Distance Configuration (accepts high hazard)
    config_short = MissionConfig(
        start_pos=(0, 7),
        target_pos=(14, 7),
        objective=MissionObjective.MIN_DISTANCE,
        max_allowed_hazard=0.80
    )
    
    res_short = pathfinder.find_path(dem, hazard, slope, config_short)
    assert res_short.success is True
    # Shortest distance path crosses the hazard block
    assert res_short.max_hazard >= 0.65
    assert res_safe.total_distance_m > res_short.total_distance_m
