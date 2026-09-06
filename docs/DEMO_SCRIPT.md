# LUNA-X College Exhibition & Demo Walkthrough Script

## 🎬 Demonstration Narrative

This document outlines the step-by-step presentation script for showcasing LUNA-X to evaluators, judges, faculty, and exhibition attendees.

Total Demo Duration: **4 - 5 Minutes**.

---

## 📍 Step-by-Step Demo Sequence

### Step 1: Start Mission & 3D Moon Exploration (0:00 - 0:45)
- **Presenter**: *"Welcome to LUNA-X — an AI-powered lunar ice intelligence and autonomous rover mission control platform. We begin at full orbital scale looking at an interactive 3D digital twin of the Moon."*
- **Action**: Click `South Pole` view tab on the top Header HUD.
- **Visual**: Camera smoothly lerps from global lunar orbit down to the **South Polar Region** ($89.9^\circ\text{S}$, Shackleton Crater region).
- **Key Point**: Explain that the South Pole is the primary target for NASA Artemis and ISRO Chandrayaan missions due to potential water ice inside Permanently Shadowed Regions (PSRs).

---

### Step 2: Scientific Data & Heatmap Layers (0:45 - 1:30)
- **Presenter**: *"We now load multi-spectral observation layers computed deterministically by the backend scientific engine."*
- **Action**: Click `Ice Likelihood` overlay on the Scientific Overlays HUD.
- **Visual**: Thermal heatmap (cyan/blue for high ice likelihood, dark grey for dry regolith) drapes over the 3D heightfield crater terrain.
- **Action**: Click `Confidence` overlay, then `Hazard` overlay.
- **Key Point**: Highlight data honesty — all synthetic demo matrices are explicitly labeled `[DEMO / SIMULATION DATA MODE]`. The system presents quantified confidence metrics derived from sensor resolution and overlap, not absolute claims.

---

### Step 3: Landing Site Selection & Comparison (1:30 - 2:30)
- **Presenter**: *"Before landing a rover, we analyze candidate landing zones evaluated using Pareto multi-attribute scoring."*
- **Action**: Click `Rank #1 Shackleton Rim Alpha` in the Mission Planner panel.
- **Visual**: Camera focuses on the target pin on the crater rim. The detailed composite score breakdown table opens showing component scores (Ice: 0.85, Safety: 0.88, Solar Illum: 0.78, Earth Comm: 0.82).

---

### Step 4: Mission Constraints & Route Generation (2:30 - 3:15)
- **Presenter**: *"Next, we configure mission constraints: Battery budget 500 Wh, Moderate Risk, Max Slope 18°."*
- **Action**: Click `GENERATE TRAVERSE ROUTE`.
- **Visual**: The UI switches to `Mission Twin` mode. The backend Weighted 3D A* scientific engine returns an optimal route, rendering a glowing green traversal path along crater contour lines.

---

### Step 5: Rover Animation & Dynamic Rerouting (3:15 - 4:15)
- **Presenter**: *"We initiate the autonomous rover traverse simulation."*
- **Action**: Click `Play` on the Telemetry HUD.
- **Visual**: 3D Rover mesh moves smoothly along the path. Real-time speed, battery %, distance traveled, and current slope display on the Telemetry HUD.
- **Action**: Click `Inject Rock Collapse` on the Mission Event HUD.
- **Visual**: Red obstacle appears on the path. Alert notification triggers: `[ROUTE BLOCKED AT (45, 64): Dynamic Replanner calculated alternate path]`. Within milliseconds, the path recalculates around the blockage and the rover continues without interruption.

---

### Step 6: Mission Analytics & Briefing (4:15 - 4:45)
- **Presenter**: *"Upon completing the traverse, LUNA-X produces a complete post-mission analytics report."*
- **Action**: Click `BarChart` button to open the Mission Control Analytics Modal.
- **Visual**: Displays interactive Recharts area graphs showing energy consumption profile across the path, cumulative distance, average risk score, and flight director briefing summary.
- **Presenter**: *"LUNA-X demonstrates how autonomous scientific engines and 3D digital twins can revolutionize future lunar exploration planning."*
