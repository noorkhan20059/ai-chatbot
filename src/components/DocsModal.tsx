import React, { useState } from 'react';
import { X, Copy, Check, Terminal, FolderTree, Key, Play, ShieldAlert, Cloud } from 'lucide-react';

interface DocsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DocsModal: React.FC<DocsModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'vercel' | 'structure' | 'env' | 'route' | 'install'>('vercel');
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(id);
    setTimeout(() => setCopiedSnippet(null), 2000);
  };

  const vercelJsonSnippet = `{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "vite",
  "buildCommand": "vite build",
  "outputDirectory": "dist",
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/$1"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}`;

  const envSnippet = `# Obtain free key from https://aistudio.google.com/
GEMINI_API_KEY="your-gemini-api-key-here"

# Runtime configuration
GEMINI_MODEL="gemini-3.1-flash-lite"
PORT=3000
NEXT_PUBLIC_APP_URL="http://localhost:3000"`;

  const routeSnippet = `// api/chat.ts (Vercel Serverless Function)
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
});

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { prompt, model = 'gemini-3.1-flash-lite' } = req.body;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
  });

  return res.json({ text: response.text });
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
                Deployment & Architecture Guide
              </h2>
              <p className="text-xs text-[#908fa0]">
                Vercel deployment setup, serverless route handlers, and environment variables
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
            onClick={() => setActiveTab('vercel')}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'vercel'
                ? 'text-indigo-300 border-indigo-400 bg-[#1c1b1d]/60 rounded-t-lg'
                : 'text-[#908fa0] border-transparent hover:text-[#e5e1e4]'
            }`}
          >
            <Cloud size={14} className="text-emerald-400" />
            Vercel Deployment (Fix 404)
          </button>
          <button
            onClick={() => setActiveTab('structure')}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'structure'
                ? 'text-indigo-300 border-indigo-400 bg-[#1c1b1d]/60 rounded-t-lg'
                : 'text-[#908fa0] border-transparent hover:text-[#e5e1e4]'
            }`}
          >
            <FolderTree size={14} />
            Directory Tree
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
            Environment (.env)
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
            Route Handler
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
            Local Run
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 bg-[#1c1b1d] space-y-4">
          {activeTab === 'vercel' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-xs text-indigo-200 leading-relaxed space-y-2">
                <div className="flex items-center gap-2 font-semibold text-indigo-300 text-sm">
                  <span>🚀 How to Sync Image, Doc & Voice Features to Vercel</span>
                </div>
                <p>
                  The Image, Document, and Voice buttons are running live here in your AI Studio build. Because your Vercel site (<strong className="text-white">ai-chatbot-tau-three-34.vercel.app</strong>) automatically builds from your GitHub repository (<strong className="text-white">noorkhan20059/ai-chatbot</strong>), you simply need to push the updated files to GitHub!
                </p>
                <div className="pt-1">
                  <a
                    href="/gemini-nextjs-latest.zip"
                    download="gemini-nextjs-latest.zip"
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-md transition-all"
                  >
                    <Play size={14} className="fill-current" />
                    <span>📥 Download Complete Project ZIP</span>
                  </a>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#f4f4f6]">
                  Method 1: Quick GitHub Upload (2 minutes)
                </h3>
                <ol className="list-decimal list-inside space-y-1.5 text-xs text-[#c7c4d7]">
                  <li>Click the <strong className="text-white">Download Complete Project ZIP</strong> button above.</li>
                  <li>Extract the ZIP on your computer.</li>
                  <li>Open your GitHub repository at <strong className="text-white">github.com/noorkhan20059/ai-chatbot</strong>.</li>
                  <li>Drag and drop the extracted files (especially <code className="text-indigo-300 font-mono">src/components/PromptComposer.tsx</code>, <code className="text-indigo-300 font-mono">src/components/MessageItem.tsx</code>, and <code className="text-indigo-300 font-mono">src/App.tsx</code>).</li>
                  <li>Click <strong className="text-white">Commit changes</strong>. Vercel will auto-deploy the new buttons within 30 seconds!</li>
                </ol>
              </div>

              <div className="space-y-2 pt-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#f4f4f6]">
                  Method 2: Git Command Line
                </h3>
                <div className="p-3.5 bg-[#0e0e10] border border-[#2d2c33] rounded-xl font-mono text-xs text-[#e5e1e4] space-y-1">
                  <div className="text-[#908fa0]"># In your local repository folder:</div>
                  <div className="text-emerald-300">git add .</div>
                  <div className="text-emerald-300">git commit -m "Add Image, Doc, Voice support and fix Vercel deployment"</div>
                  <div className="text-emerald-300">git push origin main</div>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#f4f4f6]">
                  Step 3: Set GEMINI_API_KEY in Vercel
                </h3>
                <ol className="list-decimal list-inside space-y-1.5 text-xs text-[#c7c4d7]">
                  <li>Go to your project dashboard at <strong className="text-white">vercel.com</strong>.</li>
                  <li>Click <strong className="text-white">Settings</strong> &rarr; <strong className="text-white">Environment Variables</strong>.</li>
                  <li>Add variable name: <code className="text-indigo-300 font-mono bg-[#201f22] px-1.5 py-0.5 rounded">GEMINI_API_KEY</code> with your key.</li>
                  <li>Save and redeploy.</li>
                </ol>
              </div>

              <div className="p-3 bg-[#201f22] rounded-xl text-xs text-[#908fa0] leading-relaxed">
                💡 <strong>How it works:</strong> <code className="text-white font-mono">vercel.json</code> rewrites requests from <code className="text-indigo-300 font-mono">/api/chat</code> directly to the serverless function <code className="text-indigo-300 font-mono">api/chat.ts</code>, preventing any 404 errors.
              </div>
            </div>
          )}

          {activeTab === 'structure' && (
            <div className="space-y-3">
              <p className="text-xs text-[#c7c4d7]">
                Unified folder structure supporting both local development and Vercel serverless deployment:
              </p>
              <div className="p-4 bg-[#0e0e10] border border-[#2d2c33] rounded-xl font-mono text-xs text-[#e5e1e4] leading-relaxed">
                <pre className="m-0">{`my-gemini-app/
├── api/
│   ├── chat.ts                  # Vercel Serverless Function (/api/chat)
│   └── health.ts                # Serverless Health Check (/api/health)
├── src/
│   ├── components/              # ChatHeader, MessageItem, Sidebar, Composer
│   ├── types/chat.ts            # Chat interfaces
│   ├── utils/storage.ts         # LocalStorage CRUD & byte quota
│   └── App.tsx                  # Main client application
├── vercel.json                  # Vercel deployment rewrites & build config
├── server.ts                    # Full-stack local dev server
├── .env.local.example           # Environment variable template
└── package.json`}</pre>
              </div>
            </div>
          )}

          {activeTab === 'env' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-[#c7c4d7]">
                  Configure your environment variables in <code className="text-indigo-300 font-mono">.env.local</code>:
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
                  Vercel Serverless Function (<code className="text-indigo-300 font-mono">api/chat.ts</code>):
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
                <div className="text-[#908fa0]"># 1. Install dependencies</div>
                <div className="text-emerald-300">npm install</div>
                <div className="text-[#908fa0] pt-2"># 2. Run local development server</div>
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
            Vercel Serverless & Next.js Compatible
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
