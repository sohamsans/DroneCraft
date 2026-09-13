"""
Unit Tests for DroneCraft Physics, Aerodynamics, and Electromechanical Solver.
"""

import math
import pytest
from app.physics.bemt import (
    calculate_air_density,
    estimate_propeller_coefficients,
    calculate_thrust,
    calculate_torque,
    calculate_mechanical_power,
    solve_hover_rps
)
from app.physics.motor_circuit import MotorCircuit
from app.physics.battery_model import BatteryModel
from app.physics.mass_rollup import MassRollup
from app.physics.powertrain_solver import PowertrainSolver


def test_air_density_isa():
    # Sea level standard ~1.20 - 1.25 kg/m^3
    rho_sl = calculate_air_density(0, 15.0)
    assert 1.20 <= rho_sl <= 1.25

    # High altitude density is lower
    rho_high = calculate_air_density(3000, 15.0)
    assert rho_high < rho_sl


def test_propeller_aerodynamics():
    diameter_inch = 5.0
    pitch_inch = 4.3
    d_m = diameter_inch * 0.0254
    ct, cp = estimate_propeller_coefficients(diameter_inch, pitch_inch, blade_count=3)
    
    assert 0.05 <= ct <= 0.20
    assert 0.02 <= cp <= 0.15

    rps = 350.0  # 21,000 RPM
    thrust_n = calculate_thrust(rps, d_m, ct)
    torque_nm = calculate_torque(rps, d_m, cp)
    p_mech_w = calculate_mechanical_power(rps, d_m, cp)

    assert thrust_n > 0.0
    assert torque_nm > 0.0
    assert p_mech_w > 0.0
    # Mechanical power = 2 * pi * n * Q
    assert math.isclose(p_mech_w, 2 * math.pi * rps * torque_nm, rel_tol=1e-3)


def test_motor_equivalent_circuit():
    kv = 1950.0
    rm = 0.048  # 48 mΩ
    motor = MotorCircuit(kv=kv, internal_resistance_ohm=rm, idle_current_a=1.1)

    rps = 300.0  # 18,000 RPM
    eb = motor.compute_back_emf(rps)
    # Eb = (60 * n) / Kv = (60 * 300) / 1950 ~ 9.23 V
    assert math.isclose(eb, (60.0 * 300.0) / 1950.0, rel_tol=1e-3)

    torque = 0.05  # N*m
    im = motor.compute_motor_current(torque)
    assert im > motor.i0

    eval_point = motor.evaluate_operating_point(rps, torque)
    assert eval_point["phase_voltage_v"] > eb
    assert eval_point["electrical_power_w"] > eval_point["mechanical_power_w"]
    assert 0.0 < eval_point["motor_efficiency"] < 1.0


def test_battery_sag_and_endurance():
    bat = BatteryModel(
        cells_s=6,
        capacity_mah=1400.0,
        c_rating_continuous=150.0,
        internal_resistance_cell_mohm=3.2
    )

    # 6S nominal = 22.2V
    assert bat.v_pack_nom == 6 * 3.7
    # Pack IR = 6 * 3.2 mΩ = 19.2 mΩ = 0.0192 Ω
    assert math.isclose(bat.r_pack_ohm, 0.0192, rel_tol=1e-3)

    # Voltage droop under 50A bus load
    v_loaded = bat.calculate_terminal_voltage(50.0)
    assert v_loaded < bat.v_pack_nom
    assert math.isclose(v_loaded, 22.2 - (50.0 * 0.0192), rel_tol=1e-3)

    # Flight endurance at 10A hover draw:
    # 1.4 Ah * 0.8 / 10 A * 60 = 6.72 minutes
    t_flight = bat.estimate_flight_endurance_mins(10.0)
    assert math.isclose(t_flight, 6.72, rel_tol=1e-3)


def test_mass_rollup():
    mass = MassRollup.calculate_auw(
        num_rotors=4,
        frame_weight_g=125.0,
        motor_weight_g=33.8,
        propeller_weight_g=4.2,
        esc_weight_g=14.5,
        battery_weight_g=222.0,
        payload_weight_g=50.0,
        avionics_weight_g=45.0,
        is_4in1_esc=True
    )
    
    # 125 + 4*(33.8 + 4.2) + 14.5 + 222 + 50 + 45 = 125 + 152 + 14.5 + 222 + 50 + 45 = 608.5g
    assert math.isclose(mass["auw_g"], 608.5, rel_tol=1e-2)
    assert mass["hover_thrust_per_rotor_g"] > 0
    assert mass["hover_thrust_per_rotor_n"] > 0


def test_powertrain_solver_full_simulation():
    frame = {
        "name": "TBS Source One V5",
        "wheelbase_mm": 226.0,
        "frame_type": "Quad-X",
        "max_prop_size_inch": 5.1,
        "dry_weight_g": 125.0,
        "price_usd": 29.95
    }
    motor = {
        "model": "T-Motor F60 PRO V 1950KV",
        "kv": 1950.0,
        "internal_resistance_mohm": 48.0,
        "idle_current_a": 1.1,
        "max_power_w": 1100.0,
        "max_continuous_current_a": 46.5,
        "weight_g": 33.8,
        "price_usd": 27.90
    }
    prop = {
        "model": "Gemfan 51466 V2",
        "diameter_inch": 5.1,
        "pitch_inch": 4.66,
        "blade_count": 3,
        "weight_g": 4.2,
        "price_usd": 3.75
    }
    esc = {
        "model": "SpeedyBee 55A",
        "continuous_current_a": 55.0,
        "burst_current_a": 70.0,
        "weight_g": 14.5,
        "price_usd": 49.99
    }
    battery = {
        "brand": "Tattu",
        "model": "R-Line 6S 1400mAh",
        "cells_s": 6,
        "capacity_mah": 1400.0,
        "c_rating_continuous": 150.0,
        "c_rating_burst": 250.0,
        "internal_resistance_cell_mohm": 3.2,
        "weight_g": 222.0,
        "price_usd": 41.99
    }

    solver = PowertrainSolver(frame, motor, prop, esc, battery, payload_weight_g=0.0)
    results = solver.simulate()

    assert results["mass"]["auw_g"] > 0
    assert results["hover"]["hover_throttle_pct"] > 0
    assert results["hover"]["hover_flight_time_minutes"] > 0
    assert results["max_performance"]["twr"] > 1.8
    assert results["max_performance"]["max_total_thrust_g"] > results["mass"]["auw_g"]
    assert len(results["throttle_curve"]) == 11
