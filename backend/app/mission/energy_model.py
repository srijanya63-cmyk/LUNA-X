"""
LUNA-X Mission Engine — Energy Model

Estimates rover electrical and mechanical energy consumption per traversal step.

UNITS SPECIFICATION:
- Distance (delta_d): meters [m]
- Mass (m): kilograms [kg]
- Velocity (v): meters / second [m/s]
- Power (P): Watts [W = J/s]
- Energy: Joules [J] and Watt-hours [Wh] (1 Wh = 3600 Joules)
- Gravity (g_lunar): meters / second^2 [m/s^2] (1.62 m/s^2 for Lunar South Pole)
- Incline Slope (theta): degrees [deg]

PHYSICAL ASSUMPTIONS & SIMPLIFICATIONS:
1. Constant nominal rover speed (default 0.05 m/s). Acceleration energy spikes are ignored.
2. Regolith rolling resistance is modeled as F_roll = m * g * mu * cos(theta).
3. Gravity work on slopes is modeled as F_grav = m * g * sin(theta).
4. Mechanical drive efficiency is simplified to 1.0 (ideal motor/gearbox assumption).
5. Regenerative braking during steep downhill movement is assumed unavailable (F_drive >= 0).

DISCLOSURE: This is a mission simulation engineering model for route optimization,
NOT a certified thermal-electrical hardware model of an operational space rover.
"""

import math
from typing import Tuple
from app.models.mission import RoverParameters


class EnergyModel:
    """Calculates rover energy consumption across flat, uphill, and downhill terrain steps."""

    def __init__(self, params: RoverParameters = RoverParameters()):
        self.params = params

    def calculate_step_energy(
        self,
        distance_m: float,
        slope_deg: float
    ) -> Tuple[float, float]:
        """
        Calculates energy required to travel `distance_m` meters across a slope of `slope_deg` degrees.
        
        Returns:
            Tuple[float, float]: (energy_joules, energy_watt_hours)
        """
        if distance_m < 0.0:
            raise ValueError("Distance cannot be negative")
        if self.params.velocity_m_s <= 0.0:
            raise ValueError("Rover velocity must be strictly positive")
        if self.params.mass_kg <= 0.0:
            raise ValueError("Rover mass must be strictly positive")

        if distance_m == 0.0:
            return 0.0, 0.0

        # Travel time in seconds
        delta_t = distance_m / self.params.velocity_m_s

        # Angle conversion
        slope_rad = math.radians(slope_deg)

        # Force components
        f_rolling = self.params.mass_kg * self.params.lunar_gravity_m_s2 * self.params.rolling_resistance_coeff * math.cos(slope_rad)
        f_gravity = self.params.mass_kg * self.params.lunar_gravity_m_s2 * math.sin(slope_rad)

        # Net drive force required (clamped to >= 0, assuming no regenerative braking input)
        f_drive = max(0.0, f_rolling + f_gravity)

        # Power components (Watts)
        p_mechanical = f_drive * self.params.velocity_m_s
        p_total = self.params.base_power_w + p_mechanical

        # Energy calculation
        energy_joules = p_total * delta_t
        energy_wh = energy_joules / 3600.0

        return float(energy_joules), float(energy_wh)

    def estimate_path_energy(
        self,
        path_segments: list  # List of tuples: [(distance_m, slope_deg), ...]
    ) -> Tuple[float, float]:
        """Calculates total energy consumption across an entire sequence of path steps."""
        total_joules = 0.0
        total_wh = 0.0

        for dist_m, slope in path_segments:
            j, wh = self.calculate_step_energy(dist_m, slope)
            total_joules += j
            total_wh += wh

        return total_joules, total_wh
