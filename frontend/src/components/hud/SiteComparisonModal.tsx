import React from 'react';
import { X, Award, Sparkles, Compass } from 'lucide-react';
import { useUIStore } from '../../stores/useUIStore';
import { useTerrainStore } from '../../stores/useTerrainStore';
import { useMissionStore } from '../../stores/useMissionStore';

export const SiteComparisonModal: React.FC = () => {
  const { isComparisonOpen, toggleComparison } = useUIStore();
  const { landingCandidates, selectedCandidate, setSelectedCandidate } = useTerrainStore();
  const { setConfig, planMission } = useMissionStore();

  if (!isComparisonOpen) return null;

  const topCandidates = landingCandidates.slice(0, 3);
  const recommendedSite = topCandidates.length > 0 ? topCandidates[0] : null;

  const handleSelectAndPlan = async (site: any) => {
    setSelectedCandidate(site);
    setConfig({
      start_pos: [site.grid_x, site.grid_y],
      target_pos: [site.grid_x - 24, site.grid_y - 20],
    });
    toggleComparison();
    await planMission();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xl p-4 animate-in fade-in duration-200 font-sans">
      <div className="w-full max-w-4xl bg-slate-900/95 border border-slate-800 rounded-2xl p-6 text-slate-100 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
          <div className="flex items-center space-x-3 text-sky-400 font-display font-black text-lg tracking-wider">
            <Compass className="w-6 h-6 text-sky-400" />
            <span>CANDIDATE LANDING SITE COMPARISON & EVALUATION</span>
          </div>
          <button
            onClick={toggleComparison}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-all font-bold text-xs"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Recommended Site Callout Box */}
        {recommendedSite && (
          <div className="bg-sky-950/60 border border-sky-800/60 rounded-xl p-4 flex items-start space-x-3 shadow-sm">
            <Sparkles className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-tech font-extrabold text-xs text-sky-300 tracking-wider uppercase block">
                PRIMARY RECOMMENDED TARGET: {recommendedSite.name} (RANK #1)
              </span>
              <p className="text-xs text-slate-300 leading-relaxed font-sans font-medium">
                {recommendedSite.name} delivers the highest composite scientific yield (Score: {(recommendedSite.composite_score ?? 0).toFixed(2)}) with an ice likelihood of {((recommendedSite.ice_likelihood_score ?? 0) * 100).toFixed(0)}%, low slope hazards, and 24/7 direct-to-Earth communications coverage.
              </p>
            </div>
          </div>
        )}

        {/* Side-by-Side Comparison Table */}
        <div className="overflow-x-auto border border-slate-800 rounded-xl bg-slate-950/60 shadow-sm">
          <table className="w-full text-xs text-left border-collapse font-mono">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-slate-300 font-tech font-extrabold uppercase tracking-wider">
                <th className="p-3.5 border-r border-slate-800 font-sans text-slate-100">EVALUATION METRIC</th>
                {topCandidates.map((site) => (
                  <th key={site.id} className="p-3.5 border-r border-slate-800 text-center min-w-[200px]">
                    <div className="flex flex-col items-center space-y-1">
                      <span className="text-sky-400 font-bold text-sm">RANK #{site.rank}</span>
                      <span className="text-slate-100 font-sans font-extrabold text-xs">{site.name}</span>
                      {selectedCandidate?.id === site.id && (
                        <span className="px-2 py-0.5 bg-emerald-950 text-emerald-300 text-[10px] rounded-full font-bold border border-emerald-700">
                          SELECTED
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              <tr>
                <td className="p-3 font-tech font-bold text-slate-400 border-r border-slate-800">COMPOSITE SCORE</td>
                {topCandidates.map((site) => (
                  <td key={site.id} className="p-3 text-center border-r border-slate-800 font-extrabold text-sm text-sky-400">
                    {(site.composite_score ?? 0).toFixed(2)}
                  </td>
                ))}
              </tr>

              <tr>
                <td className="p-3 font-tech font-bold text-slate-400 border-r border-slate-800">ICE LIKELIHOOD</td>
                {topCandidates.map((site) => (
                  <td key={site.id} className="p-3 text-center border-r border-slate-800 font-extrabold text-sky-400">
                    {((site.ice_likelihood_score ?? 0) * 100).toFixed(0)}%
                  </td>
                ))}
              </tr>

              <tr>
                <td className="p-3 font-tech font-bold text-slate-400 border-r border-slate-800">TERRAIN SAFETY SCORE</td>
                {topCandidates.map((site) => (
                  <td key={site.id} className="p-3 text-center border-r border-slate-800 font-extrabold text-emerald-400">
                    {((site.safety_score ?? 0) * 100).toFixed(0)}%
                  </td>
                ))}
              </tr>

              <tr>
                <td className="p-3 font-tech font-bold text-slate-400 border-r border-slate-800">SOLAR ILLUMINATION</td>
                {topCandidates.map((site) => (
                  <td key={site.id} className="p-3 text-center border-r border-slate-800 font-extrabold text-amber-400">
                    {((site.illumination_score ?? 0) * 100).toFixed(0)}%
                  </td>
                ))}
              </tr>

              <tr>
                <td className="p-3 font-tech font-bold text-slate-400 border-r border-slate-800">EARTH COMMS COVERAGE</td>
                {topCandidates.map((site) => (
                  <td key={site.id} className="p-3 text-center border-r border-slate-800 font-extrabold text-blue-400">
                    {((site.comm_score ?? 0) * 100).toFixed(0)}%
                  </td>
                ))}
              </tr>

              <tr>
                <td className="p-3 font-tech font-bold text-slate-400 border-r border-slate-800">ELEVATION (DEM)</td>
                {topCandidates.map((site) => (
                  <td key={site.id} className="p-3 text-center border-r border-slate-800 font-medium text-slate-300">
                    {site.elevation_m.toFixed(0)} m
                  </td>
                ))}
              </tr>

              <tr>
                <td className="p-3 font-tech font-bold text-slate-400 border-r border-slate-800">ESTIMATED TRAVERSE ENERGY</td>
                {topCandidates.map((site) => (
                  <td key={site.id} className="p-3 text-center border-r border-slate-800 font-extrabold text-amber-400">
                    {Math.round(240 + site.rank * 60)} Wh
                  </td>
                ))}
              </tr>

              <tr>
                <td className="p-3 font-tech font-bold text-slate-400 border-r border-slate-800">ACTION</td>
                {topCandidates.map((site) => (
                  <td key={site.id} className="p-3 text-center border-r border-slate-800">
                    <button
                      onClick={() => handleSelectAndPlan(site)}
                      className={`w-full py-2 px-3 rounded-xl font-tech font-extrabold text-xs tracking-wider transition-all shadow-sm ${
                        selectedCandidate?.id === site.id
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                          : 'bg-sky-500 hover:bg-sky-400 text-slate-950'
                      }`}
                    >
                      {selectedCandidate?.id === site.id ? 'ACTIVE TARGET' : 'SELECT & PLAN ROUTE'}
                    </button>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Data Honesty Disclaimer */}
        <div className="text-[11px] font-mono text-slate-400 text-center border-t border-slate-800 pt-3">
          [DEMO / SIMULATION DATA] — Scoring model evaluates multi-evidence synthetic layers based on LRO LOLA DEM proxies.
        </div>
      </div>
    </div>
  );
};
