import {
  CatalogLibrary,
  Frame,
  Motor,
  Propeller,
  ESC,
  Battery,
  SimulationResult,
  DiagnosticsResult,
  OptimizerResult
} from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export async function fetchCatalog(): Promise<CatalogLibrary> {
  const res = await fetch(`${API_BASE_URL}/parts/all`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to fetch parts catalog: ${res.statusText}`);
  }
  return res.json();
}

export interface BuildPayload {
  frame: Frame;
  motor: Motor;
  propeller: Propeller;
  esc: ESC;
  battery: Battery;
  payload_weight_g: number;
  altitude_m?: number;
  temperature_c?: number;
  depth_of_discharge?: number;
}

export async function simulateBuild(build: BuildPayload): Promise<{ success: boolean; data: SimulationResult }> {
  const res = await fetch(`${API_BASE_URL}/simulate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(build)
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Simulation failed");
  }
  return res.json();
}

export async function diagnoseBuild(build: BuildPayload): Promise<{
  success: boolean;
  simulation: SimulationResult;
  diagnostics: DiagnosticsResult;
}> {
  const res = await fetch(`${API_BASE_URL}/diagnose`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(build)
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Diagnostic audit failed");
  }
  return res.json();
}

export interface OptimizerPayload {
  payload_g: number;
  target_flight_time_min: number;
  max_budget_usd: number;
  frame_type_filter?: string | null;
  min_twr?: number;
  population_size?: number;
  generations?: number;
}

export async function runOptimizer(payload: OptimizerPayload): Promise<{ success: boolean; data: OptimizerResult }> {
  const res = await fetch(`${API_BASE_URL}/optimize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Genetic optimizer failed");
  }
  return res.json();
}

export async function exportSpec(build: BuildPayload): Promise<{
  success: boolean;
  markdown: string;
  simulation: SimulationResult;
  diagnostics: DiagnosticsResult;
}> {
  const res = await fetch(`${API_BASE_URL}/export/spec`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(build)
  });
  if (!res.ok) {
    throw new Error("Failed to export build specification");
  }
  return res.json();
}

export async function createCustomPart(category: string, partData: any) {
  const res = await fetch(`${API_BASE_URL}/parts/${category}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(partData)
  });
  if (!res.ok) {
    throw new Error(`Failed to create ${category} part`);
  }
  return res.json();
}

export async function deletePart(category: string, id: number) {
  const res = await fetch(`${API_BASE_URL}/parts/${category}/${id}`, {
    method: "DELETE"
  });
  if (!res.ok) {
    throw new Error(`Failed to delete part ${id}`);
  }
  return res.json();
}
