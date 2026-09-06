import pytest
import numpy as np
from app.scientific.terrain_analysis import TerrainAnalyzer

def test_flat_dem_slope_zero():
    """Verify perfectly flat DEM produces 0 degrees slope."""
    analyzer = TerrainAnalyzer()
    flat_dem = np.full((10, 10), 100.0, dtype=np.float32)
    slope = analyzer.calculate_slope(flat_dem, resolution_m=10.0)
    
    assert np.allclose(slope, 0.0, atol=1e-4)

def test_inclined_dem_slope():
    """Verify known slope incline calculation."""
    analyzer = TerrainAnalyzer()
    # 45 degree incline: dz = dx
    x = np.linspace(0, 90, 10)
    dem, _ = np.meshgrid(x, x)
    slope = analyzer.calculate_slope(dem, resolution_m=10.0)
    
    # Interior slope should be ~45 degrees
    interior = slope[1:-1, 1:-1]
    assert np.allclose(interior, 45.0, atol=1.0)

def test_hazard_cutoff_limit():
    """Verify slope >= 20 deg forces hazard score to 1.0 (impassable)."""
    analyzer = TerrainAnalyzer()
    slope = np.array([[5.0, 10.0, 20.0, 25.0]], dtype=np.float32)
    roughness = np.array([[0.1, 0.2, 0.1, 0.1]], dtype=np.float32)
    
    hazard, trav = analyzer.calculate_hazard_map(slope, roughness)
    
    assert hazard[0, 0] < 0.5
    assert hazard[0, 2] == 1.0
    assert hazard[0, 3] == 1.0
    assert trav[0, 3] == 0.0

def test_invalid_dem_dimensions_raises():
    """Verify non 2D or small DEM raises ValueError."""
    analyzer = TerrainAnalyzer()
    with pytest.raises(ValueError):
        analyzer.calculate_slope(np.array([100.0, 200.0]))
