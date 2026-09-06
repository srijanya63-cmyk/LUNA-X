import React from 'react';
import { X, Trophy, Play } from 'lucide-react';
import { useUIStore } from '../../stores/useUIStore';
import { useMissionStore } from '../../stores/useMissionStore';
import { ChallengeMission } from '../../types';

const CHALLENGES: ChallengeMission[] = [
  {
    id: 'ch-1',
    name: 'Shackleton Ice Harvest',
    description: 'Traverse into Shackleton Crater Permanent Shadow Region with >45% battery reserve.',
    targetSite: 'Shackleton Rim Alpha',
    timeLimitSec: 300,
    minBatteryPct: 45,
    targetIceYield: 85,
    maxHazardLimit: 0.65,
    difficulty: 'Standard',
  },
  {
    id: 'ch-2',
    name: 'Low Energy Survival Run',
    description: 'Reach de Gerlache Ridge target with less than 250Wh battery budget without stranding.',
    targetSite: 'de Gerlache Ridge 1',
    timeLimitSec: 240,
    minBatteryPct: 20,
    targetIceYield: 70,
    maxHazardLimit: 0.50,
    difficulty: 'Hard',
  },
  {
    id: 'ch-3',
    name: 'Steep Rim Reconnaissance',
    description: 'Navigate steep crater walls (>15° slopes) to reach high-value volatile traps.',
    targetSite: 'Amundsen Crater Base',
    timeLimitSec: 180,
    minBatteryPct: 30,
    targetIceYield: 90,
    maxHazardLimit: 0.85,
    difficulty: 'Extreme',
  },
];

export const ChallengeModeModal: React.FC = () => {
  const { isChallengeOpen, toggleChallenge } = useUIStore();
  const { startChallenge, activeChallenge } = useMissionStore();

  if (!isChallengeOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xl p-4 font-sans">
      <div className="w-full max-w-3xl bg-slate-900/95 border border-slate-800 rounded-2xl p-6 text-slate-100 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-3 text-amber-400 font-display font-black text-lg tracking-wider">
            <Trophy className="w-6 h-6 text-amber-400" />
            <span>COMMANDER CHALLENGE MODE</span>
          </div>
          <button
            onClick={toggleChallenge}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed font-medium">
          Select a preset tactical lunar mission scenario. Test your rover configuration and route planning under strict constraint requirements.
        </p>

        <div className="space-y-3">
          {CHALLENGES.map((ch) => {
            const isActive = activeChallenge?.id === ch.id;
            return (
              <div
                key={ch.id}
                className={`p-4 rounded-xl border transition-all space-y-2 ${
                  isActive
                    ? 'bg-amber-950/60 border-amber-500/80 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                    : 'bg-slate-950/40 hover:bg-slate-800/50 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <Trophy className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-500'}`} />
                    <span className="font-tech font-extrabold text-slate-100 text-sm tracking-wider">
                      {ch.name}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-extrabold uppercase ${
                        ch.difficulty === 'Standard'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                          : ch.difficulty === 'Hard'
                          ? 'bg-amber-950 text-amber-300 border border-amber-700'
                          : 'bg-rose-950 text-rose-300 border border-rose-700'
                      }`}
                    >
                      {ch.difficulty}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      startChallenge(ch);
                      toggleChallenge();
                    }}
                    className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-tech font-black text-xs rounded-xl shadow-[0_0_10px_rgba(245,158,11,0.3)] flex items-center space-x-1.5"
                  >
                    <Play className="w-3.5 h-3.5 fill-current text-slate-950" />
                    <span>LAUNCH CHALLENGE</span>
                  </button>
                </div>

                <p className="text-xs text-slate-300 font-sans">{ch.description}</p>

                <div className="grid grid-cols-4 gap-2 text-center font-mono text-[11px]">
                  <div className="bg-slate-950 p-1.5 rounded border border-slate-800">
                    <span className="text-[9px] text-slate-400 block">TARGET</span>
                    <span className="font-bold text-slate-200">{ch.targetSite}</span>
                  </div>
                  <div className="bg-slate-950 p-1.5 rounded border border-slate-800">
                    <span className="text-[9px] text-slate-400 block">MIN BATTERY</span>
                    <span className="font-bold text-amber-400">{ch.minBatteryPct}%</span>
                  </div>
                  <div className="bg-slate-950 p-1.5 rounded border border-slate-800">
                    <span className="text-[9px] text-slate-400 block">TARGET ICE</span>
                    <span className="font-bold text-sky-400">{ch.targetIceYield}%</span>
                  </div>
                  <div className="bg-slate-950 p-1.5 rounded border border-slate-800">
                    <span className="text-[9px] text-slate-400 block">MAX HAZARD</span>
                    <span className="font-bold text-rose-400">{ch.maxHazardLimit}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
