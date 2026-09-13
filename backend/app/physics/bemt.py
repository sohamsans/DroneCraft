"""
Blade Element Momentum Theory (BEMT) and Aerodynamic Engine for DroneCraft.
Calculates thrust, torque, mechanical power, induced velocity, and aerodynamic coefficients.
"""

import math
import numpy as np
from typing import Dict, Any, Tuple, Optional

# Standard Constants
STANDARD_SEA_LEVEL_PRESSURE = 101325.0  # Pa
STANDARD_SEA_LEVEL_TEMPERATURE = 288.15  # K (15 C)
TEMPERATURE_LAPSE_RATE = 0.0065  # K/m
GAS_CONSTANT_AIR = 287.058  # J/(kg*K)
GRAVITY = 9.80665  # m/s^2


def calculate_air_density(altitude_m: float = 0.0, temperature_c: float = 20.0) -> float:
    """
    Calculate atmospheric air density at given altitude and temperature using ISA model.
    """
    temp_k = temperature_c + 273.15
    if altitude_m <= 11000:
        # Troposphere
        t_isa = STANDARD_SEA_LEVEL_TEMPERATURE - TEMPERATURE_LAPSE_RATE * altitude_m
        p_ratio = (t_isa / STANDARD_SEA_LEVEL_TEMPERATURE) ** (GRAVITY / (GAS_CONSTANT_AIR * TEMPERATURE_LAPSE_RATE))
        pressure = STANDARD_SEA_LEVEL_PRESSURE * p_ratio
    else:
        # Above troposphere simple approx
        pressure = STANDARD_SEA_LEVEL_PRESSURE * math.exp(-GRAVITY * altitude_m / (GAS_CONSTANT_AIR * temp_k))
    
    density = pressure / (GAS_CONSTANT_AIR * temp_k)
    return max(density, 0.1)


def estimate_propeller_coefficients(
    diameter_inch: float,
    pitch_inch: float,
    blade_count: int = 2,
    ct_override: Optional[float] = None,
    cp_override: Optional[float] = None
) -> Tuple[float, float]:
    """
    Returns (C_T, C_P) for the propeller.
    If overrides are provided and > 0, returns them directly.
    Otherwise, uses aerodynamic empirical models derived from UIUC propeller database.
    """
    if ct_override is not None and ct_override > 0 and cp_override is not None and cp_override > 0:
        return float(ct_override), float(cp_override)

    p_d_ratio = pitch_inch / max(diameter_inch, 0.1)
    blade_factor = (blade_count / 2.0) ** 0.75
    blade_factor_cp = (blade_count / 2.0) ** 0.85

    # Empirical correlation based on UIUC multirotor database (APC, Gemfan, HQProp)
    ct = (0.027 + 0.095 * (p_d_ratio ** 0.85)) * blade_factor
    cp = (0.012 + 0.075 * (p_d_ratio ** 1.35)) * blade_factor_cp

    # Ensure physical lower/upper bounds
    ct = max(0.01, min(ct, 0.25))
    cp = max(0.005, min(cp, 0.20))
    return ct, cp


def calculate_thrust(
    rotational_speed_rps: float,
    diameter_m: float,
    ct: float,
    density: float = 1.225
) -> float:
    """
    Thrust: T = C_T * rho * n^2 * D^4 [Newtons]
    """
    if rotational_speed_rps <= 0:
        return 0.0
    return ct * density * (rotational_speed_rps ** 2) * (diameter_m ** 4)


def calculate_torque(
    rotational_speed_rps: float,
    diameter_m: float,
    cp: float,
    density: float = 1.225
) -> float:
    """
    Torque: Q = (C_P / (2 * pi)) * rho * n^2 * D^5 [N*m]
    """
    if rotational_speed_rps <= 0:
        return 0.0
    return (cp / (2.0 * math.pi)) * density * (rotational_speed_rps ** 2) * (diameter_m ** 5)


def calculate_mechanical_power(
    rotational_speed_rps: float,
    diameter_m: float,
    cp: float,
    density: float = 1.225
) -> float:
    """
    P_mech = C_P * rho * n^3 * D^5 [Watts]
    """
    if rotational_speed_rps <= 0:
        return 0.0
    return cp * density * (rotational_speed_rps ** 3) * (diameter_m ** 5)


