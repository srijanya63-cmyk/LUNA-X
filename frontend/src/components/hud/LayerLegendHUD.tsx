import React from 'react';
import { Layers, Droplets, ShieldAlert, Activity, Eye } from 'lucide-react';
import { useUIStore, OverlayLayer } from '../../stores/useUIStore';

export const LayerLegendHUD: React.FC = () => {
  const { activeLayer, setActiveLayer, viewMode } = useUIStore();

  if (viewMode === 'global_moon') return null;

  const layers: { id: OverlayLayer; label: string; description: string; icon: React.ReactNode; gradient: string; val: string }[] = [
    {
      id: 'ice_likelihood',
      label: 'ICE LIKELIHOOD ANALYSIS',
      description: 'Multi-spectral PSR/CPR/Albedo overlay',
      icon: <Droplets className="w-4 h-4 text-sky-400" />,
      gradient: 'from-slate-800 via-sky-500 to-cyan-400',
      val: '0.88 Max',
    },
    {
      id: 'confidence',
      label: 'CONFIDENCE LEVEL',
      description: 'LOLA & Diviner sensor quality index',
      icon: <Eye className="w-4 h-4 text-amber-400" />,
      gradient: 'from-slate-800 via-amber-500 to-amber-400',
      val: '0.84 Mean',
    },
    {
      id: 'hazard',
      label: 'TERRAIN HAZARD INDEX',
      description: 'Slope + Roughness traversability risk',
      icon: <ShieldAlert className="w-4 h-4 text-rose-400" />,
      gradient: 'from-emerald-500 via-amber-500 to-rose-500',
      val: '0.12 Safe',
    },
    {
      id: 'slope',
      label: 'SLOPE INCLINE PROFILE',
      description: 'Topographic steepness gradient',
      icon: <Activity className="w-4 h-4 text-teal-400" />,
      gradient: 'from-emerald-500 via-amber-500 to-rose-500',
      val: '2.1° Plain',
    },
  ];

  const currentLayerObj = layers.find((l) => l.id === activeLayer);

  return (
    <div className="absolute top-20 left-6 z-20 flex flex-col space-y-3.5 bg-slate-900/85 backdrop-blur-xl border border-slate-800 p-5 rounded-2xl text-slate-100 text-xs w-80 shadow-2xl transition-all duration-300">
      {/* Panel Header */}
      <div className="flex items-center space-x-2 text-sky-400 font-display font-black border-b border-slate-800 pb-3 tracking-wider text-base">
        <Layers className="w-5 h-5 text-sky-400" />
        <span>SCIENTIFIC INTELLIGENCE</span>
      </div>

      {/* Intelligence Layer Cards */}
      <div className="flex flex-col space-y-2">
        {layers.map((layer) => {
          const isActive = activeLayer === layer.id;
          return (
            <button
              key={layer.id}
              onClick={() => setActiveLayer(layer.id)}
              className={`flex items-center justify-between p-2.5 rounded-xl border transition-all duration-200 text-left ${
                isActive
                  ? 'bg-sky-950/60 border-sky-400/80 shadow-[0_0_12px_rgba(56,189,248,0.25)] text-white'
                  : 'bg-slate-950/40 border-slate-800 hover:bg-slate-800/60 hover:border-slate-700 text-slate-300'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <div className={`p-1.5 rounded-lg ${isActive ? 'bg-sky-900/80 text-sky-300' : 'bg-slate-900 text-slate-400'}`}>
                  {layer.icon}
                </div>
                <div>
                  <span className={`block font-tech font-bold text-xs tracking-wider ${isActive ? 'text-sky-300' : 'text-slate-200'}`}>
                    {layer.label}
                  </span>
                  <span className="text-[10px] text-slate-400 block font-sans font-medium mt-0.5">
                    {layer.description}
                  </span>
                </div>
              </div>
              <span className={`font-mono text-[10px] font-extrabold px-2 py-0.5 rounded ${isActive ? 'bg-sky-950 text-sky-300 border border-sky-600' : 'bg-slate-900 text-slate-400 border border-slate-800'}`}>
                {layer.val}
              </span>
            </button>
          );
        })}
      </div>

      {/* Visual Color Scale Gradient Legend */}
      {currentLayerObj && (
        <div className="pt-2.5 border-t border-slate-800 flex flex-col space-y-1.5">
          <div className="flex justify-between text-[10px] font-mono font-bold text-slate-400">
            <span>MIN (0.0)</span>
            <span className="text-sky-400 font-extrabold">{currentLayerObj.label}</span>
            <span>MAX (1.0)</span>
          </div>
          <div className={`h-2.5 rounded-full bg-gradient-to-r ${currentLayerObj.gradient} shadow-inner border border-slate-700`} />
        </div>
      )}
    </div>
  );
};
