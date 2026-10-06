import React, { useState } from 'react';
import { X, Volume2, VolumeX, Download, Layers, Radio } from 'lucide-react';
import type { Track } from '../types/music.js';

interface StemMixerProps {
  track: Track;
  isOpen: boolean;
  onClose: () => void;
  onSelectStemAudio: (stemUrl: string) => void;
}

export const StemMixer: React.FC<StemMixerProps> = ({
  track,
  isOpen,
  onClose,
  onSelectStemAudio
}) => {
  if (!isOpen) return null;

  const [activeStem, setActiveStem] = useState<string>('mix');
  const [faders, setFaders] = useState({
    mix: 1.0,
    instrumental: 1.0,
    vocals: 1.0,
    drums: 1.0,
    bass: 1.0
  });

  const stemList = [
    { key: 'mix', name: 'Master Full Mix', url: track.stems.mix, color: 'text-amber-400' },
    { key: 'instrumental', name: 'Instrumental', url: track.stems.instrumental, color: 'text-cyan-400' },
    { key: 'vocals', name: 'Lead Vocals', url: track.stems.vocals, color: 'text-rose-400' },
    { key: 'drums', name: 'Drums & Percussion', url: track.stems.drums, color: 'text-emerald-400' },
    { key: 'bass', name: 'Bass & Sub', url: track.stems.bass, color: 'text-purple-400' },
  ].filter(s => Boolean(s.url));

  const handleSoloStem = (stemKey: string, url?: string) => {
    if (!url) return;
    setActiveStem(stemKey);
    onSelectStemAudio(url);
  };

  const handleDownloadStem = (name: string, url?: string) => {
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = `${track.title.toLowerCase().replace(/\s+/g, '-')}-${name.toLowerCase().replace(/\s+/g, '-')}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Studio Stem Mixer</h3>
              <p className="text-xs text-zinc-400">
                Solo or download individual multi-track stems for &ldquo;{track.title}&rdquo;
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

        {/* Stem Channels */}
        <div className="space-y-3">
          {stemList.map((stem) => {
            const isSoloed = activeStem === stem.key;
            return (
              <div
                key={stem.key}
                className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-4 ${
                  isSoloed
                    ? 'bg-zinc-950 border-amber-500/60 shadow-md shadow-amber-500/5'
                    : 'bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={() => handleSoloStem(stem.key, stem.url)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                      isSoloed
                        ? 'bg-amber-500 text-zinc-950'
                        : 'bg-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Radio className="w-3 h-3" />
                    <span>Solo</span>
                  </button>

                  <div>
                    <span className={`text-sm font-semibold ${stem.color}`}>
                      {stem.name}
                    </span>
                    <span className="block text-[10px] text-zinc-500 font-mono">
                      WAV 44.1kHz · 16-bit
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Stem Download */}
                  <button
                    onClick={() => handleDownloadStem(stem.name, stem.url)}
                    className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                    title={`Download ${stem.name} WAV`}
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Instructions */}
        <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/60 text-xs text-zinc-400 flex items-start gap-2">
          <span className="text-amber-400 font-bold">Tip:</span>
          <span>
            Click <strong>Solo</strong> to audition an isolated stem immediately through the studio audio player, or download individual tracks for external DAW remixing (Ableton, Logic, FL Studio).
          </span>
        </div>
      </div>
    </div>
  );
};
