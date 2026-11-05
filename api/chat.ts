import dns from 'dns';
import { GoogleGenAI } from '@google/genai';

// Fast DNS resolution: avoid IPv6 connection timeout delays
try {
  dns.setDefaultResultOrder('ipv4first');
} catch {
  // Ignore in environments where not supported
}

const DEFAULT_PRECISION_SYSTEM_INSTRUCTION = `You are an accurate, concise, and ultra-fast multimodal AI assistant.
Follow these core rules strictly:
1. DIRECTNESS: Answer the user's exact question immediately. Do NOT include conversational filler, greetings, pleasantries, or introductory phrases (e.g., "Sure!", "Here is...", "As an AI...").
2. MULTIMODAL ANALYSIS: When images, documents, or audio are provided:
   - For images: accurately describe visual details, read/transcribe visible text, identify objects, analyze charts/diagrams, and answer specific user questions.
   - For documents/spreadsheets: summarize accurately, extract key data points, explain tables, and cite specific document details.
   - For audio/voice: understand spoken queries, extract key information, and answer directly.
3. CONCISENESS & BREVITY: Keep answers short, clear, and relevant by default. Use concise bullet points or numbered steps where helpful. Give detailed explanations only when requested.
4. FACTUAL ACCURACY: Never invent facts or pretend to know something uncertain. If a question is ambiguous, ask one short clarifying question.
5. CODE PRECISION: For coding requests, provide clean, working code and briefly explain only the essential changes or logic.`;

