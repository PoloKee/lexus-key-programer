import React from 'react';
import { Disc3, Sparkles, CloudUpload, Github, HelpCircle, Flame, Layers } from 'lucide-react';

interface HeaderProps {
  onOpenDeployGuide: () => void;
  trackCount: number;
  activeModel: string;
}

export const Header: React.FC<HeaderProps> = ({ onOpenDeployGuide, trackCount, activeModel }) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600 shadow-lg shadow-amber-500/20 text-zinc-950 font-bold">
            <Flame className="w-5 h-5 text-zinc-950" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-extrabold text-xl tracking-tight text-white">
                POLO<span className="text-amber-400">FORGE</span>
              </span>
              <span className="text-[10px] tracking-wider uppercase font-semibold px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700/60">
                Studio
              </span>
            </div>
            <p className="text-xs text-zinc-400 hidden sm:block">
              Text-to-Music Generation Engine · Lyria 3.5 & Gemini
            </p>
          </div>
        </div>

        {/* Center Engine Badges */}
        <div className="hidden md:flex items-center gap-2 text-xs text-zinc-400">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-300">
            <Disc3 className="w-3.5 h-3.5 text-amber-400 animate-[spin_6s_linear_infinite]" />
            <span>Lyria 3.5</span>
            <span className="text-zinc-500">·</span>
            <span className="text-zinc-400">Audio Engine</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-300">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Gemini 3.8</span>
            <span className="text-zinc-500">·</span>
            <span className="text-zinc-400">Sonic Blueprint</span>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2.5">
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-zinc-400 bg-zinc-900/80 px-2.5 py-1 rounded-md border border-zinc-800">
            <Layers className="w-3.5 h-3.5 text-zinc-400" />
            <span>{trackCount} {trackCount === 1 ? 'track' : 'tracks'}</span>
          </div>

          <button
            onClick={onOpenDeployGuide}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-300 bg-zinc-900 hover:bg-zinc-800 hover:text-white border border-zinc-800 transition-colors"
            title="AI Studio Deployment & GitHub Sync"
          >
            <CloudUpload className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Cloud Run & GitHub</span>
            <HelpCircle className="w-3 h-3 text-zinc-500 sm:hidden" />
          </button>
        </div>
      </div>
    </header>
  );
};
