import { create } from 'zustand';
import { api } from '../services/api';
import { TerrainSummary, IceLikelihoodResult, LandingCandidate } from '../types';

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
  landingCandidates: [],
  selectedCandidate: null,
  isLoading: false,
  error: null,

  fetchTerrainData: async () => {
    set({ isLoading: true, error: null });
    try {
      const [summary, ice, candidates] = await Promise.all([
        api.getTerrainSummary(),
        api.getIceLikelihood(),
        api.getLandingSites(),
      ]);

      set({
        terrainSummary: summary,
        iceResult: ice,
        landingCandidates: candidates,
        selectedCandidate: candidates.length > 0 ? candidates[0] : null,
        isLoading: false,
      });
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch lunar terrain data', isLoading: false });
    }
  },

  setSelectedCandidate: (candidate) => set({ selectedCandidate: candidate }),
}));
