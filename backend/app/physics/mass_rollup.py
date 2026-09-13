"""
Mass Rollup & AUW (All-Up-Weight) Calculator for DroneCraft.
Calculates total dry weight, takeoff weight, weight distribution breakdown,
and hover thrust requirements per rotor.
"""

from typing import Dict, Any

GRAVITY = 9.80665  # m/s^2

class MassRollup:
    @staticmethod
    def calculate_auw(
        num_rotors: int,
        frame_weight_g: float,
        motor_weight_g: float,
        propeller_weight_g: float,
        esc_weight_g: float,
        battery_weight_g: float,
        payload_weight_g: float = 0.0,
        avionics_weight_g: float = 45.0,
        is_4in1_esc: bool = False
    ) -> Dict[str, Any]:
        """
        Calculates total AUW and per-rotor hover thrust requirement.
        
        :param num_rotors: 3 (Tricopter), 4 (Quad), 6 (Hexa), 8 (Octo)
        :param frame_weight_g: Frame dry mass (g)
        :param motor_weight_g: Single motor mass (g)
        :param propeller_weight_g: Single propeller mass (g)
        :param esc_weight_g: Single individual ESC or 4-in-1 ESC mass (g)
        :param battery_weight_g: Battery pack mass (g)
        :param payload_weight_g: Payload mass (camera, sensor, cargo) (g)
        :param avionics_weight_g: FC, Receiver, GPS, VTX, wiring mass (g)
        :param is_4in1_esc: True if single 4-in-1 ESC board, False if discrete per-arm ESCs
        """
        n = max(1, int(num_rotors))
        total_motors_g = n * max(0.0, float(motor_weight_g))
        total_props_g = n * max(0.0, float(propeller_weight_g))
        
        if is_4in1_esc:
            total_escs_g = max(0.0, float(esc_weight_g))
        else:
            total_escs_g = n * max(0.0, float(esc_weight_g))

        m_frame = max(0.0, float(frame_weight_g))
        m_battery = max(0.0, float(battery_weight_g))
        m_payload = max(0.0, float(payload_weight_g))
        m_avionics = max(0.0, float(avionics_weight_g))

        dry_weight_g = m_frame + total_motors_g + total_props_g + total_escs_g + m_avionics
        auw_without_payload_g = dry_weight_g + m_battery
        auw_g = auw_without_payload_g + m_payload
        auw_kg = auw_g / 1000.0

        # Total gravitational force in Newtons
        total_hover_force_n = auw_kg * GRAVITY
        # Required thrust per rotor for hover equilibrium
        hover_thrust_per_rotor_n = total_hover_force_n / n
        hover_thrust_per_rotor_g = (hover_thrust_per_rotor_n / GRAVITY) * 1000.0

        return {
            "num_rotors": n,
            "frame_weight_g": m_frame,
            "total_motors_weight_g": total_motors_g,
            "total_props_weight_g": total_props_g,
            "total_escs_weight_g": total_escs_g,
            "battery_weight_g": m_battery,
            "avionics_weight_g": m_avionics,
            "payload_weight_g": m_payload,
            "dry_weight_g": float(dry_weight_g),
            "auw_g": float(auw_g),
            "auw_kg": float(auw_kg),
            "total_hover_force_n": float(total_hover_force_n),
            "hover_thrust_per_rotor_n": float(hover_thrust_per_rotor_n),
            "hover_thrust_per_rotor_g": float(hover_thrust_per_rotor_g),
            "mass_breakdown_percentages": {
                "frame": (m_frame / auw_g * 100.0) if auw_g > 0 else 0,
                "motors": (total_motors_g / auw_g * 100.0) if auw_g > 0 else 0,
                "propellers": (total_props_g / auw_g * 100.0) if auw_g > 0 else 0,
                "escs": (total_escs_g / auw_g * 100.0) if auw_g > 0 else 0,
                "battery": (m_battery / auw_g * 100.0) if auw_g > 0 else 0,
                "avionics": (m_avionics / auw_g * 100.0) if auw_g > 0 else 0,
                "payload": (m_payload / auw_g * 100.0) if auw_g > 0 else 0,
            }
        }
