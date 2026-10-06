export interface TrackAnalysis {
  title: string;
  concept: string;
  primaryGenre: string;
  secondaryGenres: string[];
  mood: string;
  tempo: number; // BPM
  musicalKey: string;
  instrumentation: string[];
  structure: {
    section: string;
    startSec: number;
    endSec: number;
    description: string;
  }[];
  enrichedLyriaPrompt: string;
  generatedLyrics?: string;
  vocalCadenceNotes?: string;
  productionNotes: string;
}

export interface LyricLine {
  section?: string;
  text: string;
  timeSec: number;
}

export interface TrackStems {
  mix: string; // base64 data URI or relative URL
  instrumental?: string;
  vocals?: string;
  drums?: string;
  bass?: string;
}

export interface Track {
  id: string;
  title: string;
  prompt: string;
  enrichedPrompt?: string;
  genre: string;
  tags: string[];
  bpm: number;
  musicalKey: string;
  duration: number; // in seconds
  createdAt: string;
  isInstrumental: boolean;
  modelUsed: 'lyria-3-clip-preview' | 'lyria-3-pro-preview' | 'polo-forge-hybrid';
  lyrics?: string;
  parsedLyrics?: LyricLine[];
  audioUrl: string; // WAV base64 data URI
  stems: TrackStems;
  waveform: number[]; // 50 to 100 normalized float amplitude bars [0..1]
  analysis?: TrackAnalysis;
  vocalStyle?: string;
  isFavorite?: boolean;
}

export interface GenerationRequest {
  prompt: string;
  lyrics?: string;
  genre?: string;
  isInstrumental: boolean;
  model: 'lyria-3-clip-preview' | 'lyria-3-pro-preview';
  tempo?: number;
  musicalKey?: string;
  vocalStyle?: string;
}

export type PipelineStage = 
  | 'idle'
  | 'analyzing_prompt' 
  | 'composing_music' 
  | 'synthesizing_vocals' 
  | 'mastering_audio' 
  | 'completed' 
  | 'failed';

export interface PipelineProgress {
  stage: PipelineStage;
  stageIndex: number;
  totalStages: number;
  progressPercent: number;
  message: string;
  detail?: string;
}
