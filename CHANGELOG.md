# Changelog

All notable changes to the LUNA-X project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-09-05

### Added
- **Phase 5 End-to-End System Integration, Verification & Exhibition Polish Complete**:
  - Full end-to-end user workflow integration connecting Frontend 3D Twin <-> FastAPI REST Endpoints <-> Scientific Engine & Mission Pathfinder.
  - Added "Exhibition Mode Quick Actions" in Control Panel (`START DEMO MISSION` and `RESET DEMO`).
  - Added "WHY THIS SITE?" explainability drawer breaking down candidate selection factors (Ice, Safety, Solar, Comm).
  - Added "WHY THIS ROUTE?" explainability card in Telemetry HUD breaking down route factors (Distance, Energy, Peak Slope, Feasibility).
  - Data honesty disclosures: Prominent `[DEMO / SIMULATION DATA MODE]` badges across HUD and documentation.
  - Verified local AI graceful template fallback when Ollama is offline (`LOCAL AI: OFFLINE (TEMPLATES ACTIVE)`).
  - Comprehensive documentation finalization (`README.md`, `docs/RESULTS.md`, `docs/DEMO_SCRIPT.md`).
  - System verification: 47/47 backend pytest tests passing, 0 TypeScript errors, clean Vite production build.

## [0.5.0] - 2026-09-05

### Added
- **Phase 4 Frontend 3D Lunar Mission Twin & Control Room Complete**:
  - Built React 18 + Vite + TypeScript frontend structure in `frontend/`.
  - Implemented 3D WebGL scenes using React Three Fiber, Drei, and Three.js:
    - Interactive 3D Moon Globe (`MoonGlobe.tsx`).
    - 3D Regional South Pole Heightfield Terrain (`SouthPoleTerrain.tsx`) with dynamic 2D canvas texture overlays for Ice Likelihood, Confidence, Hazard, and Slope layers.
    - 3D Ranked Landing Site Pin markers (`LandingSiteMarkers.tsx`).
    - 3D Rover mesh with glowing path route line (`RoverTraverse.tsx`).
  - Implemented futuristic Mission Control HUD overlay components:
    - `HeaderHUD.tsx`: View tab switcher, version badge, data mode disclosure, and AI status.
    - `LayerLegendHUD.tsx`: Toggleable heatmap overlays with quantitative color gradient legends.
    - `ControlPanelHUD.tsx`: Ranked candidate site selector, candidate comparison panel, and mission planner parameters.
    - `TelemetryHUD.tsx`: Real-time rover telemetry gauges (battery %, distance, energy, max slope, avg risk) and traversal controls (`Play`, `Pause`, `Reset`, `1x/2x/5x Speed`).
    - `EventControlHUD.tsx`: Simulated mission events (`Inject Rock Collapse`, `Battery Drop`, `Hazard Spike`) calling backend `/api/v1/mission/{id}/events`.
    - `AIWidgetHUD.tsx`: Local AI natural language assistant prompt box with Ollama status.
    - `AnalyticsModal.tsx`: Post-simulation analytics report with Recharts area graphs.
    - `NotificationHUD.tsx`: Dynamic event notification banner.
  - Implemented typed API client (`services/api.ts`) connecting to FastAPI endpoints.
  - Implemented Zustand state stores (`useUIStore`, `useTerrainStore`, `useMissionStore`).

## [0.4.0] - 2026-09-05

### Added
- **Phase 3 REST API & Optional Local AI Layer Complete**:
  - Implemented FastAPI application and versioned REST endpoints (`/api/v1/`).

## [0.3.0] - 2026-09-05

### Added
- **Phase 2 Mission Engine & Pathfinding Complete**:
  - Implemented `RoverPathfinder`, `EnergyModel`, and `DynamicReplanner`.

## [0.2.0] - 2026-09-05

### Added
- **Phase 1 Scientific Engine Core Complete**:
  - Implemented `IceLikelihoodModel`, `ConfidenceModel`, `TerrainAnalyzer`, and `LandingSiteOptimizer`.

## [0.1.0] - 2026-09-05

### Added
- **Phase 0 Architecture Complete**:
  - Full system architecture document (`docs/ARCHITECTURE.md`).
