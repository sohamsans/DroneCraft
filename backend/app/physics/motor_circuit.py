"""
DC Equivalent Brushless Motor Circuit Model for DroneCraft.
Models back-EMF, winding resistance, idle current, mechanical/electrical power,
thermal dissipation, and motor efficiency.
"""

import math
from typing import Dict, Any

class MotorCircuit:
    def __init__(
        self,
        kv: float,
        internal_resistance_ohm: float,
        idle_current_a: float = 0.5,
        max_power_w: float = 500.0,
        max_continuous_current_a: float = 30.0
    ):
        """
        :param kv: Motor velocity constant in RPM/V
        :param internal_resistance_ohm: Stator winding phase-to-phase resistance Rm (Ohms)
        :param idle_current_a: No-load / iron / friction current I0 (Amps)
        :param max_power_w: Maximum rated electrical continuous power (Watts)
        :param max_continuous_current_a: Maximum continuous current rating (Amps)
        """
        self.kv = max(10.0, float(kv))
        self.rm = max(0.001, float(internal_resistance_ohm))
        self.i0 = max(0.01, float(idle_current_a))
        self.max_power_w = max(1.0, float(max_power_w))
        self.max_current_a = max(1.0, float(max_continuous_current_a))

        # SI Kv in rad/(s*V)
        self.kv_si = (self.kv * 2.0 * math.pi) / 60.0
        # Torque constant Kt in N*m/A: Kt = 1 / Kv_si = 60 / (2 * pi * Kv)
        self.kt = 1.0 / self.kv_si

    def compute_back_emf(self, rotational_speed_rps: float) -> float:
        """
        Eb = omega / Kv_si = (2 * pi * n) / Kv_si = (60 * n) / Kv [Volts]
        """
        if rotational_speed_rps <= 0:
            return 0.0
        omega = 2.0 * math.pi * rotational_speed_rps
        return omega / self.kv_si

    def compute_motor_current(self, torque_nm: float) -> float:
        """
        Im = (Q / Kt) + I0 = (2 * pi * Kv / 60) * Q + I0 [Amps]
        """
        if torque_nm <= 0:
            return self.i0
        return (torque_nm / self.kt) + self.i0

    def compute_phase_voltage(self, rotational_speed_rps: float, motor_current_a: float) -> float:
        """
        Vm = Eb + Im * Rm [Volts]
        """
        eb = self.compute_back_emf(rotational_speed_rps)
        return eb + motor_current_a * self.rm

    def evaluate_operating_point(
        self,
        rotational_speed_rps: float,
        torque_nm: float
    ) -> Dict[str, float]:
        """
        Evaluates full electromechanical parameters at given rotational speed and aerodynamic torque.
        """
        eb = self.compute_back_emf(rotational_speed_rps)
        im = self.compute_motor_current(torque_nm)
        vm = eb + im * self.rm
        
        p_mech = 2.0 * math.pi * rotational_speed_rps * torque_nm if rotational_speed_rps > 0 else 0.0
        p_elec = vm * im
        p_heat = (im ** 2) * self.rm
        
        efficiency = (p_mech / p_elec) if p_elec > 0 else 0.0
        efficiency = max(0.0, min(1.0, efficiency))

        return {
            "rotational_speed_rps": float(rotational_speed_rps),
            "rotational_speed_rpm": float(rotational_speed_rps * 60.0),
            "torque_nm": float(torque_nm),
            "back_emf_v": float(eb),
            "motor_current_a": float(im),
            "phase_voltage_v": float(vm),
            "mechanical_power_w": float(p_mech),
            "electrical_power_w": float(p_elec),
            "thermal_dissipation_w": float(p_heat),
            "motor_efficiency": float(efficiency)
        }
