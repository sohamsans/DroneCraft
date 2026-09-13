"""
Deterministic Diagnostics Rules Engine for DroneCraft.
Evaluates powertrain physics outputs against strict safety, clearance, thermal, and electrical rules.
"""

from typing import Dict, Any, List
from enum import Enum

class Severity(str, Enum):
    FATAL = "FATAL"          # Dangerous / physically impossible to fly safely
    CRITICAL = "CRITICAL"    # High risk of hardware destruction / severe flight instability
    WARNING = "WARNING"      # Suboptimal / thermal stress / poor battery longevity
    INFO = "INFO"            # Operational notice / optimization tip
    PASSED = "PASSED"        # Operating safely within nominal design envelope


class DiagnosticRuleResult:
    def __init__(
        self,
        rule_id: str,
        name: str,
        category: str,
        severity: Severity,
        passed: bool,
        message: str,
        recommendation: str,
        details: Dict[str, Any] = None
    ):
        self.rule_id = rule_id
        self.name = name
        self.category = category
        self.severity = severity
        self.passed = passed
        self.message = message
        self.recommendation = recommendation
        self.details = details or {}

    def to_dict(self) -> Dict[str, Any]:
        return {
            "rule_id": self.rule_id,
            "name": self.name,
            "category": self.category,
            "severity": self.severity.value,
            "passed": self.passed,
            "message": self.message,
            "recommendation": self.recommendation,
            "details": self.details
        }


def check_prop_frame_interference(frame: Dict[str, Any], prop: Dict[str, Any]) -> DiagnosticRuleResult:
    prop_dia = float(prop.get("diameter_inch", 5.0))
    max_prop = float(frame.get("max_prop_size_inch", 5.1))
    
    passed = prop_dia <= max_prop
    if passed:
        return DiagnosticRuleResult(
            rule_id="RULE_GEO_01",
            name="Propeller Frame Clearance",
            category="Geometry & Clearance",
            severity=Severity.PASSED,
            passed=True,
            message=f"Propeller diameter ({prop_dia}\") fits within frame max specification ({max_prop}\").",
            recommendation="Clearance verified.",
            details={"prop_diameter_inch": prop_dia, "max_prop_inch": max_prop}
        )
    else:
        diff = round(prop_dia - max_prop, 2)
        return DiagnosticRuleResult(
            rule_id="RULE_GEO_01",
            name="Propeller Frame Interference",
            category="Geometry & Clearance",
            severity=Severity.FATAL,
            passed=False,
            message=f"Propeller diameter ({prop_dia}\") exceeds frame maximum allowed size ({max_prop}\") by {diff}\". Blades will collide with frame arms or adjacent rotors!",
            recommendation=f"Downsize propellers to {max_prop}\" or select a larger wheelbase frame.",
            details={"prop_diameter_inch": prop_dia, "max_prop_inch": max_prop, "overlap_inch": diff}
        )


def check_thrust_authority(sim_results: Dict[str, Any]) -> DiagnosticRuleResult:
    twr = sim_results["max_performance"]["twr"]
    
    if twr < 1.3:
        return DiagnosticRuleResult(
            rule_id="RULE_THRUST_01",
            name="Insufficient Thrust-to-Weight Ratio",
            category="Thrust & Dynamics",
            severity=Severity.FATAL,
            passed=False,
            message=f"TWR is dangerously low ({twr}:1). Drone cannot lift off reliably or recover from wind disturbances.",
            recommendation="Increase motor stator size / Kv, increase propeller diameter/pitch, or decrease AUW/payload.",
            details={"twr": twr, "min_required": 1.8}
        )
    elif twr < 1.8:
        return DiagnosticRuleResult(
            rule_id="RULE_THRUST_02",
            name="Marginal Thrust Authority",
            category="Thrust & Dynamics",
            severity=Severity.CRITICAL,
            passed=False,
            message=f"TWR is marginal ({twr}:1). Minimum recommended for safe outdoor multirotor flight is 1.8:1.",
            recommendation="Reduce payload mass or upgrade to higher thrust motor/propeller combination.",
            details={"twr": twr, "recommended_min": 1.8}
        )
    elif twr > 8.0:
        return DiagnosticRuleResult(
            rule_id="RULE_THRUST_03",
            name="High Thrust-to-Weight Ratio",
            category="Thrust & Dynamics",
            severity=Severity.INFO,
            passed=True,
            message=f"High TWR ({twr}:1) optimized for extreme freestyle/racing acrobatic maneuvers. Requires aggressive PID tuning/filtering.",
            recommendation="Ensure flight controller gyro filtering is properly configured to avoid motor oscillation heating.",
            details={"twr": twr}
        )
    else:
        return DiagnosticRuleResult(
            rule_id="RULE_THRUST_04",
            name="Nominal Thrust Authority",
            category="Thrust & Dynamics",
            severity=Severity.PASSED,
            passed=True,
            message=f"TWR ({twr}:1) is well within optimal multirotor flight envelope.",
            recommendation="Powertrain authority verified.",
            details={"twr": twr}
        )


