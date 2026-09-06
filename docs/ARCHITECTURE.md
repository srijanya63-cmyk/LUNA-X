# LUNA-X System Architecture Document

## 1. System Vision & High-Level Architecture

LUNA-X is a decoupled, modular AI/ML lunar mission intelligence platform and 3D digital mission twin simulator. 

The central architectural directive is strict separation between:
1. **The Scientific & Mission Intelligence Engine**: 100% deterministic algorithms, physics models, classical ML, and graph optimization.
2. **The FastAPI Application & Integration Layer**: Versioned REST API (`/api/v1/`) connecting scientific engines to frontend services.
3. **The 3D Digital Mission Twin Frontend**: WebGL-accelerated interactive 3D environment and mission control HUD.
4. **The Natural Language AI Layer**: Optional local LLM service (Ollama) used strictly for user query translation and decision explanation.

```
+-----------------------------------------------------------------------------------+
|                                  FRONTEND LAYER                                   |
|   React 18 + TypeScript + Vite + Three.js / React Three Fiber + Zustand + Recharts  |
|                                                                                   |
|  +------------------------+  +--------------------------+  +-------------------+  |
|  | Global Lunar Scene     |  | South Pole Regional Grid |  | Telemetry & HUD   |  |
|  | - 3D Globe View        |  | - Ice Heatmap Overlay    |  | - Mission Params  |  |
|  | - Camera Transition    |  | - Hazard Map Overlay     |  | - Energy Gauges   |  |
|  | - Coordinate Raycast   |  | - Rover Traverse Path    |  | - Event Controls  |  |
|  +------------------------+  +--------------------------+  +-------------------+  |
+-----------------------------------------+-----------------------------------------+
                                          | REST API (JSON / NumPy arrays)
                                          v
+-----------------------------------------------------------------------------------+
|                            FASTAPI APPLICATION LAYER                              |
|                          Python 3.10+ / FastAPI / Pydantic                        |
|                                                                                   |
|  +-----------------------------------------------------------------------------+  |
|  |                         API ROUTES (/api/v1/)                               |  |
|  |  GET /health    GET /terrain    GET/POST /intelligence    POST /mission       |  |
|  +-----------------------------------------------------------------------------+  |
|                                         │
|                                         ▼
|  +-----------------------------------------------------------------------------+  |
|  |                           APPLICATION SERVICE LAYER                         |  |
|  |  - TerrainService    - IntelligenceService    - MissionService (Store)       |  |
|  +-----------------------------------------------------------------------------+  |
|                                         │
|                                         ▼
|  +-----------------------------------------------------------------------------+  |
|  |                    SCIENTIFIC & MISSION ENGINE CORE                         |  |
|  |  +-------------------+  +-------------------+  +-------------------------+  |  |
|  |  | Ice Likelihood    |  | Confidence Engine |  | Terrain & Hazards       |  |  |
|  |  +-------------------+  +-------------------+  +-------------------------+  |  |
|  |  | Site Selection    |  | Rover Pathfinding |  | Dynamic Replanner       |  |  |
|  |  +-------------------+  +-------------------+  +-------------------------+  |  |
|  +-----------------------------------------------------------------------------+  |
|                                                                                   |
|  +-----------------------------------------------------------------------------+  |
|  |                         OPTIONAL LOCAL AI LAYER                             |  |
|  |  - OllamaClient (Local HTTP: http://localhost:11434)                       |  |  |
|  |  - IntentParser (Natural Language -> Mission Config JSON)                   |  |  |
|  |  - Briefing Generator (Technical Briefings -> Template Fallback)           |  |  |
|  +-----------------------------------------------------------------------------+  |
+-----------------------------------------+-----------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                                 DATA STORAGE LAYER                                |
|  - Demo Mode: Pre-computed LOLA DEM & Mini-RF grid (.npy, .json)                   |
|  - Production Mode: GeoTIFF & NetCDF processed lunar grids                          |
+-----------------------------------------------------------------------------------+
```

---

## 2. API Endpoints Catalog (`/api/v1/`)

- `GET /health` / `GET /api/v1/health`: System readiness check.
- `GET /api/v1/terrain`: Terrain metadata, bounds, elevation, and slope ranges.
- `GET /api/v1/intelligence/ice-likelihood`: Multi-criteria ice likelihood and confidence summaries.
- `POST /api/v1/intelligence/landing-sites`: Candidate landing site ranking.
- `POST /api/v1/mission/plan`: Route generation using 3D A* search.
- `GET /api/v1/mission/{mission_id}`: Active mission state retrieval.
- `POST /api/v1/mission/{mission_id}/events`: Simulated event injection and dynamic rerouting.
- `POST /api/v1/mission/replan`: Direct rerouting execution.
- `GET /api/v1/ai/status`: Local Ollama AI readiness status.
- `POST /api/v1/ai/parse-intent`: Natural language prompt parsing.
- `POST /api/v1/ai/explain`: Mission summary briefing generator.
