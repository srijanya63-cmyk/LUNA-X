import React from 'react';
import { X, FileText, Download, ShieldCheck, Zap, Compass, CheckCircle2, Award, Layers } from 'lucide-react';
import { useUIStore } from '../../stores/useUIStore';
import { useMissionStore } from '../../stores/useMissionStore';
import { useTerrainStore } from '../../stores/useTerrainStore';

export const MissionReportModal: React.FC = () => {
  const { isReportOpen, toggleReport } = useUIStore();
  const { missionPlan, config, roverNodeIndex, autonomousStep } = useMissionStore();
  const { selectedCandidate, iceResult } = useTerrainStore();

  if (!isReportOpen) return null;

  // Compute actual report metrics
  const totalNodes = missionPlan?.path?.length || 0;
  const totalDistanceM = missionPlan?.metrics?.distance_m || 0;
  const totalEnergyWh = missionPlan?.metrics?.estimated_energy_wh || 0;
  
  const currentWaypointIndex = Math.min(roverNodeIndex, Math.max(0, totalNodes - 1));
  const traversedFraction = totalNodes > 1 ? currentWaypointIndex / (totalNodes - 1) : (missionPlan ? 1 : 0);
  const energyConsumedWh = Number((traversedFraction * totalEnergyWh).toFixed(1));
  const remainingBatteryWh = Math.max(0, Number((config.energy_budget_wh - energyConsumedWh).toFixed(1)));

  const landingSiteName = selectedCandidate?.name || selectedCandidate?.id || 'Shackleton Rim Alpha';
  const iceProbPct = selectedCandidate ? Math.round((selectedCandidate.ice_likelihood_score ?? 0.78) * 100) : 78;
  const confidencePct = Math.round((iceResult?.confidence_mean ?? 0.85) * 100);
  const safetyScorePct = selectedCandidate ? Math.round((selectedCandidate.safety_score ?? 0.82) * 100) : 82;
  const illuminationPct = selectedCandidate ? Math.round((selectedCandidate.illumination_score ?? 0.84) * 100) : 84;
  const objectiveName = config.objective ? config.objective.toUpperCase().replace('_', ' ') : 'BALANCED';

  const reportData = {
    report_title: "LUNA-X SIMULATION REPORT",
    data_mode: "DEMO / SIMULATION DATA",
    timestamp: new Date().toISOString(),
    overview: {
      mission_name: "LUNA-X South Pole Traversal Simulation",
      landing_site: landingSiteName,
      objective: objectiveName,
      status: autonomousStep !== 'idle' ? `AUTONOMOUS MODE: ${autonomousStep.toUpperCase()}` : (missionPlan ? "SIMULATION COMPLETE" : "PRE-MISSION STANDBY"),
    },
    ice_intelligence: {
      ice_probability_pct: iceProbPct,
      model_confidence_pct: confidencePct,
      evidence_quality: "HIGH",
      key_indicators: [
        "CPR Radar backscatter signature",
        "PSR Basin thermal trap proximity (<110K)",
        "Ejecta regolith composition analysis",
      ],
    },
    landing_site_assessment: {
      site_name: landingSiteName,
      safety_score_pct: safetyScorePct,
      illumination_pct: illuminationPct,
      accessibility_score_pct: 88,
      scientific_value: "HIGH (PRIME TARGET)",
    },
    rover_route: {
      total_distance_m: totalDistanceM,
      waypoints_count: totalNodes,
      pathfinding_method: "Weighted 3D Surface Grid A*",
      feasibility: (missionPlan?.metrics?.feasibility || 'FEASIBLE').toUpperCase(),
    },
    energy_model: {
      initial_energy_budget_wh: config.energy_budget_wh,
      estimated_consumption_wh: totalEnergyWh,
      remaining_energy_wh: remainingBatteryWh,
      feasibility_status: totalEnergyWh <= config.energy_budget_wh ? "FEASIBLE" : "INSUFFICIENT_ENERGY",
    },
    mission_events: {
      dynamic_replanning_active: true,
      rock_collapse_blockage: "Supported via In-Flight Event Simulator",
      battery_drop_scenario: "Supported via In-Flight Event Simulator",
      final_route_status: "OPTIMAL DETOUR CONFIRMED",
    },
    summary: `Mission successfully simulated. The selected landing site (${landingSiteName}) was evaluated for ice likelihood (${iceProbPct}%), terrain safety (${safetyScorePct}%), solar illumination (${illuminationPct}%), and rover accessibility. The rover completed the planned Weighted A* traverse within the simulated energy budget.`
  };

  const handleDownloadJSON = () => {
    const jsonStr = JSON.stringify(reportData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `luna_x_mission_report_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xl p-4 font-sans">
      <div className="w-full max-w-3xl bg-slate-900/95 border border-slate-800 rounded-2xl p-6 text-slate-100 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3 text-sky-400 font-display font-black text-lg tracking-wider">
            <FileText className="w-6 h-6 text-sky-400" />
            <span>LUNA-X SIMULATION REPORT</span>
          </div>
          <div className="flex items-center space-x-3">
            <span className="px-2.5 py-1 rounded-md bg-amber-950/80 border border-amber-700 text-amber-300 font-mono font-bold text-[10px] uppercase tracking-wider">
              DEMO / SIMULATION DATA
            </span>
            <button
              onClick={toggleReport}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Section 1: Mission Overview */}
        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2 font-mono text-xs shadow-sm">
          <span className="font-tech font-extrabold text-slate-300 text-xs tracking-wider block">
            1. MISSION OVERVIEW
          </span>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-slate-400 text-[10px] block font-tech">LANDING SITE:</span>
              <span className="font-bold text-slate-100">{reportData.overview.landing_site}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block font-tech">MISSION OBJECTIVE:</span>
              <span className="font-bold text-sky-400">{reportData.overview.objective}</span>
            </div>
          </div>
        </div>

        {/* Section 2: Ice Intelligence */}
        <div className="bg-sky-950/40 p-4 rounded-xl border border-sky-800/60 space-y-2 font-mono text-xs shadow-sm">
          <span className="font-tech font-extrabold text-sky-300 text-xs tracking-wider flex items-center space-x-1.5">
            <Layers className="w-4 h-4 text-sky-400" />
            <span>2. ICE INTELLIGENCE EVALUATION</span>
          </span>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-slate-900 p-2 rounded-lg border border-sky-900/60">
              <span className="text-[10px] text-slate-400 block">ICE PROBABILITY</span>
              <span className="text-lg font-black text-sky-400">{reportData.ice_intelligence.ice_probability_pct}%</span>
            </div>
            <div className="bg-slate-900 p-2 rounded-lg border border-sky-900/60">
              <span className="text-[10px] text-slate-400 block">MODEL CONFIDENCE</span>
              <span className="text-lg font-black text-teal-400">{reportData.ice_intelligence.model_confidence_pct}%</span>
            </div>
            <div className="bg-slate-900 p-2 rounded-lg border border-sky-900/60">
              <span className="text-[10px] text-slate-400 block">EVIDENCE QUALITY</span>
              <span className="text-lg font-black text-purple-400">{reportData.ice_intelligence.evidence_quality}</span>
            </div>
          </div>
        </div>

        {/* Section 3 & 4: Landing Site & Route Assessment */}
        <div className="grid grid-cols-2 gap-3 font-mono text-xs">
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2 shadow-sm">
            <span className="font-tech font-extrabold text-slate-300 text-xs tracking-wider block">
              3. LANDING SITE ASSESSMENT
            </span>
            <div className="space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-400">Safety Score:</span>
                <span className="font-bold text-emerald-400">{reportData.landing_site_assessment.safety_score_pct}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Solar Illumination:</span>
                <span className="font-bold text-amber-400">{reportData.landing_site_assessment.illumination_pct}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Scientific Value:</span>
                <span className="font-bold text-purple-400">{reportData.landing_site_assessment.scientific_value}</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2 shadow-sm">
            <span className="font-tech font-extrabold text-slate-300 text-xs tracking-wider block">
              4. ROVER ROUTE
            </span>
            <div className="space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-400">Total Distance:</span>
                <span className="font-bold text-sky-400">{reportData.rover_route.total_distance_m.toFixed(1)} m</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Waypoints:</span>
                <span className="font-bold text-purple-400">{reportData.rover_route.waypoints_count} nodes</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Pathfinder:</span>
                <span className="font-bold text-slate-100">Weighted A*</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 5 & 6: Energy & Events */}
        <div className="grid grid-cols-2 gap-3 font-mono text-xs">
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2 shadow-sm">
            <span className="font-tech font-extrabold text-slate-300 text-xs tracking-wider block">
              5. ENERGY & BATTERY
            </span>
            <div className="space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-400">Initial Budget:</span>
                <span className="font-bold text-amber-400">{reportData.energy_model.initial_energy_budget_wh} Wh</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Est. Consumption:</span>
                <span className="font-bold text-amber-500">{reportData.energy_model.estimated_consumption_wh.toFixed(1)} Wh</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Remaining Energy:</span>
                <span className="font-bold text-teal-400">{reportData.energy_model.remaining_energy_wh.toFixed(1)} Wh</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2 shadow-sm">
            <span className="font-tech font-extrabold text-slate-300 text-xs tracking-wider block">
              6. MISSION EVENTS
            </span>
            <div className="space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-400">Dynamic Replanning:</span>
                <span className="font-bold text-emerald-400">ACTIVE</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Hazard Spike & Obstacles:</span>
                <span className="font-bold text-slate-200">SUPPORTED</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 7: Final Summary */}
        <div className="bg-sky-950/40 border border-sky-800/60 p-4 rounded-xl space-y-2 text-xs font-sans">
          <span className="font-tech font-extrabold text-sky-300 tracking-wider text-sm flex items-center space-x-2">
            <Award className="w-4 h-4 text-sky-400" />
            <span>7. FINAL MISSION SUMMARY</span>
          </span>
          <p className="text-slate-300 leading-relaxed italic">{reportData.summary}</p>
        </div>

        {/* Footer CTA */}
        <div className="flex items-center justify-between border-t border-slate-800 pt-4 font-mono">
          <span className="text-[11px] font-mono text-slate-400 font-medium">
            LUNA-X Mission Report • JSON Export Available
          </span>
          <button
            onClick={handleDownloadJSON}
            className="flex items-center space-x-2 px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-tech font-bold text-xs rounded-xl shadow-[0_0_12px_rgba(56,189,248,0.3)] transition-all"
          >
            <Download className="w-4 h-4 text-slate-950" />
            <span>DOWNLOAD REPORT (.JSON)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
