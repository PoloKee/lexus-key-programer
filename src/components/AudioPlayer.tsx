import React, { useRef, useEffect, useState } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  RotateCw, 
  Repeat, 
  Volume2, 
  VolumeX, 
  Download, 
  Share2, 
  FileText, 
  Sliders, 
  Info,
  Disc3,
  Check
} from 'lucide-react';
import { WaveformVisualizer } from './WaveformVisualizer.js';
import type { Track } from '../types/music.js';

interface AudioPlayerProps {
  track: Track | null;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onOpenStems: () => void;
  onOpenLyrics: () => void;
  onOpenInspector: () => void;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  track,
  isPlaying,
  onTogglePlay,
  onOpenStems,
  onOpenLyrics,
  onOpenInspector
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [copiedShare, setCopiedShare] = useState(false);

  // Sync track URL to audio element
  useEffect(() => {
    if (audioRef.current && track?.audioUrl) {
      audioRef.current.src = track.audioUrl;
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      if (isPlaying) {
        audioRef.current.play().catch(e => console.warn('Audio play error:', e));
      }
    }
  }, [track?.id]);

  // Sync play/pause state
  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.play().catch(e => console.warn('Audio play error:', e));
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying]);

  // Sync volume & loop
  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = isMuted ? 0 : volume;
    audioRef.current.loop = isLooping;
    audioRef.current.playbackRate = playbackRate;
  }, [volume, isMuted, isLooping, playbackRate]);

  // Audio event listeners
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration || track?.duration || 28);
    }
  };

  const handleEnded = () => {
    if (!isLooping) {
      onTogglePlay(); // pause
      setCurrentTime(0);
    }
  };

  const handleSeek = (newTime: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const skipSeconds = (sec: number) => {
    if (audioRef.current) {
      const nextTime = Math.max(0, Math.min(duration, audioRef.current.currentTime + sec));
      audioRef.current.currentTime = nextTime;
      setCurrentTime(nextTime);
    }
  };

  const cyclePlaybackRate = () => {
    const rates = [1.0, 1.25, 1.5, 0.8];
    const nextIdx = (rates.indexOf(playbackRate) + 1) % rates.length;
    setPlaybackRate(rates[nextIdx]);
  };

  const handleDownload = () => {
    if (!track?.audioUrl) return;
    const a = document.createElement('a');
    a.href = track.audioUrl;
    a.download = `${track.title.toLowerCase().replace(/\s+/g, '-')}-polo-forge.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
  };

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!track) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-800 bg-zinc-950/95 backdrop-blur-xl px-4 py-3 shadow-2xl">
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
      />

      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Left: Track Info */}
        <div className="flex items-center gap-3 w-full md:w-1/4 min-w-0">
          <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 via-zinc-900 to-zinc-900 border border-amber-500/30 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-md">
            <Disc3 className={`w-7 h-7 text-amber-400 ${isPlaying ? 'animate-[spin_4s_linear_infinite]' : ''}`} />
          </div>

          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-semibold text-white truncate">
              {track.title}
            </h4>
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <span className="truncate">{track.genre}</span>
              <span>·</span>
              <span className="font-mono text-[11px] text-amber-400/90">{track.bpm} BPM</span>
              <span>·</span>
              <span className="font-mono text-[11px] text-zinc-500">{track.musicalKey}</span>
            </div>
          </div>
        </div>

        {/* Center: Controls & Waveform */}
        <div className="flex flex-col items-center gap-1.5 w-full md:w-2/4">
          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsLooping(!isLooping)}
              className={`p-1.5 rounded-lg transition-colors ${
                isLooping ? 'text-amber-400 bg-amber-500/10' : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title={isLooping ? 'Looping enabled' : 'Loop disabled'}
            >
              <Repeat className="w-4 h-4" />
            </button>

            <button
              onClick={() => skipSeconds(-5)}
              className="p-1.5 text-zinc-400 hover:text-zinc-200 transition-colors"
              title="Skip back 5s"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={onTogglePlay}
              className="w-10 h-10 rounded-full bg-amber-400 hover:bg-amber-300 text-zinc-950 flex items-center justify-center shadow-lg shadow-amber-500/30 transition-transform active:scale-95"
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
            </button>

            <button
              onClick={() => skipSeconds(5)}
              className="p-1.5 text-zinc-400 hover:text-zinc-200 transition-colors"
              title="Skip forward 5s"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            <button
              onClick={cyclePlaybackRate}
              className="px-1.5 py-0.5 rounded text-[11px] font-mono font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
              title="Playback speed"
            >
              {playbackRate}x
            </button>
          </div>

          {/* Waveform Scrubber & Timers */}
          <div className="w-full flex items-center gap-2.5">
            <span className="text-[11px] font-mono text-zinc-400 w-10 text-right">
              {formatTime(currentTime)}
            </span>

            <div className="flex-1">
              <WaveformVisualizer
                peaks={track.waveform}
                currentTime={currentTime}
                duration={duration || track.duration}
                isPlaying={isPlaying}
                onSeek={handleSeek}
                height={32}
              />
            </div>

            <span className="text-[11px] font-mono text-zinc-500 w-10">
              {formatTime(duration || track.duration)}
            </span>
          </div>
        </div>

        {/* Right: Tools & Volume */}
        <div className="flex items-center justify-end gap-2 w-full md:w-1/4">
          {/* Stems button */}
          <button
            onClick={onOpenStems}
            className="p-2 rounded-lg text-zinc-400 hover:text-amber-400 hover:bg-zinc-900 border border-transparent hover:border-zinc-800 transition-all"
            title="Stem Mixer (Mix, Instrumental, Vocals, Bass, Drums)"
          >
            <Sliders className="w-4 h-4" />
          </button>

          {/* Lyrics button */}
          {track.lyrics && (
            <button
              onClick={onOpenLyrics}
              className="p-2 rounded-lg text-zinc-400 hover:text-amber-400 hover:bg-zinc-900 border border-transparent hover:border-zinc-800 transition-all"
              title="Synchronized Lyrics"
            >
              <FileText className="w-4 h-4" />
            </button>
          )}

          {/* Track Inspector button */}
          <button
            onClick={onOpenInspector}
            className="p-2 rounded-lg text-zinc-400 hover:text-amber-400 hover:bg-zinc-900 border border-transparent hover:border-zinc-800 transition-all"
            title="Sonic Blueprint & Gemini Analysis"
          >
            <Info className="w-4 h-4" />
          </button>

          {/* Volume control */}
          <div className="flex items-center gap-1.5 ml-1">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="text-zinc-400 hover:text-zinc-200 p-1"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-rose-400" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={isMuted ? 0 : volume}
              onChange={(e) => {
                setVolume(Number(e.target.value));
                if (isMuted) setIsMuted(false);
              }}
              className="w-16 h-1 bg-zinc-800 rounded-lg accent-amber-400 cursor-pointer"
            />
          </div>

          {/* Download button */}
          <button
            onClick={handleDownload}
            className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition-all ml-1"
            title="Download Master WAV (44.1kHz)"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Share button */}
          <button
            onClick={handleShare}
            className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition-all"
            title="Share track"
          >
            {copiedShare ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};
