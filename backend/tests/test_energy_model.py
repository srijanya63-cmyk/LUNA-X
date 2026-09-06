import pytest
from pydantic import ValidationError
from app.mission.energy_model import EnergyModel
from app.models.mission import RoverParameters

def test_zero_distance_energy():
    """Verify 0 distance results in 0 Joules and 0 Wh."""
    model = EnergyModel()
    j, wh = model.calculate_step_energy(0.0, 0.0)
    assert j == 0.0
    assert wh == 0.0

def test_flat_terrain_energy_units():
    """Verify Joules / 3600 == Wh on flat terrain."""
    model = EnergyModel()
    dist_m = 100.0
    j, wh = model.calculate_step_energy(dist_m, slope_deg=0.0)
    
    assert j > 0.0
    assert pytest.approx(wh, rel=1e-5) == j / 3600.0

def test_uphill_vs_downhill_energy():
    """Verify uphill requires strictly more energy than flat and downhill."""
    model = EnergyModel()
    dist_m = 50.0
    
    j_flat, _ = model.calculate_step_energy(dist_m, slope_deg=0.0)
    j_uphill, _ = model.calculate_step_energy(dist_m, slope_deg=10.0)
    j_downhill, _ = model.calculate_step_energy(dist_m, slope_deg=-10.0)
    
    assert j_uphill > j_flat
    assert j_downhill <= j_flat

def test_invalid_parameters_raises_error():
    """Verify negative distance or invalid mass raises exception."""
    model = EnergyModel()
    with pytest.raises(ValueError, match="Distance cannot be negative"):
        model.calculate_step_energy(-10.0, 0.0)
        
    with pytest.raises((ValueError, ValidationError)):
        RoverParameters(mass_kg=-50.0)
