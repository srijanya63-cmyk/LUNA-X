import React, { useEffect } from 'react';
import { X, Keyboard } from 'lucide-react';
import { useUIStore } from '../../stores/useUIStore';
import { useMissionStore } from '../../stores/useMissionStore';

export const KeyboardShortcutsHUD: React.FC = () => {
  const {
    isShortcutsOpen,
    toggleShortcuts,
    toggleAnalytics,
    toggleComparison,
    toggleChallenge,
    toggleHumanVsAuto,
    setClickedTerrainPoint,
  } = useUIStore();
  const { isPlaying, setIsPlaying, replayMission, triggerEvent } = useMissionStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying(!isPlaying);
      } else if (e.code === 'KeyR') {
        replayMission();
      } else if (e.code === 'KeyD') {
        const currentBudget = useMissionStore.getState().config.energy_budget_wh;
        const newBudget = Math.max(40.0, Number((currentBudget * 0.5).toFixed(1)));
        triggerEvent('energy_reduction', { new_energy_budget_wh: newBudget });
      } else if (e.code === 'KeyA') {
        useMissionStore.getState().startAutonomousMission();
      } else if (e.code === 'KeyM') {
        toggleComparison();
      } else if (e.code === 'Escape') {
        setClickedTerrainPoint(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, setIsPlaying, replayMission, triggerEvent, toggleComparison, setClickedTerrainPoint]);

  if (!isShortcutsOpen) return null;

  const shortcuts = [
    { key: 'Space', desc: 'Play / Pause Rover Traversal Simulation' },
    { key: 'R', desc: 'Replay Completed Mission Traversal' },
    { key: 'D', desc: 'Simulate Battery Drop (-50% Energy Budget)' },
    { key: 'A', desc: 'Activate Autonomous Execution Engine' },
    { key: 'M', desc: 'Open Landing Site Comparison Matrix' },
    { key: 'ESC', desc: 'Close Active Modals & Clear Pin' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xl p-4 font-sans">
      <div className="w-full max-w-md bg-slate-900/95 border border-slate-800 rounded-2xl p-6 text-slate-100 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2 text-sky-400 font-display font-black text-base tracking-wider">
            <Keyboard className="w-5 h-5 text-sky-400" />
            <span>KEYBOARD SHORTCUTS</span>
          </div>
          <button
            onClick={toggleShortcuts}
            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2 font-mono text-xs">
          {shortcuts.map((sc, idx) => (
            <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800">
              <span className="px-2 py-1 bg-slate-900 border border-slate-700 rounded font-bold text-sky-400 shadow-sm">
                {sc.key}
              </span>
              <span className="text-slate-300 font-sans font-medium text-[11px] text-right">{sc.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
