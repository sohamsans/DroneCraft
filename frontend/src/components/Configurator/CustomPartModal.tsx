"use client";

import React, { useState } from "react";
import { useDroneStore } from "@/lib/store";
import { X, Plus, Save } from "lucide-react";
import { createCustomPart } from "@/lib/api";

export const CustomPartModal: React.FC = () => {
  const { isCustomPartModalOpen, setIsCustomPartModalOpen, loadCatalog } = useDroneStore();
  const [category, setCategory] = useState<"frames" | "motors" | "propellers" | "escs" | "batteries">("motors");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Common fields
  const [name, setName] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [priceUsd, setPriceUsd] = useState(25.0);
  const [weightG, setWeightG] = useState(32.0);

  // Motor fields
  const [kv, setKv] = useState(2200.0);
  const [statorSize, setStatorSize] = useState("2207");
  const [resistanceMohm, setResistanceMohm] = useState(48.0);
  const [idleCurrentA, setIdleCurrentA] = useState(1.0);
  const [maxCurrentA, setMaxCurrentA] = useState(45.0);
  const [maxPowerW, setMaxPowerW] = useState(950.0);
  const [voltageSMin, setVoltageSMin] = useState(4);
  const [voltageSMax, setVoltageSMax] = useState(6);

  // Frame fields
  const [wheelbaseMm, setWheelbaseMm] = useState(225.0);
  const [frameType, setFrameType] = useState("Quad-X");
  const [maxPropSizeInch, setMaxPropSizeInch] = useState(5.1);

  // Prop fields
  const [diameterInch, setDiameterInch] = useState(5.0);
  const [pitchInch, setPitchInch] = useState(4.3);
  const [bladeCount, setBladeCount] = useState(3);

  // ESC fields
  const [continuousAmps, setContinuousAmps] = useState(55.0);
  const [burstAmps, setBurstAmps] = useState(70.0);

  // Battery fields
  const [cellsS, setCellsS] = useState(6);
  const [capacityMah, setCapacityMah] = useState(1400.0);
  const [cRatingCont, setCRatingCont] = useState(120.0);
  const [cRatingBurst, setCRatingBurst] = useState(200.0);
  const [rCellMohm, setRCellMohm] = useState(3.5);

  if (!isCustomPartModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      let payload: any = {
        manufacturer,
        price_usd: Number(priceUsd),
        weight_g: Number(weightG)
      };

      if (category === "frames") {
        payload = {
          ...payload,
          name: name || `${manufacturer} Frame`,
          wheelbase_mm: Number(wheelbaseMm),
          frame_type: frameType,
          max_prop_size_inch: Number(maxPropSizeInch),
          dry_weight_g: Number(weightG)
        };
      } else if (category === "motors") {
        payload = {
          ...payload,
          model: name || `${manufacturer} ${statorSize} ${kv}KV`,
          kv: Number(kv),
          stator_size: statorSize,
          internal_resistance_mohm: Number(resistanceMohm),
          idle_current_a: Number(idleCurrentA),
          max_continuous_current_a: Number(maxCurrentA),
          max_power_w: Number(maxPowerW),
          recommended_voltage_s_min: Number(voltageSMin),
          recommended_voltage_s_max: Number(voltageSMax)
        };
      } else if (category === "propellers") {
        payload = {
          ...payload,
          model: name || `${manufacturer} ${diameterInch}x${pitchInch}x${bladeCount}`,
          diameter_inch: Number(diameterInch),
          pitch_inch: Number(pitchInch),
          blade_count: Number(bladeCount)
        };
      } else if (category === "escs") {
        payload = {
          ...payload,
          model: name || `${manufacturer} ${continuousAmps}A ESC`,
          continuous_current_a: Number(continuousAmps),
          burst_current_a: Number(burstAmps),
          voltage_min_s: Number(voltageSMin),
          voltage_max_s: Number(voltageSMax)
        };
      } else if (category === "batteries") {
        payload = {
          ...payload,
          brand: manufacturer,
          model: name || `${manufacturer} ${cellsS}S ${capacityMah}mAh`,
          cells_s: Number(cellsS),
          capacity_mah: Number(capacityMah),
          c_rating_continuous: Number(cRatingCont),
          c_rating_burst: Number(cRatingBurst),
          internal_resistance_cell_mohm: Number(rCellMohm)
        };
      }

      await createCustomPart(category, payload);
      await loadCatalog();
      setIsCustomPartModalOpen(false);
    } catch (err: any) {
      alert(`Error creating custom component: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#0c1222] border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Plus className="w-5 h-5 text-emerald-400" />
            Add Custom Component
          </h2>
          <button
            onClick={() => setIsCustomPartModalOpen(false)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Category Selector Tabs */}
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1.5">Component Type</label>
            <div className="grid grid-cols-5 gap-2">
              {(["frames", "motors", "propellers", "escs", "batteries"] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`py-2 text-xs font-mono capitalize rounded-lg border transition-all ${
                    category === cat
                      ? "bg-cyan-500/20 text-cyan-400 border-cyan-500"
                      : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  {cat.replace(/s$/, "")}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">Model / Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Custom 2207 High KV"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">Manufacturer / Brand</label>
              <input
                type="text"
                required
                placeholder="e.g. CustomAero"
                value={manufacturer}
                onChange={(e) => setManufacturer(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">Weight (grams)</label>
              <input
                type="number"
                step="0.1"
                required
                value={weightG}
                onChange={(e) => setWeightG(parseFloat(e.target.value))}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">Price (USD)</label>
              <input
                type="number"
                step="0.01"
                required
                value={priceUsd}
                onChange={(e) => setPriceUsd(parseFloat(e.target.value))}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white font-mono"
              />
            </div>
          </div>

          {/* Motor Specific Fields */}
          {category === "motors" && (
            <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3">
              <h4 className="text-xs font-mono font-bold text-emerald-400">Motor Circuit Parameters</h4>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">Kv (RPM/V)</label>
                  <input
                    type="number"
                    value={kv}
                    onChange={(e) => setKv(parseFloat(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">Rm (mΩ)</label>
                  <input
                    type="number"
                    value={resistanceMohm}
                    onChange={(e) => setResistanceMohm(parseFloat(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">Idle Current I0 (A)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={idleCurrentA}
                    onChange={(e) => setIdleCurrentA(parseFloat(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">Max Power (W)</label>
                  <input
                    type="number"
                    value={maxPowerW}
                    onChange={(e) => setMaxPowerW(parseFloat(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">Max Continuous (A)</label>
                  <input
                    type="number"
                    value={maxCurrentA}
                    onChange={(e) => setMaxCurrentA(parseFloat(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">Stator Size</label>
                  <input
                    type="text"
                    value={statorSize}
                    onChange={(e) => setStatorSize(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-white font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Frame Specific Fields */}
          {category === "frames" && (
            <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3">
              <h4 className="text-xs font-mono font-bold text-cyan-400">Frame Geometry</h4>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">Wheelbase (mm)</label>
                  <input
                    type="number"
                    value={wheelbaseMm}
                    onChange={(e) => setWheelbaseMm(parseFloat(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">Max Prop Size (&quot;)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={maxPropSizeInch}
                    onChange={(e) => setMaxPropSizeInch(parseFloat(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">Frame Layout</label>
                  <select
                    value={frameType}
                    onChange={(e) => setFrameType(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-white font-mono"
                  >
                    <option value="Quad-X">Quad-X (4 Rotors)</option>
                    <option value="Cinewhoop">Cinewhoop (Ducts)</option>
                    <option value="Hex-X">Hex-X (6 Rotors)</option>
                    <option value="Octo-X">Octo-X (8 Rotors)</option>
                    <option value="Long-range">Long-range (Deadcat)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Propeller Fields */}
          {category === "propellers" && (
            <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3">
              <h4 className="text-xs font-mono font-bold text-purple-400">Propeller Aerodynamics</h4>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">Diameter (&quot;)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={diameterInch}
                    onChange={(e) => setDiameterInch(parseFloat(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">Pitch (&quot;)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={pitchInch}
                    onChange={(e) => setPitchInch(parseFloat(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">Blade Count</label>
                  <input
                    type="number"
                    value={bladeCount}
                    onChange={(e) => setBladeCount(parseInt(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-white font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Battery Fields */}
          {category === "batteries" && (
            <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3">
              <h4 className="text-xs font-mono font-bold text-rose-400">Battery Chemistry & Discharge</h4>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">Series Cells (S)</label>
                  <input
                    type="number"
                    value={cellsS}
                    onChange={(e) => setCellsS(parseInt(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">Capacity (mAh)</label>
                  <input
                    type="number"
                    value={capacityMah}
                    onChange={(e) => setCapacityMah(parseFloat(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">Continuous C-Rate</label>
                  <input
                    type="number"
                    value={cRatingCont}
                    onChange={(e) => setCRatingCont(parseFloat(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-white font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsCustomPartModalOpen(false)}
              className="px-4 py-2 text-xs font-mono rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-mono font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-glowEmerald"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? "Saving..." : "Save Component"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
