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

const rawBaseUrl = ((import.meta as any).env?.VITE_API_BASE_URL as string) || ((import.meta as any).env?.VITE_API_URL as string) || 'https://luna-x-backend.vercel.app/api/v1';
const API_BASE_URL = rawBaseUrl.replace(/\/+$/, '');

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
  getHealth: (options?: RequestInit) => fetchJSON<{ status: string; version: string; scientific_engine: string; mission_engine: string; ollama: string }>('/health', options),

  // Terrain
  getTerrainSummary: (options?: RequestInit) => fetchJSON<TerrainSummary>('/terrain', options),

  // Intelligence
  getIceLikelihood: (params?: { w_cpr?: number; w_psr?: number; w_albedo?: number; w_slope?: number }, options?: RequestInit) => {
    const query = new URLSearchParams();
    if (params?.w_cpr !== undefined) query.append('w_cpr', params.w_cpr.toString());
    if (params?.w_psr !== undefined) query.append('w_psr', params.w_psr.toString());
    if (params?.w_albedo !== undefined) query.append('w_albedo', params.w_albedo.toString());
    if (params?.w_slope !== undefined) query.append('w_slope', params.w_slope.toString());
    
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return fetchJSON<IceLikelihoodResult>(`/intelligence/ice-likelihood${queryString}`, options);
  },

  getLandingSites: (payload?: Record<string, any>, options?: RequestInit) => 
    fetchJSON<LandingCandidate[]>('/intelligence/landing-sites', {
      method: 'POST',
      body: JSON.stringify(payload || {}),
      ...options,
    }),

  // Mission
  planMission: (config: MissionConfig, options?: RequestInit) =>
    fetchJSON<MissionPlanResponsePayload>('/mission/plan', {
      method: 'POST',
      body: JSON.stringify(config),
      ...options,
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
