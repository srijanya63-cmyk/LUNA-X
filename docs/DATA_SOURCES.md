# LUNA-X Data Sources & Preprocessing Specification

## 1. Scientific Data Strategy

LUNA-X adheres strictly to **Data Honesty**:
1. Real public lunar datasets are referenced and used where available.
2. Synthetic / Demo Data Mode is clearly labelled in the UI whenever synthetic elevation matrices or simulated observations are active.
3. No claims of "proven ice discovery" are made; output is presented as **Ice Likelihood** and **Model Estimates**.

---

## 2. Public Lunar Datasets Catalog

| Dataset Name | Primary Source / Instrument | Resolution | Coordinate System | Usage in LUNA-X |
| :--- | :--- | :--- | :--- | :--- |
| **LOLA DEM** | NASA LRO (Lunar Orbiter Laser Altimeter) | 20m - 60m / pixel | Polar Stereographic (South Pole) | Micro-elevation, slope calculation, surface roughness matrix. |
| **LRO Mini-RF** | NASA LRO (Miniature Radio Frequency Radar) | 30m / pixel | Polar Stereographic | Circular Polarization Ratio (CPR) for radar subsurface ice indicator. |
| **LRO LAMP** | NASA LRO (Lyman Alpha Mapping Project) | 100m / pixel | Polar Stereographic | Far-ultraviolet albedo for water ice detection in Permanently Shadowed Regions (PSRs). |
| **M3 Reflection** | ISRO Chandrayaan-1 ($M^3$ Mineralogy Mapper) | 140m / pixel | Global / Regional | Spectral absorption feature at 1.25 µm, 1.5 µm, and 2.0 µm for surface ice absorption. |
| **KAGUYA LALT** | JAXA SELENE (KAGUYA Laser Altimeter) | 100m / pixel | Lunar South Pole Grid | Global macro-elevation validation and terrain roughness cross-checking. |

---

## 3. Demo / Simulation Data Mode

During development and offline showcase demonstrations, LUNA-X operates in **Demo Data Mode**.

### Included Demo Datasets (`data/demo/`):
- `dem_south_pole.npy`: $128 \times 128$ normalized float matrix representing the terrain surrounding **Shackleton Crater** ($89.9^\circ \text{S}, 0.0^\circ \text{E}$).
- `ice_likelihood_sample.npy`: Synthetic multi-criteria ice likelihood values ($0.0 - 1.0$) calibrated against LRO PSR thermal threshold models ($< 110 \text{ K}$).
- `candidate_sites.json`: Pre-computed candidate landing points with detailed attributes (latitude, longitude, slope, ice score, illumination index).

---

## 4. Preprocessing Pipeline

```
Raw GeoTIFF / NetCDF
       ↓
Spatial Cropping (Bounding Box: 88.0°S to 90.0°S)
       ↓
Re-projection to Polar Stereographic Grid (60m resolution)
       ↓
Nan & Data Gap Imputation (Bilinear Interpolation)
       ↓
Normalisation & Export to NumPy (.npy) / GeoJSON
```
