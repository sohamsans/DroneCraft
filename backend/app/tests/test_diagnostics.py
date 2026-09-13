"""
Unit Tests for DroneCraft Diagnostics Rules and Health Advisor Engine.
"""

import pytest
from app.diagnostics.rules import (
    Severity,
    check_prop_frame_interference,
    check_thrust_authority,
    check_esc_current,
    check_motor_thermal_limits,
    check_battery_health_and_sag,
    check_voltage_compatibility
)
from app.diagnostics.advisor import DiagnosticsAdvisor
from app.physics.powertrain_solver import PowertrainSolver


def test_prop_frame_interference():
    frame = {"max_prop_size_inch": 5.1}
    valid_prop = {"diameter_inch": 5.0}
    oversized_prop = {"diameter_inch": 7.0}

    res_valid = check_prop_frame_interference(frame, valid_prop)
    assert res_valid.passed is True
    assert res_valid.severity == Severity.PASSED

    res_fail = check_prop_frame_interference(frame, oversized_prop)
    assert res_fail.passed is False
    assert res_fail.severity == Severity.FATAL


def test_voltage_compatibility():
    motor = {"recommended_voltage_s_min": 4, "recommended_voltage_s_max": 6}
    esc = {"voltage_min_s": 3, "voltage_max_s": 6}
    
    bat_compatible = {"cells_s": 6}
    bat_incompatible = {"cells_s": 2}

    res_ok = check_voltage_compatibility(motor, esc, bat_compatible)
    assert res_ok.passed is True

    res_fail = check_voltage_compatibility(motor, esc, bat_incompatible)
    assert res_fail.passed is False
    assert res_fail.severity == Severity.FATAL


def test_diagnostics_advisor_integration():
    frame = {
        "name": "GEPRC CineLog35",
        "wheelbase_mm": 142.0,
        "max_prop_size_inch": 3.5,
        "dry_weight_g": 115.0
    }
    motor = {
        "model": "GEPRC 2105.5 2650KV",
        "kv": 2650.0,
        "internal_resistance_mohm": 82.0,
        "idle_current_a": 0.7,
        "max_power_w": 460.0,
        "max_continuous_current_a": 28.0,
        "recommended_voltage_s_min": 4,
        "recommended_voltage_s_max": 4,
        "weight_g": 21.5
    }
    prop = {
        "model": "HQProp 3535",
        "diameter_inch": 3.5,
        "pitch_inch": 3.5,
        "blade_count": 3,
        "weight_g": 2.2
    }
    esc = {
        "model": "Flywoo 20A AIO",
        "continuous_current_a": 20.0,
        "burst_current_a": 25.0,
        "voltage_min_s": 2,
        "voltage_max_s": 4,
        "weight_g": 6.8
    }
    battery = {
        "brand": "GNB",
        "model": "4S 850mAh 80C",
        "cells_s": 4,
        "capacity_mah": 850.0,
        "c_rating_continuous": 80.0,
        "c_rating_burst": 160.0,
        "internal_resistance_cell_mohm": 5.5,
        "weight_g": 94.0
    }

    solver = PowertrainSolver(frame, motor, prop, esc, battery)
    sim_results = solver.simulate()

    diag = DiagnosticsAdvisor.evaluate_build(frame, motor, prop, esc, battery, sim_results)
    assert 0 <= diag["health_score"] <= 100
    assert len(diag["rules"]) >= 7
    assert "summary" in diag
