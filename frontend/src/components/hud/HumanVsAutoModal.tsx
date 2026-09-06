import React from 'react';
import { X, UserCheck, Bot, Plus, Trash2 } from 'lucide-react';
import { useUIStore } from '../../stores/useUIStore';
import { useMissionStore } from '../../stores/useMissionStore';

export const HumanVsAutoModal: React.FC = () => {
  const { isHumanVsAutoOpen, toggleHumanVsAuto } = useUIStore();
  const {
    missionPlan,
    humanRoute,
    isDrawingHumanRoute,
    setDrawingHumanRoute,
    clearHumanRoute,
  } = useMissionStore();

  if (!isHumanVsAutoOpen) return null;

  const autoDist = missionPlan?.metrics?.distance_m || 0;
  const autoEnergy = missionPlan?.metrics?.estimated_energy_wh || 0;
  const autoHazard = missionPlan?.metrics?.average_hazard || 0.15;

  const humanDist = humanRoute?.distance_m || 0;
  const humanEnergy = humanRoute?.estimated_energy_wh || 0;
  const humanHazard = humanRoute?.avg_hazard || 0.22;

  const distDelta = humanDist - autoDist;
  const energyDelta = humanEnergy - autoEnergy;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xl p-4 font-sans">
      <div className="w-full max-w-3xl bg-slate-900/95 border border-slate-800 rounded-2xl p-6 text-slate-100 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-3 text-sky-400 font-display font-black text-lg tracking-wider">
            <UserCheck className="w-6 h-6 text-sky-400" />
            <span>HUMAN PLANNER VS LUNA-X AI OPTIMIZER</span>
          </div>
          <button
            onClick={toggleHumanVsAuto}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed font-medium">
          Draw your own manual route by clicking waypoints directly on the 3D lunar terrain, then compare your plan against LUNA-X's A* optimal route.
        </p>

        <div className="flex items-center justify-between bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 font-mono text-xs">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setDrawingHumanRoute(!isDrawingHumanRoute)}
              className={`px-4 py-2 rounded-xl font-tech font-bold text-xs flex items-center space-x-2 shadow-sm transition-all ${
                isDrawingHumanRoute
                  ? 'bg-amber-500 text-slate-950 animate-pulse font-black'
                  : 'bg-sky-500 hover:bg-sky-400 text-slate-950 font-black'
              }`}
            >
              <Plus className="w-4 h-4 text-slate-950" />
              <span>{isDrawingHumanRoute ? 'CLICK TERRAIN TO ADD WAYPOINTS...' : 'DRAW MANUAL ROUTE'}</span>
            </button>
            <button
              onClick={clearHumanRoute}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
              title="Clear Manual Waypoints"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          <span className="font-bold text-slate-300">
            WAYPOINTS: {humanRoute?.points?.length || 0} PLACED
          </span>
        </div>

        {/* Comparison Table */}
        <div className="grid grid-cols-2 gap-4 font-mono text-xs">
          {/* Human Manual Plan */}
          <div className="bg-amber-950/40 p-4 rounded-xl border border-amber-800/60 space-y-3">
            <span className="font-tech font-black text-amber-400 text-sm tracking-wider block flex items-center space-x-2">
              <UserCheck className="w-4 h-4 text-amber-400" />
              <span>HUMAN MANUAL ROUTE</span>
            </span>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between border-b border-amber-900/60 pb-1">
                <span className="text-slate-400">Total Distance:</span>
                <span className="font-black text-amber-300">{humanDist.toFixed(0)}m</span>
              </div>
              <div className="flex justify-between border-b border-amber-900/60 pb-1">
                <span className="text-slate-400">Energy Consumption:</span>
                <span className="font-black text-amber-300">{humanEnergy.toFixed(1)} Wh</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Average Hazard:</span>
                <span className="font-black text-amber-300">{humanHazard.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* LUNA-X AI Plan */}
          <div className="bg-sky-950/40 p-4 rounded-xl border border-sky-800/60 space-y-3">
            <span className="font-tech font-black text-sky-400 text-sm tracking-wider block flex items-center space-x-2">
              <Bot className="w-4 h-4 text-sky-400" />
              <span>LUNA-X OPTIMAL A* ROUTE</span>
            </span>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between border-b border-sky-900/60 pb-1">
                <span className="text-slate-400">Total Distance:</span>
                <span className="font-black text-sky-300">{autoDist.toFixed(0)}m</span>
              </div>
              <div className="flex justify-between border-b border-sky-900/60 pb-1">
                <span className="text-slate-400">Energy Consumption:</span>
                <span className="font-black text-sky-300">{autoEnergy.toFixed(1)} Wh</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Average Hazard:</span>
                <span className="font-black text-sky-300">{autoHazard.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Delta Verdict Banner */}
        {humanRoute && (
          <div className="p-4 bg-teal-950/60 border border-teal-800/60 rounded-xl space-y-1 text-xs font-mono">
            <span className="font-tech font-extrabold text-teal-300 block text-sm">
              OPTIMIZATION DELTA VERDICT:
            </span>
            <p className="text-teal-200 font-sans">
              LUNA-X AI route is <strong className="font-extrabold text-teal-400">{Math.abs(distDelta).toFixed(0)}m</strong> {distDelta > 0 ? 'shorter' : 'longer'} and saves <strong className="font-extrabold text-teal-400">{Math.abs(energyDelta).toFixed(1)} Wh</strong> of battery energy compared to the manual human path.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
