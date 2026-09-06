import pytest
import numpy as np
from app.mission.dynamic_replanning import DynamicReplanner
from app.models.mission import MissionConfig

def test_replanner_route_blockage_success():
    """Verify replanner finds alternate route when primary route is blocked."""
    replanner = DynamicReplanner()
    shape = (15, 15)
    dem = np.zeros(shape)
    hazard = np.zeros(shape)
    slope = np.zeros(shape)
    
    config = MissionConfig(start_pos=(0, 0), target_pos=(10, 10))
    
    # Original straight path passes through (5, 5)
    old_path = [(i, i) for i in range(11)]
    
    # Inject blockage at (5, 5)
    blocked_nodes = [(5, 5)]
    
    result = replanner.handle_route_blockage(
        current_pos=(3, 3),
        target_pos=(10, 10),
        blocked_nodes=blocked_nodes,
        dem_grid=dem,
        hazard_grid=hazard,
        slope_grid=slope,
        config=config,
        old_remaining_path=old_path[3:]
    )
    
    assert result.replanned is True
    assert result.mission_feasible is True
    assert (5, 5) not in result.new_path
    assert result.new_path[0] == (3, 3)
    assert result.new_path[-1] == (10, 10)

def test_replanner_surrounded_target_fails():
    """Verify replanner returns mission_feasible=False if blockage completely blocks target."""
    replanner = DynamicReplanner()
    shape = (10, 10)
    dem = np.zeros(shape)
    hazard = np.zeros(shape)
    slope = np.zeros(shape)
    
    config = MissionConfig(start_pos=(0, 0), target_pos=(5, 5))
    
    # Surround target (5, 5)
    blocked_nodes = [(4, 5), (6, 5), (5, 4), (5, 6), (4, 4), (4, 6), (6, 4), (6, 6)]
    
    result = replanner.handle_route_blockage(
        current_pos=(0, 0),
        target_pos=(5, 5),
        blocked_nodes=blocked_nodes,
        dem_grid=dem,
        hazard_grid=hazard,
        slope_grid=slope,
        config=config,
        old_remaining_path=[(0, 0), (5, 5)]
    )
    
    assert result.replanned is False
    assert result.mission_feasible is False

def test_replanner_energy_reduction():
    """Verify energy reduction event re-evaluates feasibility."""
    replanner = DynamicReplanner()
    shape = (20, 20)
    dem = np.zeros(shape)
    hazard = np.zeros(shape)
    slope = np.zeros(shape)
    
    config = MissionConfig(start_pos=(0, 0), target_pos=(19, 19), energy_budget_wh=500.0)
    
    # Drastic energy drop to 0.01 Wh
    result = replanner.handle_energy_reduction(
        current_pos=(0, 0),
        target_pos=(19, 19),
        new_energy_budget_wh=0.01,
        dem_grid=dem,
        hazard_grid=hazard,
        slope_grid=slope,
        config=config,
        old_remaining_path=[(0, 0), (19, 19)]
    )
    
    assert result.replanned is False
    assert result.mission_feasible is False
