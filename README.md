# LUNA-X — AI-Powered Lunar Ice Intelligence & Autonomous Rover Mission Simulator

> **Disclaimer**: LUNA-X is an independent academic software platform designed for lunar exploration simulation, landing-site selection, ice characterization, and rover route optimization. It is inspired by planetary exploration science (such as NASA LRO and ISRO Chandrayaan missions) but is **not** an official ISRO product or endorsed by any space agency.

---

## 🚀 Live Demo

[![Launch LUNA-X Live Demo](https://img.shields.io/badge/Launch%20LUNA--X-Live%20Demo-0070f3?style=for-the-badge&logo=vercel&logoColor=white)](https://frontend-flax-five-93.vercel.app)

🌙 **[Launch LUNA-X Live Demo](https://frontend-flax-five-93.vercel.app)**

Explore the interactive 3D Lunar Mission Control, landing site analysis, and autonomous rover simulation live in your browser.

### 🌐 Production Architecture
- **Frontend**: Deployed on [Vercel](https://vercel.com) — [https://frontend-flax-five-93.vercel.app](https://frontend-flax-five-93.vercel.app)
- **Backend API**: Deployed on [Render](https://render.com) — [https://luna-x-backend.onrender.com](https://luna-x-backend.onrender.com)
- **Source Code**: Hosted on [GitHub](https://github.com/srijanya63-cmyk/LUNA-X) — [https://github.com/srijanya63-cmyk/LUNA-X](https://github.com/srijanya63-cmyk/LUNA-X)

> **Backend API Reference**: The live FastAPI engine is accessible at [`https://luna-x-backend.onrender.com/api/v1`](https://luna-x-backend.onrender.com/api/v1) (Interactive Swagger Docs at [`https://luna-x-backend.onrender.com/docs`](https://luna-x-backend.onrender.com/docs)).

---

## 🛰️ Project Overview

**LUNA-X** answers the fundamental lunar exploration question:
> *"If a rover were sent to the Moon's South Pole, where should it land, what should it explore, and how should it safely get there?"*

LUNA-X combines an autonomous **Scientific & Mission Intelligence Engine** with a **3D Digital Mission Twin** frontend. It enables mission planners to analyze lunar South Pole terrain, calculate subsurface ice likelihood using multi-spectral evidence, identify optimal landing zones under complex safety and scientific constraints, and simulate dynamic rover traverses with real-time obstacle replanning.

---

## 🔑 Core Features

1. **3D Lunar Digital Twin**: Full global-to-regional 3D visual explorer built with React Three Fiber & Three.js.
2. **Ice Intelligence Engine**: Multi-criteria ice likelihood scoring model integrating radar CPR, PSR thermal maps, elevation, and hydrogen proxies.
3. **Uncertainty & Confidence Mapping**: Quantified evidence quality metrics for realistic scientific risk assessment.
4. **Terrain & Hazard Analysis**: Automated slope calculation, surface roughness assessment, and crater proximity hazard generation.
5. **Multi-Objective Landing Zone Selection**: Composite ranking based on ice likelihood, terrain slope, illumination (power), and Earth line-of-sight communication.
6. **Energy- & Hazard-Aware Pathfinding**: Graph-based 3D A* route generation considering slope energy consumption ($E_{travel}$) and obstacle avoidance.
7. **Dynamic Mission Event Replanning**: Simulated route blockages and energy drops trigger real-time rerouting.
8. **Optional Local AI (Ollama)**: Local natural language parsing and decision explanation layer (100% optional; engine works fully offline without LLM dependencies).
9. **Mission Control Analytics**: Post-simulation telemetry breakdown (energy usage, risk profile, scientific yield, traverse efficiency).

---

## 🏗️ Architecture Summary

```
                       ┌──────────────────────────────────────────────┐
                       │          FRONTEND (React + Three.js)         │
                       │   3D Lunar Explorer & Mission Control HUD   │
                       └──────────────────────┬───────────────────────┘
                                              │ REST / WebSockets
                                              ▼
                       ┌──────────────────────────────────────────────┐
                       │           BACKEND (Python / FastAPI)         │
                       ├──────────────────────────────────────────────┤
                       │  SCIENTIFIC ENGINE   │    MISSION ENGINE     │
                       │  - Ice Likelihood    │  - Pathfinding (A*)   │
                       │  - Confidence Model  │  - Energy Model       │
                       │  - Terrain Hazards   │  - Dynamic Replanning │
                       │  - Site Optimization │  - Telemetry Stream   │
                       └──────────────┬───────────────┬───────────────┘
                                      │               │
                     (Optional HTTP)  ▼               ▼  (Local Arrays)
                        ┌───────────────────┐   ┌───────────────────┐
                        │   LOCAL AI LAYER  │   │  DEMO / REAL DATA │
                        │  (Ollama Local)   │   │  (LOLA DEM / NPY) │
                        └───────────────────┘   └───────────────────┘
```

---

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Three.js, React Three Fiber, Drei, Tailwind CSS, Zustand, Recharts
- **Backend**: Python 3.10+, FastAPI, Pydantic v2, NumPy, SciPy, Pandas, scikit-learn
- **Geospatial & Data**: Rasterio, GeoPandas, Shapely, NumPy DEM matrices
- **Local AI (Optional)**: Ollama (`llama3` / `mistral` / `phi3`) running on localhost:11434

---

## 🚦 Quick Start (Development Setup)

### Prerequisites
- Node.js 18+ and npm
- Python 3.10+
- (Optional) Ollama running locally for natural language assistant

### 1. Clone & Setup Backend
```bash
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 2. Setup Frontend
```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:5173` to access the LUNA-X Mission Control Interface.

---

## 📚 Documentation Index

Detailed architectural specs and scientific documentation can be found in `docs/`:

- [Architecture Overview](docs/ARCHITECTURE.md)
- [Data Sources & Preprocessing](docs/DATA_SOURCES.md)
- [Scientific Model Assumptions](docs/SCIENTIFIC_ASSUMPTIONS.md)
- [Mission Intelligence & Pathfinding](docs/MISSION_ENGINE.md)
- [AI Layer & Ollama Integration](docs/AI_ARCHITECTURE.md)
- [Project Demo Script & Walkthrough](docs/DEMO_SCRIPT.md)
- [Development Roadmap](docs/DEVELOPMENT_PLAN.md)
- [Verification & Scientific Results](docs/RESULTS.md)

---

## 📜 License & Citation

Licensed under the MIT License. Developed for academic demonstration and mission simulation research.

## Contributors
-Srijanya-Project Lead
-Sakshi gupta - Contributor
