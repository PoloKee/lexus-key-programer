import React, { useState } from 'react';
import { 
  Play, 
  Pause, 
  Search, 
  Star, 
  Trash2, 
  Download, 
  Sliders, 
  FileText, 
  Sparkles, 
  Music, 
  Filter,
  Flame,
  Layers,
  Repeat
} from 'lucide-react';
import { WaveformVisualizer } from './WaveformVisualizer.js';
import type { Track } from '../types/music.js';

interface TrackLibraryProps {
  tracks: Track[];
  currentTrackId: string | null;
  isPlaying: boolean;
  onPlayTrack: (track: Track) => void;
  onTogglePlay: () => void;
  onDeleteTrack: (trackId: string) => void;
  onToggleFavorite: (trackId: string) => void;
  onRemixTrack: (track: Track) => void;
  onOpenStems: (track: Track) => void;
  onOpenLyrics: (track: Track) => void;
}

export const TrackLibrary: React.FC<TrackLibraryProps> = ({
  tracks,
  currentTrackId,
  isPlaying,
  onPlayTrack,
  onTogglePlay,
  onDeleteTrack,
  onToggleFavorite,
  onRemixTrack,
  onOpenStems,
  onOpenLyrics
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'instrumental' | 'vocals' | 'favorites'>('all');

  // Filter tracks
  const filteredTracks = tracks.filter((t) => {
    // Search query match
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchPrompt = t.prompt.toLowerCase().includes(q);
      const matchGenre = t.genre.toLowerCase().includes(q);
      if (!matchTitle && !matchPrompt && !matchGenre) return false;
    }

    // Filter tabs
    if (filterType === 'instrumental') return t.isInstrumental;
    if (filterType === 'vocals') return !t.isInstrumental;
    if (filterType === 'favorites') return Boolean(t.isFavorite);

    return true;
  });

  const handleDownload = (track: Track, e: React.MouseEvent) => {
    e.stopPropagation();
    const a = document.createElement('a');
    a.href = track.audioUrl;
    a.download = `${track.title.toLowerCase().replace(/\s+/g, '-')}-polo-forge.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="w-full bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 sm:p-6 shadow-xl backdrop-blur-sm space-y-4">
      {/* Top Header & Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Music className="w-4 h-4 text-amber-400" />
            <span>Studio Track History & Library</span>
          </h3>
          <p className="text-xs text-zinc-400">
            {tracks.length} generated {tracks.length === 1 ? 'master' : 'masters'} in current session
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search title, genre, prompt..."
            className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500/80 rounded-xl pl-9 pr-3 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-500 outline-none transition-colors"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        <button
          onClick={() => setFilterType('all')}
          className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
            filterType === 'all'
              ? 'bg-zinc-800 text-amber-400'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          All Tracks ({tracks.length})
        </button>
        <button
          onClick={() => setFilterType('vocals')}
          className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
            filterType === 'vocals'
              ? 'bg-zinc-800 text-amber-400'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          With Vocals
        </button>
        <button
          onClick={() => setFilterType('instrumental')}
          className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
            filterType === 'instrumental'
              ? 'bg-zinc-800 text-amber-400'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Instrumental
        </button>
        <button
          onClick={() => setFilterType('favorites')}
          className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
            filterType === 'favorites'
              ? 'bg-zinc-800 text-amber-400'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Star className="w-3 h-3 fill-current" />
          <span>Favorites</span>
        </button>
      </div>

      {/* Track Cards */}
      <div className="space-y-2.5">
        {filteredTracks.length > 0 ? (
          filteredTracks.map((track) => {
            const isCurrent = currentTrackId === track.id;
            const isCurrentPlaying = isCurrent && isPlaying;

            return (
              <div
                key={track.id}
                onClick={() => {
                  if (isCurrent) {
                    onTogglePlay();
                  } else {
                    onPlayTrack(track);
                  }
                }}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col md:flex-row items-start md:items-center justify-between gap-3 group ${
                  isCurrent
                    ? 'bg-zinc-950 border-amber-500/60 shadow-lg shadow-amber-500/5'
                    : 'bg-zinc-950/70 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-950'
                }`}
              >
                {/* Left: Play button & Track Title */}
                <div className="flex items-center gap-3 w-full md:w-1/3 min-w-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isCurrent) {
                        onTogglePlay();
                      } else {
                        onPlayTrack(track);
                      }
                    }}
                    className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-transform active:scale-95 ${
                      isCurrentPlaying
                        ? 'bg-amber-400 text-zinc-950 shadow-md shadow-amber-500/30'
                        : 'bg-zinc-800 group-hover:bg-amber-400 group-hover:text-zinc-950 text-zinc-300'
                    }`}
                  >
                    {isCurrentPlaying ? (
                      <Pause className="w-4 h-4 fill-current" />
                    ) : (
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    )}
                  </button>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-white truncate">
                        {track.title}
                      </h4>
                      {track.isFavorite && (
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-zinc-400 truncate">
                      {track.prompt}
                    </p>
                  </div>
                </div>

                {/* Center: Waveform Thumbnail & Tags */}
                <div className="w-full md:w-1/3 flex flex-col gap-1.5 px-0 md:px-2">
                  <div className="h-6 w-full flex items-center">
                    <WaveformVisualizer
                      peaks={track.waveform}
                      currentTime={isCurrent ? 14 : 0}
                      duration={track.duration}
                      isPlaying={isCurrentPlaying}
                      onSeek={() => {}}
                      height={24}
                      interactive={false}
                    />
                  </div>

                  {/* Metadata Chips */}
                  <div className="flex items-center gap-2 text-[11px] text-zinc-400 truncate">
                    <span className="font-medium text-amber-400/90">{track.genre}</span>
                    <span>·</span>
                    <span className="font-mono text-zinc-400">{track.bpm} BPM</span>
                    <span>·</span>
                    <span className="font-mono text-zinc-400">{track.musicalKey}</span>
                    <span>·</span>
                    <span>{formatDuration(track.duration)}</span>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center justify-end gap-1.5 w-full md:w-auto self-end md:self-center">
                  {/* Stem mixer button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenStems(track);
                    }}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-amber-400 hover:bg-zinc-800 transition-colors"
                    title="View Stems"
                  >
                    <Sliders className="w-4 h-4" />
                  </button>

                  {/* Lyrics button */}
                  {track.lyrics && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenLyrics(track);
                      }}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-amber-400 hover:bg-zinc-800 transition-colors"
                      title="View Lyrics"
                    >
                      <FileText className="w-4 h-4" />
                    </button>
                  )}

                  {/* Remix prompt button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemixTrack(track);
                    }}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-amber-400 hover:bg-zinc-800 transition-colors"
                    title="Remix prompt in Studio"
                  >
                    <Repeat className="w-4 h-4" />
                  </button>

                  {/* Favorite button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(track.id);
                    }}
                    className={`p-1.5 rounded-lg transition-colors ${
                      track.isFavorite ? 'text-amber-400' : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                    title="Favorite track"
                  >
                    <Star className={`w-4 h-4 ${track.isFavorite ? 'fill-current' : ''}`} />
                  </button>

                  {/* Download button */}
                  <button
                    onClick={(e) => handleDownload(track, e)}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                    title="Download WAV"
                  >
                    <Download className="w-4 h-4" />
                  </button>

                  {/* Delete button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteTrack(track.id);
                    }}
                    className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 transition-colors"
                    title="Delete track"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-10 text-zinc-500 text-xs space-y-1">
            <p>No tracks found matching your search.</p>
            <p className="text-zinc-600">Try generating a new song above!</p>
          </div>
        )}
      </div>
    </div>
  );
};
