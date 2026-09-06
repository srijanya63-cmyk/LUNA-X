import React, { useState } from 'react';
import { Bot, Send, Sparkles, X, Terminal } from 'lucide-react';
import { useUIStore } from '../../stores/useUIStore';
import { useMissionStore } from '../../stores/useMissionStore';

export const AIWidgetHUD: React.FC = () => {
  const { isAIWidgetOpen, toggleAIWidget } = useUIStore();
  const { aiStatus, aiExplanation, parsePromptIntent } = useMissionStore();
  const [prompt, setPrompt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isAIWidgetOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsSubmitting(true);
    await parsePromptIntent(prompt);
    setIsSubmitting(false);
    setPrompt('');
  };

  return (
    <div className="absolute top-20 left-80 z-30 w-[420px] bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 text-slate-100 text-xs shadow-2xl space-y-4 transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2.5 text-sky-400 font-display font-bold text-sm tracking-wider">
          <Bot className="w-5 h-5 text-sky-400" />
          <span>LOCAL AI MISSION ASSISTANT</span>
        </div>
        <button
          onClick={toggleAIWidget}
          className="text-slate-400 hover:text-white p-1 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* AI Readiness Status */}
      <div className="flex items-center space-x-2.5 text-xs font-mono bg-slate-950 p-2.5 rounded-lg border border-slate-800">
        <span
          className={`w-2.5 h-2.5 rounded-full ${
            aiStatus?.available ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'
          }`}
        />
        <span className="text-slate-300 font-semibold">
          {aiStatus?.available
            ? `Ollama Local Model (${aiStatus.model})`
            : 'Ollama Offline — Deterministic Template Fallback Active'}
        </span>
      </div>

      {/* Technical Briefing Window */}
      {aiExplanation && (
        <div className="bg-sky-950/40 p-3.5 rounded-lg border border-sky-800/60 space-y-2 max-h-52 overflow-y-auto">
          <div className="flex items-center space-x-1.5 text-sky-300 text-xs font-tech font-bold tracking-wider">
            <Sparkles className="w-4 h-4 text-sky-400" />
            <span>FLIGHT DIRECTOR TECHNICAL BRIEFING</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed font-sans">{aiExplanation}</p>
        </div>
      )}

      {/* Natural Language Prompt Form */}
      <form onSubmit={handleSubmit} className="flex items-center space-x-2 pt-1 font-mono">
        <div className="relative flex-1">
          <Terminal className="w-4 h-4 text-sky-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. 'Plan a high safety route with 80% battery...'"
            className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 font-mono shadow-sm"
          />
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-lg flex items-center space-x-1.5 transition-all shadow-[0_0_10px_rgba(56,189,248,0.3)] disabled:opacity-50"
        >
          <Send className="w-4 h-4 text-slate-950" />
        </button>
      </form>
    </div>
  );
};
