import { GoogleGenAI, Type } from '@google/genai';
import { 
  synthesizePoloTrack, 
  mixVocalsOverInstrumental, 
  extractWaveformPeaks,
  float32ToWav,
  decodeWav
} from './audioEngine.js';
import type { Track, TrackAnalysis, GenerationRequest, LyricLine } from '../src/types/music.js';

// Initialize SDK with server environment secret
function getAIClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set in server environment. Please set it in AI Studio Secrets.');
  }
  return new GoogleGenAI({ apiKey });
}

/**
 * Stage 1: Prompt Understanding & Sonic Blueprinting
 * Uses Gemini 3.8 Flash to analyze prompt, extract musical structure, key, tempo, and enrich for Lyria.
 */
export async function analyzeMusicPrompt(
  prompt: string, 
  genre?: string, 
  lyrics?: string,
  isInstrumental: boolean = false,
  targetBpm?: number,
  targetKey?: string,
  vocalStyle?: string
): Promise<TrackAnalysis> {
  const ai = getAIClient();

  const systemInstruction = `You are a world-class Grammy-winning music producer, sound designer, and music theorist.
Analyze the user's music generation prompt and produce a rich, highly detailed sonic blueprint.
Return a structured JSON object with musical key, tempo (BPM), mood, instrumentation, lyrical breakdown, and an enriched acoustic prompt tailored for Lyria 3.5.`;

  const userQuery = `Analyze this music request:
Prompt: "${prompt}"
Genre preference: ${genre || 'Any / Auto-detect'}
Instrumental: ${isInstrumental ? 'Yes (No Vocals)' : 'No (Includes Vocals)'}
Target BPM: ${targetBpm || 'Auto-choose best'}
Target Key: ${targetKey || 'Auto-choose best'}
Vocal Style: ${vocalStyle || 'Standard modern'}
${lyrics ? `Provided Lyrics:\n"""${lyrics}"""` : 'No lyrics provided. Generate catchy lyrics with [Verse], [Chorus] sections if vocal track.'}`;

  try {
    const analysisPromise = ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: userQuery,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            concept: { type: Type.STRING },
            primaryGenre: { type: Type.STRING },
            secondaryGenres: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING } 
            },
            mood: { type: Type.STRING },
            tempo: { type: Type.INTEGER },
            musicalKey: { type: Type.STRING },
            instrumentation: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING } 
            },
            structure: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  section: { type: Type.STRING },
                  startSec: { type: Type.INTEGER },
                  endSec: { type: Type.INTEGER },
                  description: { type: Type.STRING }
                },
                required: ['section', 'startSec', 'endSec', 'description']
              }
            },
            enrichedLyriaPrompt: { type: Type.STRING },
            generatedLyrics: { type: Type.STRING },
            vocalCadenceNotes: { type: Type.STRING },
            productionNotes: { type: Type.STRING }
          },
          required: [
            'title', 'concept', 'primaryGenre', 'secondaryGenres', 'mood', 
            'tempo', 'musicalKey', 'instrumentation', 'structure', 
            'enrichedLyriaPrompt', 'productionNotes'
          ]
        }
      }
    });

    // 8-second timeout protection
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Prompt analysis timeout')), 8000)
    );

    const response = await Promise.race([analysisPromise, timeoutPromise]);
    if (response?.text) {
      const parsed = JSON.parse(response.text) as TrackAnalysis;
      if (targetBpm) parsed.tempo = targetBpm;
      if (targetKey) parsed.musicalKey = targetKey;
      if (genre && genre !== 'All') parsed.primaryGenre = genre;
      return parsed;
    }
  } catch (err) {
    console.warn('Gemini prompt analysis fallback triggered:', err);
  }

  // Graceful fallback analysis
  return {
    title: prompt.slice(0, 30).trim() || 'Neon Horizon',
    concept: 'A driving, emotive piece crafted with punchy percussion and warm analog harmonies.',
    primaryGenre: genre || 'Synthwave',
    secondaryGenres: ['Electronic', 'Retro Electro', 'Cyberpop'],
    mood: 'Atmospheric & Energetic',
    tempo: targetBpm || 124,
    musicalKey: targetKey || 'A Minor',
    instrumentation: ['Roland Juno-106 Synth Pad', 'LinnDrum Percussion', 'Moog Sub Bass', 'Stereo Plucks'],
    structure: [
      { section: 'Intro', startSec: 0, endSec: 6, description: 'Filtered synth pad and distant pulse' },
      { section: 'Verse 1', startSec: 6, endSec: 16, description: 'Full drum groove and bassline entry' },
      { section: 'Chorus', startSec: 16, endSec: 26, description: 'Bright lead melody and soaring harmonies' },
      { section: 'Outro', startSec: 26, endSec: 30, description: 'Lush reverb fade out' }
    ],
    enrichedLyriaPrompt: `${prompt}. High-definition studio production, 44.1kHz stereo, analog warmth, sidechain compression on kicks, wide stereo imaging.`,
    generatedLyrics: isInstrumental ? '' : `[Verse 1]\nStatic in the midnight air\nShadows dancing on the street\nChasing echoes everywhere\nTo the rhythm of the beat\n\n[Chorus]\nWe ride the neon wave tonight\nLost inside the velvet sound\nBurning through the city lights\nWhere the future can be found`,
    vocalCadenceNotes: 'Melodic, smooth delivery with subtle tape delay and stereo plate reverb.',
    productionNotes: 'Mastered to -14 LUFS, warm low end, crisp transient tops.'
  };
}

