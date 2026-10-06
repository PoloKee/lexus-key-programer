import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { executeMusicPipeline, analyzeMusicPrompt, generateLyrics } from './server/geminiService.js';
import { getDemoTracks } from './server/demoTracks.js';
import type { GenerationRequest } from './src/types/music.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProd = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT) || 3000;

async function startServer() {
  const app = express();

  // Allow larger audio payload sizes
  app.use(express.json({ limit: '60mb' }));
  app.use(express.urlencoded({ extended: true, limit: '60mb' }));

  // Health check
  app.get('/api/health', (req, res) => {
    const hasKey = Boolean(process.env.GEMINI_API_KEY);
    res.json({
      status: 'ok',
      hasApiKey: hasKey,
      engine: 'Polo Forge Studio (Lyria 3.5 & Gemini 3.8)',
      models: {
        music: ['lyria-3-clip-preview', 'lyria-3-pro-preview'],
        analysis: 'gemini-3.8-flash',
        tts: 'gemini-3.8-flash-lite-tts'
      }
    });
  });

  // Sample seeded tracks
  app.get('/api/sample-tracks', (req, res) => {
    try {
      const tracks = getDemoTracks();
      res.json(tracks);
    } catch (err: any) {
      console.error('Error getting demo tracks:', err);
      res.status(500).json({ error: 'Failed to retrieve demo tracks' });
    }
  });

  // Prompt Analysis endpoint
  app.post('/api/analyze-prompt', async (req, res) => {
    try {
      const { prompt, genre, lyrics, isInstrumental, tempo, musicalKey, vocalStyle } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
      }

      const analysis = await analyzeMusicPrompt(
        prompt, 
        genre, 
        lyrics, 
        isInstrumental, 
        tempo ? Number(tempo) : undefined, 
        musicalKey, 
        vocalStyle
      );
      res.json(analysis);
    } catch (err: any) {
      console.error('Analyze prompt error:', err);
      res.status(500).json({ error: err?.message || 'Failed to analyze prompt' });
    }
  });

  // Lyrics Generator endpoint
  app.post('/api/generate-lyrics', async (req, res) => {
    try {
      const { prompt, genre, theme } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
      }

      const lyrics = await generateLyrics(prompt, genre, theme);
      res.json({ lyrics });
    } catch (err: any) {
      console.error('Generate lyrics error:', err);
      res.status(500).json({ error: err?.message || 'Failed to generate lyrics' });
    }
  });

  // Server-Sent Events (SSE) endpoint for generation with live progress updates
  app.post('/api/generate-music-stream', async (req, res) => {
    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const sendEvent = (event: string, data: any) => {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    try {
      const request: GenerationRequest = req.body;
      if (!request.prompt) {
        sendEvent('error', { message: 'Prompt is required' });
        return res.end();
      }

      sendEvent('stage', {
        stage: 'analyzing_prompt',
        stageIndex: 1,
        totalStages: 4,
        progressPercent: 15,
        message: 'Deconstructing prompt & structuring sonic blueprint with Gemini 3.8 Flash...'
      });

      const track = await executeMusicPipeline(request, (stage, percent, detail) => {
        let stageIndex = 1;
        if (stage === 'composing_music') stageIndex = 2;
        if (stage === 'synthesizing_vocals') stageIndex = 3;
        if (stage === 'mastering_audio') stageIndex = 4;
        if (stage === 'completed') stageIndex = 4;

        sendEvent('stage', {
          stage,
          stageIndex,
          totalStages: 4,
          progressPercent: percent,
          message: detail || `Stage: ${stage}`
        });
      });

      sendEvent('complete', track);
      res.end();
    } catch (err: any) {
      console.error('Pipeline streaming error:', err);
      sendEvent('error', { message: err?.message || 'Music generation pipeline failed' });
      res.end();
    }
  });

  // Standard non-streaming generate-music fallback
  app.post('/api/generate-music', async (req, res) => {
    try {
      const request: GenerationRequest = req.body;
      if (!request.prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
      }

      const track = await executeMusicPipeline(request);
      res.json(track);
    } catch (err: any) {
      console.error('Generate music error:', err);
      res.status(500).json({ error: err?.message || 'Music generation failed' });
    }
  });

  // Client SPA mounting
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { 
        middlewareMode: true, 
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {}
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist/index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Polo Forge Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup failure:', err);
  process.exit(1);
});
