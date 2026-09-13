"use client";

import React from "react";
import { ArrowRightLeft, Cpu, Disc, Zap, Battery as BatteryIcon, Box, ExternalLink } from "lucide-react";

interface PartSelectorSlotProps {
  category: "frames" | "motors" | "propellers" | "escs" | "batteries";
  title: string;
  part: any | null;
  onOpenPicker: () => void;
}

export const PartSelectorSlot: React.FC<PartSelectorSlotProps> = ({
  category,
  title,
  part,
  onOpenPicker
}) => {
  const getCategoryIcon = () => {
    switch (category) {
      case "frames":
        return <Box className="w-5 h-5 text-cyan-400" />;
      case "motors":
        return <Cpu className="w-5 h-5 text-emerald-400" />;
      case "propellers":
        return <Disc className="w-5 h-5 text-purple-400" />;
      case "escs":
        return <Zap className="w-5 h-5 text-amber-400" />;
      case "batteries":
        return <BatteryIcon className="w-5 h-5 text-rose-400" />;
    }
  };

  const renderSpecs = () => {
    if (!part) return null;
    switch (category) {
      case "frames":
        return (
          <div className="grid grid-cols-2 gap-2 text-xs font-mono text-slate-300">
            <div>Wheelbase: <span className="text-cyan-400">{part.wheelbase_mm}mm</span></div>
            <div>Max Prop: <span className="text-cyan-400">{part.max_prop_size_inch}&quot;</span></div>
            <div>Weight: <span className="text-slate-200">{part.dry_weight_g}g</span></div>
            <div>Type: <span className="text-slate-200">{part.frame_type}</span></div>
          </div>
        );
      case "motors":
        return (
          <div className="grid grid-cols-2 gap-2 text-xs font-mono text-slate-300">
            <div>Kv: <span className="text-emerald-400">{part.kv} RPM/V</span></div>
            <div>Resistance: <span className="text-emerald-400">{part.internal_resistance_mohm} mΩ</span></div>
            <div>Max Power: <span className="text-slate-200">{part.max_power_w}W</span></div>
            <div>Peak Current: <span className="text-slate-200">{part.max_continuous_current_a}A</span></div>
          </div>
        );
      case "propellers":
        return (
          <div className="grid grid-cols-2 gap-2 text-xs font-mono text-slate-300">
            <div>Diameter: <span className="text-purple-400">{part.diameter_inch}&quot;</span></div>
            <div>Pitch: <span className="text-purple-400">{part.pitch_inch}&quot;</span></div>
            <div>Blades: <span className="text-slate-200">{part.blade_count}</span></div>
            <div>Weight: <span className="text-slate-200">{part.weight_g}g</span></div>
          </div>
        );
      case "escs":
        return (
          <div className="grid grid-cols-2 gap-2 text-xs font-mono text-slate-300">
            <div>Continuous: <span className="text-amber-400">{part.continuous_current_a}A</span></div>
            <div>Burst: <span className="text-amber-400">{part.burst_current_a}A</span></div>
            <div>Voltage: <span className="text-slate-200">{part.voltage_min_s}S - {part.voltage_max_s}S</span></div>
            <div>Type: <span className="text-slate-200">{part.form_factor || "4-in-1"}</span></div>
          </div>
        );
      case "batteries":
        return (
          <div className="grid grid-cols-2 gap-2 text-xs font-mono text-slate-300">
            <div>Cells: <span className="text-rose-400">{part.cells_s}S ({part.cells_s * 3.7}V)</span></div>
            <div>Capacity: <span className="text-rose-400">{part.capacity_mah} mAh</span></div>
            <div>C-Rating: <span className="text-slate-200">{part.c_rating_continuous}C / {part.c_rating_burst}C</span></div>
            <div>Weight: <span className="text-slate-200">{part.weight_g}g</span></div>
          </div>
        );
    }
  };

  return (
    <div className="glass-panel glass-panel-hover rounded-xl p-4 transition-all duration-200 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
              {getCategoryIcon()}
            </div>
            <div>
              <span className="text-xs uppercase font-mono tracking-wider text-slate-400">{title}</span>
              <h3 className="font-semibold text-white text-sm line-clamp-1">
                {part ? (part.name || `${part.manufacturer || part.brand} ${part.model}`) : "Not Selected"}
              </h3>
            </div>
          </div>

          <button
            onClick={onOpenPicker}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-cyan-500/20 hover:text-cyan-400 hover:border-cyan-500/40 text-slate-300 text-xs font-mono transition-all border border-slate-700"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>Change</span>
          </button>
        </div>

        {part ? (
          <div className="space-y-3">
            {renderSpecs()}
          </div>
        ) : (
          <div className="py-6 text-center text-slate-500 text-xs font-mono">
            No component selected. Click Change to choose from catalog.
          </div>
        )}
      </div>

      {part && (
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
          <span className="text-slate-400">Unit Price:</span>
          <span className="text-emerald-400 font-bold text-sm">${part.price_usd?.toFixed(2)}</span>
        </div>
      )}
    </div>
  );
};
