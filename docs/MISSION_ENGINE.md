# LUNA-X Mission Engine & Rover Pathfinding Specification

## 1. Rover Kinematics & Energy Model (`EnergyModel`)

The simulated rover model assumes a 4-wheeled rocker-bogie autonomous lunar rover (mass $m = 150\text{ kg}$, nominal speed $v = 0.05\text{ m/s}$, base electronics power $P_{base} = 50\text{ W}$, lunar gravity $g_{lunar} = 1.62\text{ m/s}^2$, regolith rolling resistance coefficient $\mu_{rolling} = 0.15$).

### Explicit Units Specification:
- Distance ($\Delta d$): meters [m]
- Mass ($m$): kilograms [kg]
- Speed ($v$): meters per second [m/s]
- Slope angle ($\theta$): degrees [deg] / radians [rad]
- Gravity ($g$): meters per second squared [m/s²]
- Power ($P$): Watts [W = J/s]
- Energy ($E$): Joules [J] and Watt-hours [Wh] ($1\text{ Wh} = 3600\text{ Joules}$)

### Mathematical Formulation:
Travel time for step $\Delta d$:
$$\Delta t = \frac{\Delta d}{v}$$

Force components on slope $\theta$:
$$F_{rolling} = m \cdot g_{lunar} \cdot \mu_{rolling} \cdot \cos\theta$$
$$F_{gravity} = m \cdot g_{lunar} \cdot \sin\theta$$
$$F_{drive} = \max\left(0, F_{rolling} + F_{gravity}\right)$$

Power and Energy per step:
$$P_{total} = P_{base} + F_{drive} \cdot v$$
$$E_{joules} = P_{total} \cdot \Delta t$$
$$E_{wh} = \frac{E_{joules}}{3600.0}$$

> **Model Disclosure**: This is a mission simulation engineering model for route cost estimation. It is not a flight-certified thermal-electrical model of an operational space agency rover.

---

## 2. Weighted 3D Surface Grid A* Pathfinding (`RoverPathfinder`)

The pathfinder operates over 2D elevation, slope, and hazard grid matrices ($N \times M$).

### Cost Function ($f(n) = g(n) + h(n)$):
For a step from current node $A$ to neighbor node $B$:
- Step distance: $\Delta d = \text{EuclideanDistance}(A, B)$
- Step slope: $\theta_{step} = \arctan2(Z_B - Z_A, \Delta d) \times \frac{180}{\pi}$
- Step energy: $E_{wh} = \text{EnergyModel.calculate\_step\_energy}(\Delta d, \theta_{step})$
- Hazard penalty: $H_B = \text{hazard\_grid}[B]$

$$\text{cost}_{step} = w_{dist} \cdot \left(\frac{\Delta d}{\text{resolution\_m}}\right) + w_{energy} \cdot \left(\frac{E_{wh}}{0.1}\right) + w_{risk} \cdot 10.0 \cdot H_B$$

### Configurable Objectives:
- **`max_safety`**: $w_{risk} = 0.80, w_{energy} = 0.10, w_{dist} = 0.10$ (Prefers longer safe detours over short dangerous terrain).
- **`min_energy`**: $w_{risk} = 0.10, w_{energy} = 0.80, w_{dist} = 0.10$.
- **`min_distance`**: $w_{risk} = 0.10, w_{energy} = 0.10, w_{dist} = 0.80$.
- **`balanced`**: $w_{risk} = 0.35, w_{energy} = 0.35, w_{dist} = 0.30$.

---

## 3. Feasibility Layer & Status Codes

Before and after execution/replanning, missions are evaluated against feasibility criteria:
- **`FEASIBLE`**: Optimal path found within energy budget and hazard limits.
- **`INFEASIBLE`**: Route exceeds energy budget or risk constraints.
- **`NO_ROUTE`**: Target unreachably blocked by terrain obstacles/slopes.
- **`INSUFFICIENT_ENERGY`**: Calculated energy exceeds user budget.
- **`EXCESSIVE_RISK`**: Start or target position exceeds maximum allowed hazard/slope.
- **`INVALID_CONFIGURATION`**: Input coordinates or parameters out of bounds.

---

## 4. Dynamic Replanner (`DynamicReplanner`)

Handles simulated mission events:
1. **Route Blockage**: Injects impassable hazard points ($H = 1.0$) at obstacle coordinates, preserves current rover position and target, and re-calculates route.
2. **Energy Reduction**: Re-evaluates path feasibility under reduced battery capacity.
3. **Hazard Increase**: Updates regional hazard index matrix and reroutes around hazard spikes.
