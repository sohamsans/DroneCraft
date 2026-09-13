"use client";

import React, { useState } from "react";
import { useDroneStore } from "@/lib/store";
import { ParetoPoint, ChampionBuild } from "@/lib/types";
import {
  Sparkles,
  Sliders,
  DollarSign,
  Clock,
  Zap,
  TrendingUp,
  Award,
  ArrowRight,
  RefreshCw,
  Cpu,
  Layers,
  CheckCircle2
} from "lucide-react";
import confetti from "canvas-confetti";

export const OptimizerPanel: React.FC = () => {
  const {
    optimizerPayload,
    setOptimizerPayload,
    isOptimizing,
    optimizerResult,
    optimizerError,
    executeOptimizer,
    applyChampionBuild
  } = useDroneStore();

  const [selectedParetoPoint, setSelectedParetoPoint] = useState<ParetoPoint | null>(null);

  const handleRunOptimizer = async () => {
    await executeOptimizer();
    try {
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch {}
  };

  const renderChampionCard = (champ: ChampionBuild, champType: "endurance" | "value" | "agility") => {
    if (!champ) return null;

    const getTheme = () => {
      switch (champType) {
        case "endurance":
          return {
            border: "border-purple-500/50",
            glow: "shadow-glowCyan",
            accent: "text-purple-400",
            bg: "bg-purple-950/20",
            icon: Clock
          };
        case "value":
          return {
            border: "border-emerald-500/50",
            glow: "shadow-glowEmerald",
            accent: "text-emerald-400",
            bg: "bg-emerald-950/20",
            icon: DollarSign
          };
        case "agility":
          return {
            border: "border-cyan-500/50",
            glow: "shadow-glowCyan",
            accent: "text-cyan-400",
            bg: "bg-cyan-950/20",
            icon: Zap
          };
      }
    };

    const theme = getTheme();
    const Icon = theme.icon;

    return (
      <div className={`glass-panel rounded-2xl p-5 border ${theme.border} ${theme.bg} flex flex-col justify-between transition-all duration-200 hover:scale-[1.01]`}>
        <div>
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                <Icon className={`w-4 h-4 ${theme.accent}`} />
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-bold block">
                  {champ.badge}
                </span>
                <h3 className="font-bold text-white text-sm">{champ.title}</h3>
              </div>
            </div>
            <Award className={`w-5 h-5 ${theme.accent}`} />
          </div>

          <p className="text-xs text-slate-300 font-mono mb-4">{champ.description}</p>

          {/* Primary Metrics Grid */}
          <div className="grid grid-cols-2 gap-2 mb-4 p-3 bg-slate-950/60 rounded-xl border border-slate-800 font-mono text-xs">
            <div>
              <span className="text-slate-500 block text-[10px]">FLIGHT TIME</span>
              <strong className={`text-base ${theme.accent}`}>{champ.flight_time_mins} min</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">TOTAL COST</span>
              <strong className="text-base text-white">${champ.total_cost_usd}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">TWR / AGILITY</span>
              <strong className="text-slate-200">{champ.twr}:1</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">AUW WEIGHT</span>
              <strong className="text-slate-200">{champ.auw_g}g</strong>
            </div>
          </div>

          {/* Hardware Configuration List */}
          <div className="space-y-1.5 font-mono text-xs text-slate-300">
            <div className="flex items-center gap-1.5 truncate">
              <span className="text-slate-500">Frame:</span>
              <span className="text-slate-200 truncate">{champ.frame.name}</span>
            </div>
            <div className="flex items-center gap-1.5 truncate">
              <span className="text-slate-500">Motor:</span>
              <span className="text-slate-200 truncate">{champ.motor.model} ({champ.motor.kv}KV)</span>
            </div>
            <div className="flex items-center gap-1.5 truncate">
              <span className="text-slate-500">Prop:</span>
              <span className="text-slate-200 truncate">{champ.prop.model}</span>
            </div>
            <div className="flex items-center gap-1.5 truncate">
              <span className="text-slate-500">Battery:</span>
              <span className="text-slate-200 truncate">{champ.battery.brand} {champ.battery.cells_s}S {champ.battery.capacity_mah}mAh</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => applyChampionBuild(champ)}
          className="mt-5 w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-cyan-500 hover:text-black font-mono font-bold text-xs text-cyan-400 border border-slate-700 transition-all flex items-center justify-center gap-1.5 shadow-md"
        >
          <span>Load Build Into Configurator</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Configuration Constraints Header */}
      <div className="glass-panel rounded-2xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white font-mono flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              Multi-Objective NSGA-II Genetic Drone Optimizer
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Evolves thousands of discrete catalog combinations to discover non-dominated Pareto frontier trade-offs.
            </p>
          </div>

          <button
            onClick={handleRunOptimizer}
            disabled={isOptimizing}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-black font-bold font-mono text-sm shadow-glowCyan hover:opacity-90 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isOptimizing ? "animate-spin" : ""}`} />
            <span>{isOptimizing ? "Evolving Generations..." : "Run Genetic Optimizer"}</span>
          </button>
        </div>

        {/* 4 Constraint Sliders */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="flex justify-between text-slate-400 mb-1.5">
              <span>Target Payload:</span>
              <strong className="text-cyan-400">{optimizerPayload.payload_g}g</strong>
            </div>
            <input
              type="range"
              min="0"
              max="1500"
              step="50"
              value={optimizerPayload.payload_g}
              onChange={(e) => setOptimizerPayload({ payload_g: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="flex justify-between text-slate-400 mb-1.5">
              <span>Min Flight Time:</span>
              <strong className="text-purple-400">{optimizerPayload.target_flight_time_min} mins</strong>
            </div>
            <input
              type="range"
              min="5"
              max="35"
              step="1"
              value={optimizerPayload.target_flight_time_min}
              onChange={(e) => setOptimizerPayload({ target_flight_time_min: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="flex justify-between text-slate-400 mb-1.5">
              <span>Max Budget:</span>
              <strong className="text-emerald-400">${optimizerPayload.max_budget_usd}</strong>
            </div>
            <input
              type="range"
              min="150"
              max="1000"
              step="25"
              value={optimizerPayload.max_budget_usd}
              onChange={(e) => setOptimizerPayload({ max_budget_usd: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="flex justify-between text-slate-400 mb-1.5">
              <span>Frame Layout Filter:</span>
              <strong className="text-slate-200">{optimizerPayload.frame_type_filter || "All Layouts"}</strong>
            </div>
            <select
              value={optimizerPayload.frame_type_filter || ""}
              onChange={(e) => setOptimizerPayload({ frame_type_filter: e.target.value || null })}
              className="w-full px-2 py-1 bg-slate-950 border border-slate-700 rounded text-xs text-white"
            >
              <option value="">All Layouts (Quad, Hex, etc.)</option>
              <option value="Quad-X">Quad-X (5&quot; Standard)</option>
              <option value="Cinewhoop">Cinewhoop (3.5&quot; Ducted)</option>
              <option value="Long-range">Long Range (7&quot;+)</option>
              <option value="Hex-X">Hex-X (Heavy Lift)</option>
            </select>
          </div>
        </div>
      </div>

      {optimizerError && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500 text-rose-300 font-mono text-xs">
          Optimization Error: {optimizerError}
        </div>
      )}

      {/* Top 3 Champion Builds */}
      {optimizerResult?.top_builds && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
              <Award className="w-4 h-4 text-cyan-400" />
              Optimal Frontier Champions ({optimizerResult.summary.valid_flight_ready_count} Valid Candidates)
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              Evaluated {optimizerResult.summary.total_evaluated_combinations} combinations across {optimizerResult.summary.generations_completed} generations
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {renderChampionCard(optimizerResult.top_builds.endurance_champion, "endurance")}
            {renderChampionCard(optimizerResult.top_builds.value_champion, "value")}
            {renderChampionCard(optimizerResult.top_builds.agility_champion, "agility")}
          </div>
        </div>
      )}

      {/* Interactive Pareto Frontier Scatter Plot */}
      {optimizerResult?.pareto_frontier && optimizerResult.pareto_frontier.length > 0 && (
        <div className="glass-panel rounded-2xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white font-mono">
                Interactive Pareto Frontier Trade-Off Curve (Flight Time vs Cost vs Agility)
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Click any point to inspect component details and load into configurator.
              </p>
            </div>
            <span className="text-xs font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800 px-2.5 py-1 rounded-lg">
              {optimizerResult.pareto_frontier.length} Non-Dominated Solutions
            </span>
          </div>

          {/* Scatter Chart Canvas/SVG */}
          <div className="relative w-full overflow-x-auto">
            {(() => {
              const points = optimizerResult.pareto_frontier;
              const width = 700;
              const height = 300;
              const pad = { top: 30, right: 40, bottom: 40, left: 60 };
              const innerW = width - pad.left - pad.right;
              const innerH = height - pad.top - pad.bottom;

              const minTime = Math.max(0, Math.min(...points.map((p) => p.flight_time_mins)) * 0.9);
              const maxTime = Math.max(...points.map((p) => p.flight_time_mins)) * 1.1;
              const minCost = Math.max(0, Math.min(...points.map((p) => p.total_cost_usd)) * 0.9);
              const maxCost = Math.max(...points.map((p) => p.total_cost_usd)) * 1.1;

              return (
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto max-h-[350px] select-none font-mono">
                  {/* Grid Lines */}
                  {[0, 0.25, 0.5, 0.75, 1.0].map((ratio) => {
                    const x = pad.left + ratio * innerW;
                    const timeVal = minTime + ratio * (maxTime - minTime);
                    const y = pad.top + innerH - ratio * innerH;
                    const costVal = minCost + ratio * (maxCost - minCost);
                    return (
                      <g key={ratio}>
                        <line x1={x} y1={pad.top} x2={x} y2={pad.top + innerH} stroke="#1e293b" strokeDasharray="3 3" />
                        <text x={x} y={pad.top + innerH + 20} fill="#64748b" fontSize="10" textAnchor="middle">
                          {timeVal.toFixed(1)}m
                        </text>

                        <line x1={pad.left} y1={y} x2={pad.left + innerW} y2={y} stroke="#1e293b" strokeDasharray="3 3" />
                        <text x={pad.left - 8} y={y + 3} fill="#64748b" fontSize="10" textAnchor="end">
                          ${costVal.toFixed(0)}
                        </text>
                      </g>
                    );
                  })}

                  {/* Axis Titles */}
                  <text x={pad.left + innerW / 2} y={pad.top + innerH + 35} fill="#94a3b8" fontSize="11" textAnchor="middle">
                    Flight Time (Hover mins) →
                  </text>
                  <text x={15} y={pad.top + innerH / 2} fill="#94a3b8" fontSize="11" textAnchor="middle" transform={`rotate(-90 15 ${pad.top + innerH / 2})`}>
                    Total Cost ($ USD) →
                  </text>

                  {/* Scatter Data Points */}
                  {points.map((pt, idx) => {
                    const cx = pad.left + ((pt.flight_time_mins - minTime) / (maxTime - minTime || 1)) * innerW;
                    const cy = pad.top + innerH - ((pt.total_cost_usd - minCost) / (maxCost - minCost || 1)) * innerH;
                    const isSelected = selectedParetoPoint?.build_name === pt.build_name;

                    // Color based on TWR
                    const color = pt.twr >= 4.0 ? "#06b6d4" : pt.twr >= 2.5 ? "#10b981" : "#f59e0b";

                    return (
                      <circle
                        key={idx}
                        cx={cx}
                        cy={cy}
                        r={isSelected ? 8 : Math.max(4, Math.min(10, pt.twr * 1.5))}
                        fill={color}
                        stroke={isSelected ? "#ffffff" : "#0f172a"}
                        strokeWidth="2"
                        className="cursor-pointer transition-all hover:opacity-100 opacity-80"
                        onClick={() => setSelectedParetoPoint(pt)}
                      />
                    );
                  })}
                </svg>
              );
            })()}
          </div>

          {/* Selected Pareto Point Detail Card */}
          {selectedParetoPoint && (
            <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-cyan-500/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 font-mono text-xs">
              <div className="space-y-1">
                <span className="text-cyan-400 font-bold text-sm block">{selectedParetoPoint.build_name}</span>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-slate-300">
                  <span>Hover Time: <strong className="text-purple-400">{selectedParetoPoint.flight_time_mins}m</strong></span>
                  <span>Cost: <strong className="text-emerald-400">${selectedParetoPoint.total_cost_usd}</strong></span>
                  <span>TWR: <strong className="text-cyan-400">{selectedParetoPoint.twr}:1</strong></span>
                  <span>AUW: <strong className="text-slate-200">{selectedParetoPoint.auw_g}g</strong></span>
                </div>
              </div>

              <button
                onClick={() => {
                  const { frame, motor, prop, esc, battery } = selectedParetoPoint;
                  useDroneStore.getState().loadBuild(frame, motor, prop, esc, battery);
                  useDroneStore.getState().setActiveTab("builder");
                }}
                className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold font-mono transition-all shrink-0 flex items-center gap-1.5 shadow-glowCyan"
              >
                <span>Load This Build</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
