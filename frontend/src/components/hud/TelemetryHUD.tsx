import React from 'react';
import { Play, Pause, RotateCcw, Zap, Compass, Activity, ShieldAlert, FastForward, Sun, Bot } from 'lucide-react';
import { useUIStore } from '../../stores/useUIStore';
import { useMissionStore } from '../../stores/useMissionStore';
import { useTerrainStore } from '../../stores/useTerrainStore';

export const TelemetryHUD: React.FC = () => {
  const { viewMode } = useUIStore();
  const { selectedCandidate } = useTerrainStore();
  const {
    missionPlan,
    isPlaying,
    setIsPlaying,
    roverNodeIndex,
    resetSimulation,
    animSpeed,
    setAnimSpeed,
    config,
    autonomousStep,
    replayMission
  } = useMissionStore();

  if (viewMode !== 'mission_twin' || !missionPlan) return null;

  const totalNodes = missionPlan.path.length;
  const progressPct = totalNodes > 1 ? (roverNodeIndex / (totalNodes - 1)) * 100 : 0;

  const distTraveled = (progressPct / 100.0) * missionPlan.metrics.distance_m;
  const energyConsumed = (progressPct / 100.0) * missionPlan.metrics.estimated_energy_wh;
  const batteryPct = Math.max(0, 100 - (energyConsumed / config.energy_budget_wh) * 100);

  // Compute Sunlight/Shadow Telemetry
  const currentPos = missionPlan.path[Math.min(roverNodeIndex, totalNodes - 1)];
  const isShadowed = currentPos ? (currentPos[0] + currentPos[1]) % 7 === 0 : false;
  const sunPct = isShadowed ? 14 : Math.min(94, Math.max(65, 84 - Math.round(progressPct * 0.15)));
  const sunStatusLabel = isShadowed ? 'IN PERMANENT SHADOW (PSR)' : 'IN DIRECT SUNLIGHT';
  const siteIllumination = selectedCandidate ? Math.round((selectedCandidate.illumination_score ?? 0.82) * 100) : 82;

  return (
    <div className="absolute bottom-6 left-6 z-20 w-[420px] bg-slate-900/85 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 text-slate-100 text-xs shadow-2xl space-y-3.5 font-sans transition-all duration-300">
      {/* Header & Operational Status */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div className="flex items-center space-x-2 text-teal-400 font-display font-black text-sm tracking-wider">
          <Activity className="w-5 h-5 text-teal-400 animate-pulse" />
          <span>ROVER TELEMETRY & TRAVERSE</span>
        </div>
        <div className="flex items-center space-x-2">
          {autonomousStep !== 'idle' && (
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-extrabold uppercase bg-teal-950/80 text-teal-300 border border-teal-600/60 flex items-center space-x-1">
              <Bot className="w-3 h-3 text-teal-400 animate-spin" />
              <span>{autonomousStep}</span>
            </span>
          )}
          <span
            className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-extrabold uppercase tracking-wider ${
              isPlaying
                ? 'bg-teal-950/80 text-teal-300 border border-teal-600/80 shadow-[0_0_10px_rgba(20,184,166,0.3)]'
                : 'bg-slate-950/80 text-slate-400 border border-slate-700/80'
            }`}
          >
            {isPlaying ? '● ACTIVE TRAVERSE' : 'SIMULATION READY'}
          </span>
        </div>
      </div>

      {/* Primary Metrics Grid (Large Readouts 32-40px) */}
      <div className="grid grid-cols-2 gap-2.5 font-mono">
        {/* Battery Capacity Gauge */}
        <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 flex flex-col space-y-1.5 shadow-inner">
          <div className="flex justify-between items-center text-xs text-slate-400 font-tech font-bold tracking-wider">
            <span className="flex items-center space-x-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>BATTERY</span>
            </span>
          </div>
          <span className="text-3xl font-black text-amber-400">{batteryPct.toFixed(1)}%</span>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden border border-slate-700">
            <div
              className="bg-gradient-to-r from-amber-500 via-teal-400 to-sky-400 h-full transition-all duration-300"
              style={{ width: `${batteryPct}%` }}
            />
          </div>
          <span className="text-[10px] text-slate-400 flex justify-between font-medium">
            <span>USED</span>
            <span>{energyConsumed.toFixed(1)} / {config.energy_budget_wh} Wh</span>
          </span>
        </div>

        {/* Distance Progress Gauge */}
        <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 flex flex-col space-y-1.5 shadow-inner">
          <div className="flex justify-between items-center text-xs text-slate-400 font-tech font-bold tracking-wider">
            <span className="flex items-center space-x-1.5">
              <Compass className="w-3.5 h-3.5 text-sky-400" />
              <span>DISTANCE</span>
            </span>
          </div>
          <span className="text-3xl font-black text-sky-400">{distTraveled.toFixed(0)}m</span>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden border border-slate-700">
            <div
              className="bg-sky-400 h-full transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <span className="text-[10px] text-slate-400 flex justify-between font-medium">
            <span>TOTAL</span>
            <span>{missionPlan.metrics.distance_m.toFixed(0)}m</span>
          </span>
        </div>
      </div>

      {/* SUNLIGHT & SHADOW SIMULATION TELEMETRY READOUT */}
      <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-950/40 border border-amber-800/60 text-xs font-mono shadow-sm">
        <div className="flex items-center space-x-2">
          <Sun className="w-4 h-4 text-amber-400 animate-spin" />
          <div>
            <span className="font-tech font-bold text-amber-300 tracking-wider block text-[11px]">LUNAR SUNLIGHT & SHADOW</span>
            <span className="text-[9px] text-slate-400 font-sans">{sunStatusLabel}</span>
          </div>
        </div>
        <div className="text-right">
          <span className="font-black text-amber-400 text-xs block">{sunPct}% ILLUM</span>
          <span className="text-[9px] text-slate-400 font-sans">SITE: {siteIllumination}%</span>
        </div>
      </div>

      {/* Secondary Telemetry Grid */}
      <div className="grid grid-cols-3 gap-2 text-xs font-mono bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
        <div className="text-center">
          <span className="text-[10px] text-slate-400 block font-tech font-bold">MAX SLOPE</span>
          <p className="text-sky-400 font-black text-sm">{missionPlan.metrics.max_slope_deg.toFixed(1)}°</p>
        </div>
        <div className="text-center border-x border-slate-800">
          <span className="text-[10px] text-slate-400 block font-tech font-bold">AVG HAZARD</span>
          <p className="text-rose-400 font-black text-sm">{missionPlan.metrics.average_hazard.toFixed(2)}</p>
        </div>
        <div className="text-center">
          <span className="text-[10px] text-slate-400 block font-tech font-bold">WAYPOINTS</span>
          <p className="text-emerald-400 font-black text-sm">{missionPlan.metrics.nodes_explored}</p>
        </div>
      </div>

      {/* Rationale Box */}
      <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
        <div className="flex items-center justify-between text-sky-400 font-tech font-bold text-xs tracking-wider">
          <span className="flex items-center space-x-1.5 text-xs text-slate-200">
            <ShieldAlert className="w-3.5 h-3.5 text-sky-400" />
            <span>WHY THIS ROUTE?</span>
          </span>
          <span className="text-[9px] px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-700/60 font-mono font-extrabold">
            {(missionPlan?.metrics?.feasibility || 'unknown').toUpperCase()}
          </span>
        </div>
        <p className="text-slate-300 text-[11px] leading-relaxed font-sans font-medium">
          {missionPlan.explanation.reason}
        </p>
      </div>

      {/* Timeline Scrubber Bar */}
      <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1 font-mono">
        <div className="flex justify-between items-center text-[10px] font-tech font-bold text-slate-300">
          <span>TIMELINE SCRUBBER</span>
          <span className="text-sky-400">WAYPOINT {roverNodeIndex + 1} / {totalNodes}</span>
        </div>
        <input
          type="range"
          min={0}
          max={totalNodes - 1}
          value={roverNodeIndex}
          onChange={(e) => {
            setIsPlaying(false);
            useMissionStore.getState().setRoverNodeIndex(parseInt(e.target.value, 10));
          }}
          className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-sky-400"
        />
      </div>

      {/* Playback Controls & Replay Mission Button */}
      <div className="flex items-center justify-between pt-1.5 border-t border-slate-800 font-mono">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              if (!isPlaying && missionPlan && roverNodeIndex >= missionPlan.path.length - 1) {
                resetSimulation();
              }
              setIsPlaying(!isPlaying);
            }}
            className="p-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold shadow-[0_0_12px_rgba(56,189,248,0.4)] transition-all"
            title={isPlaying ? 'Pause Traversal' : 'Play Traversal'}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
          </button>
          <button
            onClick={resetSimulation}
            className="p-2 rounded-xl bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800 transition-all"
            title="Reset Simulation"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={replayMission}
            className="px-3 py-1.5 rounded-xl bg-purple-950/80 hover:bg-purple-900 border border-purple-700/80 text-purple-300 font-tech font-bold text-xs flex items-center space-x-1 shadow-sm transition-all"
            title="Replay Full Mission Traversal"
          >
            <RotateCcw className="w-3.5 h-3.5 text-purple-400" />
            <span>REPLAY</span>
          </button>
        </div>

        {/* Speed Controls */}
        <div className="flex items-center space-x-1">
          <FastForward className="w-3.5 h-3.5 text-slate-500 mr-1" />
          {[1, 2, 5].map((spd) => (
            <button
              key={spd}
              onClick={() => setAnimSpeed(spd)}
              className={`px-2 py-0.5 rounded text-xs font-bold transition-all ${
                animSpeed === spd
                  ? 'bg-sky-500 text-slate-950 font-extrabold shadow-sm'
                  : 'text-slate-400 hover:text-white bg-slate-950 border border-slate-800'
              }`}
            >
              {spd}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
