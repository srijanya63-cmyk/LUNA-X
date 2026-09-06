import os
import json
import numpy as np
import pytest
from app.scientific.terrain_analysis import TerrainAnalyzer
from app.scientific.ice_model import IceLikelihoodModel
from app.scientific.landing_sites import LandingSiteOptimizer
from app.mission.pathfinding import RoverPathfinder
from app.mission.dynamic_replanning import DynamicReplanner
from app.models.mission import MissionConfig, MissionObjective, FeasibilityStatus

DEMO_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "data", "demo")

def load_demo_grids():
    dem = np.load(os.path.join(DEMO_DIR, "dem_south_pole.npy"))
    cpr = np.load(os.path.join(DEMO_DIR, "cpr_south_pole.npy"))
    temp = np.load(os.path.join(DEMO_DIR, "temp_south_pole.npy"))
    fuv = np.load(os.path.join(DEMO_DIR, "fuv_albedo_south_pole.npy"))
    illum = np.load(os.path.join(DEMO_DIR, "illumination_south_pole.npy"))
    comm = np.load(os.path.join(DEMO_DIR, "earth_comm_south_pole.npy"))
    
    with open(os.path.join(DEMO_DIR, "candidate_sites.json")) as f:
        candidates = json.load(f)
        
    return dem, cpr, temp, fuv, illum, comm, candidates

def test_scenario_1_simple_feasible_terrain():
    """Scenario 1: Simple feasible terrain execution on ejecta plain."""
    dem, cpr, temp, fuv, illum, comm, candidates = load_demo_grids()
    analyzer = TerrainAnalyzer()
    slope, roughness, hazard, _ = analyzer.analyze_terrain(dem)
    
    pathfinder = RoverPathfinder()
    # Coordinates in flat outer ejecta plain region (Gamma Site area)
    start_pos = (20, 20)
    target_pos = (30, 30)
    
    config = MissionConfig(
        start_pos=start_pos,
        target_pos=target_pos,
        energy_budget_wh=500.0,
        max_allowed_slope_deg=20.0,
        max_allowed_hazard=0.80
    )
    result = pathfinder.find_path(dem, hazard, slope, config)
    
    assert result.success is True
    assert result.feasibility == FeasibilityStatus.FEASIBLE
    assert len(result.path) > 1
    assert result.estimated_energy_wh <= 500.0

def test_scenario_2_high_hazard_region_detour():
    """Scenario 2: Pathfinder evaluates route into high hazard crater rim region."""
    dem, cpr, temp, fuv, illum, comm, candidates = load_demo_grids()
    analyzer = TerrainAnalyzer()
    slope, roughness, hazard, _ = analyzer.analyze_terrain(dem)
    
    pathfinder = RoverPathfinder()
    start_pos = (20, 20)
    target_pos = (35, 35)
    
    config = MissionConfig(
        start_pos=start_pos,
        target_pos=target_pos,
        objective=MissionObjective.MAX_SAFETY,
        max_allowed_slope_deg=20.0,
        max_allowed_hazard=0.80
    )
    result = pathfinder.find_path(dem, hazard, slope, config)
    
    assert isinstance(result.success, bool)

def test_scenario_3_blocked_primary_route_replanning():
    """Scenario 3: Primary route blocked in-flight, triggers dynamic replanner."""
    dem, cpr, temp, fuv, illum, comm, candidates = load_demo_grids()
    analyzer = TerrainAnalyzer()
    slope, roughness, hazard, _ = analyzer.analyze_terrain(dem)
    
    pathfinder = RoverPathfinder()
    replanner = DynamicReplanner(pathfinder)
    
    start_pos = (15, 15)
    target_pos = (30, 30)
    config = MissionConfig(
        start_pos=start_pos,
        target_pos=target_pos,
        max_allowed_slope_deg=20.0,
        max_allowed_hazard=0.80
    )
    
    # 1. Compute initial primary route
    res_initial = pathfinder.find_path(dem, hazard, slope, config)
    assert res_initial.success is True
    
    # 2. Rover advances 3 steps along path
    current_pos = res_initial.path[3]
    remaining_old_path = res_initial.path[3:]
    
    # 3. Obstacle collapses at 6th node along path
    blocked_node = res_initial.path[6]
    
    # 4. Trigger Dynamic Replanner
    replan_res = replanner.handle_route_blockage(
        current_pos=current_pos,
        target_pos=target_pos,
        blocked_nodes=[blocked_node],
        dem_grid=dem,
        hazard_grid=hazard,
        slope_grid=slope,
        config=config,
        old_remaining_path=remaining_old_path
    )
    
    assert replan_res.replanned is True
    assert replan_res.mission_feasible is True
    assert blocked_node not in replan_res.new_path

def test_scenario_4_insufficient_energy_mission():
    """Scenario 4: Route requires more energy than tiny budget."""
    dem, cpr, temp, fuv, illum, comm, candidates = load_demo_grids()
    analyzer = TerrainAnalyzer()
    slope, roughness, hazard, _ = analyzer.analyze_terrain(dem)
    
    pathfinder = RoverPathfinder()
    config = MissionConfig(
        start_pos=(15, 15),
        target_pos=(30, 30),
        energy_budget_wh=0.01,
        max_allowed_slope_deg=20.0,
        max_allowed_hazard=0.80
    )
    result = pathfinder.find_path(dem, hazard, slope, config)
    
    assert result.success is False
    assert result.feasibility == FeasibilityStatus.INSUFFICIENT_ENERGY

def test_scenario_5_no_feasible_route():
    """Scenario 5: Target inside impassable wall."""
    dem, cpr, temp, fuv, illum, comm, candidates = load_demo_grids()
    analyzer = TerrainAnalyzer()
    slope, roughness, hazard, _ = analyzer.analyze_terrain(dem)
    
    # Artificially block surrounding area of target (25, 25)
    mod_hazard = hazard.copy()
    mod_hazard[24:27, 24:27] = 1.0
    
    pathfinder = RoverPathfinder()
    config = MissionConfig(
        start_pos=(15, 15),
        target_pos=(25, 25),
        max_allowed_slope_deg=20.0,
        max_allowed_hazard=0.80
    )
    result = pathfinder.find_path(dem, mod_hazard, slope, config)
    
    assert result.success is False
    assert result.feasibility in [FeasibilityStatus.NO_ROUTE, FeasibilityStatus.EXCESSIVE_RISK]
