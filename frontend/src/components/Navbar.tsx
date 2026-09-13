"use client";

import React, { useState } from "react";
import { useDroneStore, ActiveTabType } from "@/lib/store";
import {
  Compass,
  Gauge,
  AlertTriangle,
  Layers,
  Sparkles,
  Database,
  Download,
  CheckCircle2,
  XCircle,
  AlertOctagon,
  RefreshCw,
  Zap
} from "lucide-react";
import { exportSpec } from "@/lib/api";

export const Navbar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    simulation,
    diagnostics,
    isLoadingAnalysis,
    selectedFrame,
    selectedMotor,
    selectedProp,
    selectedEsc,
    selectedBattery,
    payloadWeightG,
    runAnalysis
  } = useDroneStore();

  const [isExporting, setIsExporting] = useState(false);

  const tabs: { id: ActiveTabType; label: string; icon: any; countBadge?: number }[] = [
    { id: "builder", label: "Configurator", icon: Compass },
    { id: "hud", label: "Live Telemetry HUD", icon: Gauge },
    {
      id: "diagnostics",
      label: "Diagnostics",
      icon: AlertTriangle,
      countBadge: diagnostics?.action_items?.length || 0
    },
    { id: "visualizer3d", label: "3D Clearance View", icon: Layers },
    { id: "optimizer", label: "NSGA-II Optimizer", icon: Sparkles },
    { id: "catalog", label: "Catalog DB", icon: Database },
  ];

  const handleExport = async () => {
    if (!selectedFrame || !selectedMotor || !selectedProp || !selectedEsc || !selectedBattery) return;
    setIsExporting(true);
    try {
      const res = await exportSpec({
        frame: selectedFrame,
        motor: selectedMotor,
        propeller: selectedProp,
        esc: selectedEsc,
        battery: selectedBattery,
        payload_weight_g: payloadWeightG
      });
      const blob = new Blob([res.markdown], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `dronecraft-spec-${selectedFrame.name.toLowerCase().replace(/\s+/g, "-")}.md`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert("Failed to export build spec sheet.");
    } finally {
      setIsExporting(false);
    }
  };

  const getStatusBadge = () => {
    if (!diagnostics) return null;
    if (diagnostics.summary.fatal_count > 0) {
      return (
        <span className="flex items-center gap-1 px-2.5 py-1 text-xs font-mono font-semibold rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40">
          <XCircle className="w-3.5 h-3.5" /> FATAL ({diagnostics.summary.fatal_count})
        </span>
      );
    }
    if (diagnostics.summary.critical_count > 0) {
      return (
        <span className="flex items-center gap-1 px-2.5 py-1 text-xs font-mono font-semibold rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40">
          <AlertOctagon className="w-3.5 h-3.5" /> HIGH RISK ({diagnostics.summary.critical_count})
        </span>
      );
    }
    if (diagnostics.summary.warning_count > 0) {
      return (
        <span className="flex items-center gap-1 px-2.5 py-1 text-xs font-mono font-semibold rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/40">
          <AlertTriangle className="w-3.5 h-3.5" /> SUBOPTIMAL
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 px-2.5 py-1 text-xs font-mono font-semibold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
        <CheckCircle2 className="w-3.5 h-3.5" /> FLIGHT READY
      </span>
    );
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-[#090d16]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Branding & Quick Telemetry Bar */}
        <div className="flex items-center justify-between h-16 border-b border-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-cyan-600 to-emerald-500 flex items-center justify-center shadow-glowCyan">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-white">DRONECRAFT</h1>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                  AeroOptima v2.4
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono hidden sm:block">
                Theoretical Powertrain Physics & Multi-Objective Genetic Optimizer
              </p>
            </div>
          </div>

          {/* Quick Metrics Badge Strip */}
          <div className="flex items-center gap-3">
            {simulation && (
              <div className="hidden md:flex items-center gap-4 bg-slate-900/90 border border-slate-800 px-3.5 py-1.5 rounded-lg text-xs font-mono">
                <div>
                  <span className="text-slate-500">AUW:</span>{" "}
                  <span className="text-cyan-400 font-bold">{simulation.mass.auw_g}g</span>
                </div>
                <div className="h-3 w-px bg-slate-700" />
                <div>
                  <span className="text-slate-500">TWR:</span>{" "}
                  <span className={`font-bold ${simulation.max_performance.twr >= 1.8 ? "text-emerald-400" : "text-rose-400"}`}>
                    {simulation.max_performance.twr}:1
                  </span>
                </div>
                <div className="h-3 w-px bg-slate-700" />
                <div>
                  <span className="text-slate-500">HOVER:</span>{" "}
                  <span className="text-cyan-300 font-bold">{simulation.hover.hover_flight_time_minutes}m</span>
                </div>
                <div className="h-3 w-px bg-slate-700" />
                <div>
                  <span className="text-slate-500">COST:</span>{" "}
                  <span className="text-slate-200 font-bold">${simulation.financial.total_cost_usd}</span>
                </div>
              </div>
            )}

            {getStatusBadge()}

            <button
              onClick={() => runAnalysis()}
              disabled={isLoadingAnalysis}
              title="Refresh Physics Calculation"
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingAnalysis ? "animate-spin text-cyan-400" : ""}`} />
            </button>

            <button
              onClick={handleExport}
              disabled={isExporting}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white shadow-glowCyan transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export Spec</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="flex space-x-1 sm:space-x-2 py-2 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-cyan-400" : "text-slate-500"}`} />
                <span>{tab.label}</span>
                {tab.countBadge !== undefined && tab.countBadge > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-rose-500/20 text-rose-400 border border-rose-500/30">
                    {tab.countBadge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
