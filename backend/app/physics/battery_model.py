"""
Battery Electrochemistry & Internal Resistance Voltage Droop Model for DroneCraft.
Calculates terminal voltage sag under load, usable energy, C-rating limits, and flight times.
"""

from typing import Dict, Any

class BatteryModel:
    def __init__(
        self,
        cells_s: int,
        capacity_mah: float,
        c_rating_continuous: float = 30.0,
        c_rating_burst: float = 60.0,
        internal_resistance_cell_mohm: float = 5.0,
        nominal_cell_voltage_v: float = 3.7,
        cell_chemistry: str = "LiPo",
        depth_of_discharge: float = 0.80
    ):
        """
        :param cells_s: Series cell count S (e.g. 4 for 4S, 6 for 6S)
        :param capacity_mah: Nominal battery capacity in milliamp-hours
        :param c_rating_continuous: Continuous discharge C-rating
        :param c_rating_burst: Burst discharge C-rating (10s pulse)
        :param internal_resistance_cell_mohm: Internal resistance per cell in milliOhms (mΩ)
        :param nominal_cell_voltage_v: Nominal open-circuit voltage per cell (3.7V standard LiPo, 3.8V LiHV)
        :param cell_chemistry: LiPo, Li-ion, LiHV, LiFePO4
        :param depth_of_discharge: Usable discharge percentage (0.80 = 80%)
        """
        self.cells_s = max(1, int(cells_s))
        self.capacity_mah = max(100.0, float(capacity_mah))
        self.capacity_ah = self.capacity_mah / 1000.0
        self.c_rating_cont = max(1.0, float(c_rating_continuous))
        self.c_rating_burst = max(self.c_rating_cont, float(c_rating_burst))
        self.r_cell_ohm = max(0.1, float(internal_resistance_cell_mohm)) / 1000.0  # convert mΩ to Ω
        self.v_cell_nom = float(nominal_cell_voltage_v)
        self.cell_chemistry = cell_chemistry
        self.dod = max(0.1, min(1.0, float(depth_of_discharge)))

        # Pack aggregated properties
        self.v_pack_nom = self.cells_s * self.v_cell_nom
        self.r_pack_ohm = self.cells_s * self.r_cell_ohm
        self.max_continuous_current_a = self.c_rating_cont * self.capacity_ah
        self.max_burst_current_a = self.c_rating_burst * self.capacity_ah
        self.nominal_energy_wh = self.v_pack_nom * self.capacity_ah
        self.usable_energy_wh = self.nominal_energy_wh * self.dod

    def calculate_terminal_voltage(self, bus_current_a: float, cell_voltage_ocv: float = None) -> float:
        """
        Calculates loaded battery terminal voltage taking into account internal resistance sag:
        V_bat,loaded = S * V_cell,ocv - I_bus * (S * R_cell)
        """
        v_ocv = (self.cells_s * cell_voltage_ocv) if cell_voltage_ocv is not None else self.v_pack_nom
        v_sag = bus_current_a * self.r_pack_ohm
        v_terminal = max(0.0, v_ocv - v_sag)
        return float(v_terminal)

    def calculate_loaded_cell_voltage(self, bus_current_a: float) -> float:
        """
        Loaded voltage per single cell under bus current.
        """
        v_terminal = self.calculate_terminal_voltage(bus_current_a)
        return float(v_terminal / self.cells_s)

    def estimate_flight_endurance_mins(self, bus_current_a: float) -> float:
        """
        Endurance t_flight = (Capacity_Ah * DoD / I_bus) * 60 [minutes]
        """
        if bus_current_a <= 0:
            return 0.0
        return float((self.capacity_ah * self.dod / bus_current_a) * 60.0)

    def evaluate_battery_state(self, bus_current_a: float) -> Dict[str, Any]:
        """
        Evaluates electrical sag, power delivery, C-rate utilization, and endurance.
        """
        v_terminal = self.calculate_terminal_voltage(bus_current_a)
        v_cell_loaded = self.calculate_loaded_cell_voltage(bus_current_a)
        power_delivered_w = v_terminal * bus_current_a
        c_rate_actual = bus_current_a / self.capacity_ah if self.capacity_ah > 0 else 0.0
        flight_time_min = self.estimate_flight_endurance_mins(bus_current_a)

        is_c_cont_exceeded = bus_current_a > self.max_continuous_current_a
        is_c_burst_exceeded = bus_current_a > self.max_burst_current_a
        is_brownout_risk = v_cell_loaded < 3.2

        return {
            "pack_nominal_voltage_v": float(self.v_pack_nom),
            "pack_terminal_voltage_v": float(v_terminal),
            "loaded_cell_voltage_v": float(v_cell_loaded),
            "internal_resistance_pack_ohm": float(self.r_pack_ohm),
            "bus_current_a": float(bus_current_a),
            "total_electrical_power_w": float(power_delivered_w),
            "actual_c_rate": float(c_rate_actual),
            "flight_time_minutes": float(flight_time_min),
            "is_c_cont_exceeded": bool(is_c_cont_exceeded),
            "is_c_burst_exceeded": bool(is_c_burst_exceeded),
            "is_brownout_risk": bool(is_brownout_risk)
        }