def check_esc_current(esc: Dict[str, Any], sim_results: Dict[str, Any]) -> DiagnosticRuleResult:
    esc_cont = float(esc.get("continuous_current_a", 30.0))
    esc_burst = float(esc.get("burst_current_a", esc_cont * 1.25))
    max_im = sim_results["max_performance"]["max_motor_current_a"]

    if max_im > esc_burst:
        return DiagnosticRuleResult(
            rule_id="RULE_ESC_01",
            name="ESC Burst Overcurrent",
            category="Electrical & ESC",
            severity=Severity.FATAL,
            passed=False,
            message=f"Peak motor current ({max_im}A) exceeds ESC burst rating ({esc_burst}A). Immediate MOSFET thermal failure risk!",
            recommendation=f"Upgrade to an ESC rated for at least {round(max_im * 1.2, 0)}A continuous.",
            details={"peak_motor_current_a": max_im, "esc_burst_a": esc_burst}
        )
    elif max_im > (0.85 * esc_cont):
        return DiagnosticRuleResult(
            rule_id="RULE_ESC_02",
            name="ESC Continuous Margin Warning",
            category="Electrical & ESC",
            severity=Severity.WARNING,
            passed=False,
            message=f"Peak motor current ({max_im}A) exceeds 85% of ESC continuous rating ({esc_cont}A). ESC may overheat during sustained punchouts.",
            recommendation=f"Consider upgrading to a {round(max_im / 0.75, 0)}A ESC for cooler operation and extended component lifespan.",
            details={"peak_motor_current_a": max_im, "esc_cont_a": esc_cont, "margin_pct": round((max_im / esc_cont) * 100, 1)}
        )
    else:
        return DiagnosticRuleResult(
            rule_id="RULE_ESC_03",
            name="ESC Current Headroom",
            category="Electrical & ESC",
            severity=Severity.PASSED,
            passed=True,
            message=f"ESC has healthy current headroom ({max_im}A peak on {esc_cont}A rated ESC).",
            recommendation="ESC sizing verified.",
            details={"peak_motor_current_a": max_im, "esc_cont_a": esc_cont}
        )


def check_motor_thermal_limits(motor: Dict[str, Any], sim_results: Dict[str, Any]) -> DiagnosticRuleResult:
    max_power_rated = float(motor.get("max_power_w", 500.0))
    max_curr_rated = float(motor.get("max_continuous_current_a", 30.0))
    actual_max_power = sim_results["max_performance"]["max_motor_elec_power_w"]
    actual_max_current = sim_results["max_performance"]["max_motor_current_a"]

    if actual_max_power > (max_power_rated * 1.15):
        return DiagnosticRuleResult(
            rule_id="RULE_MOTOR_01",
            name="Motor Stator Thermal Overload",
            category="Motor & Thermal",
            severity=Severity.CRITICAL,
            passed=False,
            message=f"Peak electrical power ({actual_max_power}W) exceeds motor maximum rated power ({max_power_rated}W) by {round(((actual_max_power/max_power_rated)-1)*100, 1)}%. Risk of winding insulation breakdown!",
            recommendation="Reduce propeller pitch/diameter, lower battery cell count (S), or select a higher wattage stator motor.",
            details={"actual_power_w": actual_max_power, "rated_power_w": max_power_rated}
        )
    elif actual_max_current > (max_curr_rated * 1.10):
        return DiagnosticRuleResult(
            rule_id="RULE_MOTOR_02",
            name="Motor Overcurrent Stress",
            category="Motor & Thermal",
            severity=Severity.WARNING,
            passed=False,
            message=f"Peak motor current ({actual_max_current}A) exceeds rated continuous limit ({max_curr_rated}A).",
            recommendation="Limit prolonged full-throttle punchouts or use lower pitch propeller.",
            details={"actual_current_a": actual_max_current, "rated_current_a": max_curr_rated}
        )
    else:
        return DiagnosticRuleResult(
            rule_id="RULE_MOTOR_03",
            name="Motor Thermal Sizing",
            category="Motor & Thermal",
            severity=Severity.PASSED,
            passed=True,
            message=f"Motor operates safely within thermal and power bounds ({actual_max_power}W on {max_power_rated}W rated motor).",
            recommendation="Motor thermal loading verified.",
            details={"actual_power_w": actual_max_power, "rated_power_w": max_power_rated}
        )


