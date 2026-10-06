import React, { useRef, useState } from 'react';

interface WaveformVisualizerProps {
  peaks: number[];
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  onSeek: (time: number) => void;
  height?: number;
  interactive?: boolean;
}

export const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({
  peaks,
  currentTime,
  duration,
  isPlaying,
  onSeek,
  height = 48,
  interactive = true
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoverPosition, setHoverPosition] = useState<number | null>(null);

  const safeDuration = duration > 0 ? duration : 1;
  const progressRatio = Math.max(0, Math.min(1, currentTime / safeDuration));

  // Handle click or drag
  const handleInteract = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    onSeek(ratio * safeDuration);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const hoverX = e.clientX - rect.left;
    setHoverPosition(Math.max(0, Math.min(1, hoverX / rect.width)));
  };

  const handleMouseLeave = () => {
    setHoverPosition(null);
  };

  // If peaks is empty, provide default dummy heights
  const bars = peaks && peaks.length > 0 ? peaks : Array(60).fill(0.35);

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      ref={containerRef}
      onClick={handleInteract}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative w-full select-none flex items-center gap-[2px] ${interactive ? 'cursor-pointer group' : ''}`}
      style={{ height: `${height}px` }}
    >
      {/* Bars */}
      {bars.map((peak, index) => {
        const barRatio = index / bars.length;
        const isPast = barRatio <= progressRatio;
        const isHoverPast = hoverPosition !== null && barRatio <= hoverPosition;

        // Peak normalized height (min 15%, max 100%)
        const barHeightPercent = Math.max(14, Math.min(100, peak * 100));

        let barClass = 'bg-zinc-700 hover:bg-zinc-500';
        if (isPast) {
          barClass = isPlaying 
            ? 'bg-gradient-to-t from-amber-500 to-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.4)]' 
            : 'bg-amber-400';
        } else if (isHoverPast) {
          barClass = 'bg-zinc-500';
        }

        return (
          <div
            key={index}
            className="flex-1 flex items-center justify-center h-full"
          >
            <div
              className={`w-full rounded-full transition-all duration-75 ${barClass}`}
              style={{
                height: `${barHeightPercent}%`,
                transformOrigin: 'center'
              }}
            />
          </div>
        );
      })}

      {/* Playhead position line */}
      <div
        className="absolute top-0 bottom-0 w-[2px] bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)] pointer-events-none transition-all duration-75"
        style={{ left: `${progressRatio * 100}%` }}
      />

      {/* Hover timestamp tooltip */}
      {hoverPosition !== null && interactive && (
        <div
          className="absolute -top-7 transform -translate-x-1/2 px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-[11px] font-mono text-zinc-200 shadow-md pointer-events-none z-20"
          style={{ left: `${hoverPosition * 100}%` }}
        >
          {formatTime(hoverPosition * safeDuration)}
        </div>
      )}
    </div>
  );
};
