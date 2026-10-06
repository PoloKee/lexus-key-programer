import React from 'react';
import { Sparkles, Disc3, Mic2, Sliders, CheckCircle2, Loader2, Music2 } from 'lucide-react';
import type { PipelineProgress } from '../types/music.js';

interface GenerationProgressModalProps {
  isOpen: boolean;
  progress: PipelineProgress | null;
}

const STAGES = [
  {
    key: 'analyzing_prompt',
    label: 'Prompt Understanding & Sonic Blueprint',
    model: 'Gemini 3.8 Flash',
    desc: 'Extracting key, BPM, harmonic progression, instrumentation & acoustic textures',
    icon: Sparkles
  },
  {
    key: 'composing_music',
    label: 'Harmonic & Melodic Generation',
    model: 'Lyria 3.5 Engine',
    desc: 'Generating 44.1kHz audio stems, synth leads, basslines and drum grooves',
    icon: Disc3
  },
  {
    key: 'synthesizing_vocals',
    label: 'Vocal Synthesis & Lyric Timing',
    model: 'Gemini Vocal Studio',
    desc: 'Synthesizing sung lyrics, melodic cadence & timestamp alignment',
    icon: Mic2
  },
  {
    key: 'mastering_audio',
    label: 'Mastering, Stereo Imaging & Stems',
    model: 'Polo Studio Master',
    desc: 'Multi-band limiting, stereo panorama, stem separation & waveform extraction',
    icon: Sliders
  }
];

export const GenerationProgressModal: React.FC<GenerationProgressModalProps> = ({
  isOpen,
  progress
}) => {
  if (!isOpen) return null;

  const currentPercent = progress?.progressPercent || 15;
  const currentStage = progress?.stage || 'analyzing_prompt';
  const stageIndex = progress?.stageIndex || 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-6">
        {/* Pulsing Visualizer Anchor */}
        <div className="text-center space-y-3">
          <div className="relative mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500/20 via-amber-500/40 to-orange-500/20 border border-amber-500/40 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Music2 className="w-8 h-8 text-amber-400 animate-pulse" />
            {/* Spinning ring */}
            <div className="absolute inset-0 rounded-2xl border border-amber-400/50 animate-[spin_8s_linear_infinite]" />
          </div>

          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">
              Forging Your Music Track
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Multi-Stage Audio Pipeline in Progress
            </p>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1.5 pt-2">
            <div className="w-full bg-zinc-950 h-2 rounded-full overflow-hidden border border-zinc-800 p-0.5">
              <div 
                className="bg-gradient-to-r from-amber-500 via-amber-400 to-orange-400 h-full rounded-full transition-all duration-500 shadow-[0_0_12px_rgba(245,158,11,0.5)]"
                style={{ width: `${currentPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] font-mono text-zinc-400 px-1">
              <span>Stage {stageIndex} of 4</span>
              <span className="text-amber-400 font-bold">{currentPercent}%</span>
            </div>
          </div>
        </div>

        {/* Multi-Stage List */}
        <div className="space-y-2.5 pt-1">
          {STAGES.map((s, idx) => {
            const isCompleted = idx + 1 < stageIndex || progress?.stage === 'completed';
            const isCurrent = idx + 1 === stageIndex && progress?.stage !== 'completed';
            const isPending = idx + 1 > stageIndex;
            const Icon = s.icon;

            return (
              <div
                key={s.key}
                className={`p-3 rounded-xl border transition-all flex items-start gap-3.5 ${
                  isCurrent
                    ? 'bg-amber-500/10 border-amber-500/50 shadow-md shadow-amber-500/5'
                    : isCompleted
                    ? 'bg-zinc-950/60 border-zinc-800/80 text-zinc-400'
                    : 'bg-zinc-950/30 border-zinc-900 text-zinc-600'
                }`}
              >
                <div className="mt-0.5 flex-shrink-0">
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : isCurrent ? (
                    <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
                  ) : (
                    <Icon className="w-4 h-4 text-zinc-600" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-xs font-semibold ${isCurrent ? 'text-amber-300' : isCompleted ? 'text-zinc-200' : 'text-zinc-500'}`}>
                      {idx + 1}. {s.label}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
                      {s.model}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug">
                    {s.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Live Detail Message */}
        <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800/80 text-xs font-mono text-zinc-400 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          <span className="truncate">{progress?.message || 'Processing audio stream...'}</span>
        </div>
      </div>
    </div>
  );
};
