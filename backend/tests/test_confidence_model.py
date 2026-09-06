import pytest
import numpy as np
from app.scientific.confidence_model import ConfidenceModel

def test_confidence_calculation_normal():
    """Verify confidence grid calculation with matching 2D numpy inputs."""
    model = ConfidenceModel(resolution_m=78.125)
    
    layer1 = np.full((10, 10), 0.8, dtype=np.float32)
    layer2 = np.full((10, 10), 0.82, dtype=np.float32)
    layer3 = np.full((10, 10), 0.79, dtype=np.float32)
    
    conf_grid, mean_conf = model.calculate_confidence_grid([layer1, layer2, layer3])
    
    assert conf_grid.shape == (10, 10)
    assert np.all(conf_grid >= 0.0) and np.all(conf_grid <= 1.0)
    assert mean_conf > 0.5

def test_empty_sensor_grids_raises_error():
    """Verify passing empty list raises ValueError."""
    model = ConfidenceModel()
    with pytest.raises(ValueError, match="sensor_grids list cannot be empty"):
        model.calculate_confidence_grid([])

def test_mismatched_sensor_shapes_raises_error():
    """Verify shape mismatch raises ValueError."""
    model = ConfidenceModel()
    l1 = np.zeros((10, 10))
    l2 = np.zeros((10, 5))
    with pytest.raises(ValueError, match="mismatched shape"):
        model.calculate_confidence_grid([l1, l2])
