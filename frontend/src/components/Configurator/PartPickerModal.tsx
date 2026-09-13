"use client";

import React, { useState, useMemo } from "react";
import { useDroneStore } from "@/lib/store";
import { X, Search, Check, Plus, ExternalLink } from "lucide-react";

export const PartPickerModal: React.FC = () => {
  const {
    catalog,
    pickerCategory,
    setPickerCategory,
    selectedFrame,
    selectedMotor,
    selectedProp,
    selectedEsc,
    selectedBattery,
    setSelectedFrame,
    setSelectedMotor,
    setSelectedProp,
    setSelectedEsc,
    setSelectedBattery,
    setIsCustomPartModalOpen
  } = useDroneStore();

  const [searchTerm, setSearchTerm] = useState("");

  const items = useMemo(() => {
    if (!pickerCategory) return [];
    const list = catalog[pickerCategory] || [];
    if (!searchTerm.trim()) return list;
    const term = searchTerm.toLowerCase();
    return list.filter((item: any) => {
      const name = (item.name || item.model || "").toLowerCase();
      const mfr = (item.manufacturer || item.brand || "").toLowerCase();
      return name.includes(term) || mfr.includes(term);
    });
  }, [catalog, pickerCategory, searchTerm]);

  if (!pickerCategory) return null;

  const getActiveId = () => {
    switch (pickerCategory) {
      case "frames":
        return selectedFrame?.id;
      case "motors":
        return selectedMotor?.id;
      case "propellers":
        return selectedProp?.id;
      case "escs":
        return selectedEsc?.id;
      case "batteries":
        return selectedBattery?.id;
      default:
        return null;
    }
  };

  const handleSelect = (item: any) => {
    switch (pickerCategory) {
      case "frames":
        setSelectedFrame(item);
        break;
      case "motors":
        setSelectedMotor(item);
        break;
      case "propellers":
        setSelectedProp(item);
        break;
      case "escs":
        setSelectedEsc(item);
        break;
      case "batteries":
        setSelectedBattery(item);
        break;
    }
    setPickerCategory(null);
  };

  const activeId = getActiveId();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[85vh] bg-[#0c1222] border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div>
            <h2 className="text-lg font-bold text-white capitalize">
              Select {pickerCategory.replace(/s$/, "")}
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Choose from verified components in the catalog or add your own custom specs.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setPickerCategory(null);
                setIsCustomPartModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Custom</span>
            </button>

            <button
              onClick={() => setPickerCategory(null)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="px-6 py-3 border-b border-slate-800 bg-slate-950/40 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder={`Search ${pickerCategory} by brand, model or spec...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>
          <span className="text-xs text-slate-400 font-mono">{items.length} items</span>
        </div>

        {/* Item List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {items.length === 0 ? (
            <div className="text-center py-12 text-slate-500 font-mono text-sm">
              No components match &quot;{searchTerm}&quot;.
            </div>
          ) : (
            items.map((item: any) => {
              const isSelected = item.id === activeId;
              return (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all duration-150 flex items-center justify-between gap-4 ${
                    isSelected
                      ? "bg-cyan-950/30 border-cyan-500/80 shadow-glowCyan"
                      : "bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900"
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {item.manufacturer || item.brand}
                      </span>
                      <h4 className="font-semibold text-white text-sm">
                        {item.name || item.model}
                      </h4>
                      {isSelected && (
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
                          Active Selection
                        </span>
                      )}
                    </div>

                    {/* Spec Summary Row */}
                    <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-xs font-mono text-slate-400">
                      {pickerCategory === "frames" && (
                        <>
                          <span>Wheelbase: <strong className="text-slate-200">{item.wheelbase_mm}mm</strong></span>
                          <span>Max Prop: <strong className="text-cyan-400">{item.max_prop_size_inch}&quot;</strong></span>
                          <span>Dry Weight: <strong className="text-slate-200">{item.dry_weight_g}g</strong></span>
                          <span>Layout: <strong className="text-slate-200">{item.frame_type}</strong></span>
                        </>
                      )}
                      {pickerCategory === "motors" && (
                        <>
                          <span>Kv: <strong className="text-emerald-400">{item.kv}</strong></span>
                          <span>Stator: <strong className="text-slate-200">{item.stator_size}</strong></span>
                          <span>Rm: <strong className="text-slate-200">{item.internal_resistance_mohm}mΩ</strong></span>
                          <span>Max Power: <strong className="text-slate-200">{item.max_power_w}W</strong></span>
                          <span>Weight: <strong className="text-slate-200">{item.weight_g}g</strong></span>
                        </>
                      )}
                      {pickerCategory === "propellers" && (
                        <>
                          <span>Diameter: <strong className="text-purple-400">{item.diameter_inch}&quot;</strong></span>
                          <span>Pitch: <strong className="text-purple-400">{item.pitch_inch}&quot;</strong></span>
                          <span>Blades: <strong className="text-slate-200">{item.blade_count}</strong></span>
                          <span>Weight: <strong className="text-slate-200">{item.weight_g}g</strong></span>
                        </>
                      )}
                      {pickerCategory === "escs" && (
                        <>
                          <span>Continuous: <strong className="text-amber-400">{item.continuous_current_a}A</strong></span>
                          <span>Burst: <strong className="text-amber-400">{item.burst_current_a}A</strong></span>
                          <span>Voltage: <strong className="text-slate-200">{item.voltage_min_s}S-{item.voltage_max_s}S</strong></span>
                          <span>Weight: <strong className="text-slate-200">{item.weight_g}g</strong></span>
                        </>
                      )}
                      {pickerCategory === "batteries" && (
                        <>
                          <span>Config: <strong className="text-rose-400">{item.cells_s}S ({item.cells_s * 3.7}V)</strong></span>
                          <span>Capacity: <strong className="text-rose-400">{item.capacity_mah}mAh</strong></span>
                          <span>C-Rating: <strong className="text-slate-200">{item.c_rating_continuous}C</strong></span>
                          <span>Weight: <strong className="text-slate-200">{item.weight_g}g</strong></span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-xs text-slate-500 font-mono block">Price</span>
                      <span className="text-base font-bold font-mono text-emerald-400">
                        ${item.price_usd?.toFixed(2)}
                      </span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelect(item);
                      }}
                      className={`px-4 py-2 rounded-lg text-xs font-mono font-medium transition-all ${
                        isSelected
                          ? "bg-cyan-500 text-black font-bold"
                          : "bg-slate-800 hover:bg-cyan-600 text-white"
                      }`}
                    >
                      {isSelected ? "Selected" : "Select"}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