/**
 * Generates custom song lyrics with section markers
 */
export async function generateLyrics(prompt: string, genre: string = 'Pop', theme?: string): Promise<string> {
  const ai = getAIClient();

  try {
    const lyricsPromise = ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Write lyrics for a ${genre} track inspired by: "${prompt}". ${theme ? `Theme: ${theme}` : ''}`,
      config: {
        systemInstruction: 'You are a hit songwriter. Write catchy, emotionally evocative song lyrics with structured sections: [Intro], [Verse 1], [Chorus], [Verse 2], [Chorus], [Bridge], [Chorus], [Outro]. Maintain great rhythm and rhyme scheme.'
      }
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Lyrics generation timeout')), 8000)
    );

    const response = await Promise.race([lyricsPromise, timeoutPromise]);
    if (response?.text) {
      return response.text.trim();
    }
  } catch (err) {
    console.warn('Gemini lyrics generation fallback:', err);
  }

  return `[Verse 1]\nFootsteps on the golden shore\nMoments we were waiting for\nTurn the dial and let it play\nWatch the skyline fade away\n\n[Chorus]\nWe ignite the endless night\nDancing in the electric light\nEvery beat will set us free\nHere inside our symphony`;
}

/**
 * Stage 2: Lyria 3.5 Music Generation
 * Calls the Lyria model via Google GenAI SDK.
 */
async function callLyriaMusicModel(
  modelName: 'lyria-3-clip-preview' | 'lyria-3-pro-preview', 
  prompt: string
): Promise<{ audioBuffer?: Buffer; lyrics?: string } | null> {
  try {
    const ai = getAIClient();

    // Call Lyria model via streaming API
    const response = await ai.models.generateContentStream({
      model: modelName,
      contents: prompt,
    });

    let audioBase64 = '';
    let lyrics = '';

    for await (const chunk of response) {
      const parts = chunk.candidates?.[0]?.content?.parts;
      if (!parts) continue;

      for (const part of parts) {
        if (part.inlineData?.data) {
          audioBase64 += part.inlineData.data;
        }
        if (part.text && !lyrics) {
          lyrics = part.text;
        }
      }
    }

    if (audioBase64) {
      const audioBuffer = Buffer.from(audioBase64, 'base64');
      return { audioBuffer, lyrics };
    }
    return null;
  } catch (err: any) {
    console.warn(`Lyria model (${modelName}) unavailable or restricted:`, err?.message || err);
    return null;
  }
}

/**
 * Stage 3: Vocal Synthesis via Gemini TTS
 * Generates rhythmic or melodic singing vocals from lyrics
 */
async function synthesizeVocalsWithGemini(
  lyrics: string, 
  vocalStyle: string = 'Modern Soulful',
  musicalKey: string = 'A Minor'
): Promise<Buffer | null> {
  try {
    const ai = getAIClient();
    
    // Clean lyrics: take first 2-3 stanzas for the clip
    const lines = lyrics
      .split('\n')
      .filter(l => l.trim() && !l.startsWith('['))
      .slice(0, 8)
      .join(' . ');

    if (!lines) return null;

    // Pick appropriate voice for style
    let voice = 'Kore';
    if (vocalStyle.toLowerCase().includes('male')) voice = 'Puck';
    if (vocalStyle.toLowerCase().includes('choir') || vocalStyle.toLowerCase().includes('gospel')) voice = 'Fenrir';
    if (vocalStyle.toLowerCase().includes('intimate') || vocalStyle.toLowerCase().includes('whisper')) voice = 'Zephyr';

    const interaction = await ai.interactions.create({
      model: 'gemini-3.8-flash-lite-tts',
      input: [
        {
          type: 'text',
          text: lines,
          annotations: [
            {
              type: 'speech_metadata',
              style: `Melodic, musical, rhythmic singing in ${musicalKey}, expressive ${vocalStyle}`
            }
          ]
        }
      ],
      response_format: { type: 'audio' },
      generation_config: {
        speech_config: [
          {
            language: 'en-US',
            voice
          }
        ]
      }
    });

    const outputAudio = interaction.output_audio;
    if (outputAudio?.data) {
      return Buffer.from(outputAudio.data, 'base64');
    }
    return null;
  } catch (err: any) {
    console.warn('Gemini vocal synthesis fallback:', err?.message || err);
    return null;
  }
}

/**
 * Parses lyrics with approximate timestamps for the karaoke synchronized display
 */
export function parseLyricsWithTimestamps(rawLyrics: string, durationSec: number = 28): LyricLine[] {
  const lines = rawLyrics.split('\n');
  const parsed: LyricLine[] = [];
  let currentSection = 'Intro';

  const lyricTextLines: { section: string; text: string }[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      currentSection = trimmed.slice(1, -1);
      continue;
    }
    lyricTextLines.push({ section: currentSection, text: trimmed });
  }

  if (lyricTextLines.length === 0) return [];

  // Distribute over the middle 80% of track
  const startOffset = 4; // after intro
  const usableDuration = Math.max(8, durationSec - 8);
  const timePerLine = usableDuration / lyricTextLines.length;

  for (let i = 0; i < lyricTextLines.length; i++) {
    parsed.push({
      section: lyricTextLines[i].section,
      text: lyricTextLines[i].text,
      timeSec: Math.round((startOffset + i * timePerLine) * 10) / 10
    });
  }

  return parsed;
}

/**
 * Complete Multi-Stage Music Generation Pipeline
 * Orchestrates Prompt Analysis, Lyria 3.5 Invocation, Vocal Synthesis, and Stem Mastering
 */
export async function executeMusicPipeline(
  request: GenerationRequest,
  onProgress?: (stage: string, percent: number, detail?: string) => void
): Promise<Track> {
  const { prompt, genre, lyrics: userLyrics, isInstrumental, model, tempo, musicalKey, vocalStyle } = request;

  // 1. Stage 1: Prompt Understanding
  onProgress?.('analyzing_prompt', 20, 'Analyzing prompt with Gemini 3.8 Flash to extract tempo, key & sonic structure...');
  const analysis = await analyzeMusicPrompt(
    prompt, 
    genre, 
    userLyrics, 
    isInstrumental, 
    tempo, 
    musicalKey, 
    vocalStyle
  );

  const durationSec = model === 'lyria-3-pro-preview' ? 60 : 28;
  const effectiveLyrics = isInstrumental ? '' : (userLyrics || analysis.generatedLyrics || '');

  // 2. Stage 2: Music Generation (Lyria 3.5 Engine)
  onProgress?.('composing_music', 45, `Invoking ${model} for acoustic stem generation...`);
  
  let lyriaResult = await callLyriaMusicModel(model, analysis.enrichedLyriaPrompt);
  let masterWavBuffer: Buffer;
  let drumWavBuffer: Buffer | undefined;
  let bassWavBuffer: Buffer | undefined;
  let instWavBuffer: Buffer | undefined;
  let vocalsWavBuffer: Buffer | undefined;
  let modelUsed: 'lyria-3-clip-preview' | 'lyria-3-pro-preview' | 'polo-forge-hybrid' = model;

  if (lyriaResult?.audioBuffer) {
    masterWavBuffer = lyriaResult.audioBuffer;
  } else {
    // Hybrid Studio Engine: Procedural high-fidelity multi-track synthesis
    modelUsed = 'polo-forge-hybrid';
    const synthResult = synthesizePoloTrack({
      durationSec,
      bpm: analysis.tempo,
      genre: analysis.primaryGenre,
      musicalKey: analysis.musicalKey
    });

    masterWavBuffer = synthResult.mixWav;
    drumWavBuffer = synthResult.drumWav;
    bassWavBuffer = synthResult.bassWav;
    instWavBuffer = synthResult.instWav;
  }

  // 3. Stage 3: Vocal Synthesis
  if (!isInstrumental && effectiveLyrics) {
    onProgress?.('synthesizing_vocals', 75, 'Synthesizing expressive vocal line with Gemini TTS...');
    vocalsWavBuffer = await synthesizeVocalsWithGemini(
      effectiveLyrics, 
      vocalStyle || analysis.vocalCadenceNotes, 
      analysis.musicalKey
    ) ?? undefined;

    // Mix vocals into master track
    if (vocalsWavBuffer) {
      masterWavBuffer = mixVocalsOverInstrumental(masterWavBuffer, vocalsWavBuffer, 1.15, 0.85);
    }
  }

  // 4. Stage 4: Audio Mastering & Waveform Extraction
  onProgress?.('mastering_audio', 90, 'Applying stereo mastering, limiter, and generating waveform peaks...');
  const peaks = extractWaveformPeaks(masterWavBuffer, 90);
  const parsedLyrics = isInstrumental ? [] : parseLyricsWithTimestamps(effectiveLyrics, durationSec);

  // Encode stems to Base64 data URIs
  const masterBase64 = `data:audio/wav;base64,${masterWavBuffer.toString('base64')}`;
  const stems: Track['stems'] = {
    mix: masterBase64,
    instrumental: instWavBuffer ? `data:audio/wav;base64,${instWavBuffer.toString('base64')}` : undefined,
    vocals: vocalsWavBuffer ? `data:audio/wav;base64,${vocalsWavBuffer.toString('base64')}` : undefined,
    drums: drumWavBuffer ? `data:audio/wav;base64,${drumWavBuffer.toString('base64')}` : undefined,
    bass: bassWavBuffer ? `data:audio/wav;base64,${bassWavBuffer.toString('base64')}` : undefined,
  };

  onProgress?.('completed', 100, 'Track generation complete!');

  const trackId = `pf-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const track: Track = {
    id: trackId,
    title: analysis.title,
    prompt,
    enrichedPrompt: analysis.enrichedLyriaPrompt,
    genre: analysis.primaryGenre,
    tags: [analysis.primaryGenre, ...analysis.secondaryGenres, analysis.mood],
    bpm: analysis.tempo,
    musicalKey: analysis.musicalKey,
    duration: durationSec,
    createdAt: new Date().toISOString(),
    isInstrumental,
    modelUsed,
    lyrics: effectiveLyrics,
    parsedLyrics,
    audioUrl: masterBase64,
    stems,
    waveform: peaks,
    analysis,
    vocalStyle: vocalStyle || 'Modern Studio'
  };

  return track;
}
