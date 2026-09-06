# LUNA-X — PROJECT CHEAT SHEET & QUICK REFERENCE

This document provides concise, technically accurate answers to 25 core questions about LUNA-X for quick reference, demonstration prep, and viva examinations.

---

### 1. What is LUNA-X?
LUNA-X is an AI/ML-powered lunar mission planning and simulation platform designed to evaluate subsurface water ice likelihood in the Moon's South Polar region, select candidate landing zones, and simulate autonomous rover route navigation in a 3D digital mission twin.

### 2. What problem does it solve?
It addresses the fundamental lunar mission decision problem: *"Where should a lunar South Pole rover land, what scientific targets should it explore, and how can it navigate there safely without depleting battery energy or trapped in hazard craters?"*

### 3. Why is it useful?
It provides an integrated, end-to-end mission intelligence workflow combining orbital remote sensing data processing, multi-criteria spatial decision optimization, graph-based 3D pathfinding, and interactive 3D digital twin visualization.

### 4. What is the input to LUNA-X?
Input consists of multi-spectral lunar orbital datasets: Digital Elevation Models (LOLA DEM), maximum temperature maps (Diviner thermal stability $< 110\text{K}$), Mini-RF Circular Polarization Ratio (CPR) radar grids, and LAMP Far-Ultraviolet albedo proxies.

### 5. What is the output of LUNA-X?
Outputs include spatial Ice Likelihood grids $[0.0, 1.0]$, Model Confidence grids, top ranked landing candidate zones, 3D A* surface traverse routes, estimated energy consumption (Wh), telemetry profiles, and real-time dynamic reroutes.

### 6. Where does AI/ML fit into LUNA-X?
AI/ML is used in two ways:
1. **Deterministic Scientific Intelligence**: Multi-criteria spatial overlay optimization and non-linear hazard heuristic scoring.
2. **Local Natural Language Layer**: Optional local Ollama LLM (`llama3`) for natural language mission control query interpretation and briefing generation with offline template fallback.

### 7. How is Ice Likelihood calculated?
$$L_{ice} = w_{psr} f(T_{max}) + w_{cpr} f(CPR) + w_{alb} f(FUV) - w_{slope} f(\theta)$$
where $f(T_{max})$ evaluates thermal stability ($T \le 110\text{K}$), $f(CPR)$ evaluates radar scattering, $f(FUV)$ evaluates frost albedo, and $f(\theta)$ penalizes mass wasting on steep slopes.

### 8. What is Model Confidence?
Model Confidence $[0.0, 1.0]$ measures signal reliability and data availability by combining spatial coverage density, sensor noise variance, and multi-spectral observation overlap.

### 9. How is terrain hazard calculated?
Terrain slope $\theta$ is derived using a 3x3 Sobel gradient operator ($S_x, S_y$). Total hazard $H \in [0.0, 1.0]$ combines slope steepness, surface roughness, and crater rim proximity via a logistic sigmoid curve.

### 10. How are landing sites ranked?
Landing site candidates are ranked via a composite multi-criteria index:
$$S_{composite} = 0.35 S_{ice} + 0.25 S_{safety} + 0.20 S_{illum} + 0.20 S_{comm}$$
balancing ice potential, flat terrain safety, solar power illumination, and direct Earth line-of-sight communication.

### 11. How does Weighted 3D A* work here?
It searches an 8-neighbor 3D surface grid evaluating step distance $d_{3D}$, uphill elevation climb penalties $\max(0, \Delta z)$, and a non-linear hazard wall cost $c_{risk} = \left(\frac{H}{1.01-H}\right) \times 25.0 \times w_{risk}$.

### 12. How is rover energy estimated?
Total energy is calculated using physical rolling resistance ($\mu_r=0.08$), slope gravitational work ($m g \sin\theta$), mechanical efficiency ($\eta=0.75$), and base hotel power ($P_{base}=40\text{W}$) over distance and speed ($v=0.1\text{m/s}$). Unit: Watt-hours ($1\text{ Wh} = 3600\text{ J}$).

### 13. How does dynamic replanning work?
When an obstacle or route blockage event occurs, the active path node is invalidated, and the `DynamicReplanner` executes an instant A* search from the rover's current coordinates to the target site, updating the green 3D path line in real time.

### 14. Why Three.js and React Three Fiber (R3F)?
R3F provides declarative 3D WebGL rendering inside React, allowing seamless state synchronization between Three.js scene meshes (`MoonGlobe`, `SouthPoleTerrain`, `RoverTraverse`) and Zustand UI HUD stores.

### 15. Why React?
React 18 provides component-driven HUD layout, fast virtual DOM reconciliation, and seamless integration with Tailwind CSS and Recharts data visualization.

### 16. Why FastAPI?
FastAPI delivers asynchronous Python REST endpoints with automatic OpenAPI documentation, Pydantic data validation, and ultra-low latency ($< 25\text{ms}$) execution for NumPy scientific calculations.

### 17. Why Python for the backend?
Python is the standard language for scientific computing, providing high-performance array operations via NumPy and SciPy.

### 18. Why Ollama?
Ollama provides local execution of open-source LLMs (`llama3`, `mistral`) on the user's standard hardware without transmitting data to cloud servers or requiring API subscriptions.

### 19. Why no Gemini or OpenAI API?
To maintain 100% offline autonomy, zero external key dependencies, zero cloud API costs, and total data privacy during mission execution.

### 20. What happens if Ollama is unavailable?
The backend automatically detects daemon absence or connection timeout (3.0s) and falls back seamlessly to a deterministic template-based intent parser and explanation engine without throwing runtime errors.

### 21. What data is being used?
The application currently operates on synthetic $128 \times 128$ grid datasets modeled after Shackleton Crater topography and LRO sensor characteristics.

### 22. Is the lunar data real or simulated?
It uses synthetic/simulation data built from realistic physical ranges and peer-reviewed lunar South Pole literature parameters. All UI elements prominently display `[DEMO / SIMULATION DATA MODE]`.

### 23. What are the scientific limitations?
Model outputs represent heuristic likelihood estimates and multi-criteria predictions. Physical verification requires ground-truth robotic core sampling.

### 24. What is unique about LUNA-X?
LUNA-X bridges the gap between planetary orbital data analysis, multi-objective spatial landing optimization, energy- and hazard-aware 3D pathfinding, dynamic event replanning, and interactive 3D digital mission twin visualization in a single unified architecture.

### 25. What would be required to make it closer to a real mission system?
Incorporate high-resolution 1m/pixel LOLA DEM tiles, sub-surface thermal conductivity models, real-time kinematic wheel slip estimation, and hardware-in-the-loop ROS 2 (Robot Operating System) navigation nodes.
