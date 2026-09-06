# LUNA-X — VIVA QUESTIONS & ANSWERS (30 EXAM PREPARATION QUESTIONS)

This document contains 30 likely technical questions and concise answers for viva voce examinations, project defenses, and academic presentations.

---

### Project Motivation & Context

#### Q1: What is the core problem addressed by LUNA-X?
**Answer**: LUNA-X addresses the problem of lunar South Pole landing-site selection, ice characterization, and safe rover traverse pathfinding under harsh terrain hazards, extreme shadows, cryogenic temperatures, and limited energy budgets.

#### Q2: Why is the lunar South Pole of significant scientific interest?
**Answer**: Permanently Shadowed Regions (PSRs) at the lunar South Pole maintain temperatures below $110\text{K}$, acting as cold traps that can preserve volatile water ice over geological timescales. Water ice is crucial for in-situ resource utilization (ISRU) for life support and rocket fuel.

#### Q3: Is LUNA-X an official ISRO system?
**Answer**: No. LUNA-X is an independent academic software simulation inspired by lunar science (NASA LRO, ISRO Chandrayaan missions). It operates in **DEMO / SIMULATION DATA MODE**.

---

### AI / ML & Scientific Intelligence

#### Q4: How is Ice Likelihood calculated in LUNA-X?
**Answer**: Via a multi-criteria spatial overlay equation combining normalized thermal stability ($T_{max} \le 110\text{K}$), Mini-RF radar Circular Polarization Ratio (CPR), LAMP Far-Ultraviolet albedo, and a topographic slope mass wasting penalty:
$$L_{ice} = w_{psr} f(T) + w_{cpr} f(CPR) + w_{alb} f(FUV) - w_{slope} f(\theta)$$

#### Q5: What scientific basis supports the 110 Kelvin temperature threshold?
**Answer**: According to Paige et al. (2010) (LRO Diviner Lunar Radiometer experiment), water ice sublimates rapidly into vacuum at temperatures above $110\text{K}$. Below $110\text{K}$, ice can remain stable for billions of years.

#### Q6: What does high CPR in Mini-RF radar data indicate?
**Answer**: Circular Polarization Ratio (CPR) $> 1.0$ inside crater PSRs indicates volumetric coherent backscattering consistent with subsurface ice deposits rather than surface rocks.

#### Q7: What is the purpose of the Confidence Model?
**Answer**: It quantifies spatial observation quality and data reliability by combining spatial sensor coverage, signal-to-noise ratio (SNR), and multi-sensor spatial overlap into a single matrix $[0.0, 1.0]$.

#### Q8: Does LUNA-X claim to have proven the existence of lunar ice?
**Answer**: No. All outputs represent heuristic model estimates and multi-criteria predictions. Physical confirmation requires robotic core sampling.

---

### Terrain & Landing Site Optimization

#### Q9: How is terrain slope calculated from the Digital Elevation Model?
**Answer**: We compute spatial elevation gradients $S_x, S_y$ across the 2D grid using a 3x3 Sobel operator, deriving slope angle as $\theta = \arctan(\sqrt{S_x^2 + S_y^2})$.

#### Q10: How does the Hazard Index model work?
**Answer**: It converts terrain slope, surface roughness, and crater rim proximity into a normalized hazard index $H \in [0.0, 1.0]$ using a non-linear logistic sigmoid function.

#### Q11: How are landing sites candidate ranked?
**Answer**: Using a multi-objective composite score:
$$S_{composite} = 0.35 S_{ice} + 0.25 S_{safety} + 0.20 S_{illum} + 0.20 S_{comm}$$
balancing ice potential, flat landing safety, solar illumination, and Earth line-of-sight communication.

---

### Pathfinding & Mission Engine

#### Q12: What algorithm is used for rover pathfinding?
**Answer**: A 3D Weighted Surface Grid A* Search algorithm operating on an 8-neighbor grid.

#### Q13: What is the cost function for A* in LUNA-X?
**Answer**: 
$$c(u, v) = d_{3D}(u, v) + w_{slope} \cdot \max(0, \Delta z) + w_{risk} \cdot \left(\frac{H(v)}{1.01 - H(v)}\right) \cdot 25.0$$

