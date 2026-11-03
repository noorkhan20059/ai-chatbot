import React, { useState, useEffect } from 'react';
import { X, Key, ShieldCheck, Check, ExternalLink } from 'lucide-react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeySaved: (key: string) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, onKeySaved }) => {
  const [apiKey, setApiKey] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const existing = localStorage.getItem('gemini_custom_api_key') || '';
      setApiKey(existing);
      setSaved(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = apiKey.trim();
    if (trimmed) {
      localStorage.setItem('gemini_custom_api_key', trimmed);
      onKeySaved(trimmed);
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        onClose();
      }, 1200);
    } else {
      localStorage.removeItem('gemini_custom_api_key');
      onKeySaved('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-md bg-[#1c1b1d] border border-[#2d2c33] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-[#201f22] border-b border-[#2d2c33] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <Key size={16} />
            </div>
            <h2 className="text-sm font-semibold text-[#f4f4f6]">Gemini API Key Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#908fa0] hover:text-white hover:bg-[#2a2a2c] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSave} className="p-6 space-y-4">
          <p className="text-xs text-[#c7c4d7] leading-relaxed">
            If your Vercel deployment encounters authentication errors (401 Unauthorized), enter your official Google Gemini API key below. It is stored securely in your browser's local storage and never exposed publicly.
          </p>

          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-[#908fa0] uppercase tracking-wider">
              Google Gemini API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full bg-[#131315] border border-[#2d2c33] rounded-xl px-3 py-2.5 text-xs text-[#f4f4f6] placeholder-[#908fa0] focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-[#908fa0]">
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-400 hover:underline inline-flex items-center gap-1"
            >
              <span>Get a free key from Google AI Studio</span>
              <ExternalLink size={11} />
            </a>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl bg-[#2a2a2c] hover:bg-[#353437] text-xs text-[#c7c4d7] hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs text-white font-medium shadow-md shadow-indigo-600/20 transition-all"
            >
              {saved ? (
                <>
                  <Check size={14} className="text-emerald-300" />
                  <span>Saved!</span>
                </>
              ) : (
                <span>Save API Key</span>
              )}
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-3 bg-[#201f22] border-t border-[#2d2c33] flex items-center gap-2 text-[11px] text-[#908fa0]">
          <ShieldCheck size={13} className="text-emerald-400 shrink-0" />
          <span>Keys are stored strictly in browser localStorage and sent securely to backend.</span>
        </div>
      </div>
    </div>
  );
};
