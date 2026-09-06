export type MissionObjective = 
  | 'max_science' 
  | 'max_ice' 
  | 'max_safety' 
  | 'min_energy' 
  | 'min_distance' 
  | 'balanced';

export type RiskTolerance = 'low' | 'medium' | 'high';

export type MissionStatus = 
  | 'planned' 
  | 'ready' 
  | 'running' 
  | 'paused' 
  | 'blocked' 
  | 'replanning' 
  | 'completed' 
  | 'failed';

export type FeasibilityStatus = 
  | 'feasible' 
  | 'infeasible' 
  | 'no_route' 
  | 'insufficient_energy' 
  | 'excessive_risk' 
  | 'invalid_configuration';

export interface GridMetadata {
  grid_shape: [number, number];
  pixel_resolution_m: number;
  bounding_box_meters: {
    x_min: number;
    x_max: number;
    y_min: number;
    y_max: number;
  };
  reference_frame: string;
  data_mode: string;
}

export interface TerrainSummary {
  min_elevation_m: number;
  max_elevation_m: number;
  mean_elevation_m: number;
  max_slope_deg: number;
  mean_slope_deg: number;
  high_hazard_area_pct: number;
  metadata: GridMetadata;
}

export interface IceLikelihoodResult {
  ice_likelihood_mean: number;
  ice_likelihood_max: number;
  confidence_mean: number;
  high_likelihood_area_pct: number;
  grid_shape: [number, number];
  data_mode: string;
  metadata: Record<string, any>;
}

export interface LandingCandidate {
  id: string;
  name: string;
  grid_x: number;
  grid_y: number;
  lat: number;
  lon: number;
  elevation_m: number;
  composite_score: number;
  ice_likelihood_score: number;
  safety_score: number;
  illumination_score: number;
  comm_score: number;
  hazard_score: number;
  rank: number;
  data_mode: string;
  description?: string;
}

export interface MissionConfig {
  start_pos: [number, number];
  target_pos: [number, number];
  energy_budget_wh: number;
  risk_tolerance: RiskTolerance;
  objective: MissionObjective;
  max_allowed_slope_deg: number;
  max_allowed_hazard: number;
  risk_weight: number;
  energy_weight: number;
  distance_weight: number;
}

export interface MissionPlanResponsePayload {
  mission_id: string;
  status: string;
  success: boolean;
  path: [number, number][];
  metrics: {
    distance_m: number;
    estimated_energy_wh: number;
    estimated_energy_joules: number;
    average_hazard: number;
    max_hazard: number;
    max_slope_deg: number;
    nodes_explored: number;
    feasibility: FeasibilityStatus;
  };
  explanation: {
    objective: string;
    risk_tolerance: string;
    reason: string;
    major_factors: string[];
  };
}

export interface ReplanningResult {
  replanned: boolean;
  reason: string;
  old_path: [number, number][];
  new_path: [number, number][];
  additional_distance_m: number;
  additional_energy_wh: number;
  new_risk_score: number;
  mission_feasible: boolean;
}

export interface AIStatusResponse {
  enabled: boolean;
  provider: string;
  local: boolean;
  available: boolean;
  model: string;
  fallback_enabled: boolean;
}

export interface IntentParseResponse {
  objective: MissionObjective;
  risk_tolerance: RiskTolerance;
  energy_budget_wh: number;
  max_allowed_slope_deg: number;
  max_allowed_hazard: number;
  source: string;
  local_ai_available: boolean;
}

export interface ExplainMissionResponse {
  explanation_text: string;
  source: string;
  local_ai_available: boolean;
}

export type LayerOverlayType = 'none' | 'ice' | 'hazard' | 'illumination' | 'slope' | 'science';

export interface TerrainAnalysisData {
  grid_x: number;
  grid_y: number;
  world_pos: [number, number, number];
  elevation_m: number;
  slope_deg: number;
  hazard: number;
  ice_likelihood: number;
  confidence: number;
  illumination_pct: number;
  accessibility_score: number;
}

export interface ActivityLogEntry {
  id: string;
  timestamp: string;
  type: 'info' | 'warning' | 'error' | 'success';
  message: string;
  category: string;
}

export interface ChallengeMission {
  id: string;
  name: string;
  description: string;
  targetSite: string;
  timeLimitSec: number;
  minBatteryPct: number;
  targetIceYield: number;
  maxHazardLimit: number;
  difficulty: 'Standard' | 'Hard' | 'Extreme';
}

export interface PerformanceSettings {
  quality: 'high' | 'medium' | 'low';
  enableShadows: boolean;
  starCount: number;
  enableParticles: boolean;
}

export interface MissionScoreBreakdown {
  totalScore: number;
  iceYieldScore: number;
  energyReserveScore: number;
  hazardSafetyScore: number;
  distanceEfficiencyScore: number;
}

export interface SubsystemHealth {
  power: number;
  thermal: number;
  mobility: number;
  comms: number;
  payload: number;
  overallStatus: 'NOMINAL' | 'WARNING' | 'CRITICAL';
}

export interface HumanRoute {
  points: [number, number][];
  distance_m: number;
  estimated_energy_wh: number;
  avg_hazard: number;
  ice_yield_estimate: number;
}

