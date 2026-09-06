import { create } from 'zustand';
import { api } from '../services/api';
import { useTerrainStore } from './useTerrainStore';
import { useUIStore } from './useUIStore';
import {
  MissionConfig,
  MissionPlanResponsePayload,
  ReplanningResult,
  MissionObjective,
  RiskTolerance,
  AIStatusResponse,
  ActivityLogEntry,
  ChallengeMission,
  HumanRoute
} from '../types';

export type AutonomousStep =
  | 'idle'
  | 'analyzing'
  | 'planning'
  | 'verified'
  | 'traversing'
  | 'replanning'
  | 'completed'
  | 'infeasible';

interface MissionStateStore {
  config: MissionConfig;
  missionPlan: MissionPlanResponsePayload | null;
  isPlanning: boolean;
  error: string | null;

  // Traversal Simulation Controls
  isPlaying: boolean;
  roverNodeIndex: number;
  animSpeed: number; // 1x, 2x, 5x

  // Autonomous Execution Mode
  autonomousStep: AutonomousStep;

  // Local AI State
  aiStatus: AIStatusResponse | null;
  aiExplanation: string | null;

  // Master Upgrade Additions
  activityLogs: ActivityLogEntry[];
  customWeights: { risk: number; energy: number; distance: number; ice: number };
  sunAngleDeg: number;
  isDrawingHumanRoute: boolean;
  humanRoute: HumanRoute | null;
  activeChallenge: ChallengeMission | null;
  challengeScore: number | null;

  // Actions
  setConfig: (partial: Partial<MissionConfig>) => void;
  setCustomWeights: (weights: { risk: number; energy: number; distance: number; ice: number }) => void;
  setSunAngleDeg: (angle: number) => void;
  addActivityLog: (log: { type: 'info' | 'warning' | 'error' | 'success'; message: string; category: string }) => void;
  setDrawingHumanRoute: (drawing: boolean) => void;
  addHumanWaypoint: (point: [number, number]) => void;
  clearHumanRoute: () => void;
  startChallenge: (challenge: ChallengeMission) => void;
  planMission: () => Promise<void>;
  triggerEvent: (eventType: string, payload: Record<string, any>) => Promise<ReplanningResult | null>;
  setIsPlaying: (playing: boolean) => void;
  setRoverNodeIndex: (index: number) => void;
  setAnimSpeed: (speed: number) => void;
  setAutonomousStep: (step: AutonomousStep) => void;
  resetSimulation: () => void;
  resetDemoState: () => void;
  startDemoMission: () => Promise<void>;
  startAutonomousMission: () => Promise<void>;
  replayMission: () => void;
  checkAIStatus: () => Promise<void>;
  parsePromptIntent: (prompt: string) => Promise<void>;
}

const DEFAULT_CONFIG: MissionConfig = {
  start_pos: [20, 20],
  target_pos: [32, 35],
  energy_budget_wh: 600.0,
  risk_tolerance: 'medium',
  objective: 'balanced',
  max_allowed_slope_deg: 25.0,
  max_allowed_hazard: 0.80,
  risk_weight: 0.35,
  energy_weight: 0.35,
  distance_weight: 0.30,
};


