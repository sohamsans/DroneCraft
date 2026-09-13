import { create } from "zustand";
import {
  CatalogLibrary,
  Frame,
  Motor,
  Propeller,
  ESC,
  Battery,
  SimulationResult,
  DiagnosticsResult,
  OptimizerResult,
  ChampionBuild
} from "./types";
import { fetchCatalog, diagnoseBuild, runOptimizer, OptimizerPayload } from "./api";

export type ActiveTabType = "builder" | "hud" | "diagnostics" | "visualizer3d" | "optimizer" | "catalog";

interface DroneStore {
  // Catalog
  catalog: CatalogLibrary;
  isLoadingCatalog: boolean;
  catalogError: string | null;
  loadCatalog: () => Promise<void>;

  // Current Build Selections
  selectedFrame: Frame | null;
  selectedMotor: Motor | null;
  selectedProp: Propeller | null;
  selectedEsc: ESC | null;
  selectedBattery: Battery | null;
  payloadWeightG: number;
  altitudeM: number;
  temperatureC: number;
  depthOfDischarge: number;

  // Setters
  setSelectedFrame: (frame: Frame | null) => void;
  setSelectedMotor: (motor: Motor | null) => void;
  setSelectedProp: (prop: Propeller | null) => void;
  setSelectedEsc: (esc: ESC | null) => void;
  setSelectedBattery: (battery: Battery | null) => void;
  setPayloadWeightG: (weight: number) => void;
  setAltitudeM: (alt: number) => void;
  setTemperatureC: (temp: number) => void;
  loadBuild: (frame: Frame, motor: Motor, prop: Propeller, esc: ESC, battery: Battery) => void;

  // Simulation & Diagnostics Results
  simulation: SimulationResult | null;
  diagnostics: DiagnosticsResult | null;
  isLoadingAnalysis: boolean;
  analysisError: string | null;
  runAnalysis: () => Promise<void>;

  // Optimizer
  optimizerPayload: OptimizerPayload;
  setOptimizerPayload: (payload: Partial<OptimizerPayload>) => void;
  isOptimizing: boolean;
  optimizerResult: OptimizerResult | null;
  optimizerError: string | null;
  executeOptimizer: () => Promise<void>;
  applyChampionBuild: (champion: ChampionBuild) => void;

  // Navigation & UI
  activeTab: ActiveTabType;
  setActiveTab: (tab: ActiveTabType) => void;
  pickerCategory: "frames" | "motors" | "propellers" | "escs" | "batteries" | null;
  setPickerCategory: (cat: "frames" | "motors" | "propellers" | "escs" | "batteries" | null) => void;
  isCustomPartModalOpen: boolean;
  setIsCustomPartModalOpen: (open: boolean) => void;
}

