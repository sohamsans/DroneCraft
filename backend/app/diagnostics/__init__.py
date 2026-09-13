"""
Diagnostics and Rules Package for DroneCraft.
"""

from app.diagnostics.rules import (
    Severity,
    DiagnosticRuleResult,
    check_prop_frame_interference,
    check_thrust_authority,
    check_esc_current,
    check_motor_thermal_limits,
    check_battery_health_and_sag,
    check_hover_efficiency,
    check_voltage_compatibility
)
from app.diagnostics.advisor import DiagnosticsAdvisor

__all__ = [
    "Severity",
    "DiagnosticRuleResult",
    "DiagnosticsAdvisor",
    "check_prop_frame_interference",
    "check_thrust_authority",
    "check_esc_current",
    "check_motor_thermal_limits",
    "check_battery_health_and_sag",
    "check_hover_efficiency",
    "check_voltage_compatibility"
]