def check_battery_health_and_sag(battery: Dict[str, Any], sim_results: Dict[str, Any]) -> DiagnosticRuleResult:
    cap_ah = float(battery.get("capacity_mah", 1500.0)) / 1000.0
    c_cont = float(battery.get("c_rating_continuous", 45.0))
    c_burst = float(battery.get("c_rating_burst", 90.0))
    max_bus_curr = sim_results["max_performance"]["max_bus_current_a"]
    hov_bus_curr = sim_results["hover"]["hover_bus_current_a"]
    min_cell_v = sim_results["max_performance"]["max_battery_cell_voltage_v"]

    i_cont_limit = cap_ah * c_cont
    i_burst_limit = cap_ah * c_burst

    if hov_bus_curr > i_cont_limit:
        return DiagnosticRuleResult(
            rule_id="RULE_BAT_01",
            name="Battery Hover C-Rating Overload",
            category="Battery & Power Bus",
            severity=Severity.FATAL,
            passed=False,
            message=f"Hover current ({hov_bus_curr}A) exceeds battery continuous discharge limit ({i_cont_limit}A). Battery will overheat and fail rapidly in basic hover!",
            recommendation="Increase battery capacity (mAh) or use a higher continuous C-rating pack.",
            details={"hover_bus_current_a": hov_bus_curr, "cont_limit_a": i_cont_limit}
        )
    elif max_bus_curr > i_burst_limit:
        return DiagnosticRuleResult(
            rule_id="RULE_BAT_02",
            name="Battery Peak C-Rating Exceeded",
            category="Battery & Power Bus",
            severity=Severity.CRITICAL,
            passed=False,
            message=f"Max throttle bus current ({max_bus_curr}A) exceeds pack burst limit ({i_burst_limit}A). Severe voltage sag and premature cell degradation.",
            recommendation=f"Upgrade battery to a pack with higher burst rating (at least {round(max_bus_curr / cap_ah, 0)}C) or higher capacity.",
            details={"max_bus_current_a": max_bus_curr, "burst_limit_a": i_burst_limit}
        )
    elif min_cell_v < 3.20:
        return DiagnosticRuleResult(
            rule_id="RULE_BAT_03",
            name="Severe Voltage Sag / Brownout Risk",
            category="Battery & Power Bus",
            severity=Severity.CRITICAL,
            passed=False,
            message=f"Loaded cell voltage drops to {min_cell_v}V at full throttle (< 3.2V cutoff). High risk of flight controller brownout and reboot mid-flight!",
            recommendation="Use lower internal resistance (mΩ) cells, higher capacity battery, or reduce peak motor current.",
            details={"loaded_cell_voltage_v": min_cell_v, "threshold_v": 3.20}
        )
    else:
        return DiagnosticRuleResult(
            rule_id="RULE_BAT_04",
            name="Battery Discharge & Voltage Sag",
            category="Battery & Power Bus",
            severity=Severity.PASSED,
            passed=True,
            message=f"Battery discharge rate and voltage sag are within safe operating limits ({min_cell_v}V/cell loaded at full throttle).",
            recommendation="Battery sizing verified.",
            details={"max_bus_current_a": max_bus_curr, "loaded_cell_voltage_v": min_cell_v}
        )


