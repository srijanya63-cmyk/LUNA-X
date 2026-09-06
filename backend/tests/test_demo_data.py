import os
import json
import numpy as np
import pytest

DEMO_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "data", "demo")

def test_demo_files_exist():
    """Verify all required demo datasets exist in data/demo/."""
    required_files = [
        "dem_south_pole.npy",
        "cpr_south_pole.npy",
        "temp_south_pole.npy",
        "fuv_albedo_south_pole.npy",
        "illumination_south_pole.npy",
        "earth_comm_south_pole.npy",
        "candidate_sites.json",
        "metadata.json"
    ]
    for filename in required_files:
        filepath = os.path.join(DEMO_DIR, filename)
        assert os.path.exists(filepath), f"Missing demo dataset file: {filename}"

def test_demo_grid_shapes_and_values():
    """Verify demo numpy arrays have identical 128x128 shape and no NaNs."""
    dem = np.load(os.path.join(DEMO_DIR, "dem_south_pole.npy"))
    cpr = np.load(os.path.join(DEMO_DIR, "cpr_south_pole.npy"))
    temp = np.load(os.path.join(DEMO_DIR, "temp_south_pole.npy"))
    
    assert dem.shape == (128, 128)
    assert cpr.shape == (128, 128)
    assert temp.shape == (128, 128)
    
    assert not np.isnan(dem).any()
    assert not np.isnan(cpr).any()
    assert not np.isnan(temp).any()

def test_demo_metadata():
    """Verify demo metadata contains explicit DEMO disclosure."""
    with open(os.path.join(DEMO_DIR, "metadata.json"), "r") as f:
        meta = json.load(f)
    
    assert meta["is_synthetic"] is True
    assert "DEMO / SIMULATION DATA MODE" in meta["mode"]
    assert meta["grid_shape"] == [128, 128]
