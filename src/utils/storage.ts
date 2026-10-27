import { Conversation } from '../types/chat';

const STORAGE_KEY = 'gemini_next_conversations_v1';
const ACTIVE_CONV_KEY = 'gemini_next_active_id';
const THEME_KEY = 'gemini_next_theme';

export const INITIAL_CONVERSATIONS: Conversation[] = [
  {
    id: 'chat-nextjs-api',
    title: 'Next.js 14 App Router API & Streaming',
    createdAt: Date.now() - 1000 * 60 * 35, // 35 mins ago (Today)
    updatedAt: Date.now() - 1000 * 60 * 15,
    model: 'gemini-3.1-flash-lite',
    messages: [
      {
        id: 'msg-1',
        role: 'user',
        content: 'Explain how to integrate Google Gemini API into Next.js App Router using Route Handlers with streaming or JSON response, and provide code examples.',
        timestamp: Date.now() - 1000 * 60 * 35,
        tokenCount: 24,
      },
      {
        id: 'msg-2',
        role: 'assistant',
        content: `To integrate Google Gemini into **Next.js 14 App Router** securely, invoke the Google Generative AI SDK inside a server-side **Route Handler** (\`app/api/chat/route.ts\`). This ensures your \`GEMINI_API_KEY\` is never leaked to the client browser.

> **Security Practice:** Always configure environment variables in \`.env.local\` without the \`NEXT_PUBLIC_\` prefix to prevent bundling into client scripts.

\`\`\`typescript
// app/api/chat/route.ts
import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';

// Initialize the Google Gemini client server-side
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: { 'User-Agent': 'aistudio-build' },
  },
});

export async function POST(req: Request) {
  try {
    const { prompt, model = 'gemini-3.8-flash' } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const result = await ai.models.generateContent({
      model,
      contents: prompt,
    });

    return NextResponse.json({
      text: result.text,
      model,
      usage: result.usageMetadata,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
\`\`\`

**Next Step:** You can consume this endpoint directly from your React Server or Client Components using standard \`fetch('/api/chat', { method: 'POST', body: JSON.stringify({ prompt }) })\`.`,
        timestamp: Date.now() - 1000 * 60 * 34,
        latencyMs: 420,
        tokenCount: 742,
      },
      {
        id: 'msg-3',
        role: 'user',
        content: 'What about handling Streaming text via Server-Sent Events (SSE) so users see tokens as they are generated?',
        timestamp: Date.now() - 1000 * 60 * 20,
        tokenCount: 19,
      },
      {
        id: 'msg-4',
        role: 'assistant',
        content: `For token streaming, leverage \`generateContentStream()\` combined with Next.js web standard \`ReadableStream\`:

- Convert Gemini's asynchronous iterable chunk into a \`new TextEncoder().encode(\`data: \${JSON.stringify({ text: chunk.text })}\\n\\n\`)\` SSE byte stream.
- Return an instance of \`new Response(stream, { headers: { 'Content-Type': 'text/event-stream; charset=utf-8' } })\`.
- In client components, consume using the browser's native \`response.body.getReader()\` for smooth UI typing.`,
        timestamp: Date.now() - 1000 * 60 * 18,
        latencyMs: 310,
        tokenCount: 512,
      },
    ],
  },
  {
    id: 'chat-tailwind-tokens',
    title: 'Tailwind Token Scaffolding',
    createdAt: Date.now() - 1000 * 60 * 60 * 3, // 3 hours ago (Today)
    updatedAt: Date.now() - 1000 * 60 * 60 * 3,
    model: 'gemini-3.1-flash-lite',
    messages: [
      {
        id: 'msg-t-1',
        role: 'user',
        content: 'How should I structure Tailwind design tokens for dark and light theme developer consoles?',
        timestamp: Date.now() - 1000 * 60 * 60 * 3,
        tokenCount: 16,
      },
      {
        id: 'msg-t-2',
        role: 'assistant',
        content: `Use CSS Custom Properties defined under \`:root\` and \`.dark\` so Tailwind utility classes (\`bg-surface\`, \`text-on-surface\`, etc.) toggle instantly without recalculating styles. This guarantees zero hydration mismatch and high contrast legibility!`,
        timestamp: Date.now() - 1000 * 60 * 60 * 3 + 2000,
        latencyMs: 350,
        tokenCount: 120,
      },
    ],
  },
  {
    id: 'chat-system-prompt',
    title: 'System Prompt Architect',
    createdAt: Date.now() - 1000 * 60 * 60 * 26, // Yesterday
    updatedAt: Date.now() - 1000 * 60 * 60 * 26,
    model: 'gemini-3.1-flash-lite',
    messages: [
      {
        id: 'msg-s-1',
        role: 'user',
        content: 'Design a system prompt for a software engineering copilot with strict coding rules.',
        timestamp: Date.now() - 1000 * 60 * 60 * 26,
        tokenCount: 14,
      },
      {
        id: 'msg-s-2',
        role: 'assistant',
        content: `Define explicit constraints, step-by-step verification, output boundaries, and zero-redundancy principles in the system instruction field. Pass this configuration in \`config.systemInstruction\` when calling the Gemini API.`,
        timestamp: Date.now() - 1000 * 60 * 60 * 26 + 3000,
        latencyMs: 290,
        tokenCount: 145,
      },
    ],
  },
];

export function getStoredConversations(): Conversation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      saveStoredConversations(INITIAL_CONVERSATIONS);
      return INITIAL_CONVERSATIONS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return INITIAL_CONVERSATIONS;
  } catch (err) {
    console.error('Failed to parse conversations from localStorage:', err);
    return INITIAL_CONVERSATIONS;
  }
}

export function saveStoredConversations(conversations: Conversation[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
  } catch (err) {
    console.error('Failed to save conversations to localStorage:', err);
  }
}

export function getActiveConversationId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_CONV_KEY);
  } catch {
    return null;
  }
}

export function setActiveConversationId(id: string): void {
  try {
    localStorage.setItem(ACTIVE_CONV_KEY, id);
  } catch (err) {
    console.error('Failed to set active conversation ID:', err);
  }
}

export function getStoredTheme(): 'dark' | 'light' {
  try {
    const theme = localStorage.getItem(THEME_KEY);
    return theme === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

export function setStoredTheme(theme: 'dark' | 'light'): void {
  try {
    localStorage.setItem(THEME_KEY, theme);
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
  } catch (err) {
    console.error('Failed to set theme in localStorage:', err);
  }
}

export function calculateStorageStats(): { usedBytes: number; formatted: string; percent: number } {
  try {
    let totalLength = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        totalLength += (localStorage.getItem(key) || '').length * 2; // ~2 bytes per char
      }
    }
    // standard localStorage quota is ~5 MB (5,242,880 bytes)
    const maxBytes = 5 * 1024 * 1024;
    const kb = (totalLength / 1024).toFixed(1);
    const percent = Math.min(100, Math.max(0.5, (totalLength / maxBytes) * 100));
    return {
      usedBytes: totalLength,
      formatted: `${kb} KB / 5 MB`,
      percent: Number(percent.toFixed(1)),
    };
  } catch {
    return { usedBytes: 14500, formatted: '14.2 KB / 5 MB', percent: 3.5 };
  }
}