def calculate_induced_velocity_hover(thrust_n: float, diameter_m: float, density: float = 1.225) -> float:
    """
    Induced velocity at disk in hover via Momentum Theory:
    v_i = sqrt( T / (2 * rho * A) ) [m/s]
    """
    if thrust_n <= 0 or diameter_m <= 0:
        return 0.0
    area = (math.pi / 4.0) * (diameter_m ** 2)
    return math.sqrt(thrust_n / (2.0 * density * area))


def solve_hover_rps(
    target_thrust_n: float,
    diameter_m: float,
    ct: float,
    density: float = 1.225
) -> float:
    """
    Solve for rotational speed n [rev/s] needed to produce target thrust:
    n = sqrt( T / (C_T * rho * D^4) )
    """
    if target_thrust_n <= 0 or diameter_m <= 0 or ct <= 0:
        return 0.0
    denominator = ct * density * (diameter_m ** 4)
    if denominator <= 0:
        return 0.0
    return math.sqrt(target_thrust_n / denominator)


def evaluate_blade_elements(
    diameter_m: float,
    pitch_m: float,
    blade_count: int,
    rotational_speed_rps: float,
    density: float = 1.225,
    num_elements: int = 20
) -> Dict[str, Any]:
    """
    High-fidelity Blade Element Momentum Theory (BEMT) with radial discretization
    and Prandtl tip loss correction.
    """
    radius = diameter_m / 2.0
    hub_radius = 0.15 * radius  # ~15% hub cut-out
    r_stations = np.linspace(hub_radius, radius, num_elements)
    dr = (radius - hub_radius) / (num_elements - 1)
    
    total_thrust = 0.0
    total_torque = 0.0
    omega = 2.0 * math.pi * rotational_speed_rps

    # Mean chord estimation
    aspect_ratio = 8.5
    mean_chord = radius / aspect_ratio

    for r in r_stations:
        r_frac = r / radius
        # Prandtl tip loss factor F
        # F = (2 / pi) * arccos(exp(-B * (1 - r/R) / (2 * sin(phi))))
        # Approximate phi
        v_tan = omega * r
        theta = math.atan2(pitch_m, 2.0 * math.pi * r) if r > 0 else 0.0
        
        # Simplified inflow angle approx for hover
        phi = 0.5 * theta
        f_tip = (2.0 / math.pi) * math.acos(max(-1.0, min(1.0, math.exp(-blade_count * (1.0 - r_frac) / max(0.001, 2.0 * math.sin(max(0.05, phi)))))))
        f_tip = max(0.01, f_tip)

        alpha = theta - phi
        cl = 2.0 * math.pi * alpha  # thin airfoil approx
        cl = max(-0.2, min(cl, 1.4))
        cd = 0.012 + 0.04 * (cl ** 2)

        w_rel = math.sqrt(v_tan ** 2 + (v_tan * math.sin(phi)) ** 2)
        q_dyn = 0.5 * density * (w_rel ** 2)

        # Sectional Lift & Drag
        dL = q_dyn * mean_chord * cl * blade_count * dr * f_tip
        dD = q_dyn * mean_chord * cd * blade_count * dr * f_tip

        # Axial thrust and tangential torque
        dT = dL * math.cos(phi) - dD * math.sin(phi)
        dQ = (dL * math.sin(phi) + dD * math.cos(phi)) * r

        total_thrust += max(0.0, dT)
        total_torque += max(0.0, dQ)

    ct_bemt = total_thrust / (density * (rotational_speed_rps ** 2) * (diameter_m ** 4)) if rotational_speed_rps > 0 else 0.0
    cp_bemt = (2.0 * math.pi * total_torque) / (density * (rotational_speed_rps ** 3) * (diameter_m ** 5)) if rotational_speed_rps > 0 else 0.0

    return {
        "bemt_thrust_n": float(total_thrust),
        "bemt_torque_nm": float(total_torque),
        "bemt_power_w": float(2.0 * math.pi * rotational_speed_rps * total_torque),
        "ct_bemt": float(ct_bemt),
        "cp_bemt": float(cp_bemt),
    }
