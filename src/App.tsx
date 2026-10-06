import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header.js';
import { PromptStudio } from './components/PromptStudio.js';
import { TrackLibrary } from './components/TrackLibrary.js';
import { AudioPlayer } from './components/AudioPlayer.js';
import { StemMixer } from './components/StemMixer.js';
import { LyricsViewer } from './components/LyricsViewer.js';
import { TrackInspectorModal } from './components/TrackInspectorModal.js';
import { GenerationProgressModal } from './components/GenerationProgressModal.js';
import { DeployGuideModal } from './components/DeployGuideModal.js';
import type { Track, GenerationRequest, PipelineProgress } from './types/music.js';

export default function App() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<PipelineProgress | null>(null);

  // Modals
  const [isDeployGuideOpen, setIsDeployGuideOpen] = useState(false);
  const [stemsTrack, setStemsTrack] = useState<Track | null>(null);
  const [lyricsTrack, setLyricsTrack] = useState<Track | null>(null);
  const [inspectorTrack, setInspectorTrack] = useState<Track | null>(null);
  const [remixData, setRemixData] = useState<{ prompt: string; genre?: string; lyrics?: string; bpm?: number; musicalKey?: string } | null>(null);

  // Load tracks on mount
  useEffect(() => {
    const saved = localStorage.getItem('polo_forge_tracks');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setTracks(parsed);
          setCurrentTrack(parsed[0]);
          return;
        }
      } catch (e) {
        console.warn('Failed to parse saved tracks:', e);
      }
    }

    // Fetch seeded showcase tracks from server
    fetch('/api/sample-tracks')
      .then(res => res.json())
      .then((data: Track[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setTracks(data);
          setCurrentTrack(data[0]);
          localStorage.setItem('polo_forge_tracks', JSON.stringify(data));
        }
      })
      .catch(err => console.warn('Could not load sample tracks:', err));
  }, []);

  // Save tracks to localStorage whenever updated
  useEffect(() => {
    if (tracks.length > 0) {
      try {
        localStorage.setItem('polo_forge_tracks', JSON.stringify(tracks));
      } catch (e) {
        // Payload might be too large for full storage in some browsers; ignore quota
      }
    }
  }, [tracks]);

  // Global spacebar shortcut for play/pause
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput = activeEl instanceof HTMLInputElement || 
                      activeEl instanceof HTMLTextAreaElement || 
                      activeEl instanceof HTMLSelectElement ||
                      activeEl?.getAttribute('contenteditable') === 'true';

      if (e.code === 'Space' && !isInput && currentTrack) {
        e.preventDefault();
        setIsPlaying(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentTrack]);

  // Handle music generation via streaming pipeline
  const handleGenerate = async (request: GenerationRequest) => {
    setIsGenerating(true);
    setProgress({
      stage: 'analyzing_prompt',
      stageIndex: 1,
      totalStages: 4,
      progressPercent: 15,
      message: 'Deconstructing prompt with Gemini 3.8 Flash...'
    });

    try {
      const response = await fetch('/api/generate-music-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      });

      if (!response.ok || !response.body) {
        throw new Error('Streaming failed, fallback to standard endpoint');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const block of lines) {
          if (!block.trim()) continue;
          const matchEvent = block.match(/event:\s*(.+)/);
          const matchData = block.match(/data:\s*(.+)/);

          const eventType = matchEvent ? matchEvent[1].trim() : 'message';
          const dataJson = matchData ? JSON.parse(matchData[1]) : null;

          if (eventType === 'stage') {
            setProgress(dataJson);
          } else if (eventType === 'complete') {
            const newTrack: Track = dataJson;
            setTracks(prev => [newTrack, ...prev]);
            setCurrentTrack(newTrack);
            setIsPlaying(true);
            setProgress(null);
            setIsGenerating(false);
            return;
          } else if (eventType === 'error') {
            throw new Error(dataJson.message || 'Generation error');
          }
        }
      }
    } catch (err) {
      console.warn('Streaming error, falling back to standard generate API:', err);
      // Fallback to standard POST
      try {
        const fallbackRes = await fetch('/api/generate-music', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request)
        });
        if (fallbackRes.ok) {
          const newTrack: Track = await fallbackRes.json();
          setTracks(prev => [newTrack, ...prev]);
          setCurrentTrack(newTrack);
          setIsPlaying(true);
        } else {
          alert('Generation failed. Please ensure GEMINI_API_KEY is configured.');
        }
      } catch (fallbackErr) {
        console.error('All generation attempts failed:', fallbackErr);
      }
    } finally {
      setIsGenerating(false);
      setProgress(null);
    }
  };

  const handleTogglePlay = () => {
    setIsPlaying(prev => !prev);
  };

  const handlePlayTrack = (track: Track) => {
    if (currentTrack?.id === track.id) {
      setIsPlaying(true);
    } else {
      setCurrentTrack(track);
      setIsPlaying(true);
    }
  };

  const handleDeleteTrack = (trackId: string) => {
    setTracks(prev => {
      const updated = prev.filter(t => t.id !== trackId);
      if (currentTrack?.id === trackId) {
        setCurrentTrack(updated[0] || null);
        setIsPlaying(false);
      }
      return updated;
    });
  };

  const handleToggleFavorite = (trackId: string) => {
    setTracks(prev => prev.map(t => {
      if (t.id === trackId) {
        const isFav = !t.isFavorite;
        if (currentTrack?.id === trackId) {
          setCurrentTrack({ ...currentTrack, isFavorite: isFav });
        }
        return { ...t, isFavorite: isFav };
      }
      return t;
    }));
  };

  const handleRemixTrack = (track: Track) => {
    setRemixData({
      prompt: track.prompt,
      genre: track.genre,
      lyrics: track.lyrics,
      bpm: track.bpm,
      musicalKey: track.musicalKey
    });
    // Scroll smoothly to top prompt studio
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* Navigation Header */}
      <Header
        onOpenDeployGuide={() => setIsDeployGuideOpen(true)}
        trackCount={tracks.length}
        activeModel="Lyria 3.5 & Gemini 3.8"
      />

      {/* Main Studio Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 pb-36 space-y-6">
        {/* Creation Station */}
        <section aria-label="Music Generator">
          <PromptStudio
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
            remixData={remixData}
          />
        </section>

        {/* History and Track Library */}
        <section aria-label="Track Library">
          <TrackLibrary
            tracks={tracks}
            currentTrackId={currentTrack?.id || null}
            isPlaying={isPlaying}
            onPlayTrack={handlePlayTrack}
            onTogglePlay={handleTogglePlay}
            onDeleteTrack={handleDeleteTrack}
            onToggleFavorite={handleToggleFavorite}
            onRemixTrack={handleRemixTrack}
            onOpenStems={(t) => setStemsTrack(t)}
            onOpenLyrics={(t) => setLyricsTrack(t)}
          />
        </section>
      </main>

      {/* Persistent Docked Audio Player */}
      <AudioPlayer
        track={currentTrack}
        isPlaying={isPlaying}
        onTogglePlay={handleTogglePlay}
        onOpenStems={() => currentTrack && setStemsTrack(currentTrack)}
        onOpenLyrics={() => currentTrack && setLyricsTrack(currentTrack)}
        onOpenInspector={() => currentTrack && setInspectorTrack(currentTrack)}
      />

      {/* Generation Multi-Stage Progress Modal */}
      <GenerationProgressModal
        isOpen={isGenerating}
        progress={progress}
      />

      {/* Stem Isolation Mixer Modal */}
      {stemsTrack && (
        <StemMixer
          track={stemsTrack}
          isOpen={Boolean(stemsTrack)}
          onClose={() => setStemsTrack(null)}
          onSelectStemAudio={(url) => {
            if (currentTrack) {
              setCurrentTrack({ ...currentTrack, audioUrl: url });
              setIsPlaying(true);
            }
          }}
        />
      )}

      {/* Synchronized Lyrics Viewer Modal */}
      {lyricsTrack && (
        <LyricsViewer
          track={lyricsTrack}
          isOpen={Boolean(lyricsTrack)}
          onClose={() => setLyricsTrack(null)}
        />
      )}

      {/* Sonic Blueprint / Inspector Modal */}
      {inspectorTrack && (
        <TrackInspectorModal
          track={inspectorTrack}
          isOpen={Boolean(inspectorTrack)}
          onClose={() => setInspectorTrack(null)}
        />
      )}

      {/* Deployment & GitHub Guide Modal */}
      <DeployGuideModal
        isOpen={isDeployGuideOpen}
        onClose={() => setIsDeployGuideOpen(false)}
      />
    </div>
  );
}
