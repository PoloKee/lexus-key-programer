/**
 * Polo Forge Audio Synthesis & WAV Processing Engine
 * High-performance PCM WAV encoding, multi-track stem mixing, and waveform extraction.
 */

// Musical note frequencies (Hz) for A4 = 440Hz
const NOTE_SEMITONES: Record<string, number> = {
  'C': -9, 'C#': -8, 'Db': -8,
  'D': -7, 'D#': -6, 'Eb': -6,
  'E': -5,
  'F': -4, 'F#': -3, 'Gb': -3,
  'G': -2, 'G#': -1, 'Ab': -1,
  'A': 0, 'A#': 1, 'Bb': 1,
  'B': 2
};

export function getNoteFrequency(noteName: string, octave: number = 4): number {
  const cleanNote = noteName.trim().toUpperCase();
  const semitones = NOTE_SEMITONES[cleanNote] ?? 0;
  // A4 is 440 Hz (octave 4)
  const octaveDiff = octave - 4;
  return 440 * Math.pow(2, (semitones + octaveDiff * 12) / 12);
}

/**
 * Creates a standard 44-byte RIFF WAV header for 16-bit PCM audio
 */
export function createWavHeader(numSamples: number, sampleRate: number = 44100, numChannels: number = 2): Buffer {
  const bytesPerSample = 2; // 16-bit
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = numSamples * blockAlign;
  const buffer = Buffer.alloc(44);

  // RIFF chunk descriptor
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);

  // "fmt " sub-chunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
  buffer.writeUInt16LE(1, 20);  // AudioFormat (1 for PCM)
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(16, 34); // BitsPerSample

  // "data" sub-chunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  return buffer;
}

/**
 * Encodes Float32 channel buffers [-1.0 .. 1.0] to a complete 16-bit PCM WAV Buffer
 */
export function float32ToWav(left: Float32Array, right: Float32Array, sampleRate: number = 44100): Buffer {
  const numSamples = left.length;
  const header = createWavHeader(numSamples, sampleRate, 2);
  const data = Buffer.alloc(numSamples * 4); // 2 channels * 2 bytes

  for (let i = 0; i < numSamples; i++) {
    // Left channel clamp and scale
    let sL = Math.max(-1, Math.min(1, left[i]));
    let intL = sL < 0 ? sL * 0x8000 : sL * 0x7FFF;
    data.writeInt16LE(Math.floor(intL), i * 4);

    // Right channel clamp and scale
    let sR = Math.max(-1, Math.min(1, right[i]));
    let intR = sR < 0 ? sR * 0x8000 : sR * 0x7FFF;
    data.writeInt16LE(Math.floor(intR), i * 4 + 2);
  }

  return Buffer.concat([header, data]);
}

/**
 * Decodes 16-bit PCM WAV into normalized Float32 arrays
 */
export function decodeWav(wavBuffer: Buffer): { left: Float32Array; right: Float32Array; sampleRate: number } {
  // Read RIFF
  const sampleRate = wavBuffer.readUInt32LE(24);
  const numChannels = wavBuffer.readUInt16LE(22);
  const bitsPerSample = wavBuffer.readUInt16LE(34);
  
  // Find "data" chunk
  let offset = 12;
  while (offset < wavBuffer.length - 8) {
    const chunkId = wavBuffer.toString('utf8', offset, offset + 4);
    const chunkSize = wavBuffer.readUInt32LE(offset + 4);
    if (chunkId === 'data') {
      const dataOffset = offset + 8;
      const bytesPerSample = bitsPerSample / 8;
      const totalSamples = Math.floor(chunkSize / (bytesPerSample * numChannels));
      
      const left = new Float32Array(totalSamples);
      const right = new Float32Array(totalSamples);

      for (let i = 0; i < totalSamples; i++) {
        const sampleIdx = dataOffset + i * numChannels * bytesPerSample;
        let l = 0;
        let r = 0;

        if (sampleIdx + bytesPerSample <= wavBuffer.length) {
          l = bitsPerSample === 16 ? wavBuffer.readInt16LE(sampleIdx) / 32768 : 0;
        }
        if (numChannels === 2 && sampleIdx + bytesPerSample * 2 <= wavBuffer.length) {
          r = bitsPerSample === 16 ? wavBuffer.readInt16LE(sampleIdx + bytesPerSample) / 32768 : l;
        } else {
          r = l;
        }

        left[i] = l;
        right[i] = r;
      }
      return { left, right, sampleRate };
    }
    offset += 8 + chunkSize;
  }

  // Fallback if no data chunk found
  const fallback = new Float32Array(sampleRate * 2);
  return { left: fallback, right: fallback, sampleRate };
}

