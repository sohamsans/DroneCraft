"""
Physics and Aerodynamics Package for DroneCraft.
"""

from app.physics.bemt import (
    calculate_air_density,
    estimate_propeller_coefficients,
    calculate_thrust,
    calculate_torque,
    calculate_mechanical_power,
    solve_hover_rps,
    calculate_induced_velocity_hover,
    evaluate_blade_elements
)
from app.physics.motor_circuit import MotorCircuit
from app.physics.battery_model import BatteryModel
from app.physics.mass_rollup import MassRollup
from app.physics.powertrain_solver import PowertrainSolver, get_rotor_count_from_frame_type

__all__ = [
    "calculate_air_density",
    "estimate_propeller_coefficients",
    "calculate_thrust",
    "calculate_torque",
    "calculate_mechanical_power",
    "solve_hover_rps",
    "calculate_induced_velocity_hover",
    "evaluate_blade_elements",
    "MotorCircuit",
    "BatteryModel",
    "MassRollup",
    "PowertrainSolver",
    "get_rotor_count_from_frame_type"
]
