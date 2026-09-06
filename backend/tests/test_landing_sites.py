import pytest
import numpy as np
from app.scientific.landing_sites import LandingSiteOptimizer
from app.models.scientific import LandingSiteWeights

def test_landing_site_ranking_order():
    """Verify landing site ranking sorts candidates descending by composite score."""
    optimizer = LandingSiteOptimizer()
    
    shape = (10, 10)
    ice = np.zeros(shape, dtype=np.float32)
    hazard = np.zeros(shape, dtype=np.float32)
    illum = np.zeros(shape, dtype=np.float32)
    comm = np.zeros(shape, dtype=np.float32)
    dem = np.zeros(shape, dtype=np.float32)
    
    # Candidate 1: High ice, low hazard (high safety), high solar
    ice[2, 2] = 0.9
    hazard[2, 2] = 0.1
    illum[2, 2] = 0.8
    comm[2, 2] = 0.8
    
    # Candidate 2: Low ice, high hazard (low safety), low solar
    ice[8, 8] = 0.2
    hazard[8, 8] = 0.7
    illum[8, 8] = 0.1
    comm[8, 8] = 0.2
    
    candidates_raw = [
        {"id": "site-beta", "name": "Site Beta", "grid_x": 8, "grid_y": 8},
        {"id": "site-alpha", "name": "Site Alpha", "grid_x": 2, "grid_y": 2}
    ]
    
    ranked = optimizer.rank_landing_sites(candidates_raw, ice, hazard, illum, comm, dem)
    
    assert len(ranked) == 2
    assert ranked[0].id == "site-alpha"
    assert ranked[0].rank == 1
    assert ranked[1].id == "site-beta"
    assert ranked[1].rank == 2
    assert ranked[0].composite_score > ranked[1].composite_score

def test_out_of_bounds_grid_coord_raises():
    """Verify grid coordinates out of bounds raise ValueError."""
    optimizer = LandingSiteOptimizer()
    shape = (5, 5)
    zeros = np.zeros(shape)
    
    candidates = [{"id": "bad-site", "name": "Bad Site", "grid_x": 10, "grid_y": 2}]
    
    with pytest.raises(ValueError, match="out of grid bounds"):
        optimizer.rank_landing_sites(candidates, zeros, zeros, zeros, zeros, zeros)
