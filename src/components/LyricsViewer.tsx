import React, { useState } from 'react';
import { X, Copy, Check, FileText, Mic2 } from 'lucide-react';
import type { Track } from '../types/music.js';

interface LyricsViewerProps {
  track: Track;
  isOpen: boolean;
  onClose: () => void;
  currentTime?: number;
  onSeekTo?: (time: number) => void;
}

export const LyricsViewer: React.FC<LyricsViewerProps> = ({
  track,
  isOpen,
  onClose,
  currentTime = 0,
  onSeekTo
}) => {
  if (!isOpen) return null;

  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!track.lyrics) return;
    navigator.clipboard.writeText(track.lyrics);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const parsedLyrics = track.parsedLyrics || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <Mic2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Synchronized Lyrics</h3>
              <p className="text-xs text-zinc-400">
                {track.title} · {track.vocalStyle || 'Lead Vocals'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-300 bg-zinc-800 hover:bg-zinc-700 hover:text-white transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Lyrics Content */}
        <div className="flex-1 overflow-y-auto py-6 space-y-4 pr-2">
          {parsedLyrics.length > 0 ? (
            parsedLyrics.map((line, idx) => {
              // Determine if line is active based on timeSec
              const nextTime = parsedLyrics[idx + 1]?.timeSec ?? (track.duration || 30);
              const isActive = currentTime >= line.timeSec && currentTime < nextTime;
              const isPast = currentTime >= nextTime;

              return (
                <div
                  key={idx}
                  onClick={() => onSeekTo?.(line.timeSec)}
                  className={`p-3 rounded-xl transition-all cursor-pointer flex items-baseline justify-between gap-4 ${
                    isActive
                      ? 'bg-amber-500/10 border border-amber-500/40 text-amber-200 shadow-md shadow-amber-500/5 scale-[1.01]'
                      : isPast
                      ? 'text-zinc-500 hover:text-zinc-300'
                      : 'text-zinc-300 hover:text-white'
                  }`}
                >
                  <div className="space-y-1">
                    {line.section && (
                      <span className="text-[10px] font-mono uppercase tracking-wider text-amber-500/80 block">
                        [{line.section}]
                      </span>
                    )}
                    <p className={`text-base font-medium leading-relaxed ${isActive ? 'font-semibold text-amber-300' : ''}`}>
                      {line.text}
                    </p>
                  </div>
                  <span className="text-[11px] font-mono text-zinc-600 flex-shrink-0">
                    {Math.floor(line.timeSec / 60)}:{(Math.floor(line.timeSec % 60)).toString().padStart(2, '0')}
                  </span>
                </div>
              );
            })
          ) : track.lyrics ? (
            <div className="font-mono text-sm text-zinc-300 whitespace-pre-line leading-relaxed p-4 bg-zinc-950 rounded-xl border border-zinc-800">
              {track.lyrics}
            </div>
          ) : (
            <div className="text-center py-12 text-zinc-500 text-sm">
              This track is instrumental (no lyrics generated).
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="pt-3 border-t border-zinc-800 text-[11px] text-zinc-500 flex justify-between items-center flex-shrink-0">
          <span>Click any line to jump audio playback</span>
          <span className="font-mono">Time: {Math.floor(currentTime)}s</span>
        </div>
      </div>
    </div>
  );
};
