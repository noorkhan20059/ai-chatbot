import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import dns from 'dns';
import chatHandler from './api/chat.ts';
import healthHandler from './api/health.ts';

// Fast DNS resolution: avoid IPv6 connection timeout delays
try {
  dns.setDefaultResultOrder('ipv4first');
} catch {}

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// Delegate API routes to shared Vercel serverless handlers
app.all('/api/health', (req, res) => healthHandler(req, res));
app.all('/api/chat', (req, res) => chatHandler(req, res));

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
