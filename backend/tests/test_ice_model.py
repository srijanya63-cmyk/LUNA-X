import pytest
import numpy as np
from app.scientific.ice_model import IceLikelihoodModel
from app.models.scientific import ScientificWeights

def test_scientific_weights_validation():
    """Verify ScientificWeights enforces sum = 1.0."""
    valid_weights = ScientificWeights(w_cpr=0.35, w_psr=0.35, w_albedo=0.20, w_slope=0.10)
    assert valid_weights.w_cpr == 0.35
    
    with pytest.raises(ValueError, match="Scientific weights must sum to 1.0"):
        ScientificWeights(w_cpr=0.5, w_psr=0.5, w_albedo=0.5, w_slope=0.5)

def test_temperature_factor_thresholds():
    """Verify T <= 40K yields factor 1.0 and T >= 110K yields factor 0.0."""
    model = IceLikelihoodModel()
    temps = np.array([[30.0, 40.0, 75.0, 110.0, 200.0]], dtype=np.float32)
    factors = model.compute_temperature_factor(temps)
    
    assert factors[0, 0] == 1.0
    assert factors[0, 1] == 1.0
    assert 0.0 < factors[0, 2] < 1.0
    assert factors[0, 3] == 0.0
    assert factors[0, 4] == 0.0

def test_cpr_factor_scaling():
    """Verify CPR factor scales from 0.4 to 1.6."""
    model = IceLikelihoodModel()
    cpr = np.array([[0.2, 0.4, 1.0, 1.6, 2.0]], dtype=np.float32)
    factors = model.compute_cpr_factor(cpr)
    
    assert factors[0, 0] == 0.0
    assert factors[0, 1] == 0.0
    assert pytest.approx(factors[0, 2], 0.01) == 0.5
    assert factors[0, 3] == 1.0
    assert factors[0, 4] == 1.0

def test_likelihood_grid_calculation_deterministic():
    """Verify deterministic ice likelihood grid output and bounds [0.0 - 1.0]."""
    model = IceLikelihoodModel()
    grid_size = 10
    temp = np.full((grid_size, grid_size), 50.0, dtype=np.float32)
    cpr = np.full((grid_size, grid_size), 1.2, dtype=np.float32)
    fuv = np.full((grid_size, grid_size), 0.4, dtype=np.float32)
    slope = np.full((grid_size, grid_size), 5.0, dtype=np.float32)
    
    grid, summary = model.calculate_likelihood_grid(temp, cpr, fuv, slope)
    
    assert grid.shape == (grid_size, grid_size)
    assert np.all(grid >= 0.0) and np.all(grid <= 1.0)
    assert summary.ice_likelihood_mean > 0.5
    assert summary.grid_shape == [grid_size, grid_size]

def test_shape_mismatch_raises_error():
    """Verify shape mismatches raise ValueError."""
    model = IceLikelihoodModel()
    temp = np.zeros((10, 10))
    cpr = np.zeros((10, 5))
    fuv = np.zeros((10, 10))
    slope = np.zeros((10, 10))
    
    with pytest.raises(ValueError, match="Input grid shape mismatch"):
        model.calculate_likelihood_grid(temp, cpr, fuv, slope)