export const useMissionStore = create<MissionStateStore>((set, get) => ({
  config: DEFAULT_CONFIG,
  missionPlan: null,
  isPlanning: false,
  error: null,

  isPlaying: false,
  roverNodeIndex: 0,
  animSpeed: 1,

  autonomousStep: 'idle',

  aiStatus: null,
  aiExplanation: null,

  // Master Upgrade Initial State
  activityLogs: [
    {
      id: 'init-1',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      type: 'info',
      message: 'LUNA-X Digital Twin System Online. Initialized South Pole DEM & Ice Intelligence model.',
      category: 'SYSTEM',
    },
  ],
  customWeights: { risk: 0.35, energy: 0.35, distance: 0.30, ice: 0.40 },
  sunAngleDeg: 45,
  isDrawingHumanRoute: false,
  humanRoute: null,
  activeChallenge: null,
  challengeScore: null,

  setConfig: (partial) =>
    set((state) => ({
      config: { ...state.config, ...partial },
    })),

  setCustomWeights: (weights) => {
    set((state) => ({
      customWeights: weights,
      config: {
        ...state.config,
        risk_weight: weights.risk,
        energy_weight: weights.energy,
        distance_weight: weights.distance,
      },
    }));
    get().addActivityLog({
      type: 'info',
      category: 'WEIGHTS',
      message: `Custom A* Weights updated: Hazard=${weights.risk.toFixed(2)}, Energy=${weights.energy.toFixed(2)}, Ice=${weights.ice.toFixed(2)}`,
    });
    // Trigger re-plan if mission configured
    get().planMission();
  },

  setSunAngleDeg: (angle) => set({ sunAngleDeg: angle }),

  addActivityLog: (log) =>
    set((state) => ({
      activityLogs: [
        {
          id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          ...log,
        },
        ...state.activityLogs.slice(0, 49),
      ],
    })),

  setDrawingHumanRoute: (drawing) => set({ isDrawingHumanRoute: drawing }),

  addHumanWaypoint: (point) => {
    set((state) => {
      const existingPoints = state.humanRoute?.points || [];
      const newPoints = [...existingPoints, point];
      let dist = 0;
      for (let i = 1; i < newPoints.length; i++) {
        const dx = (newPoints[i][0] - newPoints[i - 1][0]) * 15;
        const dy = (newPoints[i][1] - newPoints[i - 1][1]) * 15;
        dist += Math.sqrt(dx * dx + dy * dy);
      }
      const estimated_energy_wh = Number((dist * 0.45).toFixed(1));
      const ice_yield_estimate = Number((dist * 0.85).toFixed(1));
      return {
        humanRoute: {
          points: newPoints,
          distance_m: Number(dist.toFixed(1)),
          estimated_energy_wh,
          avg_hazard: 0.22,
          ice_yield_estimate,
        },
      };
    });
  },

  clearHumanRoute: () => set({ humanRoute: null }),

  startChallenge: (challenge) => {
    set({
      activeChallenge: challenge,
      challengeScore: null,
      config: {
        ...get().config,
        energy_budget_wh: challenge.minBatteryPct * 5,
        max_allowed_hazard: challenge.maxHazardLimit,
      },
    });
    get().addActivityLog({
      type: 'warning',
      category: 'COMMANDER',
      message: `CHALLENGE INITIALIZED: "${challenge.name}" (${challenge.difficulty}). Target: ${challenge.targetSite}.`,
    });
    useUIStore.getState().setNotification('info', `Challenge mode active: ${challenge.name}`);
  },

  setAutonomousStep: (step) => set({ autonomousStep: step }),

  planMission: async () => {
    if (get().isPlanning) return;
    set({ isPlanning: true, error: null, isPlaying: false, roverNodeIndex: 0 });
    get().addActivityLog({ type: 'info', category: 'SOLVER', message: 'Weighted A* Pathfinding solver initiated...' });

    let plan = null;
    let lastErr = null;

    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Backend connection timed out during spin-up')), 12000)
        );
        plan = await Promise.race([api.planMission(get().config), timeoutPromise]);
        lastErr = null;
        break;
      } catch (err: any) {
        lastErr = err;
        if (attempt < 2) {
          get().addActivityLog({
            type: 'warning',
            category: 'SOLVER',
            message: 'WAKING UP LUNAR ENGINE... Retrying pathfinding solver...',
          });
          useUIStore.getState().setNotification('info', 'WAKING UP LUNAR ENGINE: Retrying pathfinding solver...');
          await new Promise((res) => setTimeout(res, 2000));
        }
      }
    }

    if (plan) {
      set({ missionPlan: plan, isPlanning: false });
      get().addActivityLog({
        type: 'success',
        category: 'SOLVER',
        message: `Route solved successfully! Path: ${plan.path.length} waypoints, Distance: ${plan.metrics.distance_m.toFixed(0)}m, Energy: ${plan.metrics.estimated_energy_wh.toFixed(1)}Wh.`,
      });

      // Automatically fetch briefing explanation in background (non-blocking)
      api
        .explainMission({
          objective: plan.explanation.objective,
          distance_m: plan.metrics.distance_m,
          energy_wh: plan.metrics.estimated_energy_wh,
          reason: plan.explanation.reason,
        })
        .then((briefing) => {
          set({ aiExplanation: briefing.explanation_text });
        })
        .catch(() => {
          set({ aiExplanation: `Mission planned successfully: ${plan.explanation.reason}` });
        });
    } else {
      const errMsg = lastErr?.message || 'Mission planning failed';
      set({ error: errMsg, isPlanning: false });
      get().addActivityLog({ type: 'error', category: 'SOLVER', message: `Pathfinding failed: ${errMsg}` });
    }
  },


  triggerEvent: async (eventType, payload) => {
    const plan = get().missionPlan;
    if (!plan || !plan.mission_id) return null;

    try {
      const res = await api.sendMissionEvent(plan.mission_id, eventType, payload);

      if (eventType === 'energy_reduction' && payload.new_energy_budget_wh != null) {
        set((state) => ({
          config: {
            ...state.config,
            energy_budget_wh: Number(payload.new_energy_budget_wh),
          },
        }));
      }

      if (res.replanned && res.new_path.length > 0) {
        set((state) => ({
          autonomousStep: 'replanning',
          missionPlan: state.missionPlan
            ? {
                ...state.missionPlan,
                path: res.new_path,
                metrics: {
                  ...state.missionPlan.metrics,
                  distance_m: state.missionPlan.metrics.distance_m + res.additional_distance_m,
                  estimated_energy_wh: state.missionPlan.metrics.estimated_energy_wh + res.additional_energy_wh,
                  average_hazard: res.new_risk_score,
                  feasibility: res.mission_feasible === false ? 'insufficient_energy' : 'feasible',
                },
              }
            : null,
          roverNodeIndex: 0,
        }));
        setTimeout(() => {
          set({ autonomousStep: 'traversing' });
        }, 1200);
      } else if (res && res.mission_feasible === false) {
        set((state) => ({
          isPlaying: false,
          autonomousStep: 'infeasible',
          missionPlan: state.missionPlan
            ? {
                ...state.missionPlan,
                metrics: {
                  ...state.missionPlan.metrics,
                  feasibility: 'insufficient_energy',
                },
              }
            : null,
        }));
      }

      return res;
    } catch (err: any) {
      set({ error: err.message || 'Failed to execute mission event' });
      return null;
    }
  },

  setIsPlaying: (playing) =>
    set((state) => {
      const maxNodes = state.missionPlan?.path?.length ?? 1;
      const isAtEnd = state.roverNodeIndex >= maxNodes - 1;
      const nextStep = playing ? (isAtEnd ? 'traversing' : state.autonomousStep) : state.autonomousStep;
      return {
        isPlaying: playing,
        roverNodeIndex: playing && isAtEnd ? 0 : state.roverNodeIndex,
        autonomousStep: isAtEnd && playing ? 'traversing' : nextStep,
      };
    }),

  setRoverNodeIndex: (index) =>
    set((state) => {
      const maxNodes = state.missionPlan?.path?.length ?? 1;
      const isCompleted = index >= maxNodes - 1 && maxNodes > 0;
      return {
        roverNodeIndex: index,
        autonomousStep: isCompleted ? 'completed' : state.autonomousStep,
      };
    }),

  setAnimSpeed: (speed) => set({ animSpeed: speed }),

  resetSimulation: () => set({ isPlaying: false, roverNodeIndex: 0, autonomousStep: 'idle' }),

  resetDemoState: () => {
    set({
      config: DEFAULT_CONFIG,
      missionPlan: null,
      isPlanning: false,
      error: null,
      isPlaying: false,
      roverNodeIndex: 0,
      animSpeed: 1,
      autonomousStep: 'idle',
      aiExplanation: null,
    });
  },

  startDemoMission: async () => {
    if (get().isPlanning) return;

    let candidates = useTerrainStore.getState().landingCandidates;
    if (candidates.length === 0) {
      await useTerrainStore.getState().fetchTerrainData();
      candidates = useTerrainStore.getState().landingCandidates;
    }
    
    let startX = 20;
    let startY = 20;
    if (candidates.length > 0) {
      const site = candidates[0];
      if (site.grid_x !== 88 || site.grid_y !== 64) {
        startX = site.grid_x;
        startY = site.grid_y;
      }
    }

    const demoSite = candidates.length > 0 ? candidates[0] : { grid_x: startX, grid_y: startY };
    useTerrainStore.getState().setSelectedCandidate(demoSite as any);

    set({
      roverNodeIndex: 0,
      isPlaying: false,
      config: {
        ...DEFAULT_CONFIG,
        start_pos: [startX, startY],
        target_pos: [Math.min(127, startX + 12), Math.min(127, startY + 15)],
        energy_budget_wh: 600.0,
        max_allowed_slope_deg: 25.0,
        max_allowed_hazard: 0.80,
      },
    });

    await get().planMission();
    const plan = get().missionPlan;
    if (plan && plan.success && plan.path.length > 0) {
      set({ isPlaying: true, roverNodeIndex: 0, autonomousStep: 'traversing' });
    }
  },

  startAutonomousMission: async () => {
    set({ autonomousStep: 'analyzing', isPlaying: false });

    // Step 1: Fetch & Select Landing Site
    let candidates = useTerrainStore.getState().landingCandidates;
    if (candidates.length === 0) {
      await useTerrainStore.getState().fetchTerrainData();
      candidates = useTerrainStore.getState().landingCandidates;
    }

    const selectedSite = useTerrainStore.getState().selectedCandidate || (candidates.length > 0 ? candidates[0] : null);
    if (selectedSite) {
      useTerrainStore.getState().setSelectedCandidate(selectedSite);
      set((state) => ({
        config: {
          ...state.config,
          start_pos: [selectedSite.grid_x, selectedSite.grid_y],
          target_pos: [Math.min(127, selectedSite.grid_x + 15), Math.min(127, selectedSite.grid_y + 12)],
          energy_budget_wh: Math.max(500, state.config.energy_budget_wh),
        },
      }));
    }

    // Step 2: Planning Route
    set({ autonomousStep: 'planning' });
    await get().planMission();

    const plan = get().missionPlan;
    if (plan && plan.success) {
      // Step 3: Route Verified
      set({ autonomousStep: 'verified' });
      setTimeout(() => {
        // Step 4: Traversing
        set({ autonomousStep: 'traversing', isPlaying: true });
      }, 500);
    } else {
      set({ autonomousStep: 'infeasible', isPlaying: false });
    }
  },

  replayMission: () => {
    const plan = get().missionPlan;
    if (!plan || !plan.success || plan.path.length === 0) {
      useUIStore.getState().setNotification('warning', 'Complete a mission before replaying it.');
      return;
    }
    set({
      isPlaying: true,
      roverNodeIndex: 0,
      autonomousStep: 'traversing',
    });
    useUIStore.getState().setNotification('info', 'MISSION REPLAY ACTIVE: Replaying completed traverse from Waypoint 0.');
  },

  checkAIStatus: async () => {
    try {
      const status = await api.getAIStatus();
      set({ aiStatus: status });
    } catch (err) {
      set({
        aiStatus: {
          enabled: true,
          provider: 'ollama',
          local: true,
          available: false,
          model: 'llama3:latest',
          fallback_enabled: true,
        },
      });
    }
  },

  parsePromptIntent: async (prompt) => {
    try {
      const parsed = await api.parsePromptIntent(prompt);
      set((state) => ({
        config: {
          ...state.config,
          objective: parsed.objective,
          risk_tolerance: parsed.risk_tolerance,
          energy_budget_wh: parsed.energy_budget_wh,
          max_allowed_slope_deg: parsed.max_allowed_slope_deg,
          max_allowed_hazard: parsed.max_allowed_hazard,
        },
      }));
    } catch (err: any) {
      set({ error: 'Failed to interpret prompt' });
    }
  },
}));