function sanitizeModel(modelName?: string): string {
  if (!modelName) return 'gemini-3.1-flash-lite';
  const lower = modelName.toLowerCase();
  if (lower.includes('lite') || lower.includes('3.1')) return 'gemini-3.1-flash-lite';
  if (lower.includes('pro') || lower.includes('3.8')) return 'gemini-3.8-flash';
  return 'gemini-3.1-flash-lite';
}

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 2, baseDelay = 800): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (err: any) {
      attempt++;
      const isRetryable =
        err?.status === 429 ||
        err?.status === 503 ||
        err?.message?.includes('429') ||
        err?.message?.includes('503') ||
        err?.message?.includes('RESOURCE_EXHAUSTED') ||
        err?.message?.includes('UNAVAILABLE') ||
        err?.message?.includes('high demand');

      if (attempt > maxRetries || !isRetryable) {
        throw err;
      }
      const delay = baseDelay * Math.pow(2, attempt - 1);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

function formatErrorMessage(rawErr: string): string {
  if (
    rawErr.includes('401') ||
    rawErr.includes('API key not valid') ||
    rawErr.includes('UNAUTHENTICATED') ||
    rawErr.includes('ACCESS_TOKEN_TYPE_UNSUPPORTED') ||
    rawErr.includes('API_KEY_INVALID')
  ) {
    return `### ⚠️ Gemini API Authentication Error\n\nThe API key was rejected by Google Gemini.\n\n**To resolve:**\n1. Ensure your \`GEMINI_API_KEY\` is configured correctly in your Vercel Project Settings > Environment Variables (or in \`.env.local\`).\n2. Verify the key on [Google AI Studio](https://aistudio.google.com/apikey).`;
  }
  if (rawErr.includes('429') || rawErr.includes('RESOURCE_EXHAUSTED') || rawErr.includes('Quota')) {
    return `### ⏳ Rate Limit / Quota Exceeded\n\nThe Gemini API request limit has been reached. Please wait a few moments and try your prompt again.`;
  }
  if (rawErr.includes('503') || rawErr.includes('UNAVAILABLE') || rawErr.includes('high demand')) {
    return `### 🌐 Gemini Model High Demand\n\nThe selected model is temporarily experiencing high traffic spikes. Retrying automatically or switching to another model usually resolves this in seconds.`;
  }
  if (rawErr.includes('ETIMEDOUT') || rawErr.includes('ECONNRESET') || rawErr.includes('fetch failed')) {
    return `### 📡 Network Connection Issue\n\nCould not reach the Google Gemini API servers. Please verify your internet connection and try again.`;
  }
  return `### ⚠️ Request Error\n\n${rawErr.slice(0, 300)}. Please try again.`;
}

export default async function handler(req: any, res: any) {
  // CORS configuration for Vercel
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const {
    prompt,
    messages = [],
    attachments = [],
    model: requestedModel,
    systemInstruction = DEFAULT_PRECISION_SYSTEM_INSTRUCTION,
    stream = true,
    maxHistoryTurns = 8,
  } = req.body || {};

  const apiKey = (process.env.GEMINI_API_KEY || '').trim();

  // Validate API key presence
  if (!apiKey) {
    const missingMsg = `### ⚠️ Gemini API Key Missing\n\nThe \`GEMINI_API_KEY\` environment variable is not configured.\n\n**To resolve:**\n1. **On Vercel:** Open **vercel.com** → Your Project → **Settings** → **Environment Variables**.\n2. Add **Key:** \`GEMINI_API_KEY\` and **Value:** your Google Gemini key (starts with \`AIzaSy...\`).\n3. Click **Save** and trigger a **Redeploy** on Vercel.\n4. **In Local Dev:** Add \`GEMINI_API_KEY="AIzaSy..."\` to \`.env.local\`.\n\n👉 Create a free key at [Google AI Studio](https://aistudio.google.com/apikey).`;
    
    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.write(`data: ${JSON.stringify({ text: missingMsg, model: requestedModel || 'gemini-3.1-flash-lite' })}\n\n`);
      res.write(`data: ${JSON.stringify({ done: true, elapsedMs: 0 })}\n\n`);
      res.write('data: [DONE]\n\n');
      return res.end();
    }
    return res.status(500).json({ error: missingMsg });
  }



  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  try {
    const primaryModel = sanitizeModel(requestedModel);

    // Limit conversation history to the most recent relevant turns
    const trimmedMessages = Array.isArray(messages) ? messages.slice(-maxHistoryTurns) : [];
    const contents: Array<{ role: 'user' | 'model'; parts: Array<any> }> = [];

    // Add previous turns
    for (const msg of trimmedMessages) {
      if (!msg.content || typeof msg.content !== 'string') continue;
      const role = msg.role === 'user' ? 'user' : 'model';
      contents.push({
        role,
        parts: [{ text: msg.content }],
      });
    }

    // Build latest user turn with multimodal attachments (images, PDFs, audio, documents)
    const userParts: any[] = [];

    if (Array.isArray(attachments) && attachments.length > 0) {
      for (const att of attachments) {
        if (!att) continue;

        // Binary files: images, PDFs, audio
        if (att.data && typeof att.data === 'string') {
          const cleanBase64 = att.data.replace(/^data:[^;]+;base64,/, '').trim();
          userParts.push({
            inlineData: {
              mimeType: att.mimeType || 'image/jpeg',
              data: cleanBase64,
            },
          });
        }
        // Textual documents: TXT, CSV, MD, JSON, extracted DOCX/XLSX text
        else if (att.text && typeof att.text === 'string') {
          userParts.push({
            text: `[Attached Document: ${att.name || 'file'}]\n${att.text}`,
          });
        }
      }
    }

    // Add user text question or default if empty with attachments
    if (prompt && typeof prompt === 'string' && prompt.trim()) {
      userParts.push({ text: prompt.trim() });
    } else if (userParts.length > 0) {
      userParts.push({ text: 'Please analyze the attached content and provide a concise summary or description.' });
    }

    if (userParts.length === 0) {
      return res.status(400).json({ error: 'Prompt or attachment is required.' });
    }

    contents.push({
      role: 'user',
      parts: userParts,
    });

    const config: Record<string, any> = {
      systemInstruction,
    };

    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');
      res.flushHeaders?.();

      const startTime = Date.now();
      let firstTokenMs: number | null = null;
      let totalTokensEstimated = 0;

      const tryStream = async (modelName: string) => {
        const responseStream = await withRetry(() =>
          ai.models.generateContentStream({
            model: modelName,
            contents,
            config,
          })
        );

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
          await tryStream('gemini-3.8-flash');
        } catch (backupErr: any) {
          console.error('All live models failed:', backupErr.message);
          const rawErr = backupErr.message || err.message || '';
          const errText = formatErrorMessage(rawErr);
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
      // Unary non-streaming
      const startTime = Date.now();
      let response;
      try {
        response = await withRetry(() =>
          ai.models.generateContent({
            model: primaryModel,
            contents,
            config,
          })
        );
      } catch {
        response = await withRetry(() =>
          ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents,
            config,
          })
        );
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
    console.error('API /api/chat error:', error);
    return res.status(500).json({
      error: formatErrorMessage(error.message || 'Internal server error while processing Gemini API request.'),
    });
  }
}
