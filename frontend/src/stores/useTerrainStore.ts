import { create } from 'zustand';
import { api } from '../services/api';
import { TerrainSummary, IceLikelihoodResult, LandingCandidate } from '../types';

const DEFAULT_LANDING_CANDIDATES: LandingCandidate[] = [
  {
    id: 'site-alpha',
    name: 'South Pole Plain Alpha',
    grid_x: 20,
    grid_y: 20,
    lat: -89.5,
    lon: 0.0,
    elevation_m: -1200,
    composite_score: 0.88,
    ice_likelihood_score: 0.85,
    safety_score: 0.90,
    illumination_score: 0.75,
    comm_score: 0.95,
    hazard_score: 0.20,
    rank: 1,
    data_mode: 'synthetic',
    description: 'Safe flat ejecta plain near South Pole',
  },
  {
    id: 'site-beta',
    name: 'Connecting Ridge Beta',
    grid_x: 42,
    grid_y: 42,
    lat: -89.1,
    lon: 45.0,
    elevation_m: -800,
    composite_score: 0.76,
    ice_likelihood_score: 0.72,
    safety_score: 0.85,
    illumination_score: 0.88,
    comm_score: 0.90,
    hazard_score: 0.35,
    rank: 2,
    data_mode: 'synthetic',
    description: 'Elevated ridge candidate site',
  },
];

interface TerrainState {
  terrainSummary: TerrainSummary | null;
  iceResult: IceLikelihoodResult | null;
  landingCandidates: LandingCandidate[];
  selectedCandidate: LandingCandidate | null;
  isLoading: boolean;
  error: string | null;

  fetchTerrainData: () => Promise<void>;
  setSelectedCandidate: (candidate: LandingCandidate | null) => void;
}

export const useTerrainStore = create<TerrainState>((set, get) => ({
  terrainSummary: null,
  iceResult: null,
  landingCandidates: DEFAULT_LANDING_CANDIDATES,
  selectedCandidate: DEFAULT_LANDING_CANDIDATES[0],
  isLoading: false,
  error: null,

  fetchTerrainData: async () => {
    set({ isLoading: true, error: null });
    try {
      const results = await Promise.allSettled([
        api.getTerrainSummary(),
        api.getIceLikelihood(),
        api.getLandingSites(),
      ]);

      const summary = results[0].status === 'fulfilled' ? results[0].value : get().terrainSummary;
      const ice = results[1].status === 'fulfilled' ? results[1].value : get().iceResult;
      const fetchedCandidates = results[2].status === 'fulfilled' && Array.isArray(results[2].value) && results[2].value.length > 0
        ? results[2].value
        : get().landingCandidates.length > 0
        ? get().landingCandidates
        : DEFAULT_LANDING_CANDIDATES;

      set({
        terrainSummary: summary,
        iceResult: ice,
        landingCandidates: fetchedCandidates,
        selectedCandidate: get().selectedCandidate || fetchedCandidates[0],
        isLoading: false,
      });
    } catch (err: any) {
      set({
        error: err.message || 'Failed to fetch lunar terrain data',
        isLoading: false,
        landingCandidates: get().landingCandidates.length > 0 ? get().landingCandidates : DEFAULT_LANDING_CANDIDATES,
      });
    }
  },

  setSelectedCandidate: (candidate) => set({ selectedCandidate: candidate }),
}));
