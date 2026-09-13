"use client";

import React from "react";
import { useDroneStore } from "@/lib/store";
import { PartSelectorSlot } from "./PartSelectorSlot";
import { Sliders, DollarSign, Weight, AlertCircle, Sparkles, Zap } from "lucide-react";

export const ConfiguratorView: React.FC = () => {
  const {
    selectedFrame,
    selectedMotor,
    selectedProp,
    selectedEsc,
    selectedBattery,
    payloadWeightG,
    setPayloadWeightG,
    altitudeM,
    setAltitudeM,
    temperatureC,
    setTemperatureC,
    setPickerCategory,
    simulation,
    diagnostics,
    setActiveTab
  } = useDroneStore();

  const numRotors = simulation?.mass.num_rotors || 4;

  return (
    <div className="space-y-6">
      {/* Alert banner if build is dangerous or invalid */}
      {diagnostics && !diagnostics.is_flight_ready && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <div>
              <h4 className="text-sm font-semibold text-rose-200">
                Hardware Mismatch / Diagnostic Alert
              </h4>
              <p className="text-xs text-rose-300 font-mono">
                {diagnostics.action_items[0]?.issue || "Powertrain limits exceeded."}
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab("diagnostics")}
            className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-mono font-medium transition-colors shrink-0"
          >
            Review Fixes ({diagnostics.action_items.length})
          </button>
        </div>
      )}

      {/* Main 5 Part Slots Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <PartSelectorSlot
          category="frames"
          title="1. Airframe"
          part={selectedFrame}
          onOpenPicker={() => setPickerCategory("frames")}
        />
        <PartSelectorSlot
          category="motors"
          title={`2. Motors (${numRotors}x)`}
          part={selectedMotor}
          onOpenPicker={() => setPickerCategory("motors")}
        />
        <PartSelectorSlot
          category="propellers"
          title={`3. Propellers (${numRotors}x)`}
          part={selectedProp}
          onOpenPicker={() => setPickerCategory("propellers")}
        />
        <PartSelectorSlot
          category="escs"
          title="4. ESC (Speed Controller)"
          part={selectedEsc}
          onOpenPicker={() => setPickerCategory("escs")}
        />
        <PartSelectorSlot
          category="batteries"
          title="5. Battery Pack"
          part={selectedBattery}
          onOpenPicker={() => setPickerCategory("batteries")}
        />

        {/* Environmental & Mission Parameters Card */}
        <div className="glass-panel rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-3 mb-3 border-b border-slate-800">
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                <Sliders className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <span className="text-xs uppercase font-mono tracking-wider text-slate-400">Mission Envelope</span>
                <h3 className="font-semibold text-white text-sm">Payload & Environment</h3>
              </div>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>Payload Cargo / Camera:</span>
                  <span className="text-cyan-400 font-bold">{payloadWeightG}g</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="2000"
                  step="25"
                  value={payloadWeightG}
                  onChange={(e) => setPayloadWeightG(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>Takeoff Altitude:</span>
                  <span className="text-slate-200">{altitudeM}m</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="4000"
                  step="100"
                  value={altitudeM}
                  onChange={(e) => setAltitudeM(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>Ambient Temperature:</span>
                  <span className="text-slate-200">{temperatureC} deg C</span>
                </div>
                <input
                  type="range"
                  min="-10"
                  max="45"
                  step="5"
                  value={temperatureC}
                  onChange={(e) => setTemperatureC(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center text-xs font-mono">
            <span className="text-slate-400">Air Density (ρ):</span>
            <span className="text-cyan-400 font-bold">
              {simulation?.aerodynamics.air_density_kg_m3 || 1.225} kg/m³
            </span>
          </div>
        </div>
      </div>

      {/* Bill of Materials (BOM) & Mass Rollup Strip */}
      {simulation && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Cost Rollup Card */}
          <div className="glass-panel rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                Bill of Materials (BOM) Cost Breakdown
              </h3>
              <span className="text-lg font-bold font-mono text-emerald-400">
                ${simulation.financial.total_cost_usd}
              </span>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between py-1 border-b border-slate-800/60 text-slate-400">
                <span>Frame ({selectedFrame?.name}):</span>
                <span className="text-slate-200">${simulation.financial.frame_cost_usd}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60 text-slate-400">
                <span>Motors ({numRotors}x {selectedMotor?.model}):</span>
                <span className="text-slate-200">${simulation.financial.motors_total_cost_usd}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60 text-slate-400">
                <span>Propellers ({numRotors / 2} sets):</span>
                <span className="text-slate-200">${simulation.financial.props_total_cost_usd}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60 text-slate-400">
                <span>ESC ({selectedEsc?.model}):</span>
                <span className="text-slate-200">${simulation.financial.esc_cost_usd}</span>
              </div>
              <div className="flex justify-between py-1 text-slate-400">
                <span>Battery ({selectedBattery?.brand} {selectedBattery?.cells_s}S):</span>
                <span className="text-slate-200">${simulation.financial.battery_cost_usd}</span>
              </div>
            </div>
          </div>

          {/* Mass Rollup Breakdown Card */}
          <div className="glass-panel rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Weight className="w-4 h-4 text-cyan-400" />
                All-Up-Weight (AUW) Rollup: {simulation.mass.auw_g}g
              </h3>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                {simulation.mass.auw_kg} kg
              </span>
            </div>

            {/* Mass Progress Bar */}
            <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden flex mb-3">
              <div
                style={{ width: `${simulation.mass.mass_breakdown_percentages.battery}%` }}
                title={`Battery: ${simulation.mass.battery_weight_g}g`}
                className="bg-rose-500 h-full"
              />
              <div
                style={{ width: `${simulation.mass.mass_breakdown_percentages.motors}%` }}
                title={`Motors: ${simulation.mass.total_motors_weight_g}g`}
                className="bg-emerald-500 h-full"
              />
              <div
                style={{ width: `${simulation.mass.mass_breakdown_percentages.frame}%` }}
                title={`Frame: ${simulation.mass.frame_weight_g}g`}
                className="bg-cyan-500 h-full"
              />
              <div
                style={{ width: `${simulation.mass.mass_breakdown_percentages.payload}%` }}
                title={`Payload: ${simulation.mass.payload_weight_g}g`}
                className="bg-amber-500 h-full"
              />
              <div
                style={{ width: `${simulation.mass.mass_breakdown_percentages.escs + simulation.mass.mass_breakdown_percentages.propellers + simulation.mass.mass_breakdown_percentages.avionics}%` }}
                title="Other Electronics"
                className="bg-purple-500 h-full"
              />
            </div>

            <div className="grid grid-cols-3 gap-2 text-[11px] font-mono text-slate-400">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span>Battery: {simulation.mass.battery_weight_g}g</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>Motors: {simulation.mass.total_motors_weight_g}g</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
                <span>Frame: {simulation.mass.frame_weight_g}g</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span>Payload: {simulation.mass.payload_weight_g}g</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                <span>Electronics: {simulation.mass.total_escs_weight_g + simulation.mass.avionics_weight_g}g</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                <span>Props: {simulation.mass.total_props_weight_g}g</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
