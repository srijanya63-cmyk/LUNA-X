import os
import json
import numpy as np

def generate_demo_dataset(output_dir: str, grid_size: int = 128, seed: int = 42):
    """
    Generates deterministic synthetic lunar South Pole observation matrices
    representing a $128 x 128$ spatial grid around Shackleton Crater region.
    All data produced is explicitly marked as DEMO / SIMULATION DATA.
    """
    np.random.seed(seed)
    os.makedirs(output_dir, exist_ok=True)

    # Spatial coordinates (meters relative to grid center)
    x = np.linspace(-5000, 5000, grid_size)
    y = np.linspace(-5000, 5000, grid_size)
    xx, yy = np.meshgrid(x, y)
    r = np.sqrt(xx**2 + yy**2)

    # 1. Digital Elevation Model (DEM in meters)
    # Synthetic Shackleton-like crater: radius ~2500m, depth ~800m, rim height ~200m
    crater_radius = 2500.0
    rim_width = 800.0
    
    # Base undulating terrain
    base_elevation = 100.0 * np.sin(xx / 1200.0) * np.cos(yy / 1200.0) + 50.0 * np.sin(xx / 400.0)
    
    # Crater bowl profile using smooth sigmoid/gaussian profile
    crater_depth = 800.0
    bowl_mask = r < crater_radius
    bowl_profile = -crater_depth * (1.0 - (r / crater_radius)**2)
    bowl_profile[~bowl_mask] = 0.0
    
    # Crater rim profile
    rim_mask = (r >= crater_radius) & (r < crater_radius + rim_width)
    rim_profile = 200.0 * np.exp(-((r - crater_radius) / (rim_width / 2.0))**2)
    rim_profile[~rim_mask] = 0.0
    
    dem = base_elevation + bowl_profile + rim_profile
    # Add minor micro-roughness
    noise = np.random.normal(0.0, 1.5, size=(grid_size, grid_size))
    dem += noise

    # 2. Maximum Annual Surface Temperature Grid (Kelvin)
    # Inside crater bowl (r < 2000m): Permanently Shadowed Region (PSR) with T_max ~ 40K - 90K
    # Outside crater bowl: solar illuminated during lunar day with T_max ~ 180K - 240K
    temp = np.zeros((grid_size, grid_size))
    psr_mask = r < 1800.0
    temp[psr_mask] = 50.0 + 35.0 * (r[psr_mask] / 1800.0)**2 + np.random.uniform(-3, 3, size=np.sum(psr_mask))
    temp[~psr_mask] = 190.0 + 40.0 * np.sin(r[~psr_mask] / 1000.0) + np.random.uniform(-5, 5, size=np.sum(~psr_mask))

    # 3. Mini-RF Radar Circular Polarization Ratio (CPR) Proxy
    # Elevated CPR inside PSR (0.9 - 1.4) indicating potential ice/rough scattering
    # Background CPR (0.2 - 0.6)
    cpr = np.zeros((grid_size, grid_size))
    cpr[psr_mask] = 0.95 + 0.3 * (1.0 - r[psr_mask] / 1800.0) + np.random.uniform(-0.1, 0.1, size=np.sum(psr_mask))
    cpr[~psr_mask] = 0.4 + 0.2 * np.random.uniform(0, 1, size=np.sum(~psr_mask))
    cpr = np.clip(cpr, 0.1, 2.0)

    # 4. LAMP Far-Ultraviolet (FUV) Albedo Proxy
    fuv_albedo = np.zeros((grid_size, grid_size))
    fuv_albedo[psr_mask] = 0.38 + 0.08 * (1.0 - r[psr_mask] / 1800.0) + np.random.uniform(-0.02, 0.02, size=np.sum(psr_mask))
    fuv_albedo[~psr_mask] = 0.22 + 0.04 * np.random.uniform(0, 1, size=np.sum(~psr_mask))
    fuv_albedo = np.clip(fuv_albedo, 0.1, 0.6)

    # 5. Solar Illumination Fraction Proxy (0.0 to 1.0)
    # Crater rims have high annual illumination (~0.7 - 0.9); PSR interior has 0.0 illumination
    illumination = np.zeros((grid_size, grid_size))
    illumination[rim_mask] = 0.75 + np.random.uniform(0.0, 0.15, size=np.sum(rim_mask))
    illumination[~rim_mask & ~psr_mask] = 0.40 + np.random.uniform(-0.1, 0.1, size=np.sum(~rim_mask & ~psr_mask))
    illumination[psr_mask] = 0.0
    illumination = np.clip(illumination, 0.0, 1.0)

    # 6. Earth Line-of-Sight Visibility Proxy (0.0 to 1.0)
    earth_comm = np.zeros((grid_size, grid_size))
    earth_comm[rim_mask] = 0.85 + np.random.uniform(-0.05, 0.1, size=np.sum(rim_mask))
    earth_comm[~rim_mask] = 0.50 + np.random.uniform(-0.15, 0.15, size=np.sum(~rim_mask))
    earth_comm[psr_mask] = 0.10
    earth_comm = np.clip(earth_comm, 0.0, 1.0)

    # Save array binary files (.npy)
    np.save(os.path.join(output_dir, "dem_south_pole.npy"), dem.astype(np.float32))
    np.save(os.path.join(output_dir, "cpr_south_pole.npy"), cpr.astype(np.float32))
    np.save(os.path.join(output_dir, "temp_south_pole.npy"), temp.astype(np.float32))
    np.save(os.path.join(output_dir, "fuv_albedo_south_pole.npy"), fuv_albedo.astype(np.float32))
    np.save(os.path.join(output_dir, "illumination_south_pole.npy"), illumination.astype(np.float32))
    np.save(os.path.join(output_dir, "earth_comm_south_pole.npy"), earth_comm.astype(np.float32))

    # Candidate Landing Sites Metadata JSON
    candidate_sites = [
        {
            "id": "site-alpha",
            "name": "Shackleton Rim Ridge Alpha",
            "grid_x": 88,
            "grid_y": 64,
            "lat": -89.85,
            "lon": 120.4,
            "elevation_m": float(dem[88, 64]),
            "description": "High illumination ridge along North Shackleton Rim. Excellent communications and solar access with safe approach slopes.",
            "data_type": "DEMO / SIMULATION DATA"
        },
        {
            "id": "site-beta",
            "name": "Connecting Ridge Plateau Beta",
            "grid_x": 42,
            "grid_y": 90,
            "lat": -89.72,
            "lon": 45.2,
            "elevation_m": float(dem[42, 90]),
            "description": "Smooth plateau near crater connecting ridge. Moderate slope with direct access to PSR sampling zones.",
            "data_type": "DEMO / SIMULATION DATA"
        },
        {
            "id": "site-gamma",
            "name": "Outer Ejecta Plain Gamma",
            "grid_x": 20,
            "grid_y": 20,
            "lat": -89.50,
            "lon": -110.1,
            "elevation_m": float(dem[20, 20]),
            "description": "Ultra-safe flat landing plain outside crater ejecta blanket. Long rover traverse required to reach primary PSR targets.",
            "data_type": "DEMO / SIMULATION DATA"
        }
    ]

    with open(os.path.join(output_dir, "candidate_sites.json"), "w") as f:
        json.dump(candidate_sites, f, indent=2)

    # Dataset Metadata JSON
    metadata = {
        "dataset_name": "LUNA-X South Pole Shackleton Demo Grid",
        "mode": "DEMO / SIMULATION DATA MODE",
        "is_synthetic": True,
        "grid_shape": [grid_size, grid_size],
        "pixel_resolution_m": 78.125,
        "bounding_box_meters": {
            "x_min": -5000.0,
            "x_max": 5000.0,
            "y_min": -5000.0,
            "y_max": 5000.0
        },
        "target_crater": "Shackleton Crater Region (-89.9°S, 0.0°E)",
        "reference_frame": "Polar Stereographic",
        "created_with_seed": seed,
        "layers": [
            "dem_south_pole.npy",
            "cpr_south_pole.npy",
            "temp_south_pole.npy",
            "fuv_albedo_south_pole.npy",
            "illumination_south_pole.npy",
            "earth_comm_south_pole.npy"
        ]
    }

    with open(os.path.join(output_dir, "metadata.json"), "w") as f:
        json.dump(metadata, f, indent=2)

    print(f"[LUNA-X] Demo dataset generated successfully in '{output_dir}' (Shape: {grid_size}x{grid_size})")

if __name__ == "__main__":
    generate_demo_dataset("data/demo", grid_size=128, seed=42)
