import React from 'react';
import { Terminal, Activity, ChevronUp, ChevronDown } from 'lucide-react';
import { useMissionStore } from '../../stores/useMissionStore';

export const ActivityFeedHUD: React.FC = () => {
  const [collapsed, setCollapsed] = React.useState(false);
  const activityLogs = useMissionStore((s) => s.activityLogs);

  return (
    <div className="absolute bottom-6 left-[460px] z-20 w-[380px] bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl p-3 text-slate-100 shadow-2xl font-mono text-xs transition-all duration-300">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
        <div className="flex items-center space-x-2 text-sky-400 font-tech font-bold tracking-wider">
          <Terminal className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
          <span>LIVE MISSION TICKER</span>
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-slate-400 hover:text-white p-0.5"
        >
          {collapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {!collapsed && (
        <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
          {activityLogs.map((log) => (
            <div key={log.id} className="flex items-start space-x-2 text-[11px] leading-tight">
              <span className="text-slate-400 text-[10px] flex-shrink-0">{log.timestamp}</span>
              <span
                className={`px-1 rounded text-[9px] font-bold flex-shrink-0 ${
                  log.type === 'error'
                    ? 'bg-rose-900/60 text-rose-300 border border-rose-700'
                    : log.type === 'warning'
                    ? 'bg-amber-900/60 text-amber-300 border border-amber-700'
                    : log.type === 'success'
                    ? 'bg-teal-900/60 text-teal-300 border border-teal-700'
                    : 'bg-sky-900/60 text-sky-300 border border-sky-700'
                }`}
              >
                [{log.category}]
              </span>
              <span className="text-slate-200">{log.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
