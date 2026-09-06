import React from 'react';
import { X, Info, Database, Cpu, AlertCircle } from 'lucide-react';
import { useUIStore } from '../../stores/useUIStore';

export const TransparencyModal: React.FC = () => {
  const { isTransparencyOpen, toggleTransparency } = useUIStore();

  if (!isTransparencyOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xl p-4 font-sans">
      <div className="w-full max-w-3xl bg-slate-900/95 border border-slate-800 rounded-2xl p-6 text-slate-100 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-3 text-sky-400 font-display font-black text-lg tracking-wider">
            <Info className="w-6 h-6 text-sky-400" />
            <span>HOW LUNA-X WORKS — SYSTEM TRANSPARENCY</span>
          </div>
          <button
            onClick={toggleTransparency}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section 1: Data Sources */}
        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
          <span className="font-tech font-extrabold text-slate-100 text-sm tracking-wider flex items-center space-x-2">
            <Database className="w-4 h-4 text-sky-400" />
            <span>1. SCIENTIFIC DATASETS & ORBITAL DEMS</span>
          </span>
          <p className="text-xs text-slate-300 leading-relaxed font-sans">
            LUNA-X uses high-resolution digital elevation models derived from NASA LRO (Lunar Reconnaissance Orbiter) LOLA altimetry and LROC Narrow Angle Camera images. Ice probability models incorporate Diviner surface temperature profiles (&lt;110K thermal traps) and Mini-RF CPR radar backscatter data.
          </p>
        </div>

        {/* Section 2: Pathfinding Mathematics */}
        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
          <span className="font-tech font-extrabold text-slate-100 text-sm tracking-wider flex items-center space-x-2">
            <Cpu className="w-4 h-4 text-amber-400" />
            <span>2. DETERMINISTIC WEIGHTED A* PATHFINDER</span>
          </span>
          <p className="text-xs text-slate-300 leading-relaxed font-sans">
            Rover routes are generated deterministically using a 3D surface cost function:
          </p>
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-[11px] text-sky-300 font-bold">
            Cost(n, m) = Distance(n,m) + w_risk * Hazard(m) + w_energy * EnergyCost(n,m) - w_ice * IceYield(m)
          </div>
        </div>

        {/* Section 3: Limitations & Disclaimer */}
        <div className="bg-amber-950/40 border border-amber-800/60 p-4 rounded-xl space-y-2">
          <span className="font-tech font-extrabold text-amber-300 text-xs tracking-wider flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-amber-400" />
            <span>SIMULATION BOUNDARIES & DEMO DISCLAIMER</span>
          </span>
          <p className="text-xs text-amber-200 leading-relaxed font-sans font-medium">
            All telemetry metrics, battery calculations, and ice yield scores are deterministic simulation estimates created for educational and demonstration purposes. No real hardware commands are transmitted to active space assets.
          </p>
        </div>
      </div>
    </div>
  );
};
