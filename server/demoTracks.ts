import { synthesizePoloTrack, extractWaveformPeaks } from './audioEngine.js';
import type { Track } from '../src/types/music.js';

let cachedDemos: Track[] | null = null;

export function getDemoTracks(): Track[] {
  if (cachedDemos) return cachedDemos;

  const demo1Audio = synthesizePoloTrack({
    durationSec: 20,
    bpm: 124,
    genre: 'Synthwave',
    musicalKey: 'A Minor',
    sampleRate: 24000
  });
  const peaks1 = extractWaveformPeaks(demo1Audio.mixWav, 90);
  const audio1Url = `data:audio/wav;base64,${demo1Audio.mixWav.toString('base64')}`;

  const demo2Audio = synthesizePoloTrack({
    durationSec: 18,
    bpm: 82,
    genre: 'Lo-Fi Chillhop',
    musicalKey: 'C Major',
    sampleRate: 24000
  });
  const peaks2 = extractWaveformPeaks(demo2Audio.mixWav, 90);
  const audio2Url = `data:audio/wav;base64,${demo2Audio.mixWav.toString('base64')}`;

  const demo3Audio = synthesizePoloTrack({
    durationSec: 20,
    bpm: 132,
    genre: 'Cyberpunk EDM',
    musicalKey: 'F# Minor',
    sampleRate: 24000
  });
  const peaks3 = extractWaveformPeaks(demo3Audio.mixWav, 90);
  const audio3Url = `data:audio/wav;base64,${demo3Audio.mixWav.toString('base64')}`;

  cachedDemos = [
    {
      id: 'demo-1-neon-horizon',
      title: 'Neon Horizon',
      prompt: '80s synthwave with soaring analog pads, driving retro bassline, gated reverb snare, and nostalgic summer twilight feel',
      enrichedPrompt: 'Cinematic 80s synthwave, Roland Juno-106 chorus pads, Moog Taurus sub-bass, LinnDrum gated snare, tape saturation, wide stereo panorama.',
      genre: 'Synthwave',
      tags: ['Synthwave', 'Retro Electro', 'Nostalgic', 'Sunset Drive'],
      bpm: 124,
      musicalKey: 'A Minor',
      duration: 28,
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      isInstrumental: false,
      modelUsed: 'lyria-3-clip-preview',
      lyrics: `[Verse 1]\nStreets of chrome beneath the rain\nHeadlights wash away the pain\nCounting down the miles ahead\nLiving words we never said\n\n[Chorus]\nTake me to the neon sky\nWatch the digital stars go by\nNever stop and never fade\nIn the promises we made`,
      parsedLyrics: [
        { section: 'Intro', text: 'Ambient synth chime fade-in', timeSec: 0 },
        { section: 'Verse 1', text: 'Streets of chrome beneath the rain', timeSec: 5.5 },
        { section: 'Verse 1', text: 'Headlights wash away the pain', timeSec: 9.2 },
        { section: 'Verse 1', text: 'Counting down the miles ahead', timeSec: 13.0 },
        { section: 'Verse 1', text: 'Living words we never said', timeSec: 16.5 },
        { section: 'Chorus', text: 'Take me to the neon sky', timeSec: 19.8 },
        { section: 'Chorus', text: 'Watch the digital stars go by', timeSec: 23.2 },
        { section: 'Chorus', text: 'In the promises we made', timeSec: 26.0 }
      ],
      audioUrl: audio1Url,
      stems: {
        mix: audio1Url,
        drums: `data:audio/wav;base64,${demo1Audio.drumWav.toString('base64')}`,
        bass: `data:audio/wav;base64,${demo1Audio.bassWav.toString('base64')}`,
        instrumental: `data:audio/wav;base64,${demo1Audio.instWav.toString('base64')}`
      },
      waveform: peaks1,
      vocalStyle: 'Airy Female Synthpop',
      isFavorite: true,
      analysis: {
        title: 'Neon Horizon',
        concept: 'High-energy retro drive into a neon twilight city.',
        primaryGenre: 'Synthwave',
        secondaryGenres: ['Retro Electro', 'Outrun'],
        mood: 'Nostalgic & Euphoric',
        tempo: 124,
        musicalKey: 'A Minor',
        instrumentation: ['Roland Juno-106', 'Moog Sub Bass', 'LinnDrum Gated Kit', 'Arp Odyssey'],
        structure: [
          { section: 'Intro', startSec: 0, endSec: 6, description: 'Filtered synth pulse' },
          { section: 'Verse', startSec: 6, endSec: 18, description: 'Bassline groove and vocals' },
          { section: 'Chorus', startSec: 18, endSec: 28, description: 'Soaring octave melody' }
        ],
        enrichedLyriaPrompt: '80s synthwave with soaring analog pads, driving retro bassline, gated reverb snare.',
        productionNotes: 'Mastered to -14 LUFS, analog tape saturation on master bus.'
      }
    },
    {
      id: 'demo-2-midnight-espresso',
      title: 'Midnight Espresso',
      prompt: 'Cozy lo-fi hip hop beat with warm Rhodes piano chords, vinyl crackle, gentle jazz swing, and relaxing study rain atmosphere',
      enrichedPrompt: 'Lo-fi chillhop, Fender Rhodes Mark I through vintage tape, SP-404 vinyl simulator, muted kick, mellow walking bass, rain ambient layer.',
      genre: 'Lo-Fi Chillhop',
      tags: ['Lo-Fi', 'Jazz Hop', 'Chill', 'Study Beat'],
      bpm: 82,
      musicalKey: 'C Major',
      duration: 26,
      createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
      isInstrumental: true,
      modelUsed: 'lyria-3-clip-preview',
      lyrics: '',
      parsedLyrics: [],
      audioUrl: audio2Url,
      stems: {
        mix: audio2Url,
        drums: `data:audio/wav;base64,${demo2Audio.drumWav.toString('base64')}`,
        bass: `data:audio/wav;base64,${demo2Audio.bassWav.toString('base64')}`,
        instrumental: `data:audio/wav;base64,${demo2Audio.instWav.toString('base64')}`
      },
      waveform: peaks2,
      isFavorite: true,
      analysis: {
        title: 'Midnight Espresso',
        concept: 'Warm vintage Rhodes chords over relaxed swung hip-hop drums.',
        primaryGenre: 'Lo-Fi Chillhop',
        secondaryGenres: ['Jazz Hop', 'Ambient'],
        mood: 'Relaxed & Contemplative',
        tempo: 82,
        musicalKey: 'C Major',
        instrumentation: ['Fender Rhodes', 'Upright Bass', 'SP-404 Swung Drums', 'Vinyl Crackle'],
        structure: [
          { section: 'Intro', startSec: 0, endSec: 4, description: 'Warm vinyl crackle & Rhodes chords' },
          { section: 'Groove', startSec: 4, endSec: 20, description: 'Full swung beat with muted bass' },
          { section: 'Outro', startSec: 20, endSec: 26, description: 'Gentle chord decay' }
        ],
        enrichedLyriaPrompt: 'Cozy lo-fi hip hop beat with warm Rhodes piano chords, vinyl crackle, gentle jazz swing.',
        productionNotes: 'Warm vintage tape saturation, high-cut filter on drums, cozy stereo spread.'
      }
    },
    {
      id: 'demo-3-cyber-protocol',
      title: 'Cybernetic Protocol',
      prompt: 'Dark cinematic cyberpunk club track with industrial distortion, heavy rolling 808 bass, and futuristic tech synths',
      enrichedPrompt: 'Heavy industrial darksynth, distorted 808 subs, aggressive neurofunk modulation, metallic foley percussion, 132 BPM.',
      genre: 'Cyberpunk EDM',
      tags: ['Cyberpunk', 'Darksynth', 'Industrial', 'Club'],
      bpm: 132,
      musicalKey: 'F# Minor',
      duration: 30,
      createdAt: new Date(Date.now() - 3600000 * 9).toISOString(),
      isInstrumental: true,
      modelUsed: 'lyria-3-clip-preview',
      lyrics: '',
      parsedLyrics: [],
      audioUrl: audio3Url,
      stems: {
        mix: audio3Url,
        drums: `data:audio/wav;base64,${demo3Audio.drumWav.toString('base64')}`,
        bass: `data:audio/wav;base64,${demo3Audio.bassWav.toString('base64')}`,
        instrumental: `data:audio/wav;base64,${demo3Audio.instWav.toString('base64')}`
      },
      waveform: peaks3,
      isFavorite: false,
      analysis: {
        title: 'Cybernetic Protocol',
        concept: 'High-octane industrial darksynth with dystopian energy.',
        primaryGenre: 'Cyberpunk EDM',
        secondaryGenres: ['Darksynth', 'Midtempo'],
        mood: 'Aggressive & Dark',
        tempo: 132,
        musicalKey: 'F# Minor',
        instrumentation: ['Wavetable Neuro Bass', 'Distorted 909 Kick', 'Glitch Percussion', 'FM Synth Stabs'],
        structure: [
          { section: 'Build', startSec: 0, endSec: 8, description: 'Rising sirens and fast hats' },
          { section: 'Drop', startSec: 8, endSec: 22, description: 'Heavy distorted bass assault' },
          { section: 'Break', startSec: 22, endSec: 30, description: 'Glitch percussion decay' }
        ],
        enrichedLyriaPrompt: 'Dark cinematic cyberpunk club track with industrial distortion, heavy rolling bass.',
        productionNotes: 'Aggressive transient shaping, multi-band compression, hard clipped transients.'
      }
    }
  ];

  return cachedDemos;
}
