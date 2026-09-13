"use client";

import React from "react";
import { useDroneStore } from "@/lib/store";
import { ThrottleCurvesChart } from "./ThrottleCurvesChart";
import {
  Gauge,
  Clock,
  Zap,
  Flame,
  Wind,
  TrendingUp,
  Activity,
  Compass,
  BatteryCharging
} from "lucide-react";

export const PerformanceHUD: React.FC = () => {
  const { simulation, diagnostics } = useDroneStore();

  if (!simulation) {
    return (
      <div className="glass-panel rounded-xl p-12 text-center text-slate-400 font-mono">
        <Activity className="w-8 h-8 text-cyan-400 mx-auto mb-3 animate-pulse" />
        <p>Awaiting build telemetry... Select your powertrain components in the Configurator.</p>
      </div>
    );
  }

  const { mass, hover, max_performance, financial, throttle_curve } = simulation;

  // Hover throttle color
  const getThrottleColor = (pct: number) => {
    if (pct < 30) return "text-cyan-400";
    if (pct <= 50) return "text-emerald-400";
    if (pct <= 65) return "text-yellow-400";
    return "text-rose-400";
  };

  // TWR color
  const getTwrColor = (twr: number) => {
    if (twr < 1.5) return "text-rose-400";
    if (twr < 1.8) return "text-amber-400";
    if (twr <= 3.5) return "text-emerald-400";
    if (twr <= 6.0) return "text-cyan-400";
    return "text-purple-400";
  };

  return (
    <div className="space-y-6">
      {/* Top 4 Primary Critical Telemetry Gauges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gauge 1: Hover Throttle */}
        <div className="glass-panel rounded-xl p-5 border-l-4 border-l-cyan-500">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs uppercase font-mono tracking-wider">Hover Throttle</span>
            <Gauge className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-black font-mono ${getThrottleColor(hover.hover_throttle_pct)}`}>
              {hover.hover_throttle_pct}%
            </span>
            <span className="text-xs text-slate-400 font-mono">
              ({hover.hover_rotational_speed_rpm} RPM)
            </span>
          </div>
          {/* Progress bar */}
          <div className="w-full h-1.5 bg-slate-800 rounded-full mt-3 overflow-hidden">
            <div
              style={{ width: `${Math.min(100, hover.hover_throttle_pct)}%` }}
              className={`h-full ${hover.hover_throttle_pct > 65 ? "bg-rose-500" : hover.hover_throttle_pct > 50 ? "bg-yellow-500" : "bg-emerald-500"}`}
            />
          </div>
          <p className="text-[11px] text-slate-500 font-mono mt-2">
            Optimal multirotor hover band: 35% to 50%
          </p>
        </div>

        {/* Gauge 2: Thrust-to-Weight Ratio (TWR) */}
        <div className="glass-panel rounded-xl p-5 border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs uppercase font-mono tracking-wider">Thrust-to-Weight</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-black font-mono ${getTwrColor(max_performance.twr)}`}>
              {max_performance.twr}:1
            </span>
            <span className="text-xs text-slate-400 font-mono">
              ({max_performance.max_total_thrust_g}g max)
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full mt-3 overflow-hidden">
            <div
              style={{ width: `${Math.min(100, (max_performance.twr / 8.0) * 100)}%` }}
              className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400"
            />
          </div>
          <p className="text-[11px] text-slate-500 font-mono mt-2">
            Max total thrust: {max_performance.max_total_thrust_n} Newtons
          </p>
        </div>

        {/* Gauge 3: Hover Flight Endurance */}
        <div className="glass-panel rounded-xl p-5 border-l-4 border-l-purple-500">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs uppercase font-mono tracking-wider">Hover Endurance</span>
            <Clock className="w-4 h-4 text-purple-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black font-mono text-purple-300">
              {hover.hover_flight_time_minutes}
            </span>
            <span className="text-sm text-slate-400 font-mono">mins</span>
          </div>
          <div className="flex justify-between text-xs font-mono text-slate-400 mt-3 pt-2 border-t border-slate-800/80">
            <span>Cruise Time: <strong className="text-slate-200">{hover.cruise_flight_time_minutes}m</strong></span>
            <span>Burst: <strong className="text-slate-200">{max_performance.burst_flight_time_minutes}m</strong></span>
          </div>
        </div>

        {/* Gauge 4: Hover Efficiency (g/W) */}
        <div className="glass-panel rounded-xl p-5 border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs uppercase font-mono tracking-wider">Aerodynamic Efficiency</span>
            <BatteryCharging className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black font-mono text-amber-300">
              {hover.hover_efficiency_g_per_w}
            </span>
            <span className="text-sm text-slate-400 font-mono">g/W</span>
          </div>
          <div className="flex justify-between text-xs font-mono text-slate-400 mt-3 pt-2 border-t border-slate-800/80">
            <span>Hover Power: <strong className="text-slate-200">{hover.hover_total_electrical_power_w}W</strong></span>
            <span>Current: <strong className="text-slate-200">{hover.hover_bus_current_a}A</strong></span>
          </div>
        </div>
      </div>

      {/* Throttle Performance Dynamic Sweep Chart */}
      <ThrottleCurvesChart
        curveData={throttle_curve}
        hoverThrottlePct={hover.hover_throttle_pct}
      />

      {/* Detailed Secondary Telemetry Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono">
        {/* Column 1: Aerodynamics & Velocity */}
        <div className="glass-panel rounded-xl p-5 space-y-3 text-xs">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800 text-cyan-400 font-bold">
            <Wind className="w-4 h-4" />
            <span>Aerodynamics & Velocity</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Estimated Level Top Speed:</span>
            <span className="text-slate-200 font-bold">{max_performance.estimated_top_speed_kmh} km/h</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Prop Pitch Speed:</span>
            <span className="text-slate-200">{max_performance.max_pitch_speed_mps} m/s</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Induced Hover Velocity:</span>
            <span className="text-slate-200">{simulation.aerodynamics.induced_velocity_hover_mps} m/s</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Thrust Coefficient (CT):</span>
            <span className="text-slate-200">{simulation.aerodynamics.ct}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Power Coefficient (CP):</span>
            <span className="text-slate-200">{simulation.aerodynamics.cp}</span>
          </div>
        </div>

        {/* Column 2: Electrical & Battery Bus */}
        <div className="glass-panel rounded-xl p-5 space-y-3 text-xs">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800 text-amber-400 font-bold">
            <Zap className="w-4 h-4" />
            <span>Electrical & Battery Bus</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Max Throttle Bus Current:</span>
            <span className="text-amber-400 font-bold">{max_performance.max_bus_current_a} A</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Max Per-Motor Current:</span>
            <span className="text-slate-200">{max_performance.max_motor_current_a} A</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Loaded Pack Voltage (Sag):</span>
            <span className="text-slate-200">{max_performance.max_battery_loaded_voltage_v} V</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Loaded Cell Voltage:</span>
            <span className={`font-bold ${max_performance.max_battery_cell_voltage_v < 3.2 ? "text-rose-400" : "text-emerald-400"}`}>
              {max_performance.max_battery_cell_voltage_v} V/cell
            </span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Peak Electrical Power:</span>
            <span className="text-slate-200 font-bold">{max_performance.max_total_elec_power_w} W</span>
          </div>
        </div>

        {/* Column 3: Thermal & Stator Dissipation */}
        <div className="glass-panel rounded-xl p-5 space-y-3 text-xs">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800 text-rose-400 font-bold">
            <Flame className="w-4 h-4" />
            <span>Thermal & Stator Dissipation</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Max Thermal Dissipation:</span>
            <span className="text-rose-400 font-bold">{max_performance.max_thermal_dissipation_per_motor_w} W / motor</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Motor Peak Power:</span>
            <span className="text-slate-200">{max_performance.max_motor_elec_power_w} W</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Motor Hover Efficiency:</span>
            <span className="text-emerald-400">{hover.hover_motor_efficiency_pct}%</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Max Rotational Speed:</span>
            <span className="text-slate-200 font-bold">{max_performance.max_rotational_speed_rpm} RPM</span>
          </div>
        </div>
      </div>
    </div>
  );
};
