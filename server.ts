import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import dns from 'dns';
import { GoogleGenAI } from '@google/genai';

// Fast DNS resolution: avoid IPv6 connection timeout delays
dns.setDefaultResultOrder('ipv4first');

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize Google Gemini Client on server-side
const apiKey = process.env.GEMINI_API_KEY || 'AQ.Ab8RN6L3SFT5exU6Nxe94zrSSolborvz4rrmQlFM0RnTu27MpQ';

const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Precision system instruction: direct, concise, factual, no filler
const DEFAULT_PRECISION_SYSTEM_INSTRUCTION = `You are an accurate, concise, and ultra-fast AI assistant.
Follow these core rules strictly:
1. DIRECTNESS: Answer the user's exact question immediately. Do NOT include conversational filler, greetings, pleasantries, or introductory phrases (e.g., "Sure!", "Here is...", "As an AI...").
2. CONCISENESS & BREVITY: Keep answers short, clear, and relevant by default. Use concise bullet points or numbered steps where helpful. Give detailed explanations only when requested.
3. FACTUAL ACCURACY: Never invent facts or pretend to know something uncertain. If a question is ambiguous, ask one short clarifying question.
4. CODE PRECISION: For coding requests, provide clean, working code and briefly explain only the essential changes or logic.
5. CONTEXTUAL RELEVANCE: Retain conversation context for coherent follow-up questions without repeating previous answers.`;

// Supported fast models for conversational tasks
function sanitizeModel(modelName?: string): string {
  if (!modelName) return 'gemini-3.1-flash-lite';
  const lower = modelName.toLowerCase();
  if (lower.includes('3.8')) return 'gemini-3.1-flash-lite';
  if (lower.includes('lite')) return 'gemini-3.1-flash-lite';
  if (lower.includes('flash')) return 'gemini-3.1-flash-lite';
  return 'gemini-3.1-flash-lite';
}

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'online',
    framework: 'Next.js App Router / Express Architecture',
    model: 'gemini-3.1-flash-lite',
    apiKeyConfigured: Boolean(apiKey),
    temperature: 0.3,
    timestamp: new Date().toISOString(),
  });
});

// Model list endpoint
app.get('/api/models', (_req, res) => {
  res.json({
    models: [
      {
        id: 'gemini-3.1-flash-lite',
        name: 'Gemini 3.1 Flash Lite',
        description: 'Ultra-fast, concise, and accurate responses (Free Tier)',
        speed: '~65 tokens/sec',
        default: true,
      },
      {
        id: 'gemini-3.5-flash',
        name: 'Gemini 3.5 Flash',
        description: 'High capability model for complex multi-turn chats',
        speed: '~45 tokens/sec',
        default: false,
      },
    ],
  });
});

// Optimized Chat Route Handler
app.post('/api/chat', async (req, res) => {
  try {
    const {
      prompt,
      messages = [],
      model: requestedModel,
      temperature = 0.3, // Moderate/low temperature for accurate, non-rambling responses
      systemInstruction = DEFAULT_PRECISION_SYSTEM_INSTRUCTION,
      stream = true,
      maxHistoryTurns = 8, // Configurable limit: send only relevant recent history to maximize speed
    } = req.body;

    const primaryModel = sanitizeModel(requestedModel);

    // Limit conversation history to the most recent relevant turns
    const trimmedMessages = Array.isArray(messages) ? messages.slice(-maxHistoryTurns) : [];

    // Build conversation contents array for multi-turn chat
    const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

    for (const msg of trimmedMessages) {
      if (!msg.content || typeof msg.content !== 'string') continue;
      const role = msg.role === 'user' ? 'user' : 'model';
      contents.push({
        role,
        parts: [{ text: msg.content }],
      });
    }

    // Append latest prompt if not already the final item
    if (prompt && typeof prompt === 'string') {
      const lastMsg = contents[contents.length - 1];
      if (!lastMsg || lastMsg.role !== 'user' || lastMsg.parts[0]?.text !== prompt) {
        contents.push({
          role: 'user',
          parts: [{ text: prompt }],
        });
      }
    }

    if (contents.length === 0) {
      return res.status(400).json({ error: 'Prompt or conversation message is required.' });
    }

    // Model configuration optimized for accuracy, low latency, and conciseness
    const config: Record<string, any> = {
      systemInstruction,
      temperature, // 0.3 for precision
      topP: 0.85,
      maxOutputTokens: 2048,
    };

    if (stream) {
      // Set SSE headers
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');
      res.flushHeaders?.();

      const startTime = Date.now();
      let firstTokenMs: number | null = null;
      let totalTokensEstimated = 0;

      // Helper to stream chunks
      const tryStream = async (modelName: string) => {
        const responseStream = await ai.models.generateContentStream({
          model: modelName,
          contents,
          config,
        });

        for await (const chunk of responseStream) {
          const textChunk = chunk.text;
          if (textChunk) {
            if (firstTokenMs === null) {
              firstTokenMs = Date.now() - startTime;
            }
            totalTokensEstimated += Math.ceil(textChunk.length / 4);
            res.write(`data: ${JSON.stringify({ text: textChunk, model: modelName })}\n\n`);
          }
        }
      };

      try {
        await tryStream(primaryModel);
      } catch (err: any) {
        console.warn(`Primary model ${primaryModel} failed (${err.message}), trying backup model...`);
        try {
          await tryStream('gemini-3.5-flash');
        } catch (backupErr: any) {
          console.error('All live models failed:', backupErr.message);
          const errText = `I encountered an issue connecting to the Gemini API: ${backupErr.message || err.message}. Please check your connection or try again.`;
          res.write(`data: ${JSON.stringify({ text: errText, model: primaryModel })}\n\n`);
        }
      }

      const elapsedMs = Date.now() - startTime;
      res.write(
        `data: ${JSON.stringify({
          done: true,
          elapsedMs,
          firstTokenMs: firstTokenMs || elapsedMs,
          estimatedTokens: totalTokensEstimated,
          model: primaryModel,
        })}\n\n`
      );
      res.write('data: [DONE]\n\n');
      res.end();
    } else {
      // Unary non-streaming response
      const startTime = Date.now();
      let response;
      try {
        response = await ai.models.generateContent({
          model: primaryModel,
          contents,
          config,
        });
      } catch {
        response = await ai.models.generateContent({
          model: 'gemini-3.5-flash',
          contents,
          config,
        });
      }

      const elapsedMs = Date.now() - startTime;
      return res.json({
        text: response.text || '',
        model: primaryModel,
        elapsedMs,
        usage: response.usageMetadata,
      });
    }
  } catch (error: any) {
    console.error('Server /api/chat error:', error);
    return res.status(500).json({
      error: error.message || 'Internal server error while processing Gemini API request.',
    });
  }
});

// Setup Vite middleware in dev or static server in prod
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(Number(port), '0.0.0.0', () => {
    console.log(`Gemini Next Chatbot server running at http://0.0.0.0:${port}`);
  });
}

startServer();
