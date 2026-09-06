import React from 'react';
import { Shield, Orbit, MapPin, Radio, Bot, BarChart3, Sparkles, Trophy, UserCheck, HelpCircle, Info, HeartPulse } from 'lucide-react';
import { useUIStore } from '../../stores/useUIStore';
import { useMissionStore } from '../../stores/useMissionStore';
import { useTerrainStore } from '../../stores/useTerrainStore';

export const HeaderHUD: React.FC = () => {
  const [missionSec, setMissionSec] = React.useState(277);

  React.useEffect(() => {
    const timer = setInterval(() => setMissionSec((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatMissionTime = (sec: number) => {
    const hrs = String(Math.floor(sec / 3600)).padStart(2, '0');
    const mins = String(Math.floor((sec % 3600) / 60)).padStart(2, '0');
    const secs = String(sec % 60).padStart(2, '0');
    return `${hrs}:${mins}:${secs}`;
  };

  const {
    viewMode,
    setViewMode,
    toggleAnalytics,
    toggleAIWidget,
    toggleChallenge,
    toggleHumanVsAuto,
    toggleTransparency,
    toggleShortcuts,
    isAnalyticsOpen,
    isChallengeOpen,
    isHumanVsAutoOpen,
  } = useUIStore();
  const { aiStatus, autonomousStep, missionPlan } = useMissionStore();
  const { terrainSummary } = useTerrainStore();

  const dataMode = terrainSummary?.metadata?.data_mode || 'SIMULATION MODE';
  const healthStatus = autonomousStep === 'infeasible' ? 'CRITICAL' : missionPlan?.metrics?.feasibility === 'insufficient_energy' ? 'WARNING' : 'NOMINAL';


  return (
    <header className="absolute top-0 left-0 right-0 z-30 px-6 py-2.5 flex items-center justify-between bg-slate-950/85 backdrop-blur-xl border-b border-slate-800/80 text-slate-100 shadow-2xl">
      {/* Brand & Mission Control Identity */}
      <div className="flex items-center space-x-3.5">
        <div className="relative p-2 rounded-xl bg-sky-950/60 border border-sky-500/40 text-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.2)]">
          <Radio className="w-5 h-5 animate-pulse text-sky-400" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-sky-400 animate-ping" />
        </div>
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-2xl font-black tracking-widest text-[#123b5d] font-display whitespace-nowrap">
              LUNA-X
            </h1>
            <span className="text-[10px] font-mono font-extrabold px-2 py-0.5 rounded bg-sky-950/80 text-sky-300 border border-sky-700/60 tracking-wider">
              MISSION CONTROL
            </span>
          </div>
          <p className="text-[10px] font-tech font-semibold text-slate-400 tracking-wider flex items-center space-x-1 mt-0.5">
            <Sparkles className="w-3 h-3 text-sky-400" />
            <span>LUNAR MISSION INTELLIGENCE & 3D DIGITAL TWIN</span>
          </p>
        </div>
      </div>

      {/* Primary Navigation Tabs */}
      <nav className="flex items-center space-x-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
        <button
          onClick={() => setViewMode('global_moon')}
          className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-tech font-bold tracking-wider transition-all duration-200 ${
            viewMode === 'global_moon'
              ? 'bg-sky-500 text-white shadow-[0_0_12px_rgba(56,189,248,0.4)] scale-[1.02]'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Orbit className="w-3.5 h-3.5" />
          <span>GLOBAL MOON</span>
        </button>

        <button
          onClick={() => setViewMode('south_pole')}
          className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-tech font-bold tracking-wider transition-all duration-200 ${
            viewMode === 'south_pole'
              ? 'bg-sky-500 text-white shadow-[0_0_12px_rgba(56,189,248,0.4)] scale-[1.02]'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <MapPin className="w-3.5 h-3.5" />
          <span>SOUTH POLE & ICE INTELLIGENCE</span>
        </button>

        <button
          onClick={() => setViewMode('mission_twin')}
          className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-tech font-bold tracking-wider transition-all duration-200 ${
            viewMode === 'mission_twin'
              ? 'bg-sky-500 text-white shadow-[0_0_12px_rgba(56,189,248,0.4)] scale-[1.02]'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>MISSION TWIN & SIMULATION</span>
        </button>
      </nav>

      {/* Operational Status Badges & Controls */}
      <div className="flex items-center space-x-2 font-mono">
        {/* Live Mission Clock Badge */}
        <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-sky-950/60 border border-sky-700/60 text-sky-300 text-xs font-bold shadow-sm">
          <span className="text-[10px] text-slate-400 font-tech">TIME:</span>
          <span>{formatMissionTime(missionSec)}</span>
        </div>

        {/* System Health Status Indicator */}
        <div className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold ${
          healthStatus === 'NOMINAL'
            ? 'bg-emerald-950/60 text-emerald-300 border-emerald-700/60 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
            : healthStatus === 'WARNING'
            ? 'bg-amber-950/60 text-amber-300 border-amber-700/60 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
            : 'bg-rose-950/60 text-rose-300 border-rose-700/60 shadow-[0_0_10px_rgba(239,68,68,0.2)]'
        }`}>
          <HeartPulse className="w-3.5 h-3.5 animate-pulse" />
          <span>● {healthStatus}</span>
        </div>


        {/* Challenge Mode Trigger */}
        <button
          onClick={toggleChallenge}
          className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg border text-xs font-tech font-bold tracking-wider transition-all ${
            isChallengeOpen
              ? 'bg-amber-500 text-white border-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.4)]'
              : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border-slate-700/80'
          }`}
          title="Commander Challenge Mode"
        >
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
          <span>CHALLENGES</span>
        </button>

        {/* Human vs LUNA-X Plan Comparison Trigger */}
        <button
          onClick={toggleHumanVsAuto}
          className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg border text-xs font-tech font-bold tracking-wider transition-all ${
            isHumanVsAutoOpen
              ? 'bg-sky-600 text-white border-sky-500 shadow-[0_0_10px_rgba(56,189,248,0.4)]'
              : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border-slate-700/80'
          }`}
          title="Human vs AI Route Comparison"
        >
          <UserCheck className="w-3.5 h-3.5 text-sky-400" />
          <span>HUMAN VS AI</span>
        </button>

        {/* Local AI Assistant Status Toggle */}
        <button
          onClick={toggleAIWidget}
          className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg border text-xs font-mono font-bold transition-all ${
            aiStatus?.available
              ? 'bg-teal-950/60 text-teal-300 border-teal-700/60 shadow-[0_0_10px_rgba(20,184,166,0.2)]'
              : 'bg-slate-900/80 text-slate-400 border-slate-700/80 hover:bg-slate-800'
          }`}
        >
          <Bot className="w-3.5 h-3.5 text-teal-400" />
          <span>{aiStatus?.available ? `LOCAL AI` : 'AI ENGINE'}</span>
        </button>

        {/* Post-Mission Analytics Trigger */}
        <button
          onClick={toggleAnalytics}
          className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg border text-xs font-tech font-bold tracking-wider transition-all ${
            isAnalyticsOpen
              ? 'bg-sky-500 text-white border-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.4)]'
              : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border-slate-700/80'
          }`}
          title="Open Post-Mission Analytics"
        >
          <BarChart3 className="w-3.5 h-3.5 text-sky-400" />
          <span>ANALYTICS</span>
        </button>

        {/* System Transparency Modal Trigger */}
        <button
          onClick={toggleTransparency}
          className="p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 text-slate-300 transition-all"
          title="How LUNA-X Works (System Transparency)"
        >
          <Info className="w-4 h-4 text-sky-400" />
        </button>

        {/* Keyboard Shortcuts Trigger */}
        <button
          onClick={toggleShortcuts}
          className="p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 text-slate-400 hover:text-white transition-all"
          title="Keyboard Shortcuts"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
