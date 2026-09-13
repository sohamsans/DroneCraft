"""
Diagnostics Advisor & Health Score Engine for DroneCraft.
Aggregates deterministic rule results, computes overall health/safety score,
and generates actionable upgrade and fix recommendations.
"""

from typing import Dict, Any, List
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

class DiagnosticsAdvisor:
    @staticmethod
    def evaluate_build(
        frame: Dict[str, Any],
        motor: Dict[str, Any],
        prop: Dict[str, Any],
        esc: Dict[str, Any],
        battery: Dict[str, Any],
        sim_results: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Runs all deterministic diagnostics and calculates health score.
        """
        results: List[DiagnosticRuleResult] = [
            check_prop_frame_interference(frame, prop),
            check_voltage_compatibility(motor, esc, battery),
            check_thrust_authority(sim_results),
            check_esc_current(esc, sim_results),
            check_motor_thermal_limits(motor, sim_results),
            check_battery_health_and_sag(battery, sim_results),
            check_hover_efficiency(sim_results),
        ]

        # Count severities
        fatal_count = sum(1 for r in results if r.severity == Severity.FATAL)
        critical_count = sum(1 for r in results if r.severity == Severity.CRITICAL)
        warning_count = sum(1 for r in results if r.severity == Severity.WARNING)
        info_count = sum(1 for r in results if r.severity == Severity.INFO and not r.passed)
        passed_count = sum(1 for r in results if r.passed)

        # Health score calculation (0 to 100)
        # Baseline = 100
        # FATAL: -50 each
        # CRITICAL: -25 each
        # WARNING: -10 each
        # INFO fail: -3 each
        score = 100 - (fatal_count * 50) - (critical_count * 25) - (warning_count * 10) - (info_count * 3)
        score = max(0, min(100, score))

        if fatal_count > 0:
            status = "DANGEROUS / INVALID BUILD"
            status_color = "red"
        elif critical_count > 0:
            status = "HIGH RISK"
            status_color = "orange"
        elif warning_count > 0:
            status = "SUBOPTIMAL"
            status_color = "yellow"
        else:
            status = "OPTIMAL & SAFE"
            status_color = "emerald"

        # Actionable recommendations
        action_items = []
        for r in results:
            if not r.passed:
                action_items.append({
                    "rule_id": r.rule_id,
                    "severity": r.severity.value,
                    "category": r.category,
                    "title": r.name,
                    "issue": r.message,
                    "recommendation": r.recommendation,
                })

        # Order action items: FATAL first, then CRITICAL, then WARNING, then INFO
        severity_order = {"FATAL": 0, "CRITICAL": 1, "WARNING": 2, "INFO": 3, "PASSED": 4}
        action_items.sort(key=lambda x: severity_order.get(x["severity"], 99))

        return {
            "health_score": score,
            "status": status,
            "status_color": status_color,
            "is_flight_ready": fatal_count == 0 and critical_count == 0,
            "summary": {
                "total_checks": len(results),
                "passed_count": passed_count,
                "fatal_count": fatal_count,
                "critical_count": critical_count,
                "warning_count": warning_count,
                "info_count": info_count
            },
            "rules": [r.to_dict() for r in results],
            "action_items": action_items
        }
