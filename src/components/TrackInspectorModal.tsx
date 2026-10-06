import React from 'react';
import { X, Sparkles, Sliders, Music, Activity, Compass, Cpu, Layers } from 'lucide-react';
import type { Track } from '../types/music.js';

interface TrackInspectorModalProps {
  track: Track;
  isOpen: boolean;
  onClose: () => void;
}

export const TrackInspectorModal: React.FC<TrackInspectorModalProps> = ({
  track,
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  const analysis = track.analysis;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-5 max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Sonic Blueprint & Analysis</h3>
              <p className="text-xs text-zinc-400">
                Gemini 3.8 Flash Musical Deconstruction · {track.title}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Concept & Mood */}
        <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800/80 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
            <Compass className="w-4 h-4" />
            <span>Artistic Vision & Mood</span>
          </div>
          <p className="text-sm text-zinc-200">
            {analysis?.concept || track.prompt}
          </p>
          <div className="flex flex-wrap gap-2 pt-1 text-xs text-zinc-400">
            <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
              Mood: {analysis?.mood || 'Expressive'}
            </span>
            <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 font-mono">
              Tempo: {track.bpm} BPM
            </span>
            <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 font-mono">
              Key: {track.musicalKey}
            </span>
            <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
              Model: {track.modelUsed}
            </span>
          </div>
        </div>

        {/* Instrumentation Breakdown */}
        {analysis?.instrumentation && analysis.instrumentation.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span>Synthesizers & Instrumentation</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {analysis.instrumentation.map((inst, i) => (
                <div key={i} className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800/80 text-xs text-zinc-300 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 flex-shrink-0" />
                  <span>{inst}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Song Structure Timeline */}
        {analysis?.structure && analysis.structure.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>Arrangement & Structure Timeline</span>
            </div>
            <div className="space-y-2">
              {analysis.structure.map((sec, idx) => (
                <div key={idx} className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800/80 flex items-start justify-between gap-3 text-xs">
                  <div>
                    <span className="font-semibold text-emerald-400 mr-2">[{sec.section}]</span>
                    <span className="text-zinc-300">{sec.description}</span>
                  </div>
                  <span className="font-mono text-zinc-500 text-[11px] flex-shrink-0">
                    {sec.startSec}s - {sec.endSec}s
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Enriched Lyria Prompt */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300">
            <Music className="w-4 h-4 text-amber-400" />
            <span>Enriched Lyria 3.5 Synthesis Prompt</span>
          </div>
          <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 text-xs font-mono text-zinc-400 leading-relaxed">
            {track.enrichedPrompt || track.prompt}
          </div>
        </div>

        {/* Production & Mastering Notes */}
        {analysis?.productionNotes && (
          <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 text-xs text-zinc-400 space-y-1">
            <span className="font-semibold text-zinc-200 block">Production & Mastering:</span>
            <p>{analysis.productionNotes}</p>
          </div>
        )}
      </div>
    </div>
  );
};
