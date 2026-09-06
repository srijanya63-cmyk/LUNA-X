import {
  TerrainSummary,
  IceLikelihoodResult,
  LandingCandidate,
  MissionConfig,
  MissionPlanResponsePayload,
  ReplanningResult,
  AIStatusResponse,
  IntentParseResponse,
  ExplainMissionResponse
} from '../types';

const API_BASE_URL = ((import.meta as any).env?.VITE_API_BASE_URL as string) || 'http://127.0.0.1:8001/api/v1';

async function fetchJSON<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(errorData.detail || `HTTP Error ${response.status}`);
  }

  return response.json();
}

export const api = {
  // Health
  getHealth: () => fetchJSON<{ status: string; version: string; scientific_engine: string; mission_engine: string; ollama: string }>('/health'),

  // Terrain
  getTerrainSummary: () => fetchJSON<TerrainSummary>('/terrain'),

  // Intelligence
  getIceLikelihood: (params?: { w_cpr?: number; w_psr?: number; w_albedo?: number; w_slope?: number }) => {
    const query = new URLSearchParams();
    if (params?.w_cpr !== undefined) query.append('w_cpr', params.w_cpr.toString());
    if (params?.w_psr !== undefined) query.append('w_psr', params.w_psr.toString());
    if (params?.w_albedo !== undefined) query.append('w_albedo', params.w_albedo.toString());
    if (params?.w_slope !== undefined) query.append('w_slope', params.w_slope.toString());
    
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return fetchJSON<IceLikelihoodResult>(`/intelligence/ice-likelihood${queryString}`);
  },

  getLandingSites: (payload?: Record<string, any>) => 
    fetchJSON<LandingCandidate[]>('/intelligence/landing-sites', {
      method: 'POST',
      body: JSON.stringify(payload || {}),
    }),

  // Mission
  planMission: (config: MissionConfig) =>
    fetchJSON<MissionPlanResponsePayload>('/mission/plan', {
      method: 'POST',
      body: JSON.stringify(config),
    }),

  sendMissionEvent: (missionId: string, eventType: string, payload: Record<string, any>) =>
    fetchJSON<ReplanningResult>(`/mission/${missionId}/events`, {
      method: 'POST',
      body: JSON.stringify({ event_type: eventType, payload }),
    }),

  // Local AI
  getAIStatus: () => fetchJSON<AIStatusResponse>('/ai/status'),

  parsePromptIntent: (prompt: string) =>
    fetchJSON<IntentParseResponse>('/ai/parse-intent', {
      method: 'POST',
      body: JSON.stringify({ prompt }),
    }),

  explainMission: (missionSummary: Record<string, any>) =>
    fetchJSON<ExplainMissionResponse>('/ai/explain', {
      method: 'POST',
      body: JSON.stringify({ mission_summary: missionSummary }),
    }),
};
