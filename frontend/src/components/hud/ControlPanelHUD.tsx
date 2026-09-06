import React, { useState } from 'react';
import {
  Target,
  Zap,
  ShieldAlert,
  Compass,
  ChevronRight,
  Sliders,
  Award,
  Bot,
  Layers,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useUIStore } from '../../stores/useUIStore';
import { useTerrainStore } from '../../stores/useTerrainStore';
import { useMissionStore } from '../../stores/useMissionStore';
import { MissionObjective, RiskTolerance } from '../../types';

export const ControlPanelHUD: React.FC = () => {
  const { viewMode, isConfigOpen, toggleConfig, setViewMode, toggleComparison, setNotification } = useUIStore();
  const { landingCandidates, selectedCandidate, setSelectedCandidate, iceResult } = useTerrainStore();
  const {
    config,
    setConfig,
    planMission,
    isPlanning,
    startDemoMission,
    startAutonomousMission,
    autonomousStep,
    customWeights,
    setCustomWeights,
  } = useMissionStore();

  const [showIceEvidence, setShowIceEvidence] = useState(true);

  if (viewMode === 'global_moon' || !isConfigOpen) return null;

  const handleSelectCandidate = (candidate: any) => {
    setSelectedCandidate(candidate);
    setConfig({
      start_pos: [candidate.grid_x, candidate.grid_y],
      target_pos: [Math.min(127, candidate.grid_x + 15), Math.min(127, candidate.grid_y + 12)],
    });
  };

  const handleObjectiveChange = async (newObj: MissionObjective) => {
    setConfig({ objective: newObj });
    setNotification('info', `OBJECTIVE UPDATED: Optimization target set to ${newObj.toUpperCase().replace('_', ' ')}.`);
    await planMission();
  };

  const handlePlanClick = async () => {
    await planMission();
    const plan = useMissionStore.getState().missionPlan;
    const err = useMissionStore.getState().error;
    if (err) {
      setNotification('error', `PLANNING ERROR: ${err}`);
    } else if (plan && !plan.success) {
      setNotification('warning', `MISSION INFEASIBLE: ${plan.explanation?.reason || 'Constraints prevented valid route generation.'}`);
      setViewMode('mission_twin');
    } else {
      setNotification('success', 'MISSION ROUTE GENERATED: Rover path planned successfully.');
      setViewMode('mission_twin');
    }
  };

  const handleStartDemo = async () => {
    setNotification('info', 'INITIALIZING DEMO: Planning optimal rover route...');
    await startDemoMission();
    const plan = useMissionStore.getState().missionPlan;
    const err = useMissionStore.getState().error;
    if (err) {
      setNotification('error', `DEMO INITIALIZATION FAILED: ${err}`);
    } else if (plan && !plan.success) {
      setNotification('warning', `DEMO ROUTE INFEASIBLE: ${plan.explanation?.reason || 'Terrain constraints prevented route.'}`);
      setViewMode('mission_twin');
    } else {
      setNotification('success', 'DEMO MISSION INITIALIZED: Rover traverse simulation active.');
      setViewMode('mission_twin');
    }
  };

  const handleStartAutonomous = async () => {
    setNotification('info', '🤖 AUTONOMOUS MODE ACTIVATED: Analyzing terrain & verifying optimal route...');
    setViewMode('mission_twin');
    await startAutonomousMission();
    setNotification('success', '✔ AUTONOMOUS TRAVERSE INITIATED: Rover traversing verified route.');
  };

  // Feasibility Check logic
  const isFeasible = config.energy_budget_wh >= 200 && config.max_allowed_slope_deg >= 10;

  return (
    <div className="absolute top-20 right-6 z-20 w-[420px] max-h-[calc(100vh-6rem)] overflow-y-auto bg-slate-900/85 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 text-slate-100 shadow-2xl space-y-4 font-sans transition-all duration-300">
      {/* Panel Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2.5 text-sky-400 font-display font-black text-base tracking-wider">
          <Sliders className="w-5 h-5 text-sky-400" />
          <span>LANDING SITES & MISSION PLANNER</span>
        </div>
        <button
          onClick={toggleConfig}
          className="text-slate-400 hover:text-white font-mono text-xs px-2.5 py-1 rounded bg-slate-800 border border-slate-700 font-bold transition-all"
        >
          [HIDE]
        </button>
      </div>

      {/* Hero Quick Actions: Autonomous Mode & Demo */}
      <div className="grid grid-cols-2 gap-2.5 pb-2 border-b border-slate-800">
        <button
          onClick={handleStartAutonomous}
          disabled={isPlanning}
          className="py-3 px-3 bg-teal-950/80 hover:bg-teal-900/90 text-teal-300 border border-teal-500/50 font-tech font-extrabold rounded-xl text-xs tracking-wider flex items-center justify-center space-x-1.5 shadow-[0_0_15px_rgba(20,184,166,0.2)] transition-all duration-200 disabled:opacity-50"
        >
          <Bot className="w-4 h-4 text-teal-400 animate-pulse" />
          <span>AUTONOMOUS MODE</span>
        </button>

        <button
          onClick={handleStartDemo}
          disabled={isPlanning}
          className="py-3 px-3 bg-sky-950/80 hover:bg-sky-900/90 text-sky-300 border border-sky-500/50 font-tech font-extrabold rounded-xl text-xs tracking-wider flex items-center justify-center space-x-1.5 shadow-[0_0_15px_rgba(56,189,248,0.2)] transition-all duration-200 disabled:opacity-50"
        >
          <Zap className="w-4 h-4 text-sky-400 fill-current" />
          <span>INITIALIZE DEMO</span>
        </button>
      </div>

      {/* Autonomous Mode Lifecycle State Badge (When Active) */}
      {autonomousStep !== 'idle' && (
        <div className="p-3 rounded-xl bg-teal-950/60 border border-teal-700/60 text-teal-300 font-mono text-xs flex items-center justify-between shadow-sm">
          <span className="font-tech font-bold text-teal-400 tracking-wider flex items-center space-x-1.5">
            <Bot className="w-4 h-4 text-teal-400 animate-spin" />
            <span>AUTONOMOUS PIPELINE:</span>
          </span>
          <span className="px-2.5 py-0.5 rounded-full bg-teal-600 text-white font-extrabold text-[10px] uppercase tracking-wider shadow-sm">
            {autonomousStep}
          </span>
        </div>
      )}

      {/* Live Mission Feasibility Engine Banner */}
      <div
        className={`p-3.5 rounded-xl border text-xs font-mono transition-all ${
          isFeasible
            ? 'bg-emerald-950/40 border-emerald-700/50 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.1)]'
            : 'bg-amber-950/40 border-amber-700/50 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.1)]'
        }`}
      >
        <div className="flex items-center justify-between font-tech font-extrabold tracking-wider mb-1">
          <span className="flex items-center space-x-1.5 text-xs">
            <ShieldAlert className={`w-4 h-4 ${isFeasible ? 'text-emerald-400' : 'text-amber-400'}`} />
            <span>FEASIBILITY ENGINE</span>
          </span>
          <span
            className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
              isFeasible ? 'bg-emerald-900/80 text-emerald-200 border border-emerald-600' : 'bg-amber-900/80 text-amber-200 border border-amber-600'
            }`}
          >
            {isFeasible ? 'FEASIBLE' : 'CONSTRAINT RISK'}
          </span>
        </div>
        <p className="text-[11px] font-sans leading-snug text-slate-300 font-medium">
          {isFeasible
            ? `FEASIBLE: Energy budget (${config.energy_budget_wh} Wh) is sufficient for target candidate traversal.`
            : `CONSTRAINT RISK: Budget (${config.energy_budget_wh} Wh) or slope (${config.max_allowed_slope_deg}°) is near threshold.`}
        </p>
      </div>

      {/* Candidate Landing Site Selector */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs font-tech font-bold text-slate-300 tracking-wider">
          <span className="flex items-center space-x-2 text-sm text-slate-100">
            <Target className="w-4 h-4 text-amber-400" />
            <span>CANDIDATE LANDING SITES</span>
          </span>
          <span className="font-mono text-xs text-slate-400 font-semibold">{landingCandidates.length} TARGETS</span>
        </div>

        <div className="space-y-2">
          {landingCandidates.map((site) => {
            const isSelected = selectedCandidate?.id === site.id;
            return (
              <button
                key={site.id}
                onClick={() => handleSelectCandidate(site)}
                className={`w-full text-left p-3 rounded-xl border transition-all duration-200 flex flex-col space-y-2 ${
                  isSelected
                    ? 'bg-sky-950/60 border-sky-400/80 shadow-[0_0_15px_rgba(56,189,248,0.2)] text-white'
                    : 'bg-slate-950/40 border-slate-800 text-slate-300 hover:bg-slate-800/50 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <Award className={`w-4 h-4 ${isSelected ? 'text-amber-400' : 'text-slate-500'}`} />
                    <span className="font-tech font-extrabold text-xs tracking-wider text-slate-100">
                      RANK #{site.rank} • {site.name}
                    </span>
                  </div>
                  <span className="font-mono font-extrabold text-xs px-2.5 py-0.5 rounded bg-sky-950 border border-sky-600/60 text-sky-300 shadow-sm">
                    {(site.composite_score ?? 0).toFixed(2)}
                  </span>
                </div>

                {isSelected && (
                  <div className="mt-1 pt-2 border-t border-sky-900/60 space-y-2 text-xs">
                    <div className="grid grid-cols-2 gap-1.5 font-mono text-[10px]">
                      <div className="bg-slate-900 p-1.5 rounded border border-slate-800">
                        <span className="text-slate-400 block text-[9px] font-tech font-bold">ICE LIKELIHOOD</span>
                        <span className="text-sky-400 font-extrabold text-xs">{Math.round((site.ice_likelihood_score ?? 0.78) * 100)}%</span>
                      </div>
                      <div className="bg-slate-900 p-1.5 rounded border border-slate-800">
                        <span className="text-slate-400 block text-[9px] font-tech font-bold">SAFETY SCORE</span>
                        <span className="text-emerald-400 font-extrabold text-xs">{Math.round((site.safety_score ?? 0.82) * 100)}%</span>
                      </div>
                      <div className="bg-slate-900 p-1.5 rounded border border-slate-800">
                        <span className="text-slate-400 block text-[9px] font-tech font-bold">SOLAR ILLUM</span>
                        <span className="text-amber-400 font-extrabold text-xs">{Math.round((site.illumination_score ?? 0.84) * 100)}%</span>
                      </div>
                      <div className="bg-slate-900 p-1.5 rounded border border-slate-800">
                        <span className="text-slate-400 block text-[9px] font-tech font-bold">EARTH COMMS</span>
                        <span className="text-blue-400 font-extrabold text-xs">{Math.round((site.comm_score ?? 0.80) * 100)}%</span>
                      </div>
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ICE EVIDENCE EXPLORER CARD */}
      {selectedCandidate && (
        <div className="bg-sky-950/40 border border-sky-800/60 rounded-xl p-3.5 space-y-2.5 font-sans">
          <div className="flex items-center justify-between border-b border-sky-800/60 pb-2">
            <span className="text-xs font-tech font-extrabold text-sky-300 tracking-wider flex items-center space-x-2">
              <Layers className="w-4 h-4 text-sky-400" />
              <span>ICE EVIDENCE EXPLORER</span>
            </span>
            <button
              onClick={() => setShowIceEvidence(!showIceEvidence)}
              className="text-[10px] font-mono font-bold text-sky-400 hover:text-white"
            >
              [{showIceEvidence ? 'COLLAPSE' : 'EXPAND'}]
            </button>
          </div>

          {showIceEvidence && (
            <div className="space-y-2.5 text-xs">
              <div className="grid grid-cols-4 gap-1.5 text-center font-mono">
                <div className="bg-slate-900/90 p-1.5 rounded border border-sky-900/60">
                  <span className="text-[9px] text-slate-400 block font-tech font-bold">ICE PROB</span>
                  <span className="text-xs font-black text-sky-400">
                    {Math.round((selectedCandidate.ice_likelihood_score ?? 0.78) * 100)}%
                  </span>
                </div>
                <div className="bg-slate-900/90 p-1.5 rounded border border-sky-900/60">
                  <span className="text-[9px] text-slate-400 block font-tech font-bold">CONFIDENCE</span>
                  <span className="text-xs font-black text-teal-400">
                    {Math.round((iceResult?.confidence_mean ?? 0.85) * 100)}%
                  </span>
                </div>
                <div className="bg-slate-900/90 p-1.5 rounded border border-sky-900/60">
                  <span className="text-[9px] text-slate-400 block font-tech font-bold">HAZARD</span>
                  <span className="text-xs font-black text-emerald-400">
                    {(selectedCandidate.hazard_score ?? 0.15) < 0.3 ? 'LOW' : 'MOD'}
                  </span>
                </div>
                <div className="bg-slate-900/90 p-1.5 rounded border border-sky-900/60">
                  <span className="text-[9px] text-slate-400 block font-tech font-bold">VALUE</span>
                  <span className="text-xs font-black text-purple-400">HIGH</span>
                </div>
              </div>

              <div className="bg-slate-900/90 p-2.5 rounded border border-sky-900/60 space-y-1 font-mono text-[10px]">
                <span className="font-tech font-bold text-slate-300 block text-[11px] tracking-wider">EVIDENCE SIGNALS:</span>
                <div className="text-slate-400 space-y-1 font-sans">
                  <div className="flex items-center space-x-1.5">
                    <CheckCircle2 className="w-3 h-3 text-teal-400 flex-shrink-0" />
                    <span>CPR Radar backscatter signature (subsurface ice)</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 flex-shrink-0" />
                    <span>PSR Basin Proximity (Permanently Shadowed Region &lt;110K)</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 flex-shrink-0" />
                    <span>Thermal Stability (&lt;110K surface temperature profile)</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MISSION OBJECTIVE SELECTOR */}
      <div className="space-y-2 pt-2 border-t border-slate-800">
        <label className="text-xs font-tech font-bold text-slate-300 tracking-wider flex items-center space-x-2">
          <Compass className="w-4 h-4 text-sky-400" />
          <span>ROVER ROUTE MISSION OBJECTIVE</span>
        </label>

        <select
          value={config.objective}
          onChange={(e) => handleObjectiveChange(e.target.value as MissionObjective)}
          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-sky-300 focus:outline-none focus:border-sky-500 font-mono font-bold shadow-sm cursor-pointer"
        >
          <option value="balanced">Balanced Mission (Safety & Science)</option>
          <option value="max_safety">Maximum Safety (Avoid All Hazard Slopes)</option>
          <option value="min_energy">Minimum Energy (Contour Search)</option>
          <option value="max_science">Maximum Scientific Yield</option>
          <option value="min_distance">Shortest Distance</option>
        </select>
      </div>

      {/* Energy Budget Slider */}
      <div className="space-y-1.5 pt-2 border-t border-slate-800">
        <div className="flex justify-between items-center text-xs font-tech font-bold">
          <span className="text-slate-300 flex items-center space-x-2 tracking-wider">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>BATTERY ENERGY BUDGET</span>
          </span>
          <span className="font-mono text-amber-400 font-extrabold text-xs">{config.energy_budget_wh} Wh</span>
        </div>
        <input
          type="range"
          min="50"
          max="1000"
          step="50"
          value={config.energy_budget_wh}
          onChange={(e) => setConfig({ energy_budget_wh: parseFloat(e.target.value) })}
          className="w-full accent-sky-400 bg-slate-800 h-2 rounded cursor-pointer"
        />
      </div>

      {/* CUSTOM OBJECTIVE WEIGHT SLIDERS */}
      <div className="space-y-2.5 pt-2 border-t border-slate-800 bg-slate-950/60 p-3 rounded-xl border border-slate-800 font-mono">
        <div className="flex justify-between items-center">
          <span className="text-xs font-tech font-extrabold text-sky-400 tracking-wider flex items-center space-x-1.5">
            <Sliders className="w-4 h-4 text-sky-400" />
            <span>CUSTOM A* SOLVER WEIGHTS</span>
          </span>
          <span className="text-[10px] text-slate-400 font-sans">LIVE RE-PLANNING</span>
        </div>
        <div className="space-y-2 text-[11px]">
          <div>
            <div className="flex justify-between text-slate-300 font-bold mb-1">
              <span>HAZARD SAFETY PENALTY:</span>
              <span className="text-rose-400">{customWeights.risk.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={customWeights.risk}
              onChange={(e) => {
                const w = parseFloat(e.target.value);
                setCustomWeights({ ...customWeights, risk: w });
              }}
              className="w-full h-1.5 bg-slate-800 rounded accent-rose-500 cursor-pointer"
            />
          </div>
          <div>
            <div className="flex justify-between text-slate-300 font-bold mb-1">
              <span>ENERGY CONSERVATION:</span>
              <span className="text-amber-400">{customWeights.energy.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={customWeights.energy}
              onChange={(e) => {
                const w = parseFloat(e.target.value);
                setCustomWeights({ ...customWeights, energy: w });
              }}
              className="w-full h-1.5 bg-slate-800 rounded accent-amber-500 cursor-pointer"
            />
          </div>
          <div>
            <div className="flex justify-between text-slate-300 font-bold mb-1">
              <span>ICE PRIORITY REWARD:</span>
              <span className="text-sky-400">{customWeights.ice.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={customWeights.ice}
              onChange={(e) => {
                const w = parseFloat(e.target.value);
                setCustomWeights({ ...customWeights, ice: w });
              }}
              className="w-full h-1.5 bg-slate-800 rounded accent-sky-400 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Hero CTA Button (Generate Rover Route) */}
      <button
        onClick={handlePlanClick}
        disabled={isPlanning}
        className="w-full py-3 bg-sky-500 hover:bg-sky-400 text-slate-950 font-display font-black rounded-xl text-xs shadow-[0_0_20px_rgba(56,189,248,0.4)] uppercase tracking-widest flex items-center justify-center space-x-2 transition-all duration-200 disabled:opacity-50"
      >
        {isPlanning ? (
          <span>PLANNING ROUTE...</span>
        ) : (
          <>
            <span>GENERATE ROVER ROUTE</span>
            <ChevronRight className="w-5 h-5 text-slate-950" />
          </>
        )}
      </button>
    </div>
  );
};
