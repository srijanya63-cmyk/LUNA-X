import React from 'react';
import { X, MapPin, Mountain, Zap, Shield, Sun, Eye } from 'lucide-react';
import { useUIStore } from '../../stores/useUIStore';

export const TerrainAnalysisHUD: React.FC = () => {
  const { clickedTerrainPoint, setClickedTerrainPoint } = useUIStore();

  if (!clickedTerrainPoint) return null;

  return (
    <div className="absolute top-24 left-6 z-20 w-80 bg-slate-900/85 backdrop-blur-xl border border-slate-800 rounded-2xl p-4 text-slate-100 shadow-2xl space-y-3 font-sans animate-in fade-in duration-200">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center space-x-2 text-sky-400 font-display font-bold text-xs tracking-wider">
          <MapPin className="w-4 h-4 text-sky-400 animate-bounce" />
          <span>TERRAIN POINT ANALYSIS</span>
        </div>
        <button
          onClick={() => setClickedTerrainPoint(null)}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex justify-between items-center text-xs font-mono bg-sky-950/60 px-3 py-1.5 rounded-lg border border-sky-800/60 text-sky-300 font-bold">
        <span>GRID POS: [{clickedTerrainPoint.grid_x}, {clickedTerrainPoint.grid_y}]</span>
        <span className="text-[9px] bg-sky-900 text-sky-200 px-1.5 py-0.5 rounded font-tech font-extrabold">
          SIMULATION ESTIMATE
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
        <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
          <span className="text-[9px] text-slate-400 font-tech font-bold block flex items-center space-x-1">
            <Mountain className="w-3 h-3 text-slate-400" />
            <span>ELEVATION</span>
          </span>
          <span className="text-sm font-black text-slate-100">{clickedTerrainPoint.elevation_m}m</span>
        </div>

        <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
          <span className="text-[9px] text-slate-400 font-tech font-bold block flex items-center space-x-1">
            <Zap className="w-3 h-3 text-amber-400" />
            <span>SLOPE</span>
          </span>
          <span className="text-sm font-black text-amber-400">{clickedTerrainPoint.slope_deg}°</span>
        </div>

        <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
          <span className="text-[9px] text-slate-400 font-tech font-bold block flex items-center space-x-1">
            <Eye className="w-3 h-3 text-sky-400" />
            <span>ICE LIKELIHOOD</span>
          </span>
          <span className="text-sm font-black text-sky-400">{clickedTerrainPoint.ice_likelihood_pct}%</span>
        </div>

        <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
          <span className="text-[9px] text-slate-400 font-tech font-bold block flex items-center space-x-1">
            <Sun className="w-3 h-3 text-amber-400" />
            <span>ILLUMINATION</span>
          </span>
          <span className="text-sm font-black text-amber-400">{clickedTerrainPoint.illumination_pct}%</span>
        </div>
      </div>

      <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 space-y-1 font-mono text-xs">
        <div className="flex justify-between font-bold">
          <span className="text-slate-400">HAZARD LEVEL:</span>
          <span className={clickedTerrainPoint.hazard_level === 'HIGH' ? 'text-rose-400' : 'text-emerald-400'}>
            {clickedTerrainPoint.hazard_level}
          </span>
        </div>
        <div className="flex justify-between font-bold">
          <span className="text-slate-400">ACCESSIBILITY SCORE:</span>
          <span className="text-teal-400">{clickedTerrainPoint.accessibility_score}/100</span>
        </div>
      </div>
    </div>
  );
};
