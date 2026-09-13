"""
Comprehensive Powertrain Physics & Aerodynamics Solver for DroneCraft.
Integrates BEMT aerodynamics, DC motor equivalent circuit, battery IR droop,
and non-linear root solver for hover and max throttle performance.
"""

import math
from typing import Dict, Any, List, Optional
from scipy.optimize import brentq

from app.physics.bemt import (
    calculate_air_density,
    estimate_propeller_coefficients,
    calculate_thrust,
    calculate_torque,
    calculate_mechanical_power,
    solve_hover_rps,
    calculate_induced_velocity_hover
)
from app.physics.motor_circuit import MotorCircuit
from app.physics.battery_model import BatteryModel
from app.physics.mass_rollup import MassRollup, GRAVITY

def get_rotor_count_from_frame_type(frame_type: str) -> int:
    ft = frame_type.lower()
    if "tri" in ft or "3" in ft:
        return 3
    elif "hexa" in ft or "hex" in ft or "6" in ft:
        return 6
    elif "octo" in ft or "8" in ft:
        return 8
    elif "y6" in ft:
        return 6
    elif "x8" in ft:
        return 8
    # Default Quadcopter
    return 4


class PowertrainSolver:
    def __init__(
        self,
        frame_data: Dict[str, Any],
        motor_data: Dict[str, Any],
        propeller_data: Dict[str, Any],
        esc_data: Dict[str, Any],
        battery_data: Dict[str, Any],
        payload_weight_g: float = 0.0,
        avionics_weight_g: float = 45.0,
        avionics_power_w: float = 5.0,
        altitude_m: float = 0.0,
        temperature_c: float = 20.0,
        depth_of_discharge: float = 0.80
    ):
        self.frame = frame_data
        self.motor = motor_data
        self.prop = propeller_data
        self.esc = esc_data
        self.battery = battery_data
        self.payload_weight_g = max(0.0, float(payload_weight_g))
        self.avionics_weight_g = max(0.0, float(avionics_weight_g))
        self.avionics_power_w = max(0.0, float(avionics_power_w))
        self.altitude_m = float(altitude_m)
        self.temperature_c = float(temperature_c)
        self.dod = float(depth_of_discharge)

        # Environmental
        self.density = calculate_air_density(self.altitude_m, self.temperature_c)

        # Frame & Geometry
        self.num_rotors = get_rotor_count_from_frame_type(self.frame.get("frame_type", "Quad-X"))
        self.wheelbase_mm = float(self.frame.get("wheelbase_mm", 220.0))
        self.max_prop_size_inch = float(self.frame.get("max_prop_size_inch", 5.1))
        
        # Propeller geometry & coefficients
        self.prop_diameter_inch = float(self.prop.get("diameter_inch", 5.0))
        self.prop_pitch_inch = float(self.prop.get("pitch_inch", 4.3))
        self.prop_blade_count = int(self.prop.get("blade_count", 3))
        self.prop_diameter_m = self.prop_diameter_inch * 0.0254
        self.prop_pitch_m = self.prop_pitch_inch * 0.0254

        self.ct, self.cp = estimate_propeller_coefficients(
            diameter_inch=self.prop_diameter_inch,
            pitch_inch=self.prop_pitch_inch,
            blade_count=self.prop_blade_count,
            ct_override=self.prop.get("ct_hover"),
            cp_override=self.prop.get("cp_hover")
        )

        # Motor circuit model
        rm_ohm = float(self.motor.get("internal_resistance_mohm", 45.0)) / 1000.0
        self.motor_circuit = MotorCircuit(
            kv=float(self.motor.get("kv", 2450.0)),
            internal_resistance_ohm=rm_ohm,
            idle_current_a=float(self.motor.get("idle_current_a", 0.8)),
            max_power_w=float(self.motor.get("max_power_w", 650.0)),
            max_continuous_current_a=float(self.motor.get("max_continuous_current_a", 35.0))
        )

        # Battery model
        self.battery_model = BatteryModel(
            cells_s=int(self.battery.get("cells_s", 4)),
            capacity_mah=float(self.battery.get("capacity_mah", 1500.0)),
            c_rating_continuous=float(self.battery.get("c_rating_continuous", 100.0)),
            c_rating_burst=float(self.battery.get("c_rating_burst", 150.0)),
            internal_resistance_cell_mohm=float(self.battery.get("internal_resistance_cell_mohm", 4.0)),
            nominal_cell_voltage_v=float(self.battery.get("nominal_cell_voltage_v", 3.7)),
            cell_chemistry=self.battery.get("cell_chemistry", "LiPo"),
            depth_of_discharge=self.dod
        )

        # Mass Rollup
        self.mass = MassRollup.calculate_auw(
            num_rotors=self.num_rotors,
            frame_weight_g=float(self.frame.get("dry_weight_g", 110.0)),
            motor_weight_g=float(self.motor.get("weight_g", 32.0)),
            propeller_weight_g=float(self.prop.get("weight_g", 4.5)),
            esc_weight_g=float(self.esc.get("weight_g", 12.0)),
            battery_weight_g=float(self.battery.get("weight_g", 185.0)),
            payload_weight_g=self.payload_weight_g,
            avionics_weight_g=self.avionics_weight_g,
            is_4in1_esc=True
        )

    def solve_max_throttle_rps(self) -> float:
        """
        Solves for n_max (rev/s) at full throttle (duty cycle delta = 1.0).
        Residual f(n) = V_bat_terminal(n) - V_motor_phase(n) = 0.
        """
        kv_si = self.motor_circuit.kv_si
        kt = self.motor_circuit.kt
        rm = self.motor_circuit.rm
        r_pack = self.battery_model.r_pack_ohm
        v_pack_nom = self.battery_model.v_pack_nom
        n_rotors = self.num_rotors
        d = self.prop_diameter_m
        cp = self.cp
        rho = self.density
        i0 = self.motor_circuit.i0
        i_avionics = self.avionics_power_w / max(1.0, v_pack_nom)

        def residual(n: float) -> float:
            if n <= 0:
                return v_pack_nom
            # Aerodynamic torque Q(n)
            q = (cp / (2.0 * math.pi)) * rho * (n ** 2) * (d ** 5)
            # Motor current Im(n)
            im = (q / kt) + i0
            # Bus current Ibus(n)
            ibus = n_rotors * im + i_avionics
            # Loaded battery voltage Vbat(n)
            v_bat = max(0.0, v_pack_nom - ibus * r_pack)
            # Motor phase voltage required Vm(n)
            eb = (2.0 * math.pi * n) / kv_si
            v_m = eb + im * rm
            return v_bat - v_m

        # Search bounds: n from 0 up to no-load speed
        n_max_theoretical_noload = (v_pack_nom * self.motor_circuit.kv) / 60.0
        high = max(10.0, n_max_theoretical_noload * 1.2)
        
        try:
            # Check if root is bracketed
            f_low = residual(0.1)
            f_high = residual(high)
            if f_low * f_high <= 0:
                root = brentq(residual, 0.1, high, xtol=1e-4, maxiter=100)
                return float(max(0.0, root))
            else:
                # Approximate fallback
                return float(n_max_theoretical_noload * 0.75)
        except Exception:
            return float(n_max_theoretical_noload * 0.70)

    def simulate(self) -> Dict[str, Any]:
        """
        Executes full flight simulation and returns comprehensive powertrain telemetry.
        """
        # 1. Hover Point Solving
        t_hov_per_rotor_n = self.mass["hover_thrust_per_rotor_n"]
        n_hov_rps = solve_hover_rps(t_hov_per_rotor_n, self.prop_diameter_m, self.ct, self.density)
        n_hov_rpm = n_hov_rps * 60.0

        q_hov_nm = calculate_torque(n_hov_rps, self.prop_diameter_m, self.cp, self.density)
        p_mech_hov_motor_w = calculate_mechanical_power(n_hov_rps, self.prop_diameter_m, self.cp, self.density)
        
        motor_hov_eval = self.motor_circuit.evaluate_operating_point(n_hov_rps, q_hov_nm)
        i_m_hov = motor_hov_eval["motor_current_a"]
        v_m_hov = motor_hov_eval["phase_voltage_v"]

        # Bus electrical load at hover
        i_avionics = self.avionics_power_w / max(1.0, self.battery_model.v_pack_nom)
        i_bus_hov = self.num_rotors * i_m_hov + i_avionics

        battery_hov_eval = self.battery_model.evaluate_battery_state(i_bus_hov)
        v_bat_loaded_hov = battery_hov_eval["pack_terminal_voltage_v"]
        
        # Hover Duty Cycle (effective throttle)
        duty_cycle_hov = (v_m_hov / v_bat_loaded_hov) if v_bat_loaded_hov > 0 else 1.0
        hover_throttle_pct = min(100.0, max(0.0, duty_cycle_hov * 100.0))

        hover_time_mins = self.battery_model.estimate_flight_endurance_mins(i_bus_hov)
        # Cruise endurance estimated at ~1.25x hover power
        cruise_time_mins = hover_time_mins / 1.25 if hover_time_mins > 0 else 0.0

        total_elec_hover_power_w = v_bat_loaded_hov * i_bus_hov
        hover_efficiency_g_per_w = (self.mass["auw_g"] / total_elec_hover_power_w) if total_elec_hover_power_w > 0 else 0.0

        # Induced velocity at hover
        v_induced_hov_mps = calculate_induced_velocity_hover(t_hov_per_rotor_n, self.prop_diameter_m, self.density)

        # 2. Maximum Throttle Point Solving
        n_max_rps = self.solve_max_throttle_rps()
        n_max_rpm = n_max_rps * 60.0

        q_max_nm = calculate_torque(n_max_rps, self.prop_diameter_m, self.cp, self.density)
        motor_max_eval = self.motor_circuit.evaluate_operating_point(n_max_rps, q_max_nm)
        
        t_max_per_rotor_n = calculate_thrust(n_max_rps, self.prop_diameter_m, self.ct, self.density)
        t_max_total_n = self.num_rotors * t_max_per_rotor_n
        t_max_total_kgf = t_max_total_n / GRAVITY
        t_max_total_g = t_max_total_kgf * 1000.0

        i_m_max = motor_max_eval["motor_current_a"]
        i_bus_max = self.num_rotors * i_m_max + i_avionics
        battery_max_eval = self.battery_model.evaluate_battery_state(i_bus_max)

        twr = (t_max_total_n / self.mass["total_hover_force_n"]) if self.mass["total_hover_force_n"] > 0 else 0.0
        max_throttle_endurance_mins = self.battery_model.estimate_flight_endurance_mins(i_bus_max)

        # Estimated pitch speed & theoretical max top speed (level flight approx)
        pitch_speed_mps = n_max_rps * self.prop_pitch_m
        estimated_top_speed_kmh = (pitch_speed_mps * 3.6) * 0.82  # ~82% pitch speed efficiency

        # Total system cost rollup
        frame_price = float(self.frame.get("price_usd", 45.0))
        motor_price = float(self.motor.get("price_usd", 22.0)) * self.num_rotors
        prop_price = float(self.prop.get("price_usd", 3.5)) * (self.num_rotors / 2.0)
        esc_price = float(self.esc.get("price_usd", 55.0))
        battery_price = float(self.battery.get("price_usd", 35.0))
        total_cost_usd = frame_price + motor_price + prop_price + esc_price + battery_price

        # 3. Generate Throttle Sweep (0% to 100% in 11 steps for charts)
        throttle_curve = []
        for pct in range(0, 105, 10):
            delta = max(0.01, pct / 100.0)
            n_sweep_rps = n_max_rps * math.sqrt(delta)
            t_sweep_n = calculate_thrust(n_sweep_rps, self.prop_diameter_m, self.ct, self.density) * self.num_rotors
            q_sweep = calculate_torque(n_sweep_rps, self.prop_diameter_m, self.cp, self.density)
            im_sweep = self.motor_circuit.compute_motor_current(q_sweep)
            ibus_sweep = self.num_rotors * im_sweep + i_avionics
            v_terminal_sweep = self.battery_model.calculate_terminal_voltage(ibus_sweep)
            p_elec_sweep = v_terminal_sweep * ibus_sweep

            throttle_curve.append({
                "throttle_pct": pct,
                "rotational_speed_rpm": round(n_sweep_rps * 60.0, 1),
                "total_thrust_g": round((t_sweep_n / GRAVITY) * 1000.0, 1),
                "total_thrust_n": round(t_sweep_n, 2),
                "bus_current_a": round(ibus_sweep, 2),
                "motor_current_a": round(im_sweep, 2),
                "total_power_w": round(p_elec_sweep, 1),
                "terminal_voltage_v": round(v_terminal_sweep, 2),
                "twr": round(t_sweep_n / max(0.001, self.mass["total_hover_force_n"]), 2)
            })

        return {
            "mass": self.mass,
            "aerodynamics": {
                "air_density_kg_m3": round(self.density, 4),
                "altitude_m": self.altitude_m,
                "temperature_c": self.temperature_c,
                "ct": round(self.ct, 4),
                "cp": round(self.cp, 4),
                "prop_diameter_inch": self.prop_diameter_inch,
                "prop_pitch_inch": self.prop_pitch_inch,
                "prop_blade_count": self.prop_blade_count,
                "induced_velocity_hover_mps": round(v_induced_hov_mps, 2),
            },
            "hover": {
                "hover_throttle_pct": round(hover_throttle_pct, 1),
                "hover_rotational_speed_rpm": round(n_hov_rpm, 0),
                "hover_rotational_speed_rps": round(n_hov_rps, 1),
                "hover_thrust_per_rotor_g": round(self.mass["hover_thrust_per_rotor_g"], 1),
                "hover_thrust_per_rotor_n": round(t_hov_per_rotor_n, 2),
                "hover_motor_current_a": round(i_m_hov, 2),
                "hover_bus_current_a": round(i_bus_hov, 2),
                "hover_motor_phase_voltage_v": round(v_m_hov, 2),
                "hover_battery_terminal_voltage_v": round(v_bat_loaded_hov, 2),
                "hover_motor_mechanical_power_w": round(p_mech_hov_motor_w, 2),
                "hover_motor_electrical_power_w": round(motor_hov_eval["electrical_power_w"], 2),
                "hover_total_electrical_power_w": round(total_elec_hover_power_w, 2),
                "hover_motor_efficiency_pct": round(motor_hov_eval["motor_efficiency"] * 100.0, 1),
                "hover_efficiency_g_per_w": round(hover_efficiency_g_per_w, 2),
                "hover_flight_time_minutes": round(hover_time_mins, 1),
                "cruise_flight_time_minutes": round(cruise_time_mins, 1),
            },
            "max_performance": {
                "twr": round(twr, 2),
                "max_total_thrust_g": round(t_max_total_g, 1),
                "max_total_thrust_n": round(t_max_total_n, 2),
                "max_thrust_per_rotor_g": round((t_max_per_rotor_n / GRAVITY) * 1000.0, 1),
                "max_rotational_speed_rpm": round(n_max_rpm, 0),
                "max_motor_current_a": round(i_m_max, 2),
                "max_bus_current_a": round(i_bus_max, 2),
                "max_battery_loaded_voltage_v": round(battery_max_eval["pack_terminal_voltage_v"], 2),
                "max_battery_cell_voltage_v": round(battery_max_eval["loaded_cell_voltage_v"], 2),
                "max_motor_elec_power_w": round(motor_max_eval["electrical_power_w"], 2),
                "max_total_elec_power_w": round(battery_max_eval["total_electrical_power_w"], 2),
                "max_thermal_dissipation_per_motor_w": round(motor_max_eval["thermal_dissipation_w"], 2),
                "max_pitch_speed_mps": round(pitch_speed_mps, 1),
                "estimated_top_speed_kmh": round(estimated_top_speed_kmh, 1),
                "burst_flight_time_minutes": round(max_throttle_endurance_mins, 2),
            },
            "financial": {
                "frame_cost_usd": frame_price,
                "motors_total_cost_usd": motor_price,
                "props_total_cost_usd": prop_price,
                "esc_cost_usd": esc_price,
                "battery_cost_usd": battery_price,
                "total_cost_usd": round(total_cost_usd, 2)
            },
            "throttle_curve": throttle_curve
        }
