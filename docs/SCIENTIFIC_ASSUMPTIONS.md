# LUNA-X Scientific Assumptions & Mathematical Formulation

> **Important Scientific Disclosure**: LUNA-X distinguishes strictly between **established planetary science principles/observations** (from NASA LRO, ISRO Chandrayaan, and peer-reviewed literature) and **LUNA-X engineering heuristic models** developed for multi-criteria simulation, site ranking, and rover path planning.

---

## 1. Established Lunar Science Framework

### A. Surface Temperature & Thermal Stability of Water Ice (PSRs)
- **Scientific Foundation**: Peer-reviewed thermal modeling of lunar polar cold traps (e.g., Paige et al., 2010; Vasavada et al., 1999) establishes that subsurface water ice is thermally stable over geological timescales inside Permanently Shadowed Regions (PSRs) where maximum annual surface temperatures stay below approximately **$110 \text{ K}$** (or $\sim 100 \text{ K}$ for surface ice exposure).
- **Application in LUNA-X**: Temperature matrices derived from LRO Diviner thermal measurements (or simulated temperature grids calibrated to PSR boundaries) are evaluated against the $T_{max} \le 110 \text{ K}$ physical threshold.

### B. Circular Polarization Ratio (CPR) from Radar
- **Scientific Foundation**: Circular Polarization Ratio ($CPR = P_{same} / P_{opposite}$) measured by radar instruments like LRO Mini-RF and Chandrayaan-1 Mini-SAR indicates surface/subsurface scattering characteristics (Spudis et al., 2013). High CPR ($CPR > 1.0$) inside a PSR can indicate volumetric ice scattering, though high CPR outside PSRs often indicates surface rockiness/roughness (crater ejecta).
- **Application in LUNA-X**: CPR is evaluated in conjunction with PSR shadow boundaries to differentiate candidate ice-bearing regolith from rocky crater ejecta.

### C. Slope Calculation from Digital Elevation Models (DEM)
- **Scientific Foundation**: Standard geospatial gradient calculation using 2nd-order central finite differences on regularly spaced Digital Elevation Model (DEM) grids (e.g., LRO LOLA DEM):
  $$\theta = \arctan \left( \sqrt{\left(\frac{\partial Z}{\partial x}\right)^2 + \left(\frac{\partial Z}{\partial y}\right)^2} \right) \times \frac{180}{\pi}$$
- **Application in LUNA-X**: Topographic slope $\theta$ in degrees is directly derived from elevation grids.

---

## 2. LUNA-X Engineering Heuristic Models & Scoring Functions

*The following equations are LUNA-X specific multi-criteria decision and simulation models, designed for landing site ranking and pathfinding. They represent model estimates and relative scores, not physical constants.*

### A. Ice Likelihood Model Estimate ($L_{ice} \in [0, 1]$)
The Ice Likelihood Score is an engineering heuristic model combining weighted multi-evidence indicators:

$$L_{ice}(x,y) = w_{cpr} \cdot f_{cpr}(CPR) + w_{psr} \cdot f_{temp}(T_{max}) + w_{alb} \cdot f_{alb}(A_{FUV}) - w_{slope} \cdot f_{slope}(\theta)$$

**Heuristic Components**:
- $f_{temp}(T_{max}) = \max\left(0, 1 - \frac{T_{max} - 40}{110 - 40}\right)$ for $T_{max} \le 110\text{ K}$, otherwise $0$.
- $f_{cpr}(CPR) = \min\left(1.0, \frac{\max(0, CPR - 0.4)}{1.6 - 0.4}\right)$.
- $f_{alb}(A_{FUV}) = \min\left(1.0, \frac{\max(0, A_{FUV} - 0.2)}{0.5 - 0.2}\right)$.
- $f_{slope}(\theta) = \min\left(1.0, \frac{\theta}{30^\circ}\right)$ (slope penalizes long-term ice accumulation stability).

**Default Weights**: $w_{cpr} = 0.35, w_{psr} = 0.35, w_{alb} = 0.20, w_{slope} = 0.10$.

---

### B. Uncertainty & Prediction Confidence ($C_{ice} \in [0, 1]$)
Prediction confidence represents data quality and multi-sensor agreement across spatial grid cells:

$$C_{ice}(x,y) = Q_{coverage} \times \left(1 - \frac{\sigma_{sensors}}{\mu_{sensors} + \epsilon}\right) \times Q_{resolution}$$

- $Q_{coverage}$: Fraction of available sensor layers with non-null measurements at cell $(x, y)$.
- $\sigma / \mu$: Local spatial noise / coefficient of variation across overlapping observations.
- $Q_{resolution}$: Resolution factor normalized to DEM grid pixel size.

---

### C. Terrain Hazard Score ($H \in [0, 1]$)
Hazard index combining slope incline and micro-surface roughness ($S_r = \text{std. dev. of elevation in } 3 \times 3 \text{ neighborhood}$):

$$H(x,y) = \begin{cases} 
1.0 & \text{if } \theta > 20^\circ \text{ (Impassable Terrain Limit)} \\
0.6 \cdot \left(\frac{\theta}{20^\circ}\right) + 0.4 \cdot \min\left(1.0, \frac{S_r}{2.0\text{ m}}\right) & \text{otherwise}
\end{cases}$$

---

### D. Landing Site Composite Ranking Score ($S_{site} \in [0, 1]$)

Candidate landing zones are evaluated using a multi-attribute utility function:

$$S_{site} = w_1 \cdot L_{ice} + w_2 \cdot (1 - H) + w_3 \cdot I_{illum} + w_4 \cdot C_{earth}$$

**Parameters**:
- $L_{ice}$: Estimated ice likelihood.
- $H$: Terrain hazard score.
- $I_{illum}$: Solar illumination fraction (power generation potential).
- $C_{earth}$: Earth direct line-of-sight communication visibility fraction.
- **Default Weights**: $w_1 = 0.35, w_2 = 0.35, w_3 = 0.20, w_4 = 0.10$.

---

## 3. Demo Data Disclosure

All datasets in `data/demo/` are generated using **deterministic synthetic elevation and observation synthesis algorithms** calibrated against published LRO South Pole topographic parameters. All UI elements displaying these datasets MUST contain the explicit label:

`[DEMO / SIMULATION DATA MODE ACTIVE]`
