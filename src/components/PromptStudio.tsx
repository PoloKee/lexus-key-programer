import React, { useState } from 'react';
import { 
  Sparkles, 
  Wand2, 
  Mic, 
  Music, 
  Sliders, 
  Disc, 
  FileText, 
  ChevronDown, 
  ChevronUp, 
  Play, 
  Volume2,
  RefreshCw,
  Compass
} from 'lucide-react';
import type { GenerationRequest } from '../types/music.js';

interface PromptStudioProps {
  onGenerate: (request: GenerationRequest) => void;
  isGenerating: boolean;
  onAnalyzePromptOnly?: (prompt: string) => void;
  remixData?: { prompt: string; genre?: string; lyrics?: string; bpm?: number; musicalKey?: string } | null;
}

const GENRE_TAGS = [
  'Synthwave',
  'Lo-Fi Chill',
  'Cyberpunk EDM',
  'Cinematic Epic',
  'Neo-Soul',
  'Afrobeats',
  'Hard Rock',
  'Ambient Drone',
  'Indie Pop',
  'Hyperpop'
];

const INSPIRATION_PROMPTS = [
  {
    title: 'Neon Horizon',
    genre: 'Synthwave',
    prompt: '80s synthwave with soaring analog pads, driving retro bassline, gated reverb snare, and nostalgic summer twilight feel'
  },
  {
    title: 'Midnight Coffee',
    genre: 'Lo-Fi Chill',
    prompt: 'Cozy lo-fi hip hop beat with warm Rhodes piano chords, gentle vinyl crackle, swung drums, and relaxing rainy atmosphere'
  },
  {
    title: 'Cybernetic Breach',
    genre: 'Cyberpunk EDM',
    prompt: 'Aggressive industrial darksynth with distorted 808 subs, metallic neurofunk percussion, and dystopian cyberpunk energy'
  },
  {
    title: 'Celestial Awakening',
    genre: 'Cinematic Epic',
    prompt: 'Sweeping orchestral fantasy theme with heroic French horns, soaring violins, epic cinematic taiko drums, and choral climax'
  },
  {
    title: 'Golden Sunset Afrobeats',
    genre: 'Afrobeats',
    prompt: 'Lively Lagos afrobeats rhythm with bouncy log drum bass, bright guitar plucks, upbeat percussion, and smooth vocal harmonies'
  }
];

const MUSICAL_KEYS = [
  'C Major', 'A Minor', 'G Major', 'E Minor', 
  'D Major', 'B Minor', 'F Major', 'D Minor', 
  'F# Minor', 'Bb Major', 'Eb Major', 'C# Minor'
];

const VOCAL_STYLES = [
  'Modern Studio Female',
  'Smooth Soulful Male',
  'Vocoder Cyber Robotic',
  'Ethereal Ambient Choral',
  'Intimate Whispered Acoustic',
  'Energetic Pop Belting'
];

