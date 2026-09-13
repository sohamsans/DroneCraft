"use client";

import React, { useState } from "react";
import { useDroneStore } from "@/lib/store";
import { Database, Plus, Search, Trash2, Cpu, Disc, Zap, Battery as BatteryIcon, Box } from "lucide-react";
import { deletePart } from "@/lib/api";

export const CatalogManager: React.FC = () => {
  const { catalog, loadCatalog, setIsCustomPartModalOpen } = useDroneStore();
  const [activeCategory, setActiveCategory] = useState<"frames" | "motors" | "propellers" | "escs" | "batteries">("motors");
  const [search, setSearch] = useState("");

  const items = (catalog[activeCategory] || []).filter((item: any) => {
    const text = `${item.name || ""} ${item.model || ""} ${item.manufacturer || ""} ${item.brand || ""}`.toLowerCase();
    return text.includes(search.toLowerCase());
  });

  const handleDelete = async (id: number) => {
    if (!confirm(`Are you sure you want to delete this component (ID: ${id})?`)) return;
    try {
      await deletePart(activeCategory, id);
      await loadCatalog();
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case "frames":
        return <Box className="w-4 h-4 text-cyan-400" />;
      case "motors":
        return <Cpu className="w-4 h-4 text-emerald-400" />;
      case "propellers":
        return <Disc className="w-4 h-4 text-purple-400" />;
      case "escs":
        return <Zap className="w-4 h-4 text-amber-400" />;
      case "batteries":
        return <BatteryIcon className="w-4 h-4 text-rose-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="glass-panel rounded-2xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white font-mono flex items-center gap-2">
              <Database className="w-5 h-5 text-cyan-400" />
              Component Catalog Database
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Inspect database schema, parameters, and insert custom experimental hardware specs.
            </p>
          </div>

          <button
            onClick={() => setIsCustomPartModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold shadow-glowEmerald transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Custom Part</span>
          </button>
        </div>

        {/* Category Pills and Search */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-2 overflow-x-auto font-mono text-xs">
            {(["frames", "motors", "propellers", "escs", "batteries"] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border transition-all capitalize ${
                  activeCategory === cat
                    ? "bg-cyan-500/20 text-cyan-400 border-cyan-500 font-bold"
                    : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                {getCategoryIcon(cat)}
                <span>{cat}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-400">
                  {catalog[cat]?.length || 0}
                </span>
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search component..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* Table of Parts */}
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left font-mono text-xs">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Brand / Manufacturer</th>
                <th className="py-3 px-4">Model Name</th>
                <th className="py-3 px-4">Key Specifications</th>
                <th className="py-3 px-4">Weight</th>
                <th className="py-3 px-4">Price</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
              {items.map((item: any) => (
                <tr key={item.id} className="hover:bg-slate-900 transition-colors">
                  <td className="py-3 px-4 text-slate-300">{item.manufacturer || item.brand}</td>
                  <td className="py-3 px-4 text-white font-semibold">{item.name || item.model}</td>
                  <td className="py-3 px-4 text-slate-300">
                    {activeCategory === "frames" && `${item.wheelbase_mm}mm | Max: ${item.max_prop_size_inch}" | ${item.frame_type}`}
                    {activeCategory === "motors" && `${item.kv}KV | ${item.internal_resistance_mohm}mΩ | ${item.max_power_w}W max | ${item.stator_size || ""}`}
                    {activeCategory === "propellers" && `${item.diameter_inch}" x ${item.pitch_inch}" | ${item.blade_count}-blade`}
                    {activeCategory === "escs" && `${item.continuous_current_a}A Cont | ${item.burst_current_a}A Burst | ${item.voltage_min_s}-${item.voltage_max_s}S`}
                    {activeCategory === "batteries" && `${item.cells_s}S (${item.cells_s * 3.7}V) | ${item.capacity_mah}mAh | ${item.c_rating_continuous}C`}
                  </td>
                  <td className="py-3 px-4 text-slate-300">{item.weight_g}g</td>
                  <td className="py-3 px-4 text-emerald-400 font-bold">${item.price_usd?.toFixed(2)}</td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1.5 rounded bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                      title="Delete part"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
