import React, { useState } from 'react';
import { X, Copy, Check, Terminal, FolderTree, Key, Play, ShieldAlert } from 'lucide-react';

interface DocsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DocsModal: React.FC<DocsModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'structure' | 'env' | 'route' | 'install'>('structure');
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(id);
    setTimeout(() => setCopiedSnippet(null), 2000);
  };

  const envSnippet = `# Obtain free key from https://aistudio.google.com/
GEMINI_API_KEY="your-gemini-api-key-here"

# Runtime configuration
GEMINI_MODEL="gemini-3.8-flash"
PORT=3000
NEXT_PUBLIC_APP_URL="http://localhost:3000"`;

  const routeSnippet = `// app/api/chat/route.ts (or server.ts in Express full-stack)
import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';

// Server-side initialization ensures API key is never exposed to the client
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

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });

    return NextResponse.json({
      text: response.text,
      model,
      usage: response.usageMetadata,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-3xl bg-[#1c1b1d] border border-[#2d2c33] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-[#201f22] border-b border-[#2d2c33] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <Terminal size={19} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#f4f4f6]">
                Next.js 14 + Gemini Project Architecture
              </h2>
              <p className="text-xs text-[#908fa0]">
                Server-side Route Handler, secure environment variables, and token streaming
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#908fa0] hover:text-[#f4f4f6] hover:bg-[#2a2a2c] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-[#201f22] px-6 gap-2 border-b border-[#2d2c33] overflow-x-auto">
          <button
            onClick={() => setActiveTab('structure')}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'structure'
                ? 'text-indigo-300 border-indigo-400 bg-[#1c1b1d]/60 rounded-t-lg'
                : 'text-[#908fa0] border-transparent hover:text-[#e5e1e4]'
            }`}
          >
            <FolderTree size={14} />
            1. Directory Structure
          </button>
          <button
            onClick={() => setActiveTab('env')}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'env'
                ? 'text-indigo-300 border-indigo-400 bg-[#1c1b1d]/60 rounded-t-lg'
                : 'text-[#908fa0] border-transparent hover:text-[#e5e1e4]'
            }`}
          >
            <Key size={14} />
            2. .env.local
          </button>
          <button
            onClick={() => setActiveTab('route')}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'route'
                ? 'text-indigo-300 border-indigo-400 bg-[#1c1b1d]/60 rounded-t-lg'
                : 'text-[#908fa0] border-transparent hover:text-[#e5e1e4]'
            }`}
          >
            <Terminal size={14} />
            3. Route Handler
          </button>
          <button
            onClick={() => setActiveTab('install')}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'install'
                ? 'text-indigo-300 border-indigo-400 bg-[#1c1b1d]/60 rounded-t-lg'
                : 'text-[#908fa0] border-transparent hover:text-[#e5e1e4]'
            }`}
          >
            <Play size={14} />
            4. Install & Run
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 bg-[#1c1b1d] space-y-4">
          {activeTab === 'structure' && (
            <div className="space-y-3">
              <p className="text-xs text-[#c7c4d7]">
                Production-grade folder structure separating server-side AI handling from responsive client UI components:
              </p>
              <div className="p-4 bg-[#0e0e10] border border-[#2d2c33] rounded-xl font-mono text-xs text-[#e5e1e4] leading-relaxed">
                <pre className="m-0">{`my-gemini-nextjs-app/
├── app/ (or src/ for React SPA)
│   ├── api/
│   │   └── chat/
│   │       └── route.ts         # Secure Route Handler proxying Gemini SDK
│   ├── layout.tsx               # Root application layout
│   └── page.tsx                 # Main client conversation interface
├── components/
│   ├── ChatArea.tsx             # Interactive conversation thread
│   ├── MessageTurn.tsx          # Markdown, code blocks & copy actions
│   ├── Sidebar.tsx              # CRUD history & LocalStorage persistence
│   └── PromptComposer.tsx       # Auto-expanding textarea & suggestion pills
├── lib/
│   └── gemini.ts                # Server-only GoogleGenAI client singleton
├── utils/
│   └── storage.ts               # LocalStorage CRUD & byte quota calculation
├── .env.local                   # Secret API Key (Never committed to Git!)
└── package.json`}</pre>
              </div>
            </div>
          )}

          {activeTab === 'env' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-[#c7c4d7]">
                  Configure your server-side environment variables in <code className="text-indigo-300 font-mono">.env.local</code>:
                </p>
                <button
                  onClick={() => copyToClipboard(envSnippet, 'env')}
                  className="flex items-center gap-1 text-xs text-indigo-300 hover:text-white px-2 py-1 rounded bg-[#2a2a2c] transition-colors"
                >
                  {copiedSnippet === 'env' ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                  <span>{copiedSnippet === 'env' ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
              <div className="p-4 bg-[#0e0e10] border border-[#2d2c33] rounded-xl font-mono text-xs text-[#e5e1e4] leading-relaxed">
                <pre className="m-0">{envSnippet}</pre>
              </div>
              <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-2.5 text-xs text-amber-200">
                <ShieldAlert size={16} className="text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong>Security Best Practice:</strong> Do not prefix <code className="font-mono text-amber-300">GEMINI_API_KEY</code> with <code className="font-mono text-amber-300">NEXT_PUBLIC_</code>. Environment variables without that prefix remain isolated strictly on the server-side runtime, eliminating client exposure.
                </div>
              </div>
            </div>
          )}

          {activeTab === 'route' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-[#c7c4d7]">
                  Server-side Route Handler (<code className="text-indigo-300 font-mono">app/api/chat/route.ts</code>):
                </p>
                <button
                  onClick={() => copyToClipboard(routeSnippet, 'route')}
                  className="flex items-center gap-1 text-xs text-indigo-300 hover:text-white px-2 py-1 rounded bg-[#2a2a2c] transition-colors"
                >
                  {copiedSnippet === 'route' ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                  <span>{copiedSnippet === 'route' ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
              <div className="p-4 bg-[#0e0e10] border border-[#2d2c33] rounded-xl font-mono text-xs text-[#e5e1e4] leading-relaxed overflow-x-auto max-h-72">
                <pre className="m-0">{routeSnippet}</pre>
              </div>
            </div>
          )}

          {activeTab === 'install' && (
            <div className="space-y-3">
              <p className="text-xs text-[#c7c4d7]">
                Quick installation commands to run locally:
              </p>
              <div className="p-4 bg-[#0e0e10] border border-[#2d2c33] rounded-xl font-mono text-xs text-[#e5e1e4] space-y-2">
                <div className="text-[#908fa0]"># 1. Install official Google GenAI SDK</div>
                <div className="text-emerald-300">npm install @google/genai</div>
                <div className="text-[#908fa0] pt-2"># 2. Run full-stack dev server</div>
                <div className="text-emerald-300">npm run dev</div>
              </div>
              <p className="text-xs text-emerald-400 flex items-center gap-1.5 pt-1">
                ✓ Ready at http://localhost:3000 with live /api/chat endpoint
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-[#201f22] border-t border-[#2d2c33] flex items-center justify-between">
          <span className="text-xs text-[#908fa0]">
            Complies with official Google AI Studio guidelines
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors shadow-sm"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
