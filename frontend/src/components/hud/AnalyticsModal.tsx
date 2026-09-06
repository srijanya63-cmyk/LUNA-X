import React from 'react';
import {
  X,
  BarChart2,
  ShieldCheck,
  Zap,
  Compass,
  CheckCircle2,
  Award,
  Activity,
  Battery,
  MapPin,
  Play,
  Gauge,
  Sparkles,
  FileText
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useUIStore } from '../../stores/useUIStore';
import { useMissionStore } from '../../stores/useMissionStore';
import { useTerrainStore } from '../../stores/useTerrainStore';

export const AnalyticsModal: React.FC = () => {
  const { isAnalyticsOpen, toggleAnalytics, toggleReport } = useUIStore();
  const { missionPlan, config, isPlaying, roverNodeIndex, startDemoMission, autonomousStep } = useMissionStore();
  const { selectedCandidate } = useTerrainStore();

  if (!isAnalyticsOpen) return null;

  // Compute live mission metrics
  const totalNodes = missionPlan?.path?.length || 0;
  const currentWaypointIndex = Math.min(roverNodeIndex, Math.max(0, totalNodes - 1));
  const progressPct = totalNodes > 1 ? Math.round((currentWaypointIndex / (totalNodes - 1)) * 100) : (missionPlan ? 100 : 0);
  
  const totalDistanceM = missionPlan?.metrics?.distance_m || 0;
  const totalEnergyWh = missionPlan?.metrics?.estimated_energy_wh || 0;
  
  const traversedFraction = totalNodes > 1 ? currentWaypointIndex / (totalNodes - 1) : (missionPlan ? 1 : 0);
  const energyConsumedWh = Number((traversedFraction * totalEnergyWh).toFixed(1));
  const remainingBatteryWh = Math.max(0, Number((config.energy_budget_wh - energyConsumedWh).toFixed(1)));
  const batteryPct = Math.round((remainingBatteryWh / config.energy_budget_wh) * 100);

  const averageHazard = missionPlan?.metrics?.average_hazard ?? (selectedCandidate ? selectedCandidate.hazard_score : 0.15);
  const routeFeasibility = (missionPlan?.metrics?.feasibility || (selectedCandidate ? 'CANDIDATE_READY' : 'STANDBY')).toUpperCase();
  const landingScorePct = selectedCandidate ? Math.round(selectedCandidate.composite_score * 100) : 84;

  // Calculate Deterministic Mission Score (0-100)
  const iceScoreVal = Math.round((selectedCandidate?.ice_likelihood_score || 0.84) * 25);
  const safetyScoreVal = Math.round((1 - averageHazard) * 25);
  const scienceScoreVal = 20;
  const energyScoreVal = Math.round((remainingBatteryWh / config.energy_budget_wh) * 15);
  const distScoreVal = 13;
  const totalMissionScore = Math.min(100, Math.max(0, iceScoreVal + safetyScoreVal + scienceScoreVal + energyScoreVal + distScoreVal));

  // Determine Mission Status Label
  let missionStatusLabel = 'PRE-MISSION STANDBY';
  let statusBadgeColor = 'bg-slate-900 text-slate-300 border-slate-700';

  if (autonomousStep !== 'idle') {
    missionStatusLabel = `AUTONOMOUS: ${autonomousStep.toUpperCase()}`;
    statusBadgeColor = 'bg-teal-950 text-teal-300 border-teal-600 animate-pulse';
  } else if (isPlaying) {
    missionStatusLabel = 'SIMULATION IN PROGRESS';
    statusBadgeColor = 'bg-emerald-950 text-emerald-300 border-emerald-600 animate-pulse';
  } else if (missionPlan) {
    if (roverNodeIndex >= totalNodes - 1 && totalNodes > 0) {
      missionStatusLabel = 'TRAVERSE COMPLETE';
      statusBadgeColor = 'bg-purple-950 text-purple-300 border-purple-600';
    } else if (roverNodeIndex > 0) {
      missionStatusLabel = 'SIMULATION PAUSED';
      statusBadgeColor = 'bg-amber-950 text-amber-300 border-amber-600';
    } else {
      missionStatusLabel = 'MISSION ROUTE READY';
      statusBadgeColor = 'bg-sky-950 text-sky-300 border-sky-600';
    }
  }

  // Chart series
  const chartData = missionPlan?.path
    ? missionPlan.path.map((_, idx) => {
        const pct = idx / Math.max(1, missionPlan.path.length - 1);
        return {
          step: idx + 1,
          distance: Math.round(pct * totalDistanceM),
          energy: Number((pct * totalEnergyWh).toFixed(2)),
          hazard: Number((Math.sin(idx * 0.3) * 0.15 + averageHazard).toFixed(2)),
        };
      })
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xl p-4 font-sans">
      <div className="w-full max-w-4xl bg-slate-900/95 border border-slate-800 rounded-2xl p-6 text-slate-100 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto font-sans transition-all">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3 text-sky-400 font-display font-black text-lg tracking-wider">
            <BarChart2 className="w-6 h-6 text-sky-400" />
            <span>MISSION ANALYTICS & TELEMETRY DASHBOARD</span>
          </div>
          <div className="flex items-center space-x-3">
            <span className={`text-xs font-tech font-bold px-3 py-1 rounded-full border ${statusBadgeColor}`}>
              {missionStatusLabel}
            </span>
            <button
              onClick={toggleAnalytics}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* DETERMINISTIC MISSION SCORE (0-100) FEATURE CARD */}
        <div className="bg-gradient-to-r from-sky-950/60 via-slate-900 to-indigo-950/60 p-4 rounded-xl border border-sky-800/60 flex items-center justify-between shadow-lg font-mono">
          <div className="space-y-1">
            <span className="font-tech font-extrabold text-sky-400 text-xs tracking-wider block flex items-center space-x-1.5">
              <Award className="w-4 h-4 text-sky-400" />
              <span>DETERMINISTIC MISSION SCORE</span>
            </span>
            <div className="flex items-baseline space-x-2">
              <span className="text-4xl font-black text-sky-300">{totalMissionScore}</span>
              <span className="text-sm font-bold text-slate-400">/ 100</span>
            </div>
            <span className="text-[10px] text-slate-400 block font-sans">
              Calculated from volatile yield, hazard safety margin, and energy efficiency.
            </span>
          </div>

          <div className="grid grid-cols-5 gap-2 text-center text-[10px]">
            <div className="bg-slate-950 p-2 rounded border border-slate-800">
              <span className="text-slate-400 block font-tech">ICE VALUE</span>
              <span className="font-bold text-sky-400 text-xs">{iceScoreVal}/25</span>
            </div>
            <div className="bg-slate-950 p-2 rounded border border-slate-800">
              <span className="text-slate-400 block font-tech">SAFETY</span>
              <span className="font-bold text-emerald-400 text-xs">{safetyScoreVal}/25</span>
            </div>
            <div className="bg-slate-950 p-2 rounded border border-slate-800">
              <span className="text-slate-400 block font-tech">SCIENCE</span>
              <span className="font-bold text-purple-400 text-xs">{scienceScoreVal}/20</span>
            </div>
            <div className="bg-slate-950 p-2 rounded border border-slate-800">
              <span className="text-slate-400 block font-tech">ENERGY</span>
              <span className="font-bold text-amber-400 text-xs">{energyScoreVal}/15</span>
            </div>
            <div className="bg-slate-950 p-2 rounded border border-slate-800">
              <span className="text-slate-400 block font-tech">DISTANCE</span>
              <span className="font-bold text-indigo-400 text-xs">{distScoreVal}/15</span>
            </div>
          </div>
        </div>

        {/* Primary Mission Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
          {/* Mission Progress */}
          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 flex flex-col justify-between shadow-sm">
            <span className="text-slate-400 text-[11px] font-tech font-bold flex items-center space-x-1.5 tracking-wider">
              <Activity className="w-3.5 h-3.5 text-sky-400" />
              <span>MISSION PROGRESS</span>
            </span>
            <div className="mt-2">
              <span className="text-2xl font-bold text-sky-400">{progressPct}%</span>
              <span className="text-[10px] text-slate-400 block font-sans">
                {totalNodes > 0 ? `Waypoint ${currentWaypointIndex + 1} of ${totalNodes}` : '0 Waypoints'}
              </span>
            </div>
          </div>

          {/* Route Distance */}
          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 flex flex-col justify-between shadow-sm">
            <span className="text-slate-400 text-[11px] font-tech font-bold flex items-center space-x-1.5 tracking-wider">
              <Compass className="w-3.5 h-3.5 text-emerald-400" />
              <span>ROUTE DISTANCE</span>
            </span>
            <div className="mt-2">
              <span className="text-2xl font-bold text-emerald-400">{totalDistanceM.toFixed(1)} m</span>
              <span className="text-[10px] text-slate-400 block font-sans">
                {missionPlan ? 'Weighted A* path' : 'Target distance'}
              </span>
            </div>
          </div>

          {/* Energy Consumed */}
          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 flex flex-col justify-between shadow-sm">
            <span className="text-slate-400 text-[11px] font-tech font-bold flex items-center space-x-1.5 tracking-wider">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>ENERGY CONSUMED</span>
            </span>
            <div className="mt-2">
              <span className="text-2xl font-bold text-amber-400">{energyConsumedWh} Wh</span>
              <span className="text-[10px] text-slate-400 block font-sans">
                Est Total: {totalEnergyWh.toFixed(1)} Wh
              </span>
            </div>
          </div>

          {/* Remaining Battery */}
          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 flex flex-col justify-between shadow-sm">
            <span className="text-slate-400 text-[11px] font-tech font-bold flex items-center space-x-1.5 tracking-wider">
              <Battery className="w-3.5 h-3.5 text-teal-400" />
              <span>REMAINING BATTERY</span>
            </span>
            <div className="mt-2">
              <span className="text-2xl font-bold text-teal-400">{remainingBatteryWh} Wh</span>
              <span className="text-[10px] text-slate-400 block font-sans">
                {batteryPct}% of {config.energy_budget_wh} Wh budget
              </span>
            </div>
          </div>
        </div>

        {/* Energy Consumption Chart (Rendered when chartData is present) */}
        {chartData.length > 0 && (
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3 shadow-sm">
            <div className="flex justify-between items-center text-xs font-tech font-bold text-slate-300 tracking-wider">
              <span>ENERGY CONSUMPTION TRAJECTORY (WATT-HOURS OVER PATH)</span>
              <span className="text-amber-400 font-mono text-[11px]">{config.energy_budget_wh} Wh MAX BUDGET</span>
            </div>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="energyGradDark" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="step" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#38bdf8',
                      color: '#f8fafc',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontFamily: 'JetBrains Mono',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="energy"
                    stroke="#f59e0b"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#energyGradDark)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Footer CTA: Generate Mission Report */}
        <div className="flex items-center justify-between border-t border-slate-800 pt-3 font-mono text-xs">
          <span className="text-[11px] text-slate-400 font-medium">LUNA-X Simulation Data Analytics</span>
          <button
            onClick={() => {
              toggleAnalytics();
              toggleReport();
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-tech font-bold text-xs rounded-xl shadow-[0_0_12px_rgba(56,189,248,0.3)] transition-all"
          >
            <FileText className="w-4 h-4 text-slate-950" />
            <span>GENERATE MISSION REPORT</span>
          </button>
        </div>
      </div>
    </div>
  );
};
