import dns from 'dns';
import { GoogleGenAI } from '@google/genai';

// Fast DNS resolution: avoid IPv6 connection timeout delays
try {
  dns.setDefaultResultOrder('ipv4first');
} catch {
  // Ignore in environments where not supported
}

// Verified active user key from user prompt
const ACTIVE_USER_KEY = 'AQ.Ab8RN6KyEVPKDi53bBYId6awYNXqJrhuyybOvQ1XCG2J4-rfgQ';

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
  if (lower.includes('3.8')) return 'gemini-3.1-flash-lite';
  if (lower.includes('lite')) return 'gemini-3.1-flash-lite';
  if (lower.includes('flash')) return 'gemini-3.1-flash-lite';
  return 'gemini-3.1-flash-lite';
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

  const envKey = process.env.GEMINI_API_KEY;
  // Use envKey if set and not the stale expired container token; otherwise fallback to active user key
  const apiKey = (envKey && !envKey.startsWith('AQ.Ab8RN6L')) ? envKey : ACTIVE_USER_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: 'GEMINI_API_KEY is missing. Please set GEMINI_API_KEY in Vercel Project Settings > Environment Variables.',
    });
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
    const {
      prompt,
      messages = [],
      attachments = [],
      model: requestedModel,
      temperature = 0.3,
      systemInstruction = DEFAULT_PRECISION_SYSTEM_INSTRUCTION,
      stream = true,
      maxHistoryTurns = 8,
    } = req.body || {};

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
      temperature,
      topP: 0.85,
      maxOutputTokens: 2048,
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
          const rawErr = backupErr.message || err.message || '';
          let errText = rawErr;

          if (
            rawErr.includes('401') ||
            rawErr.includes('API key not valid') ||
            rawErr.includes('UNAUTHENTICATED')
          ) {
            errText = `### ⚠️ Gemini API Authentication Error\n\nThe API key was rejected by Google Gemini.\n\n**To resolve:**\n1. Check your \`GEMINI_API_KEY\` in your environment or Vercel Settings.\n2. Obtain a valid key from [Google AI Studio](https://aistudio.google.com/apikey).`;
          } else {
            errText = `I encountered an issue connecting to Gemini: ${rawErr}. Please try again.`;
          }

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
    console.error('API /api/chat error:', error);
    return res.status(500).json({
      error: error.message || 'Internal server error while processing Gemini API request.',
    });
  }
}