def check_hover_efficiency(sim_results: Dict[str, Any]) -> DiagnosticRuleResult:
    hov_throttle = sim_results["hover"]["hover_throttle_pct"]
    g_per_w = sim_results["hover"]["hover_efficiency_g_per_w"]

    if hov_throttle > 65.0:
        return DiagnosticRuleResult(
            rule_id="RULE_EFF_01",
            name="High Hover Throttle (Suboptimal Torque Band)",
            category="Efficiency & Endurance",
            severity=Severity.WARNING,
            passed=False,
            message=f"Hover throttle is high ({hov_throttle}%). Motor is operating far outside its optimal torque/efficiency band with little vertical climb headroom.",
            recommendation="Select larger diameter propellers, higher Kv motors, or reduce AUW.",
            details={"hover_throttle_pct": hov_throttle, "optimal_target_pct": "35-50%"}
        )
    elif g_per_w < 5.5:
        return DiagnosticRuleResult(
            rule_id="RULE_EFF_02",
            name="Low Aerodynamic Efficiency",
            category="Efficiency & Endurance",
            severity=Severity.INFO,
            passed=False,
            message=f"Hover efficiency is relatively low ({g_per_w} g/W).",
            recommendation="Switch to higher efficiency lower-pitch bi-blade props or higher stator volume motors for longer endurance.",
            details={"efficiency_g_per_w": g_per_w, "benchmark_g_per_w": 6.5}
        )
    else:
        return DiagnosticRuleResult(
            rule_id="RULE_EFF_03",
            name="Optimal Hover Efficiency",
            category="Efficiency & Endurance",
            severity=Severity.PASSED,
            passed=True,
            message=f"Hover operating point is highly efficient ({hov_throttle}% throttle, {g_per_w} g/W).",
            recommendation="Efficiency verified.",
            details={"hover_throttle_pct": hov_throttle, "efficiency_g_per_w": g_per_w}
        )


def check_voltage_compatibility(motor: Dict[str, Any], esc: Dict[str, Any], battery: Dict[str, Any]) -> DiagnosticRuleResult:
    bat_s = int(battery.get("cells_s", 4))
    
    motor_s_min = int(motor.get("recommended_voltage_s_min", 3))
    motor_s_max = int(motor.get("recommended_voltage_s_max", 6))
    
    esc_s_min = int(esc.get("voltage_min_s", 3))
    esc_s_max = int(esc.get("voltage_max_s", 6))

    if bat_s < motor_s_min or bat_s > motor_s_max:
        return DiagnosticRuleResult(
            rule_id="RULE_VOLT_01",
            name="Motor Voltage (S) Incompatibility",
            category="Voltage Matching",
            severity=Severity.FATAL,
            passed=False,
            message=f"Battery cell count ({bat_s}S) is outside motor recommended range ({motor_s_min}S - {motor_s_max}S).",
            recommendation=f"Change battery to a {motor_s_min}S–{motor_s_max}S pack or select compatible motor.",
            details={"battery_s": bat_s, "motor_s_range": f"{motor_s_min}S-{motor_s_max}S"}
        )
    elif bat_s < esc_s_min or bat_s > esc_s_max:
        return DiagnosticRuleResult(
            rule_id="RULE_VOLT_02",
            name="ESC Voltage (S) Incompatibility",
            category="Voltage Matching",
            severity=Severity.FATAL,
            passed=False,
            message=f"Battery cell count ({bat_s}S) is outside ESC rated voltage range ({esc_s_min}S - {esc_s_max}S).",
            recommendation=f"Select an ESC rated for {bat_s}S operation.",
            details={"battery_s": bat_s, "esc_s_range": f"{esc_s_min}S-{esc_s_max}S"}
        )
    else:
        return DiagnosticRuleResult(
            rule_id="RULE_VOLT_03",
            name="Voltage Level Compatibility",
            category="Voltage Matching",
            severity=Severity.PASSED,
            passed=True,
            message=f"Battery {bat_s}S voltage is fully compatible with motor and ESC ratings.",
            recommendation="Voltage compatibility verified.",
            details={"battery_s": bat_s}
        )