export const PromptStudio: React.FC<PromptStudioProps> = ({ onGenerate, isGenerating, remixData }) => {
  const [prompt, setPrompt] = useState('');
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [isInstrumental, setIsInstrumental] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState('Synthwave');
  const [lyrics, setLyrics] = useState('');
  const [model, setModel] = useState<'lyria-3-clip-preview' | 'lyria-3-pro-preview'>('lyria-3-clip-preview');
  const [bpm, setBpm] = useState(124);
  const [musicalKey, setMusicalKey] = useState('A Minor');
  const [vocalStyle, setVocalStyle] = useState(VOCAL_STYLES[0]);
  
  const [isEnhancingPrompt, setIsEnhancingPrompt] = useState(false);
  const [isGeneratingLyrics, setIsGeneratingLyrics] = useState(false);

  // Sync remixData if user clicks remix on a library track
  React.useEffect(() => {
    if (remixData) {
      if (remixData.prompt) setPrompt(remixData.prompt);
      if (remixData.genre) setSelectedGenre(remixData.genre);
      if (remixData.lyrics) {
        setLyrics(remixData.lyrics);
        setIsInstrumental(false);
      }
      if (remixData.bpm) setBpm(remixData.bpm);
      if (remixData.musicalKey) setMusicalKey(remixData.musicalKey);
      setIsCustomMode(true);
    }
  }, [remixData]);

  // Handle generation submission
  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!prompt.trim() || isGenerating) return;

    onGenerate({
      prompt: prompt.trim(),
      lyrics: isInstrumental ? '' : lyrics.trim(),
      genre: selectedGenre,
      isInstrumental,
      model,
      tempo: bpm,
      musicalKey,
      vocalStyle: isInstrumental ? undefined : vocalStyle
    });
  };

  // Keyboard shortcut: Cmd/Ctrl + Enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      handleSubmit();
    }
  };

  // Enhance prompt with Gemini
  const handleEnhancePrompt = async () => {
    if (!prompt.trim()) return;
    setIsEnhancingPrompt(true);
    try {
      const res = await fetch('/api/analyze-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, genre: selectedGenre, isInstrumental })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.enrichedLyriaPrompt) {
          setPrompt(data.enrichedLyriaPrompt);
        }
        if (data.tempo) setBpm(data.tempo);
        if (data.musicalKey) setMusicalKey(data.musicalKey);
      }
    } catch (err) {
      console.error('Enhance prompt failed:', err);
    } finally {
      setIsEnhancingPrompt(false);
    }
  };

  // Generate lyrics with Gemini
  const handleGenerateLyrics = async () => {
    setIsGeneratingLyrics(true);
    try {
      const res = await fetch('/api/generate-lyrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt || 'An epic journey across neon skies',
          genre: selectedGenre
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.lyrics) {
          setLyrics(data.lyrics);
          setIsInstrumental(false);
        }
      }
    } catch (err) {
      console.error('Generate lyrics failed:', err);
    } finally {
      setIsGeneratingLyrics(false);
    }
  };

  // Insert lyric section tag
  const insertLyricTag = (tag: string) => {
    setLyrics(prev => {
      const trimmed = prev.trim();
      return trimmed ? `${trimmed}\n\n[${tag}]\n` : `[${tag}]\n`;
    });
  };

  return (
    <div className="w-full bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 sm:p-6 shadow-xl backdrop-blur-sm">
      {/* Mode Bar */}
      <div className="flex items-center justify-between gap-2 pb-4 mb-4 border-b border-zinc-800/80">
        <div className="flex items-center gap-1.5 p-1 bg-zinc-950 rounded-xl border border-zinc-800">
          <button
            type="button"
            onClick={() => setIsCustomMode(false)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              !isCustomMode
                ? 'bg-zinc-800 text-amber-400 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Prompt Mode
          </button>
          <button
            type="button"
            onClick={() => setIsCustomMode(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              isCustomMode
                ? 'bg-zinc-800 text-amber-400 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Custom Studio</span>
          </button>
        </div>

        {/* Instrumental Switcher */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-zinc-400 flex items-center gap-2 cursor-pointer select-none">
            <span className={isInstrumental ? 'text-zinc-200 font-medium' : 'text-zinc-500'}>
              Instrumental
            </span>
            <div 
              onClick={() => setIsInstrumental(!isInstrumental)}
              className={`w-9 h-5 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                isInstrumental ? 'bg-amber-500 justify-end' : 'bg-zinc-700 justify-start'
              }`}
            >
              <div className="bg-zinc-950 w-3.5 h-3.5 rounded-full shadow-md" />
            </div>
          </label>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Main Prompt Input */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
              <Music className="w-3.5 h-3.5 text-amber-400" />
              <span>Describe the music you want to generate</span>
            </label>
            <button
              type="button"
              onClick={handleEnhancePrompt}
              disabled={isEnhancingPrompt || !prompt.trim()}
              className="flex items-center gap-1 text-[11px] font-medium text-amber-400 hover:text-amber-300 disabled:opacity-40 transition-colors"
            >
              <Wand2 className={`w-3 h-3 ${isEnhancingPrompt ? 'animate-spin' : ''}`} />
              <span>{isEnhancingPrompt ? 'Refining...' : 'Enhance with Gemini'}</span>
            </button>
          </div>

          <div className="relative">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g. Dreamy 80s synthwave with analog chorus pads, driving bassline, nostalgic sunset atmosphere, 124 BPM..."
              rows={3}
              className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/50 rounded-xl p-3 text-sm text-zinc-100 placeholder:text-zinc-500 resize-none outline-none transition-all"
            />
            <div className="absolute right-3 bottom-3 flex items-center gap-2">
              <span className="text-[10px] text-zinc-500">
                {prompt.length} chars
              </span>
            </div>
          </div>
        </div>

        {/* Quick Inspiration Chips */}
        <div>
          <div className="flex items-center gap-1.5 text-xs text-zinc-400 mb-2">
            <Compass className="w-3.5 h-3.5 text-zinc-500" />
            <span>Style Inspirations:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {INSPIRATION_PROMPTS.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setPrompt(item.prompt);
                  setSelectedGenre(item.genre);
                }}
                className="px-2.5 py-1 rounded-lg text-xs bg-zinc-950/80 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800/80 transition-all text-left"
              >
                <span className="text-amber-400/90 font-medium">{item.title}</span>
                <span className="text-zinc-500 text-[10px] ml-1.5">({item.genre})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Genre Selector Pills */}
        <div>
          <label className="block text-xs font-semibold text-zinc-300 mb-2">
            Genre & Sonic Texture
          </label>
          <div className="flex flex-wrap gap-1.5">
            {GENRE_TAGS.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setSelectedGenre(g)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  selectedGenre === g
                    ? 'bg-amber-500 text-zinc-950 font-semibold shadow-md shadow-amber-500/20'
                    : 'bg-zinc-950 text-zinc-300 hover:bg-zinc-800 border border-zinc-800'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Studio Expanded Controls */}
        {isCustomMode && (
          <div className="space-y-4 pt-3 border-t border-zinc-800/80 animate-in fade-in duration-200">
            {/* Lyrics Section */}
            {!isInstrumental && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-amber-400" />
                    <span>Song Lyrics (Optional)</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateLyrics}
                    disabled={isGeneratingLyrics}
                    className="flex items-center gap-1 text-[11px] font-medium text-amber-400 hover:text-amber-300 disabled:opacity-40 transition-colors"
                  >
                    <Sparkles className={`w-3 h-3 ${isGeneratingLyrics ? 'animate-spin' : ''}`} />
                    <span>{isGeneratingLyrics ? 'Writing...' : 'Generate AI Lyrics'}</span>
                  </button>
                </div>

                {/* Section insertion buttons */}
                <div className="flex flex-wrap gap-1">
                  {['Intro', 'Verse 1', 'Chorus', 'Verse 2', 'Bridge', 'Drop', 'Outro'].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => insertLyricTag(tag)}
                      className="px-2 py-0.5 rounded text-[11px] bg-zinc-950 text-zinc-400 hover:text-zinc-200 border border-zinc-800 hover:border-zinc-700 transition-colors"
                    >
                      +{tag}
                    </button>
                  ))}
                </div>

                <textarea
                  value={lyrics}
                  onChange={(e) => setLyrics(e.target.value)}
                  placeholder="[Verse 1]&#10;Streets of neon glowing bright&#10;Chasing shadows through the night...&#10;&#10;[Chorus]&#10;Take me to the electric sky..."
                  rows={4}
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/50 rounded-xl p-3 text-xs font-mono text-zinc-200 placeholder:text-zinc-600 resize-none outline-none transition-all"
                />
              </div>
            )}

            {/* Studio Sliders & Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {/* Lyria Model Selector */}
              <div className="bg-zinc-950/80 p-3 rounded-xl border border-zinc-800">
                <label className="text-[11px] font-semibold text-zinc-400 block mb-1.5">
                  Lyria 3.5 Engine
                </label>
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value as any)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-1.5 px-2.5 text-xs text-zinc-200 outline-none focus:border-amber-500"
                >
                  <option value="lyria-3-clip-preview">Lyria 3.5 Clip (30s Preview)</option>
                  <option value="lyria-3-pro-preview">Lyria 3.5 Pro (Full Track)</option>
                </select>
                <span className="text-[10px] text-zinc-500 mt-1 block">
                  {model === 'lyria-3-clip-preview' ? 'Fast render for rapid ideas' : 'Complete song arrangement'}
                </span>
              </div>

              {/* Tempo / BPM */}
              <div className="bg-zinc-950/80 p-3 rounded-xl border border-zinc-800">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-zinc-400">
                    Tempo: <span className="text-amber-400 font-mono font-bold">{bpm} BPM</span>
                  </label>
                </div>
                <input
                  type="range"
                  min={70}
                  max={175}
                  value={bpm}
                  onChange={(e) => setBpm(Number(e.target.value))}
                  className="w-full accent-amber-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-zinc-500 mt-1">
                  <span>70 (Slow)</span>
                  <span>124 (Dance)</span>
                  <span>175 (Fast)</span>
                </div>
              </div>

              {/* Musical Key */}
              <div className="bg-zinc-950/80 p-3 rounded-xl border border-zinc-800">
                <label className="text-[11px] font-semibold text-zinc-400 block mb-1.5">
                  Harmonic Key & Scale
                </label>
                <select
                  value={musicalKey}
                  onChange={(e) => setMusicalKey(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-1.5 px-2.5 text-xs text-zinc-200 outline-none focus:border-amber-500"
                >
                  {MUSICAL_KEYS.map((k) => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </select>
                <span className="text-[10px] text-zinc-500 mt-1 block">
                  Defines chord progressions
                </span>
              </div>
            </div>

            {/* Vocal Timbre (If vocal track) */}
            {!isInstrumental && (
              <div className="bg-zinc-950/80 p-3 rounded-xl border border-zinc-800">
                <label className="text-[11px] font-semibold text-zinc-400 block mb-1.5">
                  Vocal Synthesis Persona & Timbre
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {VOCAL_STYLES.map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setVocalStyle(v)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs text-left transition-all ${
                        vocalStyle === v
                          ? 'bg-amber-500/10 border-amber-500/80 text-amber-300 border'
                          : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Submit Button */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-zinc-500 flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Multi-Stage Pipeline: Gemini 3 Analysis → Lyria 3.5 Synthesis → Stem Master</span>
          </div>

          <button
            type="submit"
            disabled={isGenerating || !prompt.trim()}
            className="w-full sm:w-auto min-w-[200px] flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-semibold text-sm bg-gradient-to-r from-amber-500 via-amber-400 to-orange-500 text-zinc-950 shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 hover:brightness-105 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none transition-all cursor-pointer"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-zinc-950" />
                <span>Forging Audio Track...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-zinc-950" />
                <span>Generate Music</span>
                <span className="text-[10px] text-zinc-800 bg-amber-300/60 px-1.5 py-0.5 rounded font-mono ml-1">
                  ⌘↵
                </span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
