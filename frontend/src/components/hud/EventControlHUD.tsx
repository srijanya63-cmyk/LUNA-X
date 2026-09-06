import React, { useState } from 'react';
import { AlertTriangle, ZapOff, RefreshCw, Flame, CheckCircle2 } from 'lucide-react';
import { useUIStore } from '../../stores/useUIStore';
import { useMissionStore } from '../../stores/useMissionStore';

export const EventControlHUD: React.FC = () => {
  const { viewMode } = useUIStore();
  const { missionPlan, triggerEvent, roverNodeIndex } = useMissionStore();
  const setNotification = useUIStore((s) => s.setNotification);

  const [isSimulating, setIsSimulating] = useState(false);
  const [lastEventFlow, setLastEventFlow] = useState<string[] | null>(null);

  if (viewMode !== 'mission_twin' || !missionPlan) return null;

  const handleRouteBlockage = async () => {
    setIsSimulating(true);
    setLastEventFlow(['ROUTE BLOCKED', 'HAZARD DETECTED', 'REPLANNING...']);
    setNotification('warning', '⚠ ROUTE OBSTRUCTION DETECTED: Analyzing alternative path...');
    
    const path = missionPlan.path;
    const currPos = path[Math.min(roverNodeIndex, path.length - 1)];
    const blockPos = path[Math.min(roverNodeIndex + 3, path.length - 1)];

    const res = await triggerEvent('route_blockage', {
      current_position: currPos,
      blocked_nodes: [blockPos],
    });

    setIsSimulating(false);
    if (res?.replanned) {
      setLastEventFlow(['ROUTE BLOCKED', 'REPLANNING', 'NEW ROUTE FOUND', 'ROVER CONTINUING']);
      setNotification('success', `✔ NEW ROUTE GENERATED: Detour calculated around obstacle (+${res.additional_distance_m.toFixed(0)}m).`);
    } else if (res) {
      setLastEventFlow(['ROUTE BLOCKED', 'REPLANNING FAILED', 'INFEASIBLE ROUTE']);
      setNotification('error', `ROUTE BLOCKED: ${res.reason}`);
    }
  };

  const handleEnergyLoss = async () => {
    setIsSimulating(true);
    setLastEventFlow(['BATTERY DROP', 'RECALCULATING BUDGET', 'EVALUATING RANGE...']);
    setNotification('warning', '⚡ BATTERY DEGRADATION: Recalculating energy budget...');
    
    const currentBudget = useMissionStore.getState().config.energy_budget_wh;
    const newBudget = Math.max(40.0, Number((currentBudget * 0.5).toFixed(1)));

    const res = await triggerEvent('energy_reduction', {
      new_energy_budget_wh: newBudget,
    });

    setIsSimulating(false);
    if (res?.replanned) {
      setLastEventFlow(['BATTERY DROP (-50%)', 'REPLANNING', 'EFFICIENT ROUTE FOUND', 'ROVER CONTINUING']);
      setNotification(
        'warning',
        `⚡ BATTERY DROP (-50%): Energy budget reduced to ${newBudget.toFixed(1)} Wh. New route generated.`
      );
    } else if (res) {
      if (res.mission_feasible === false) {
        setLastEventFlow(['BATTERY DROP (-50%)', 'POWER CRITICAL', 'INFEASIBLE']);
        setNotification(
          'error',
          `⚡ CRITICAL POWER FAILURE: Energy budget reduced to ${newBudget.toFixed(1)} Wh. ${res.reason || 'Path energy exceeds available budget.'}`
        );
      } else {
        setLastEventFlow(['BATTERY DROP (-50%)', 'VERIFIED FEASIBLE', 'CONTINUING']);
        setNotification(
          'info',
          `⚡ BATTERY DROP (-50%): Energy budget reduced to ${newBudget.toFixed(1)} Wh. Current route remains feasible.`
        );
      }
    }
  };

  const handleHazardSpike = async () => {
    setIsSimulating(true);
    setLastEventFlow(['HAZARD SPIKE', 'SLOPE RISK DETECTED', 'REPLANNING...']);
    setNotification('info', '🔥 HAZARD SPIKE DETECTED: Evaluating terrain risk...');
    
    const path = missionPlan.path;
    const aheadPos = path[Math.min(roverNodeIndex + 2, path.length - 1)];

    const res = await triggerEvent('hazard_increase', {
      hazard_spike_region: [aheadPos],
      hazard_increase_amount: 0.4,
    });

    setIsSimulating(false);
    if (res?.replanned) {
      setLastEventFlow(['HAZARD SPIKE (+0.40)', 'HAZARD AVOIDED', 'DETOUR GENERATED', 'ROVER CONTINUING']);
      setNotification('info', `✔ HAZARD SPIKE DETECTED (+0.40): Route dynamically detoured around hazard zone.`);
    } else {
      setLastEventFlow(['HAZARD SPIKE', 'ANALYZED', 'CONTINUING']);
    }
  };

  return (
    <div className="absolute bottom-6 right-6 z-20 w-80 bg-slate-900/85 backdrop-blur-xl border border-slate-800 rounded-2xl p-4 text-slate-100 text-xs shadow-2xl space-y-3 font-sans transition-all duration-300">
      <div className="flex items-center space-x-2 text-amber-400 font-display font-bold text-xs tracking-wider border-b border-slate-800 pb-2">
        <AlertTriangle className="w-4 h-4 text-amber-400 animate-pulse" />
        <span>MISSION SCENARIO LAB</span>
      </div>

      <p className="text-[11px] text-slate-400 font-sans leading-relaxed font-medium">
        Inject dynamic lunar hazards to test backend autonomous replanning in real time.
      </p>

      {/* EVENT FLOW FEEDBACK BANNER */}
      {lastEventFlow && (
        <div className="p-2.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1 font-mono text-[10px]">
          <span className="font-tech font-bold text-slate-400 block text-[10px]">EVENT EXECUTION FLOW:</span>
          <div className="flex items-center space-x-1 overflow-x-auto text-slate-200 py-0.5 font-bold">
            {lastEventFlow.map((step, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <span className="text-slate-600 font-normal">↓</span>}
                <span
                  className={`px-1.5 py-0.5 rounded ${
                    idx === lastEventFlow.length - 1
                      ? 'bg-sky-950 text-sky-300 border border-sky-600'
                      : 'bg-slate-900 text-slate-400 border border-slate-800'
                  }`}
                >
                  {step}
                </span>
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col space-y-2 pt-1 font-tech">
        {/* Inject Rock Collapse */}
        <button
          onClick={handleRouteBlockage}
          disabled={isSimulating}
          className="w-full py-2 px-3 bg-rose-950/60 hover:bg-rose-900/80 border border-rose-700/60 text-rose-300 rounded-xl font-bold text-xs flex items-center justify-between shadow-sm transition-all duration-200 disabled:opacity-50"
        >
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span className="tracking-wider">INJECT ROCK COLLAPSE</span>
          </div>
          {isSimulating ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-rose-400" /> : <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-rose-900 text-rose-200 border border-rose-700 font-extrabold">BLOCK</span>}
        </button>

        {/* Battery Loss Event */}
        <button
          onClick={handleEnergyLoss}
          disabled={isSimulating}
          className="w-full py-2 px-3 bg-amber-950/60 hover:bg-amber-900/80 border border-amber-700/60 text-amber-300 rounded-xl font-bold text-xs flex items-center justify-between shadow-sm transition-all duration-200 disabled:opacity-50"
        >
          <div className="flex items-center space-x-2">
            <ZapOff className="w-3.5 h-3.5 text-amber-400" />
            <span className="tracking-wider">SIMULATE BATTERY DROP</span>
          </div>
          {isSimulating ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" /> : <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-amber-900 text-amber-200 border border-amber-700 font-extrabold">-50%</span>}
        </button>

        {/* Regional Hazard Spike */}
        <button
          onClick={handleHazardSpike}
          disabled={isSimulating}
          className="w-full py-2 px-3 bg-purple-950/60 hover:bg-purple-900/80 border border-purple-700/60 text-purple-300 rounded-xl font-bold text-xs flex items-center justify-between shadow-sm transition-all duration-200 disabled:opacity-50"
        >
          <div className="flex items-center space-x-2">
            <Flame className="w-3.5 h-3.5 text-purple-400" />
            <span className="tracking-wider">INJECT HAZARD SPIKE</span>
          </div>
          {isSimulating ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-400" /> : <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-purple-900 text-purple-200 border border-purple-700 font-extrabold">+0.40</span>}
        </button>
      </div>
    </div>
  );
};
