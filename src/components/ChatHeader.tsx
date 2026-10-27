import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  Sparkles,
  Edit2,
  Terminal,
  Download,
  Trash2,
  Sun,
  Moon,
  ChevronDown,
  Check,
  FileText,
  FileCode,
  User,
} from 'lucide-react';
import { ModelOption } from '../types/chat';

interface ChatHeaderProps {
  title: string;
  onRenameTitle: () => void;
  onClearChat: () => void;
  onOpenDocs: () => void;
  onExport: (format: 'json' | 'md') => void;
  selectedModel: string;
  onSelectModel: (model: string) => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onOpenMobileMenu: () => void;
}

const AVAILABLE_MODELS: ModelOption[] = [
  {
    id: 'gemini-3.1-flash-lite',
    name: 'Gemini 3.1 Flash Lite',
    description: 'Instant, responsive multimodal AI (Free Tier)',
    speed: '~65 t/s',
    default: true,
  },
  {
    id: 'gemini-3.8-flash',
    name: 'Gemini 3.8 Flash',
    description: 'Advanced reasoning model with auto-failover',
    speed: '~42 t/s',
    default: false,
  },
];

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  title,
  onRenameTitle,
  onClearChat,
  onOpenDocs,
  onExport,
  selectedModel,
  onSelectModel,
  theme,
  onToggleTheme,
  onOpenMobileMenu,
}) => {
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);

  const modelRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (modelRef.current && !modelRef.current.contains(e.target as Node)) {
        setModelDropdownOpen(false);
      }
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setExportDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const currentModelObj =
    AVAILABLE_MODELS.find((m) => m.id === selectedModel) || AVAILABLE_MODELS[0];

  return (
    <header className="sticky top-0 left-0 right-0 z-30 bg-[#131315]/90 backdrop-blur-md border-b border-[#2d2c33] px-4 py-2.5 flex flex-wrap items-center justify-between gap-2.5 transition-colors">
      {/* Left Context: Hamburger, Model Pill & Editable Title */}
      <div className="flex items-center gap-2.5 flex-wrap min-w-0">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-1.5 rounded-lg text-[#908fa0] hover:text-white hover:bg-[#201f22] transition-colors"
          title="Open menu"
        >
          <Menu size={18} />
        </button>

        {/* Model Badge with Dropdown */}
        <div className="relative" ref={modelRef}>
          <button
            onClick={() => setModelDropdownOpen((prev) => !prev)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#201f22] hover:bg-[#2a2a2c] border border-[#2d2c33] transition-colors"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-400" />
            </span>
            <span className="text-xs font-medium text-sky-300">
              {currentModelObj.name}
            </span>
            <ChevronDown size={12} className="text-[#908fa0]" />
          </button>

          {modelDropdownOpen && (
            <div className="absolute left-0 mt-1.5 w-64 py-1 bg-[#1c1b1d] border border-[#2d2c33] rounded-xl shadow-2xl z-40">
              <div className="px-3 py-1.5 text-[10px] font-semibold text-[#908fa0] uppercase tracking-wider">
                Select Gemini Model
              </div>
              {AVAILABLE_MODELS.map((model) => (
                <button
                  key={model.id}
                  onClick={() => {
                    onSelectModel(model.id);
                    setModelDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-[#2a2a2c] transition-colors ${
                    model.id === selectedModel ? 'bg-[#2a2a2c]/60' : ''
                  }`}
                >
                  <div>
                    <div className="text-xs font-medium text-[#f4f4f6] flex items-center gap-1.5">
                      {model.name}
                      {model.default && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300">
                          Recommended
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-[#908fa0]">{model.description}</div>
                  </div>
                  {model.id === selectedModel && (
                    <Check size={14} className="text-indigo-400 shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Editable Title */}
        <div className="flex items-center gap-1.5 group max-w-[200px] sm:max-w-xs md:max-w-md truncate">
          <span
            onClick={onRenameTitle}
            className="text-xs sm:text-sm font-semibold text-[#f4f4f6] tracking-tight truncate cursor-pointer hover:underline"
            title="Click to rename"
          >
            {title}
          </span>
          <button
            onClick={onRenameTitle}
            className="p-1 rounded text-[#908fa0] hover:text-[#f4f4f6] hover:bg-[#201f22] transition-colors"
            title="Rename Conversation"
          >
            <Edit2 size={13} />
          </button>
        </div>

        <span className="hidden sm:inline-block text-[10px] font-mono text-[#908fa0] px-1.5 py-0.5 rounded bg-[#1c1b1d] border border-[#2d2c33]">
          v2.4.0-edge
        </span>

        <span className="hidden xl:inline-flex items-center gap-1 text-[10px] font-medium text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
          ⚡ Direct Mode · Temp 0.3
        </span>
      </div>

      {/* Right Controls: Docs, Export, Clear, Theme, Latency */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Next.js Setup & API Button */}
        <button
          onClick={onOpenDocs}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#201f22] hover:bg-[#2a2a2c] border border-[#2d2c33] text-[#f4f4f6] text-xs font-medium transition-colors shadow-sm"
        >
          <Terminal size={14} className="text-indigo-400" />
          <span className="hidden md:inline">Next.js Setup & API</span>
          <span className="md:hidden">Setup</span>
        </button>

        {/* Export Dropdown */}
        <div className="relative" ref={exportRef}>
          <button
            onClick={() => setExportDropdownOpen((prev) => !prev)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#201f22] hover:bg-[#2a2a2c] border border-[#2d2c33] text-[#c7c4d7] hover:text-[#f4f4f6] text-xs font-medium transition-colors"
            title="Export conversation"
          >
            <Download size={14} />
            <span className="hidden sm:inline">Export</span>
            <ChevronDown size={12} className="text-[#908fa0]" />
          </button>

          {exportDropdownOpen && (
            <div className="absolute right-0 mt-1.5 w-40 py-1 bg-[#1c1b1d] border border-[#2d2c33] rounded-xl shadow-2xl z-40">
              <button
                onClick={() => {
                  onExport('json');
                  setExportDropdownOpen(false);
                }}
                className="w-full text-left px-3 py-1.5 text-xs text-[#f4f4f6] hover:bg-[#2a2a2c] flex items-center gap-2"
              >
                <FileCode size={14} className="text-sky-400" />
                <span>JSON Format</span>
              </button>
              <button
                onClick={() => {
                  onExport('md');
                  setExportDropdownOpen(false);
                }}
                className="w-full text-left px-3 py-1.5 text-xs text-[#f4f4f6] hover:bg-[#2a2a2c] flex items-center gap-2"
              >
                <FileText size={14} className="text-purple-400" />
                <span>Markdown (.md)</span>
              </button>
            </div>
          )}
        </div>

        {/* Clear Chat Button */}
        <button
          onClick={onClearChat}
          className="p-1.5 rounded-xl bg-[#201f22] hover:bg-[#2a2a2c] border border-[#2d2c33] text-[#908fa0] hover:text-rose-400 transition-colors"
          title="Clear messages in this conversation"
        >
          <Trash2 size={15} />
        </button>

        {/* Theme Toggle */}
        <button
          onClick={onToggleTheme}
          className="p-1.5 rounded-xl bg-[#201f22] hover:bg-[#2a2a2c] border border-[#2d2c33] text-[#908fa0] hover:text-[#f4f4f6] transition-colors"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        {/* Speed throughput badge */}
        <div className="hidden xl:flex items-center gap-1 px-2 py-1 rounded-full bg-[#201f22] text-[#908fa0] font-mono text-[11px] border border-[#2d2c33]">
          <span className="text-indigo-400">{currentModelObj.speed}</span>
        </div>

        {/* User avatar */}
        <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-500 to-sky-400 flex items-center justify-center text-white shadow-sm shrink-0">
          <User size={14} />
        </div>
      </div>
    </header>
  );
};
