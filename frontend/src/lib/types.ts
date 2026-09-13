export interface Frame {
  id: number;
  name: string;
  manufacturer: string;
  wheelbase_mm: number;
  frame_type: string;
  max_prop_size_inch: number;
  dry_weight_g: number;
  payload_volume_cm3?: number;
  price_usd: number;
  source_url?: string;
  image_url?: string;
  specs_json?: Record<string, any>;
}

export interface Motor {
  id: number;
  model: string;
  manufacturer: string;
  kv: number;
  stator_size?: string;
  internal_resistance_mohm: number;
  idle_current_a: number;
  max_continuous_current_a: number;
  max_power_w: number;
  recommended_voltage_s_min?: number;
  recommended_voltage_s_max?: number;
  weight_g: number;
  price_usd: number;
  source_url?: string;
  image_url?: string;
  thrust_table_json?: Array<Record<string, any>>;
}

export interface Propeller {
  id: number;
  model: string;
  manufacturer: string;
  diameter_inch: number;
  pitch_inch: number;
  blade_count: number;
  weight_g: number;
  ct_hover?: number | null;
  cp_hover?: number | null;
  material?: string;
  price_usd: number;
  source_url?: string;
  image_url?: string;
}

export interface ESC {
  id: number;
  model: string;
  manufacturer: string;
  continuous_current_a: number;
  burst_current_a: number;
  voltage_min_s: number;
  voltage_max_s: number;
  protocol?: string;
  form_factor?: string;
  weight_g: number;
  price_usd: number;
  source_url?: string;
  image_url?: string;
}

export interface Battery {
  id: number;
  brand: string;
  model: string;
  cell_chemistry?: string;
  cells_s: number;
  capacity_mah: number;
  c_rating_continuous: number;
  c_rating_burst: number;
  internal_resistance_cell_mohm: number;
  nominal_cell_voltage_v?: number;
  weight_g: number;
  price_usd: number;
  source_url?: string;
  image_url?: string;
}

export interface ThrottleCurvePoint {
  throttle_pct: number;
  rotational_speed_rpm: number;
  total_thrust_g: number;
  total_thrust_n: number;
  bus_current_a: number;
  motor_current_a: number;
  total_power_w: number;
  terminal_voltage_v: number;
  twr: number;
}

export interface SimulationResult {
  mass: {
    num_rotors: number;
    frame_weight_g: number;
    total_motors_weight_g: number;
    total_props_weight_g: number;
    total_escs_weight_g: number;
    battery_weight_g: number;
    avionics_weight_g: number;
    payload_weight_g: number;
    dry_weight_g: number;
    auw_g: number;
    auw_kg: number;
    total_hover_force_n: number;
    hover_thrust_per_rotor_g: number;
    hover_thrust_per_rotor_n: number;
    mass_breakdown_percentages: Record<string, number>;
  };
  aerodynamics: {
    air_density_kg_m3: number;
    altitude_m: number;
    temperature_c: number;
    ct: number;
    cp: number;
    prop_diameter_inch: number;
    prop_pitch_inch: number;
    prop_blade_count: number;
    induced_velocity_hover_mps: number;
  };
  hover: {
    hover_throttle_pct: number;
    hover_rotational_speed_rpm: number;
    hover_rotational_speed_rps: number;
    hover_thrust_per_rotor_g: number;
    hover_thrust_per_rotor_n: number;
    hover_motor_current_a: number;
    hover_bus_current_a: number;
    hover_motor_phase_voltage_v: number;
    hover_battery_terminal_voltage_v: number;
    hover_motor_mechanical_power_w: number;
    hover_motor_electrical_power_w: number;
    hover_total_electrical_power_w: number;
    hover_motor_efficiency_pct: number;
    hover_efficiency_g_per_w: number;
    hover_flight_time_minutes: number;
    cruise_flight_time_minutes: number;
  };
  max_performance: {
    twr: number;
    max_total_thrust_g: number;
    max_total_thrust_n: number;
    max_thrust_per_rotor_g: number;
    max_rotational_speed_rpm: number;
    max_motor_current_a: number;
    max_bus_current_a: number;
    max_battery_loaded_voltage_v: number;
    max_battery_cell_voltage_v: number;
    max_motor_elec_power_w: number;
    max_total_elec_power_w: number;
    max_thermal_dissipation_per_motor_w: number;
    max_pitch_speed_mps: number;
    estimated_top_speed_kmh: number;
    burst_flight_time_minutes: number;
  };
  financial: {
    frame_cost_usd: number;
    motors_total_cost_usd: number;
    props_total_cost_usd: number;
    esc_cost_usd: number;
    battery_cost_usd: number;
    total_cost_usd: number;
  };
  throttle_curve: ThrottleCurvePoint[];
}

export interface DiagnosticRule {
  rule_id: string;
  name: string;
  category: string;
  severity: "FATAL" | "CRITICAL" | "WARNING" | "INFO" | "PASSED";
  passed: boolean;
  message: string;
  recommendation: string;
  details: Record<string, any>;
}

export interface DiagnosticsResult {
  health_score: number;
  status: string;
  status_color: string;
  is_flight_ready: boolean;
  summary: {
    total_checks: number;
    passed_count: number;
    fatal_count: number;
    critical_count: number;
    warning_count: number;
    info_count: number;
  };
  rules: DiagnosticRule[];
  action_items: Array<{
    rule_id: string;
    severity: string;
    category: string;
    title: string;
    issue: string;
    recommendation: string;
  }>;
}

export interface ParetoPoint {
  individual_indices: number[];
  build_name: string;
  flight_time_mins: number;
  total_cost_usd: number;
  twr: number;
  auw_g: number;
  health_score: number;
  is_flight_ready: boolean;
  frame: Frame;
  motor: Motor;
  prop: Propeller;
  esc: ESC;
  battery: Battery;
}

export interface ChampionBuild {
  title: string;
  badge: string;
  description: string;
  flight_time_mins: number;
  total_cost_usd: number;
  twr: number;
  auw_g: number;
  hover_throttle_pct: number;
  health_score: number;
  frame: Frame;
  motor: Motor;
  prop: Propeller;
  esc: ESC;
  battery: Battery;
  simulation: SimulationResult;
  diagnostics: DiagnosticsResult;
}

export interface OptimizerResult {
  summary: {
    generations_completed: number;
    population_size: number;
    total_evaluated_combinations: number;
    pareto_frontier_count: number;
    valid_flight_ready_count: number;
  };
  history: Array<{
    generation: number;
    front_size: number;
    valid_count: number;
    best_flight_time_mins: number;
    avg_cost_usd: number;
  }>;
  pareto_frontier: ParetoPoint[];
  top_builds: {
    endurance_champion: ChampionBuild;
    value_champion: ChampionBuild;
    agility_champion: ChampionBuild;
  };
}

export interface CatalogLibrary {
  frames: Frame[];
  motors: Motor[];
  propellers: Propeller[];
  escs: ESC[];
  batteries: Battery[];
}