/**
 * Extracts normalized peak amplitudes (0.0 to 1.0) for frontend audio visualizer
 */
export function extractWaveformPeaks(buffer: Buffer, numPeaks: number = 80): number[] {
  try {
    const { left, right } = decodeWav(buffer);
    const totalSamples = left.length;
    if (totalSamples === 0) return Array(numPeaks).fill(0.1);

    const blockSize = Math.floor(totalSamples / numPeaks);
    const peaks: number[] = [];

    for (let p = 0; p < numPeaks; p++) {
      let maxVal = 0;
      const start = p * blockSize;
      const end = Math.min(start + blockSize, totalSamples);
      for (let i = start; i < end; i += 4) { // step by 4 for speed
        const amp = (Math.abs(left[i]) + Math.abs(right[i])) / 2;
        if (amp > maxVal) maxVal = amp;
      }
      // Apply subtle dynamic curve so quiet parts are still visible
      const normalized = Math.min(1, Math.max(0.08, Math.pow(maxVal, 0.7) * 1.2));
      peaks.push(Math.round(normalized * 100) / 100);
    }
    return peaks;
  } catch (e) {
    return Array(numPeaks).fill(0.2);
  }
}

/**
 * Procedural Multi-Track Audio Synthesizer (Polo Forge Studio Engine)
 * Generates rhythmic, harmonic stems with proper chords, basslines, drums, and leads
 */
