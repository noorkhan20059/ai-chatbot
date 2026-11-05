import React from 'react';
import { X, Key, ShieldCheck, ExternalLink, Terminal, Cloud } from 'lucide-react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeySaved?: (key: string) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-lg bg-[#1c1b1d] border border-[#2d2c33] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-[#201f22] border-b border-[#2d2c33] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <Key size={16} />
            </div>
            <h2 className="text-sm font-semibold text-[#f4f4f6]">Gemini API Key Configuration</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#908fa0] hover:text-white hover:bg-[#2a2a2c] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-200 leading-relaxed">
            <p className="font-semibold text-indigo-300 mb-1">
              🔒 Server-Side Security Standard
            </p>
            Your Google Gemini API key is strictly maintained on the server runtime via <code className="text-white font-mono bg-indigo-900/40 px-1.5 py-0.5 rounded">GEMINI_API_KEY</code>. It is never exposed in browser scripts or client storage.
          </div>

          <div className="space-y-3 text-xs text-[#c7c4d7]">
            <div className="p-3 bg-[#131315] border border-[#2d2c33] rounded-xl space-y-2">
              <div className="flex items-center gap-2 font-medium text-emerald-400">
                <Cloud size={14} />
                <span>Configuring on Vercel (Production)</span>
              </div>
              <ol className="list-decimal list-inside space-y-1 text-[#908fa0]">
                <li>Go to <strong className="text-white">vercel.com</strong> &rarr; Your Project &rarr; <strong className="text-white">Settings</strong> &rarr; <strong className="text-white">Environment Variables</strong>.</li>
                <li>Set variable name: <code className="text-indigo-300 font-mono">GEMINI_API_KEY</code></li>
                <li>Set value: Your official key starting with <code className="text-emerald-400 font-mono">AIzaSy...</code></li>
                <li>Redeploy your project for the variable to activate.</li>
              </ol>
            </div>

            <div className="p-3 bg-[#131315] border border-[#2d2c33] rounded-xl space-y-2">
              <div className="flex items-center gap-2 font-medium text-indigo-400">
                <Terminal size={14} />
                <span>Configuring in Local Development</span>
              </div>
              <p className="text-[#908fa0]">
                Add to your <code className="text-indigo-300 font-mono">.env.local</code> file:
              </p>
              <pre className="p-2 bg-[#0e0e10] rounded text-emerald-300 font-mono text-[11px] overflow-x-auto">
                GEMINI_API_KEY="AIzaSy..."
              </pre>
            </div>

            <div className="flex items-center justify-between pt-1">
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-400 hover:underline inline-flex items-center gap-1.5 text-xs font-medium"
              >
                <span>Obtain official API key from Google AI Studio</span>
                <ExternalLink size={12} />
              </a>
            </div>
          </div>

          {/* Action */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs text-white font-medium transition-colors shadow-sm"
            >
              Close
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[#201f22] border-t border-[#2d2c33] flex items-center gap-2 text-[11px] text-[#908fa0]">
          <ShieldCheck size={13} className="text-emerald-400 shrink-0" />
          <span>Follows Google AI Studio & Next.js production security standards.</span>
        </div>
      </div>
    </div>
  );
};
