import React, { useEffect } from 'react';
import { LunarMissionScene } from './scenes/LunarMissionScene';
import { HeaderHUD } from './components/hud/HeaderHUD';
import { LayerLegendHUD } from './components/hud/LayerLegendHUD';
import { ControlPanelHUD } from './components/hud/ControlPanelHUD';
import { TelemetryHUD } from './components/hud/TelemetryHUD';
import { EventControlHUD } from './components/hud/EventControlHUD';
import { AnalyticsModal } from './components/hud/AnalyticsModal';
import { SiteComparisonModal } from './components/hud/SiteComparisonModal';
import { AIWidgetHUD } from './components/hud/AIWidgetHUD';
import { NotificationHUD } from './components/hud/NotificationHUD';
import { TerrainAnalysisHUD } from './components/hud/TerrainAnalysisHUD';
import { MissionReportModal } from './components/hud/MissionReportModal';
import { ActivityFeedHUD } from './components/hud/ActivityFeedHUD';
import { HumanVsAutoModal } from './components/hud/HumanVsAutoModal';
import { ChallengeModeModal } from './components/hud/ChallengeModeModal';
import { TransparencyModal } from './components/hud/TransparencyModal';
import { KeyboardShortcutsHUD } from './components/hud/KeyboardShortcutsHUD';
import { useUIStore } from './stores/useUIStore';
import { useTerrainStore } from './stores/useTerrainStore';
import { useMissionStore } from './stores/useMissionStore';

if (typeof window !== 'undefined') {
  (window as any).useUIStore = useUIStore;
  (window as any).useTerrainStore = useTerrainStore;
  (window as any).useMissionStore = useMissionStore;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('LUNA-X React ErrorBoundary caught an exception:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-screen h-screen bg-slate-950 flex items-center justify-center p-6 text-slate-100 font-mono">
          <div className="max-w-md bg-slate-900 border border-rose-500/40 p-6 rounded-xl space-y-4 shadow-2xl text-center">
            <h2 className="text-lg font-bold text-rose-400">MISSION CONTROL RECOVERY MODE</h2>
            <p className="text-xs text-slate-400">
              A temporary UI render error was intercepted. The 3D scene state has been safely isolated.
            </p>
            <div className="p-2 bg-slate-950 rounded border border-slate-800 text-[10px] text-rose-300 font-mono text-left max-h-24 overflow-y-auto">
              {this.state.error?.message || 'Unknown render exception'}
            </div>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded text-xs transition-all"
            >
              REBOOT MISSION CONTROL
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export const App: React.FC = () => {
  const [isBooting, setIsBooting] = React.useState(true);
  const fetchTerrainData = useTerrainStore((s) => s.fetchTerrainData);
  const checkAIStatus = useMissionStore((s) => s.checkAIStatus);

  useEffect(() => {
    fetchTerrainData();
    checkAIStatus();
    const timer = setTimeout(() => setIsBooting(false), 1400);
    return () => clearTimeout(timer);
  }, [fetchTerrainData, checkAIStatus]);

  return (
    <ErrorBoundary>
      <div className="w-screen h-screen relative bg-slate-950 overflow-hidden select-none font-mono">
        {/* Initial Aerospace Boot Overlay */}
        {isBooting && (
          <div className="absolute inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center space-y-4 font-mono text-xs">
            <div className="relative p-3 rounded-2xl bg-sky-950/80 border border-sky-500/50 shadow-[0_0_25px_rgba(56,189,248,0.3)]">
              <span className="w-3 h-3 rounded-full bg-sky-400 animate-ping block" />
            </div>
            <div className="text-center space-y-1">
              <h2 className="text-lg font-black tracking-widest text-sky-400 font-display">LUNA-X</h2>
              <p className="text-[11px] text-slate-400 font-tech tracking-wider">INITIALIZING MISSION CONTROL SYSTEM...</p>
            </div>
            <div className="w-48 bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800">
              <div className="bg-sky-400 h-full animate-[pulse_1s_infinite] w-full" />
            </div>
            <span className="text-[10px] text-slate-500">LRO DEM • ICE INTELLIGENCE • A* PATHFINDER • R3F WEBGL</span>
          </div>
        )}

        {/* 3D WebGL Scene */}
        <LunarMissionScene />

        {/* Futuristic Mission Control HUD Overlay */}
        <HeaderHUD />
        <LayerLegendHUD />
        <ControlPanelHUD />
        <TelemetryHUD />
        <EventControlHUD />
        <ActivityFeedHUD />
        <AIWidgetHUD />
        <AnalyticsModal />
        <SiteComparisonModal />
        <TerrainAnalysisHUD />
        <MissionReportModal />
        <HumanVsAutoModal />
        <ChallengeModeModal />
        <TransparencyModal />
        <KeyboardShortcutsHUD />
        <NotificationHUD />
      </div>
    </ErrorBoundary>
  );
};

export default App;


