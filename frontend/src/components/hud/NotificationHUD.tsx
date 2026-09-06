import React, { useEffect } from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';
import { useUIStore } from '../../stores/useUIStore';

export const NotificationHUD: React.FC = () => {
  const { notification, clearNotification } = useUIStore();

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        clearNotification();
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [notification, clearNotification]);

  if (!notification) return null;

  const bgColors = {
    info: 'bg-slate-900/90 border-sky-500/80 text-sky-200 shadow-[0_0_20px_rgba(56,189,248,0.25)]',
    success: 'bg-slate-900/90 border-emerald-500/80 text-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.25)]',
    warning: 'bg-slate-900/90 border-amber-500/80 text-amber-200 shadow-[0_0_20px_rgba(245,158,11,0.25)]',
    error: 'bg-slate-900/90 border-rose-500/80 text-rose-200 shadow-[0_0_20px_rgba(239,68,68,0.25)]',
  };

  const icons = {
    info: <Info className="w-5 h-5 text-sky-400 shrink-0" />,
    success: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />,
  };

  return (
    <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 max-w-xl w-full px-4 animate-in fade-in slide-in-from-top-4 duration-300 font-mono">
      <div
        className={`flex items-center justify-between p-3.5 rounded-xl border backdrop-blur-xl text-xs font-semibold transition-all ${
          bgColors[notification.type]
        }`}
      >
        <div className="flex items-center space-x-3 pr-2">
          {icons[notification.type]}
          <span className="leading-snug">{notification.message}</span>
        </div>
        <button onClick={clearNotification} className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-all">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