export const useDroneStore = create<DroneStore>((set, get) => ({
  catalog: { frames: [], motors: [], propellers: [], escs: [], batteries: [] },
  isLoadingCatalog: false,
  catalogError: null,

  loadCatalog: async () => {
    set({ isLoadingCatalog: true, catalogError: null });
    try {
      const data = await fetchCatalog();
      set({ catalog: data, isLoadingCatalog: false });

      // Auto-select initial default build if none selected
      const current = get();
      if (!current.selectedFrame && data.frames.length > 0) {
        set({
          selectedFrame: data.frames[0],
          selectedMotor: data.motors[0] || null,
          selectedProp: data.propellers[0] || null,
          selectedEsc: data.escs[0] || null,
          selectedBattery: data.batteries[0] || null,
        });
        // Run initial simulation
        setTimeout(() => {
          get().runAnalysis();
        }, 100);
      }
    } catch (err: any) {
      set({ catalogError: err.message, isLoadingCatalog: false });
    }
  },

  selectedFrame: null,
  selectedMotor: null,
  selectedProp: null,
  selectedEsc: null,
  selectedBattery: null,
  payloadWeightG: 0,
  altitudeM: 0,
  temperatureC: 20,
  depthOfDischarge: 0.8,

  setSelectedFrame: (frame) => {
    set({ selectedFrame: frame });
    get().runAnalysis();
  },
  setSelectedMotor: (motor) => {
    set({ selectedMotor: motor });
    get().runAnalysis();
  },
  setSelectedProp: (prop) => {
    set({ selectedProp: prop });
    get().runAnalysis();
  },
  setSelectedEsc: (esc) => {
    set({ selectedEsc: esc });
    get().runAnalysis();
  },
  setSelectedBattery: (battery) => {
    set({ selectedBattery: battery });
    get().runAnalysis();
  },
  setPayloadWeightG: (weight) => {
    set({ payloadWeightG: weight });
    get().runAnalysis();
  },
  setAltitudeM: (alt) => {
    set({ altitudeM: alt });
    get().runAnalysis();
  },
  setTemperatureC: (temp) => {
    set({ temperatureC: temp });
    get().runAnalysis();
  },

  loadBuild: (frame, motor, prop, esc, battery) => {
    set({
      selectedFrame: frame,
      selectedMotor: motor,
      selectedProp: prop,
      selectedEsc: esc,
      selectedBattery: battery,
    });
    get().runAnalysis();
  },

  simulation: null,
  diagnostics: null,
  isLoadingAnalysis: false,
  analysisError: null,

  runAnalysis: async () => {
    const { selectedFrame, selectedMotor, selectedProp, selectedEsc, selectedBattery, payloadWeightG, altitudeM, temperatureC, depthOfDischarge } = get();

    if (!selectedFrame || !selectedMotor || !selectedProp || !selectedEsc || !selectedBattery) {
      return;
    }

    set({ isLoadingAnalysis: true, analysisError: null });
    try {
      const resp = await diagnoseBuild({
        frame: selectedFrame,
        motor: selectedMotor,
        propeller: selectedProp,
        esc: selectedEsc,
        battery: selectedBattery,
        payload_weight_g: payloadWeightG,
        altitude_m: altitudeM,
        temperature_c: temperatureC,
        depth_of_discharge: depthOfDischarge,
      });

      set({
        simulation: resp.simulation,
        diagnostics: resp.diagnostics,
        isLoadingAnalysis: false,
      });
    } catch (err: any) {
      set({ analysisError: err.message, isLoadingAnalysis: false });
    }
  },

  optimizerPayload: {
    payload_g: 0,
    target_flight_time_min: 15,
    max_budget_usd: 450,
    frame_type_filter: null,
    min_twr: 1.8,
    population_size: 80,
    generations: 30,
  },

  setOptimizerPayload: (params) => {
    set((state) => ({
      optimizerPayload: { ...state.optimizerPayload, ...params },
    }));
  },

  isOptimizing: false,
  optimizerResult: null,
  optimizerError: null,

  executeOptimizer: async () => {
    set({ isOptimizing: true, optimizerError: null });
    try {
      const resp = await runOptimizer(get().optimizerPayload);
      set({ optimizerResult: resp.data, isOptimizing: false });
    } catch (err: any) {
      set({ optimizerError: err.message, isOptimizing: false });
    }
  },

  applyChampionBuild: (champ) => {
    set({
      selectedFrame: champ.frame,
      selectedMotor: champ.motor,
      selectedProp: champ.prop,
      selectedEsc: champ.esc,
      selectedBattery: champ.battery,
      simulation: champ.simulation,
      diagnostics: champ.diagnostics,
      activeTab: "builder",
    });
  },

  activeTab: "builder",
  setActiveTab: (tab) => set({ activeTab: tab }),

  pickerCategory: null,
  setPickerCategory: (cat) => set({ pickerCategory: cat }),

  isCustomPartModalOpen: false,
  setIsCustomPartModalOpen: (open) => set({ isCustomPartModalOpen: open }),
}));
