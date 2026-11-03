import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Conversation, ChatMessage } from './types/chat';
import {
  getStoredConversations,
  saveStoredConversations,
  getActiveConversationId,
  setActiveConversationId,
  getStoredTheme,
  setStoredTheme,
  calculateStorageStats,
} from './utils/storage';
import { Sidebar } from './components/Sidebar';
import { ChatHeader } from './components/ChatHeader';
import { MessageItem } from './components/MessageItem';
import { PromptComposer, ComposerAttachment } from './components/PromptComposer';
import { DocsModal } from './components/DocsModal';
import { RenameModal } from './components/RenameModal';
import { Zap, ArrowRight, Loader2, Sparkles, MessageSquareDashed } from 'lucide-react';

export default function App() {
  const [conversations, setConversations] = useState<Conversation[]>(getStoredConversations);
  const [activeId, setActiveId] = useState<string>(() => {
    const saved = getActiveConversationId();
    if (saved && conversations.some((c) => c.id === saved)) return saved;
    return conversations[0]?.id || 'default-chat';
  });

  const [theme, setTheme] = useState<'dark' | 'light'>(getStoredTheme);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStreamingText, setCurrentStreamingText] = useState('');
  const [storageStats, setStorageStats] = useState(calculateStorageStats);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Modals
  const [docsModalOpen, setDocsModalOpen] = useState(false);
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [renameTargetId, setRenameTargetId] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Ensure active conversation exists
  const activeConversation =
    conversations.find((c) => c.id === activeId) ||
    conversations[0] || {
      id: 'default-chat',
      title: 'New Conversation',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      model: 'gemini-3.1-flash-lite',
      messages: [],
    };

  // Sync to localStorage
  useEffect(() => {
    saveStoredConversations(conversations);
    setStorageStats(calculateStorageStats());
  }, [conversations]);

  // Sync active ID
  useEffect(() => {
    setActiveConversationId(activeId);
  }, [activeId]);

  // Initial theme setup
  useEffect(() => {
    setStoredTheme(theme);
  }, [theme]);

  // Global keyboard shortcuts (Cmd+K for new chat)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        handleNewChat();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [conversations]);

  // Auto-scroll to bottom
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeConversation.messages, isGenerating, currentStreamingText]);

  // Toggle Theme
  const handleToggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    setStoredTheme(nextTheme);
  };

  // Create New Chat
  const handleNewChat = () => {
    const newId = `chat-${Date.now()}`;
    const newConv: Conversation = {
      id: newId,
      title: `New Conversation #${Math.floor(Math.random() * 900 + 100)}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      model: activeConversation.model || 'gemini-3.1-flash-lite',
      messages: [],
    };

    setConversations((prev) => [newConv, ...prev]);
    setActiveId(newId);
  };

  // Select Conversation
  const handleSelectConversation = (id: string) => {
    if (isGenerating) {
      abortControllerRef.current?.abort();
      setIsGenerating(false);
      setCurrentStreamingText('');
    }
    setActiveId(id);
  };

  // Rename Conversation Trigger
  const handleOpenRename = (id?: string) => {
    setRenameTargetId(id || activeId);
    setRenameModalOpen(true);
  };

  // Save Renamed Conversation Title
  const handleSaveRename = (newTitle: string) => {
    const targetId = renameTargetId || activeId;
    setConversations((prev) =>
      prev.map((c) =>
        c.id === targetId ? { ...c, title: newTitle, updatedAt: Date.now() } : c
      )
    );
    setRenameModalOpen(false);
  };

  // Delete Conversation
  const handleDeleteChat = (id: string) => {
    const convToDelete = conversations.find((c) => c.id === id);
    const confirmMsg = `Delete "${convToDelete?.title || 'this conversation'}" permanently?`;
    if (!window.confirm(confirmMsg)) return;

    setConversations((prev) => {
      const remaining = prev.filter((c) => c.id !== id);
      if (remaining.length === 0) {
        const fresh: Conversation = {
          id: `chat-${Date.now()}`,
          title: 'New Conversation',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          model: 'gemini-3.1-flash-lite',
          messages: [],
        };
        setActiveId(fresh.id);
        return [fresh];
      }
      if (activeId === id) {
        setActiveId(remaining[0].id);
      }
      return remaining;
    });
  };

  // Clear Messages in current conversation
  const handleClearCurrentChat = () => {
    if (window.confirm('Clear all messages in this conversation thread?')) {
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeId ? { ...c, messages: [], updatedAt: Date.now() } : c
        )
      );
    }
  };

  // Select Model
  const handleSelectModel = (modelId: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === activeId ? { ...c, model: modelId } : c))
    );
  };

  // Export Conversation
  const handleExport = (format: 'json' | 'md') => {
    if (format === 'json') {
      const dataStr = JSON.stringify(activeConversation, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${activeConversation.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}.json`;
      a.click();
    } else {
      let md = `# Conversation: ${activeConversation.title}\n`;
      md += `Model: ${activeConversation.model}\n`;
      md += `Date: ${new Date(activeConversation.createdAt).toLocaleString()}\n\n---\n\n`;

      activeConversation.messages.forEach((msg) => {
        const role = msg.role === 'user' ? '### User' : '### Gemini AI';
        md += `${role} (${new Date(msg.timestamp).toLocaleTimeString()}):\n\n${msg.content}\n\n`;
      });

      const blob = new Blob([md], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${activeConversation.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}.md`;
      a.click();
    }
  };

  // Send Message & Stream Gemini Response
  const handleSendMessage = async (userPrompt: string, attachments?: ComposerAttachment[]) => {
    if ((!userPrompt.trim() && (!attachments || attachments.length === 0)) || isGenerating) return;

    const userMessageId = `msg-u-${Date.now()}`;
    const userMessage: ChatMessage = {
      id: userMessageId,
      role: 'user',
      content: userPrompt,
      timestamp: Date.now(),
      tokenCount: Math.ceil((userPrompt || '').length / 4),
      attachments: attachments?.map((a) => ({
        id: a.id,
        name: a.name,
        type: a.type,
        mimeType: a.mimeType,
        size: a.size,
        previewUrl: a.previewUrl,
        durationSec: a.durationSec,
      })),
    };

    // Auto update title if generic
    const shouldRenameTitle =
      activeConversation.messages.length === 0 ||
      activeConversation.title.startsWith('New Conversation');
    const autoTitle = shouldRenameTitle
      ? userPrompt
        ? userPrompt.slice(0, 36) + (userPrompt.length > 36 ? '...' : '')
        : `Analysis: ${attachments?.[0]?.name || 'Media'}`
      : activeConversation.title;

    // Update state with user message
    const updatedMessages = [...activeConversation.messages, userMessage];

    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeId
          ? {
              ...c,
              title: autoTitle,
              updatedAt: Date.now(),
              messages: updatedMessages,
            }
          : c
      )
    );

    // Prepare assistant placeholder turn
    const assistantMessageId = `msg-a-${Date.now()}`;
    setIsGenerating(true);
    setCurrentStreamingText('');

    const controller = new AbortController();
    abortControllerRef.current = controller;
    const startTime = Date.now();

    try {
      // Send conversational context to server route
      const payloadMessages = updatedMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const payloadAttachments = attachments?.map((a) => ({
        id: a.id,
        name: a.name,
        type: a.type,
        mimeType: a.mimeType,
        data: a.base64Data,
        text: a.textContent,
      }));

      let res: Response | null = null;
      let isDirectFallback = false;

      try {
        res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: userPrompt,
            messages: payloadMessages,
            attachments: payloadAttachments,
            model: activeConversation.model || 'gemini-3.1-flash-lite',
            stream: true,
          }),
          signal: controller.signal,
        });
      } catch (networkErr: any) {
        if (networkErr.name === 'AbortError') throw networkErr;
        isDirectFallback = true;
      }

      // If /api/chat is 404 on Vercel static deployment, fallback directly to Gemini SSE
      if (!res || res.status === 404) {
        isDirectFallback = true;
      }

      if (isDirectFallback) {
        const DIRECT_KEY = 'AQ.Ab8RN6KyEVPKDi53bBYId6awYNXqJrhuyybOvQ1XCG2J4-rfgQ';
        const parts: any[] = [];

        if (payloadAttachments && payloadAttachments.length > 0) {
          for (const att of payloadAttachments) {
            if (att.data) {
              parts.push({
                inline_data: {
                  mime_type: att.mimeType || 'image/jpeg',
                  data: att.data.replace(/^data:[^;]+;base64,/, ''),
                },
              });
            } else if (att.text) {
              parts.push({ text: `[Document: ${att.name}]\n${att.text}` });
            }
          }
        }

        if (userPrompt) {
          parts.push({ text: userPrompt });
        }

        const directContents = payloadMessages.slice(-6).map((m) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        }));
        directContents.push({ role: 'user', parts });

        const directUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:streamGenerateContent?alt=sse&key=${DIRECT_KEY}`;
        res = await fetch(directUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: directContents,
            system_instruction: {
              parts: [{ text: 'You are an accurate, concise, ultra-fast AI assistant. Answer directly without fluff.' }],
            },
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 2048,
            },
          }),
          signal: controller.signal,
        });
      }

      if (!res || !res.ok) {
        const errorData = await res?.json().catch(() => ({}));
        let errMsg = errorData?.error?.message || errorData?.error;
        if (!errMsg) {
          errMsg = `HTTP ${res?.status || 500}: Failed to reach Gemini API. Please check your network connection.`;
        }
        throw new Error(errMsg);
      }

      // Read SSE stream
      const reader = res.body?.getReader();
      if (!reader) throw new Error('Readable stream not supported');

      const decoder = new TextDecoder();
      let accumulatedText = '';
      let latencyMs = 0;
      let firstTokenMs: number | undefined = undefined;
      let totalTokens = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunkStr = decoder.decode(value, { stream: true });
        const lines = chunkStr.split('\n');

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;
          const dataContent = trimmed.replace(/^data:\s*/, '');

          if (dataContent === '[DONE]') {
            break;
          }

          try {
            const parsed = JSON.parse(dataContent);
            if (parsed.error) {
              throw new Error(parsed.error.message || parsed.error);
            }

            // Supports both /api/chat format and Google GenerativeLanguage SSE format
            let incomingChunk = '';
            if (parsed.text) {
              incomingChunk = parsed.text;
            } else if (parsed.candidates?.[0]?.content?.parts?.[0]?.text) {
              incomingChunk = parsed.candidates[0].content.parts[0].text;
            }

            if (incomingChunk) {
              if (firstTokenMs === undefined) {
                firstTokenMs = Date.now() - startTime;
              }
              accumulatedText += incomingChunk;
              setCurrentStreamingText(accumulatedText);
            }

            if (parsed.elapsedMs) {
              latencyMs = parsed.elapsedMs;
            }
            if (parsed.firstTokenMs) {
              firstTokenMs = parsed.firstTokenMs;
            }
            if (parsed.estimatedTokens) {
              totalTokens = parsed.estimatedTokens;
            } else if (parsed.usageMetadata?.totalTokenCount) {
              totalTokens = parsed.usageMetadata.totalTokenCount;
            }
          } catch (e: any) {
            // Ignore partial JSON splits
          }
        }
      }

      const totalElapsed = latencyMs || Date.now() - startTime;
      const finalAssistantMessage: ChatMessage = {
        id: assistantMessageId,
        role: 'assistant',
        content: accumulatedText || 'No response returned from Gemini.',
        timestamp: Date.now(),
        latencyMs: totalElapsed,
        firstTokenMs,
        tokenCount: totalTokens || Math.ceil((accumulatedText || '').length / 4),
      };

      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeId
            ? {
                ...c,
                updatedAt: Date.now(),
                messages: [...c.messages, finalAssistantMessage],
              }
            : c
        )
      );

      // Trigger celebratory confetti on first prompt completion
      if (activeConversation.messages.length === 0) {
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#818cf8', '#38bdf8', '#c084fc'],
        });
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // User stopped generation manually
        if (accumulatedTextRef.current) {
          const stoppedMessage: ChatMessage = {
            id: assistantMessageId,
            role: 'assistant',
            content: accumulatedTextRef.current + ' *(Generation stopped)*',
            timestamp: Date.now(),
            latencyMs: Date.now() - startTime,
          };
          setConversations((prev) =>
            prev.map((c) =>
              c.id === activeId
                ? { ...c, messages: [...c.messages, stoppedMessage] }
                : c
            )
          );
        }
      } else {
        console.error('Chat generation error:', err);
        const errorMessage: ChatMessage = {
          id: assistantMessageId,
          role: 'assistant',
          content: err.message || 'Error occurred while contacting Gemini API.',
          timestamp: Date.now(),
          error: true,
        };
        setConversations((prev) =>
          prev.map((c) =>
            c.id === activeId
              ? { ...c, messages: [...c.messages, errorMessage] }
              : c
          )
        );
      }
    } finally {
      setIsGenerating(false);
      setCurrentStreamingText('');
      abortControllerRef.current = null;
    }
  };

  const accumulatedTextRef = useRef('');
  accumulatedTextRef.current = currentStreamingText;

  // Stop Generation
  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  // Regenerate Response for a turn
  const handleRegenerateTurn = (messageIndex: number) => {
    const priorUserMessage = activeConversation.messages[messageIndex - 1];
    if (priorUserMessage && priorUserMessage.role === 'user') {
      // Remove current assistant message and re-send prompt
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === activeId) {
            const sliced = c.messages.slice(0, messageIndex);
            return { ...c, messages: sliced };
          }
          return c;
        })
      );
      handleSendMessage(priorUserMessage.content);
    }
  };

  // Delete Individual Message
  const handleDeleteMessage = (messageId: string) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeId
          ? {
              ...c,
              messages: c.messages.filter((m) => m.id !== messageId),
              updatedAt: Date.now(),
            }
          : c
      )
    );
  };

  // Edit User Message
  const handleEditUserMessage = (messageId: string, newContent: string) => {
    const msgIndex = activeConversation.messages.findIndex((m) => m.id === messageId);
    if (msgIndex === -1) return;

    // Truncate thread to that point and regenerate
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === activeId) {
          const sliced = c.messages.slice(0, msgIndex);
          return { ...c, messages: sliced };
        }
        return c;
      })
    );

    handleSendMessage(newContent);
  };

  // Toggle Message Feedback
  const handleToggleFeedback = (messageId: string, type: 'up' | 'down') => {
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === activeId) {
          return {
            ...c,
            messages: c.messages.map((m) => {
              if (m.id === messageId) {
                const newFeedback = m.feedback === type ? null : type;
                return { ...m, feedback: newFeedback };
              }
              return m;
            }),
          };
        }
        return c;
      })
    );
  };

  return (
    <div className={`flex h-screen w-full bg-[#131315] text-[#e5e1e4] overflow-hidden ${theme}`}>
      {/* Sidebar Navigation */}
      <Sidebar
        conversations={conversations}
        activeId={activeId}
        onSelectConversation={handleSelectConversation}
        onNewChat={handleNewChat}
        onRenameChat={handleOpenRename}
        onDeleteChat={handleDeleteChat}
        storageStats={storageStats}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onOpenDocs={() => setDocsModalOpen(true)}
        isOpenMobile={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main Chat Workspace */}
      <div className="flex-1 lg:pl-72 flex flex-col h-full bg-[#131315] relative overflow-hidden">
        {/* Top Context Header */}
        <ChatHeader
          title={activeConversation.title}
          onRenameTitle={() => handleOpenRename(activeId)}
          onClearChat={handleClearCurrentChat}
          onOpenDocs={() => setDocsModalOpen(true)}
          onExport={handleExport}
          selectedModel={activeConversation.model || 'gemini-3.8-flash'}
          onSelectModel={handleSelectModel}
          theme={theme}
          onToggleTheme={handleToggleTheme}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
        />

        {/* Chat Feed Scroll Area */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-6 max-w-4xl mx-auto w-full">
          {/* Welcome Hero Banner */}
          <div className="p-5 sm:p-6 rounded-2xl bg-[#1c1b1d] border border-[#2d2c33] shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-5 transition-all">
            <div className="space-y-1.5 max-w-md">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  <Zap size={16} />
                </span>
                <span className="font-semibold text-sm sm:text-base text-[#f4f4f6]">
                  Gemini 3.1 Flash Ready
                </span>
              </div>
              <p className="text-xs text-[#908fa0] leading-relaxed">
                Engineered Next.js 14 architecture template implementing secure server-side Route Handlers with{' '}
                <code className="text-indigo-300 font-mono">@google/genai</code>.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              <button
                onClick={() =>
                  handleSendMessage(
                    'Explain how to integrate Google Gemini API into Next.js App Router using Route Handlers with streaming or JSON response, and provide code examples.'
                  )
                }
                className="px-3 py-1.5 rounded-xl bg-[#2a2a2c] hover:bg-[#353437] text-[#f4f4f6] text-xs font-medium border border-[#3e3d48] transition-all flex items-center gap-1.5"
              >
                <span>Integration Guide</span>
                <ArrowRight size={12} className="text-indigo-400" />
              </button>
              <button
                onClick={() =>
                  handleSendMessage(
                    'How do I implement token streaming in Next.js 14 using Server-Sent Events (SSE) with Google Gemini?'
                  )
                }
                className="px-3 py-1.5 rounded-xl bg-[#2a2a2c] hover:bg-[#353437] text-[#f4f4f6] text-xs font-medium border border-[#3e3d48] transition-all flex items-center gap-1.5"
              >
                <span>Streaming Guide</span>
                <ArrowRight size={12} className="text-sky-400" />
              </button>
            </div>
          </div>

          {/* Conversation Messages */}
          {activeConversation.messages.length === 0 && !isGenerating ? (
            <div className="text-center py-12 px-4 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#1c1b1d] border border-[#2d2c33] flex items-center justify-center mx-auto text-indigo-400">
                <MessageSquareDashed size={24} />
              </div>
              <h3 className="text-sm font-semibold text-[#f4f4f6]">No messages yet</h3>
              <p className="text-xs text-[#908fa0] max-w-sm mx-auto">
                Ask Gemini anything or choose a suggested prompt below to start building your application.
              </p>
            </div>
          ) : (
            <div className="flex flex-col space-y-6">
              {activeConversation.messages.map((message, index) => (
                <MessageItem
                  key={message.id}
                  message={message}
                  onRegenerate={
                    message.role === 'assistant'
                      ? () => handleRegenerateTurn(index)
                      : undefined
                  }
                  onDelete={() => handleDeleteMessage(message.id)}
                  onEditUserMessage={
                    message.role === 'user'
                      ? (newText) => handleEditUserMessage(message.id, newText)
                      : undefined
                  }
                  onToggleFeedback={
                    message.role === 'assistant'
                      ? (type) => handleToggleFeedback(message.id, type)
                      : undefined
                  }
                />
              ))}

              {/* Live Streaming Assistant Turn */}
              {isGenerating && currentStreamingText && (
                <MessageItem
                  message={{
                    id: 'active-stream',
                    role: 'assistant',
                    content: currentStreamingText,
                    timestamp: Date.now(),
                  }}
                  isStreaming={true}
                />
              )}

              {/* Thinking Indicator before first token */}
              {isGenerating && !currentStreamingText && (
                <div className="flex flex-col items-start gap-2 animate-in fade-in duration-200">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-500 to-sky-400 flex items-center justify-center text-white">
                      <Sparkles size={13} className="animate-spin" />
                    </div>
                    <span className="text-xs font-semibold text-[#f4f4f6]">
                      Gemini Thinking...
                    </span>
                  </div>
                  <div className="bg-[#1c1b1d] border border-[#2d2c33] px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" />
                    <div className="w-2 h-2 rounded-full bg-sky-400 animate-bounce [animation-delay:0.2s]" />
                    <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce [animation-delay:0.4s]" />
                    <span className="font-mono text-xs text-[#908fa0] ml-2">
                      synthesizing tokens...
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Bottom Prompt Composer Dock */}
        <PromptComposer
          onSendMessage={handleSendMessage}
          isGenerating={isGenerating}
          onStopGeneration={handleStopGeneration}
        />
      </div>

      {/* Docs Modal */}
      <DocsModal isOpen={docsModalOpen} onClose={() => setDocsModalOpen(false)} />

      {/* Rename Modal */}
      <RenameModal
        isOpen={renameModalOpen}
        initialTitle={
          conversations.find((c) => c.id === (renameTargetId || activeId))?.title || ''
        }
        onClose={() => setRenameModalOpen(false)}
        onSave={handleSaveRename}
      />
    </div>
  );
}
