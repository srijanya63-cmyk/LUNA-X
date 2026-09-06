import { create } from 'zustand';

export type ViewMode = 'global_moon' | 'south_pole' | 'mission_twin';
export type OverlayLayer = 'none' | 'ice_likelihood' | 'confidence' | 'hazard' | 'slope';

export interface TerrainAnalysisData {
  grid_x: number;
  grid_y: number;
  world_pos: [number, number, number];
  elevation_m: number;
  slope_deg: number;
  hazard_level: 'LOW' | 'MODERATE' | 'HIGH';
  illumination_pct: number;
  ice_likelihood_pct: number;
  confidence_pct: number;
  accessibility_score: number;
}

interface UIState {
  viewMode: ViewMode;
  activeLayer: OverlayLayer;
  isAnalyticsOpen: boolean;
  isConfigOpen: boolean;
  isEventsOpen: boolean;
  isAIWidgetOpen: boolean;
  isComparisonOpen: boolean;
  isReportOpen: boolean;
  isChallengeOpen: boolean;
  isHumanVsAutoOpen: boolean;
  isTransparencyOpen: boolean;
  isShortcutsOpen: boolean;
  performanceSettings: {
    quality: 'high' | 'medium' | 'low';
    enableShadows: boolean;
    starCount: number;
    enableParticles: boolean;
  };
  clickedTerrainPoint: TerrainAnalysisData | null;
  notification: { type: 'info' | 'success' | 'warning' | 'error'; message: string } | null;

  setViewMode: (mode: ViewMode) => void;
  setActiveLayer: (layer: OverlayLayer) => void;
  toggleAnalytics: () => void;
  toggleConfig: () => void;
  toggleEvents: () => void;
  toggleAIWidget: () => void;
  toggleComparison: () => void;
  toggleReport: () => void;
  toggleChallenge: () => void;
  toggleHumanVsAuto: () => void;
  toggleTransparency: () => void;
  toggleShortcuts: () => void;
  setQuality: (quality: 'high' | 'medium' | 'low') => void;
  setClickedTerrainPoint: (data: TerrainAnalysisData | null) => void;
  setNotification: (type: 'info' | 'success' | 'warning' | 'error', message: string) => void;
  clearNotification: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  viewMode: 'global_moon',
  activeLayer: 'ice_likelihood',
  isAnalyticsOpen: false,
  isConfigOpen: true,
  isEventsOpen: false,
  isAIWidgetOpen: false,
  isComparisonOpen: false,
  isReportOpen: false,
  isChallengeOpen: false,
  isHumanVsAutoOpen: false,
  isTransparencyOpen: false,
  isShortcutsOpen: false,
  performanceSettings: {
    quality: 'high',
    enableShadows: true,
    starCount: 2000,
    enableParticles: true,
  },
  clickedTerrainPoint: null,
  notification: null,

  setViewMode: (mode) => set({ viewMode: mode }),
  setActiveLayer: (layer) => set({ activeLayer: layer }),
  toggleAnalytics: () => set((s) => ({ isAnalyticsOpen: !s.isAnalyticsOpen })),
  toggleConfig: () => set((s) => ({ isConfigOpen: !s.isConfigOpen })),
  toggleEvents: () => set((s) => ({ isEventsOpen: !s.isEventsOpen })),
  toggleAIWidget: () => set((s) => ({ isAIWidgetOpen: !s.isAIWidgetOpen })),
  toggleComparison: () => set((s) => ({ isComparisonOpen: !s.isComparisonOpen })),
  toggleReport: () => set((s) => ({ isReportOpen: !s.isReportOpen })),
  toggleChallenge: () => set((s) => ({ isChallengeOpen: !s.isChallengeOpen })),
  toggleHumanVsAuto: () => set((s) => ({ isHumanVsAutoOpen: !s.isHumanVsAutoOpen })),
  toggleTransparency: () => set((s) => ({ isTransparencyOpen: !s.isTransparencyOpen })),
  toggleShortcuts: () => set((s) => ({ isShortcutsOpen: !s.isShortcutsOpen })),
  setQuality: (quality) => set({
    performanceSettings: {
      quality,
      enableShadows: quality !== 'low',
      starCount: quality === 'high' ? 2000 : quality === 'medium' ? 1000 : 400,
      enableParticles: quality !== 'low',
    }
  }),
  setClickedTerrainPoint: (data) => set({ clickedTerrainPoint: data }),
  setNotification: (type, message) => set({ notification: { type, message } }),
  clearNotification: () => set({ notification: null }),
}));