export function synthesizePoloTrack({
  durationSec = 24,
  bpm = 120,
  genre = 'Synthwave',
  musicalKey = 'A Minor',
  sampleRate = 24000
}: {
  durationSec?: number;
  bpm?: number;
  genre?: string;
  musicalKey?: string;
  sampleRate?: number;
}) {
  const totalSamples = Math.floor(durationSec * sampleRate);
  
  // Stems
  const drumL = new Float32Array(totalSamples);
  const drumR = new Float32Array(totalSamples);
  const bassL = new Float32Array(totalSamples);
  const bassR = new Float32Array(totalSamples);
  const instL = new Float32Array(totalSamples);
  const instR = new Float32Array(totalSamples);
  const mixL = new Float32Array(totalSamples);
  const mixR = new Float32Array(totalSamples);

  // Determine root note and scale
  const isMinor = musicalKey.toLowerCase().includes('minor') || musicalKey.toLowerCase().includes('m');
  const rootNoteName = musicalKey.split(' ')[0] || 'A';
  const rootFreq = getNoteFrequency(rootNoteName, 2); // Bass root in octave 2

  // Chord progression intervals (semitones from root)
  // E.g. i - VI - III - VII in minor, or I - V - vi - IV in major
  const chordRoots = isMinor 
    ? [0, 8, 3, 10] // e.g. Am - F - C - G
    : [0, 7, 9, 5];  // e.g. C - G - Am - F

  const beatSec = 60 / bpm;
  const barSec = beatSec * 4;
  const samplesPerBar = Math.floor(barSec * sampleRate);
  const samplesPerBeat = Math.floor(beatSec * sampleRate);

  // Genre parameters
  const isLofi = genre.toLowerCase().includes('lo-fi') || genre.toLowerCase().includes('chill');
  const isCyber = genre.toLowerCase().includes('cyber') || genre.toLowerCase().includes('techno');
  const isRock = genre.toLowerCase().includes('rock');
  const isAmbient = genre.toLowerCase().includes('ambient');

  // Generate Drum Stem
  if (!isAmbient) {
    for (let t = 0; t < totalSamples; t++) {
      const beatProgress = (t % samplesPerBeat) / samplesPerBeat;
      const beatIndex = Math.floor((t % samplesPerBar) / samplesPerBeat);
      const barIndex = Math.floor(t / samplesPerBar);

      // Intro build: drums enter after 1 bar
      if (barIndex === 0 && !isCyber) continue;

      let drumSample = 0;

      // Kick on 1 and 3 (or four-on-the-floor for Cyber/EDM)
      const isKickBeat = isCyber ? true : (beatIndex === 0 || beatIndex === 2);
      if (isKickBeat) {
        const kickTime = (t % samplesPerBeat) / sampleRate;
        if (kickTime < 0.25) {
          const kickFreq = 140 * Math.exp(-kickTime * 22) + 45;
          const kickAmp = Math.max(0, 1 - kickTime * 4);
          drumSample += Math.sin(2 * Math.PI * kickFreq * kickTime) * kickAmp * 0.7;
        }
      }

      // Snare / Clap on 2 and 4
      if (beatIndex === 1 || beatIndex === 3) {
        const snareTime = (t % samplesPerBeat) / sampleRate;
        if (snareTime < 0.22) {
          const noise = (Math.random() * 2 - 1) * Math.exp(-snareTime * 18);
          const tone = Math.sin(2 * Math.PI * 185 * snareTime) * Math.exp(-snareTime * 25);
          drumSample += (noise * 0.5 + tone * 0.3) * (isLofi ? 0.45 : 0.65);
        }
      }

      // Hi-Hats on 8th notes
      const eighthProgress = ((t % samplesPerBeat) / (samplesPerBeat / 2)) % 1;
      const eighthTime = eighthProgress * (beatSec / 2);
      if (eighthTime < 0.06) {
        const hatNoise = (Math.random() * 2 - 1) * Math.exp(-eighthTime * 60);
        drumSample += hatNoise * (isLofi ? 0.15 : 0.22);
      }

      drumL[t] = drumSample;
      drumR[t] = drumSample;
    }
  }

  // Generate Bassline Stem
  for (let t = 0; t < totalSamples; t++) {
    const barIndex = Math.floor(t / samplesPerBar);
    const chordIndex = barIndex % chordRoots.length;
    const currentChordRootOffset = chordRoots[chordIndex];
    const bassBaseFreq = rootFreq * Math.pow(2, currentChordRootOffset / 12);

    // 16th note bassline pattern or sustained bass
    const sixteenth = Math.floor((t % samplesPerBeat) / (samplesPerBeat / 4));
    const sixteenthTime = ((t % samplesPerBeat) % (samplesPerBeat / 4)) / sampleRate;

    let bassSample = 0;
    if (isCyber || genre.toLowerCase().includes('synthwave')) {
      // Rolling synthwave 16th bass
      const noteFreq = bassBaseFreq * (sixteenth === 3 ? 1.5 : 1.0);
      const env = Math.exp(-sixteenthTime * 14);
      // Sawtooth with subtle filter
      const phase = (t * noteFreq / sampleRate) % 1;
      const saw = 2 * phase - 1;
      const sub = Math.sin(2 * Math.PI * (noteFreq / 2) * (t / sampleRate));
      bassSample = (saw * 0.35 + sub * 0.5) * env;
    } else {
      // Deep sustained or walking bass
      const env = Math.exp(-((t % samplesPerBeat) / sampleRate) * 3);
      const sub = Math.sin(2 * Math.PI * bassBaseFreq * (t / sampleRate));
      const warm = Math.sin(4 * Math.PI * bassBaseFreq * (t / sampleRate)) * 0.25;
      bassSample = (sub + warm) * 0.45 * Math.max(0.2, env);
    }

    bassL[t] = bassSample;
    bassR[t] = bassSample;
  }

  // Generate Harmonic Chords & Arpeggio Melodies (Instrumental Stem)
  for (let t = 0; t < totalSamples; t++) {
    const timeSec = t / sampleRate;
    const barIndex = Math.floor(t / samplesPerBar);
    const chordIndex = barIndex % chordRoots.length;
    const currentChordRootOffset = chordRoots[chordIndex];
    const chordFreq = rootFreq * 2 * Math.pow(2, currentChordRootOffset / 12); // Octave 3/4

    // Chord triad frequencies: root, 3rd (minor 3 or major 4 semitones), 5th (7 semitones)
    const thirdOffset = isMinor ? 3 : 4;
    const f1 = chordFreq;
    const f2 = chordFreq * Math.pow(2, thirdOffset / 12);
    const f3 = chordFreq * Math.pow(2, 7 / 12);
    const f4 = chordFreq * Math.pow(2, (isMinor ? 10 : 11) / 12); // 7th chord for lush warmth

    // Lush warm pad synth with stereo chorus
    const padL = (
      Math.sin(2 * Math.PI * f1 * timeSec) +
      Math.sin(2 * Math.PI * f2 * timeSec + 0.3) * 0.8 +
      Math.sin(2 * Math.PI * f3 * timeSec + 0.6) * 0.7 +
      Math.sin(2 * Math.PI * f4 * timeSec + 0.9) * 0.5
    ) * 0.12;

    const padR = (
      Math.sin(2 * Math.PI * (f1 * 1.002) * timeSec) +
      Math.sin(2 * Math.PI * (f2 * 0.998) * timeSec + 0.4) * 0.8 +
      Math.sin(2 * Math.PI * (f3 * 1.001) * timeSec + 0.7) * 0.7 +
      Math.sin(2 * Math.PI * (f4 * 0.999) * timeSec + 1.0) * 0.5
    ) * 0.12;

    // Arpeggiated lead line (octave 4 & 5)
    const arpStep = Math.floor((t % samplesPerBeat) / (samplesPerBeat / 4)); // 16th arp
    const arpNotes = [f1 * 2, f2 * 2, f3 * 2, f4 * 2];
    const arpFreq = arpNotes[arpStep % arpNotes.length];
    const arpTime = ((t % samplesPerBeat) % (samplesPerBeat / 4)) / sampleRate;
    const arpEnv = Math.exp(-arpTime * 12);
    
    // Pluck synth
    const arpL = Math.sin(2 * Math.PI * arpFreq * timeSec) * arpEnv * 0.14;
    const arpR = Math.sin(2 * Math.PI * (arpFreq * 1.003) * timeSec + 0.2) * arpEnv * 0.14;

    // Sidechain compression feel: dip volume slightly on drum kicks
    const beatFraction = (t % samplesPerBeat) / samplesPerBeat;
    const sidechainDucking = Math.min(1, 0.4 + beatFraction * 1.2);

    instL[t] = (padL * sidechainDucking + arpL) * (isLofi ? 0.75 : 0.9);
    instR[t] = (padR * sidechainDucking + arpR) * (isLofi ? 0.75 : 0.9);
  }

  // Master Mix (combining stems with soft limiter)
  for (let t = 0; t < totalSamples; t++) {
    // Fade in at start (0.5s) and fade out at end (1.5s)
    const fadeIn = Math.min(1, (t / sampleRate) / 0.5);
    const fadeOut = Math.min(1, ((totalSamples - t) / sampleRate) / 1.5);
    const envelope = fadeIn * fadeOut;

    const rawL = (drumL[t] * 0.85 + bassL[t] * 0.75 + instL[t] * 0.9) * envelope;
    const rawR = (drumR[t] * 0.85 + bassR[t] * 0.75 + instR[t] * 0.9) * envelope;

    // Soft saturation limiting: tanh curve
    mixL[t] = Math.tanh(rawL);
    mixR[t] = Math.tanh(rawR);
  }

  // Encode stems to WAV buffers
  const fullMixWav = float32ToWav(mixL, mixR, sampleRate);
  const drumWav = float32ToWav(drumL, drumR, sampleRate);
  const bassWav = float32ToWav(bassL, bassR, sampleRate);
  const instWav = float32ToWav(instL, instR, sampleRate);

  return {
    mixWav: fullMixWav,
    drumWav,
    bassWav,
    instWav,
    durationSec,
    sampleRate
  };
}

/**
 * Mixes a vocal WAV track over an instrumental track with auto-ducking and level matching
 */
export function mixVocalsOverInstrumental(
  instrumentalWav: Buffer,
  vocalsWav: Buffer,
  vocalGain: number = 1.1,
  instGain: number = 0.85
): Buffer {
  try {
    const inst = decodeWav(instrumentalWav);
    const voc = decodeWav(vocalsWav);

    const totalSamples = Math.max(inst.left.length, voc.left.length);
    const outL = new Float32Array(totalSamples);
    const outR = new Float32Array(totalSamples);

    for (let i = 0; i < totalSamples; i++) {
      const iL = i < inst.left.length ? inst.left[i] * instGain : 0;
      const iR = i < inst.right.length ? inst.right[i] * instGain : 0;

      const vL = i < voc.left.length ? voc.left[i] * vocalGain : 0;
      const vR = i < voc.right.length ? voc.right[i] * vocalGain : 0;

      // Soft mix with tanh limiter
      outL[i] = Math.tanh(iL + vL);
      outR[i] = Math.tanh(iR + vR);
    }

    return float32ToWav(outL, outR, inst.sampleRate);
  } catch (err) {
    // If decoding fails, return instrumental buffer
    return instrumentalWav;
  }
}
