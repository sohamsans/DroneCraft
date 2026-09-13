"use client";

import React, { useEffect } from "react";
import { useDroneStore } from "@/lib/store";
import { Navbar } from "@/components/Navbar";
import { ConfiguratorView } from "@/components/Configurator/ConfiguratorView";
import { PerformanceHUD } from "@/components/HUD/PerformanceHUD";
import { DiagnosticsPanel } from "@/components/Diagnostics/DiagnosticsPanel";
import { DroneViewer3D } from "@/components/Visualizer3D/DroneViewer3D";
import { OptimizerPanel } from "@/components/Optimizer/OptimizerPanel";
import { CatalogManager } from "@/components/Catalog/CatalogManager";
import { PartPickerModal } from "@/components/Configurator/PartPickerModal";
import { CustomPartModal } from "@/components/Configurator/CustomPartModal";
import { Loader2 } from "lucide-react";

export default function Home() {
  const { activeTab, loadCatalog, isLoadingCatalog, catalogError } = useDroneStore();

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {isLoadingCatalog && (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400 font-mono">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mb-3" />
            <p>Initializing catalog and pre-loading aerospace components...</p>
          </div>
        )}

        {catalogError && (
          <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500 text-rose-300 font-mono text-xs mb-6">
            Unable to connect to DroneCraft backend API. Please verify FastAPI backend is running on port 8000.
            <div className="mt-1 text-slate-400">Error: {catalogError}</div>
          </div>
        )}

        {!isLoadingCatalog && (
          <>
            {activeTab === "builder" && <ConfiguratorView />}
            {activeTab === "hud" && <PerformanceHUD />}
            {activeTab === "diagnostics" && <DiagnosticsPanel />}
            {activeTab === "visualizer3d" && <DroneViewer3D />}
            {activeTab === "optimizer" && <OptimizerPanel />}
            {activeTab === "catalog" && <CatalogManager />}
          </>
        )}
      </main>

      {/* Global Modals */}
      <PartPickerModal />
      <CustomPartModal />

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/60 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-slate-500 gap-2">
          <div>
            DroneCraft Aerospace Systems (c) 2026 - Aerodynamic BEMT & NSGA-II Multi-Objective Optimization
          </div>
          <div className="flex items-center gap-4">
            <span className="text-cyan-500">FastAPI Backend: :8000</span>
            <span className="text-emerald-500">Next.js App: :3000</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
