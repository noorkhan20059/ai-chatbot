import React, { useState, useMemo } from 'react';
import { Conversation } from '../types/chat';
import {
  Plus,
  Search,
  MessageSquare,
  Edit2,
  Trash2,
  Database,
  Terminal,
  Key,
  Moon,
  Sun,
  X,
  Sparkles,
} from 'lucide-react';

interface SidebarProps {
  conversations: Conversation[];
  activeId: string;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onRenameChat: (id: string) => void;
  onDeleteChat: (id: string) => void;
  storageStats: { usedBytes: number; formatted: string; percent: number };
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onOpenDocs: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeId,
  onSelectConversation,
  onNewChat,
  onRenameChat,
  onDeleteChat,
  storageStats,
  theme,
  onToggleTheme,
  onOpenDocs,
  isOpenMobile,
  onCloseMobile,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter conversations by search term
  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.messages.some((m) => m.content.toLowerCase().includes(q))
    );
  }, [conversations, searchQuery]);

  // Group conversations by time category
  const categorized = useMemo(() => {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const today: Conversation[] = [];
    const yesterday: Conversation[] = [];
    const last7Days: Conversation[] = [];
    const older: Conversation[] = [];

    filtered.forEach((conv) => {
      const diff = now - conv.updatedAt;
      if (diff < oneDay) {
        today.push(conv);
      } else if (diff < oneDay * 2) {
        yesterday.push(conv);
      } else if (diff < oneDay * 7) {
        last7Days.push(conv);
      } else {
        older.push(conv);
      }
    });

    return { today, yesterday, last7Days, older };
  }, [filtered]);

  const renderGroup = (title: string, list: Conversation[]) => {
    if (list.length === 0) return null;
    return (
      <div className="flex flex-col gap-1 mb-3">
        <span className="text-[11px] font-semibold text-[#908fa0] uppercase tracking-wider px-2 py-0.5">
          {title}
        </span>
        {list.map((conv) => {
          const isActive = conv.id === activeId;
          return (
            <div
              key={conv.id}
              onClick={() => {
                onSelectConversation(conv.id);
                onCloseMobile();
              }}
              className={`group flex items-center justify-between p-2 rounded-xl cursor-pointer transition-all ${
                isActive
                  ? 'bg-[#2a2a2c] text-[#f4f4f6] font-medium shadow-sm'
                  : 'text-[#c7c4d7] hover:bg-[#201f22] hover:text-[#f4f4f6]'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate flex-1 min-w-0 mr-1">
                <MessageSquare
                  size={15}
                  className={isActive ? 'text-indigo-400 shrink-0' : 'text-[#908fa0] shrink-0'}
                />
                <span className="text-xs truncate">{conv.title}</span>
              </div>
              <div
                className={`flex items-center gap-1 transition-opacity ${
                  isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => onRenameChat(conv.id)}
                  className="p-1 rounded hover:bg-[#353437] text-[#908fa0] hover:text-indigo-300 transition-colors"
                  title="Rename title"
                >
                  <Edit2 size={13} />
                </button>
                <button
                  onClick={() => onDeleteChat(conv.id)}
                  className="p-1 rounded hover:bg-[#353437] text-[#908fa0] hover:text-rose-400 transition-colors"
                  title="Delete chat"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Main Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 w-72 bg-[#18181b] border-r border-[#2d2c33] z-50 flex flex-col justify-between transition-transform duration-200 lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Header */}
          <div className="h-14 px-4 flex items-center justify-between border-b border-[#2d2c33]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-sky-400 p-[1.5px] shadow-sm">
                <div className="w-full h-full bg-[#18181b] rounded-[10px] flex items-center justify-center">
                  <Sparkles size={16} className="text-indigo-400 animate-pulse" />
                </div>
              </div>
              <div>
                <span className="font-semibold text-sm text-[#f4f4f6] tracking-tight flex items-center gap-1.5">
                  Gemini Next
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-normal">
                    v2.4
                  </span>
                </span>
              </div>
            </div>
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 rounded-lg text-[#908fa0] hover:text-white hover:bg-[#2a2a2c] transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* New Chat CTA */}
          <div className="p-3.5 pb-2">
            <button
              onClick={() => {
                onNewChat();
                onCloseMobile();
              }}
              className="flex items-center justify-between w-full py-2.5 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] text-white font-medium text-xs shadow-md shadow-indigo-600/20 transition-all"
            >
              <div className="flex items-center gap-2">
                <Plus size={16} />
                <span>New Chat Session</span>
              </div>
              <kbd className="font-mono text-[10px] bg-white/20 px-1.5 py-0.5 rounded text-white/90">
                ⌘K
              </kbd>
            </button>
          </div>

          {/* Search Box */}
          <div className="px-3.5 py-1">
            <div className="relative w-full">
              <Search size={14} className="absolute left-3 top-2.5 text-[#908fa0]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search prompts..."
                className="w-full bg-[#201f22] text-[#f4f4f6] text-xs pl-8 pr-3 py-2 rounded-xl placeholder-[#908fa0] border border-transparent focus:border-[#3e3d48] focus:outline-none transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-[#908fa0] hover:text-white"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          {/* History List */}
          <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
            {renderGroup('Today', categorized.today)}
            {renderGroup('Yesterday', categorized.yesterday)}
            {renderGroup('Previous 7 Days', categorized.last7Days)}
            {renderGroup('Older History', categorized.older)}

            {filtered.length === 0 && (
              <div className="text-center py-8 px-4 text-[#908fa0] text-xs">
                No matching conversations found.
              </div>
            )}
          </div>

          {/* Footer Utility & Quota Section */}
          <div className="p-3 bg-[#131315] border-t border-[#2d2c33] flex flex-col gap-2.5">
            {/* Storage Quota Meter */}
            <div className="p-2.5 rounded-xl bg-[#1c1b1d] border border-[#2d2c33] flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-[#908fa0] text-[11px]">
                <span className="flex items-center gap-1.5">
                  <Database size={13} className="text-sky-400" />
                  Storage Sync
                </span>
                <span className="font-mono text-[10px] text-[#c7c4d7]">
                  {storageStats.formatted}
                </span>
              </div>
              <div className="w-full bg-[#2a2a2c] h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-sky-400 h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.max(3, storageStats.percent)}%` }}
                />
              </div>
            </div>

            {/* Route Handler & Status */}
            <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-[#1c1b1d] text-[11px] text-[#908fa0]">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-mono text-[10px] text-[#c7c4d7]">/api/chat [App Router]</span>
              </div>
              <span className="text-emerald-400 text-[10px] font-semibold bg-emerald-500/10 px-1.5 py-0.5 rounded">
                Free Tier
              </span>
            </div>

            {/* API Key Status */}
            <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-[#1c1b1d] text-[11px] text-[#908fa0]">
              <div className="flex items-center gap-1.5">
                <Key size={13} className="text-indigo-400" />
                <span>API Key</span>
              </div>
              <span className="text-indigo-400 text-[10px] font-medium bg-indigo-500/10 px-1.5 py-0.5 rounded">
                Active & Secured
              </span>
            </div>

            {/* Next.js Docs & Theme Toggles */}
            <div className="flex items-center justify-between gap-1 pt-1">
              <button
                onClick={onOpenDocs}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[#908fa0] hover:text-white hover:bg-[#201f22] text-xs transition-colors flex-1"
              >
                <Terminal size={14} className="text-indigo-400" />
                <span>Architecture Guide</span>
              </button>

              <button
                onClick={onToggleTheme}
                className="p-1.5 rounded-lg text-[#908fa0] hover:text-white hover:bg-[#201f22] transition-colors"
                title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
              >
                {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