#### Q14: How does LUNA-X prevent rovers from entering dangerous craters?
**Answer**: The hazard penalty term $\frac{H}{1.01 - H}$ creates an asymptotic non-linear wall cost as $H \to 1.0$. Additionally, nodes exceeding `max_allowed_hazard` or `max_allowed_slope_deg` are hard-blocked during node expansion.

#### Q15: Why might a geometrically longer route be chosen over a shorter one?
**Answer**: If the shorter route crosses a high-hazard slope or steep crater rim, the hazard penalty and slope climb costs make its total path cost significantly higher than a flat detour.

#### Q16: How is rover energy consumption calculated?
**Answer**: `EnergyModel` calculates rolling resistance power ($P_{roll} = \mu_r m g v \cos\theta$), slope climb power ($P_{slope} = m g v \sin\theta$), mechanical efficiency ($\eta = 0.75$), and base hotel power ($P_{base} = 40\text{W}$). Energy is integrated over time/distance in Watt-hours ($1\text{ Wh} = 3600\text{ J}$).

#### Q17: How does Dynamic Replanning work?
**Answer**: When a route blockage occurs, the affected node is invalidated, and `DynamicReplanner` executes an instant A* search from the rover's active position node to the destination, updating the path line live.

---

### Software Architecture & Web Tech

#### Q18: What is the overall tech stack of LUNA-X?
**Answer**: Backend: Python 3.10+, FastAPI, NumPy, SciPy, Pydantic. Frontend: React 18, Vite, Three.js, React Three Fiber (R3F), Tailwind CSS, Zustand, Recharts.

#### Q19: Why use FastAPI for the backend?
**Answer**: FastAPI provides ultra-low latency ($< 25\text{ms}$), automatic Pydantic input validation, asynchronous execution, and OpenAPI schema generation.

#### Q20: How are scientific calculations separated from the frontend UI?
**Answer**: The frontend performs zero scientific or pathfinding calculations. It only fetches JSON responses from FastAPI endpoints and handles 3D WebGL rendering and state presentation.

#### Q21: What is the role of React Three Fiber (R3F)?
**Answer**: R3F brings declarative React component structure to Three.js WebGL scenes, enabling seamless state synchronization between Three.js meshes (`MoonGlobe`, `SouthPoleTerrain`) and Zustand HUD stores.

#### Q22: How are scientific heatmaps rendered on the 3D terrain mesh?
**Answer**: We generate dynamic 2D canvas textures off-screen based on raw NumPy array responses, updating the Three.js material map when active layer toggles or slider weights change.

---

### Local AI & Ollama Integration

#### Q23: Is an external LLM API (like OpenAI or Gemini) required for LUNA-X?
**Answer**: No. LUNA-X contains zero external API key requirements. It operates 100% locally.

#### Q24: What happens if the local Ollama LLM is offline?
**Answer**: The backend automatically detects Ollama's absence or timeout (3.0s) and switches to a deterministic template-based intent parser and explanation engine without throwing errors.

#### Q25: Can the local AI alter scientific calculations or pathfinding costs?
**Answer**: No. The AI layer only interprets natural language text into structured `MissionConfig` parameters, which are validated by Pydantic before being processed by the scientific/mission engine.

---

### Verification & Testing

#### Q26: How was the backend verified?
**Answer**: Via Pytest test suite covering 47 unit and integration tests (100% pass rate in 13.92s).

#### Q27: How was the frontend verified?
**Answer**: Via `npx tsc --noEmit` (0 TypeScript errors) and Vite production bundle build (`npm run build`).

---

### Limitations & Future Work

#### Q28: What are the primary technical limitations of LUNA-X?
**Answer**: 
1. DEM resolution is currently capped at $128 \times 128$ grid (10m/pixel) in DEMO MODE.
2. Ice likelihood indices are model predictions requiring physical core drill samples for verification.

#### Q29: What is the purpose of Exhibition Mode and Demo Reset?
**Answer**: Single-click `DEMO MISSION` and `RESET DEMO` buttons ensure that live 3-5 minute demonstrations are 100% reliable and reproducible without residual state artifacts.

#### Q30: What would be the next step for real mission deployment?
**Answer**: Integrating 1m/pixel high-resolution LOLA DEM tiles, incorporating ROS 2 (Robot Operating System) navigation nodes, and running hardware-in-the-loop rover chassis testing.
