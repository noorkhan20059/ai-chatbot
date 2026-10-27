import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Square,
  Paperclip,
  Mic,
  MicOff,
  Sparkles,
  ShieldCheck,
  Code2,
} from 'lucide-react';

interface PromptComposerProps {
  onSendMessage: (text: string) => void;
  isGenerating: boolean;
  onStopGeneration?: () => void;
  placeholder?: string;
}

const SUGGESTIONS = [
  'Explain Next.js 14 Server Actions with Gemini',
  'Debug hydration mismatch in dynamic AI chat render',
  'Create structured JSON schema output using Gemini',
  'Optimize prompt token consumption in Next.js Edge runtime',
  'Implement token streaming via Server-Sent Events',
];

export const PromptComposer: React.FC<PromptComposerProps> = ({
  onSendMessage,
  isGenerating,
  onStopGeneration,
  placeholder = 'Ask Gemini anything... (Shift + Enter for new line, Enter to send)',
}) => {
  const [text, setText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 180)}px`;
    }
  }, [text]);

  const handleSend = () => {
    if (!text.trim() || isGenerating) return;
    onSendMessage(text.trim());
    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  // Escape key cancels generation
  useEffect(() => {
    const handleGlobalEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isGenerating && onStopGeneration) {
        onStopGeneration();
      }
    };
    window.addEventListener('keydown', handleGlobalEsc);
    return () => window.removeEventListener('keydown', handleGlobalEsc);
  }, [isGenerating, onStopGeneration]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape' && isGenerating && onStopGeneration) {
      e.preventDefault();
      onStopGeneration();
      return;
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Web Speech API for voice dictation
  const toggleVoiceInput = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Voice dictation is not supported in this browser. Please use Google Chrome or Edge.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setText((prev) => (prev ? `${prev} ${transcript}` : transcript));
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Speech recognition error:', err);
      setIsListening(false);
    }
  };

  const insertSnippet = (snippet: string) => {
    setText((prev) => (prev ? `${prev}\n\n${snippet}` : snippet));
    textareaRef.current?.focus();
  };

  return (
    <div className="p-4 sm:px-6 bg-[#0e0e10] border-t border-[#2d2c33] transition-colors">
      <div className="max-w-4xl mx-auto flex flex-col gap-2.5">
        {/* Suggestion Pill Carousel */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
          <span className="text-[#908fa0] flex items-center gap-1 shrink-0 font-medium text-[11px]">
            <Sparkles size={13} className="text-amber-400" />
            Suggestions:
          </span>
          {SUGGESTIONS.map((suggestion, idx) => (
            <button
              key={idx}
              disabled={isGenerating}
              onClick={() => {
                if (isGenerating) return;
                setText(suggestion);
                textareaRef.current?.focus();
              }}
              className={`px-3 py-1 rounded-full bg-[#1c1b1d] text-[#c7c4d7] border border-[#2d2c33] text-[11px] whitespace-nowrap transition-colors ${
                isGenerating ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#2a2a2c] hover:text-[#f4f4f6]'
              }`}
            >
              {suggestion}
            </button>
          ))}
        </div>

        {/* Composer Card */}
        <div className="relative bg-[#1c1b1d] border border-[#2d2c33] rounded-2xl shadow-lg p-2.5 flex flex-col focus-within:border-indigo-500/50 focus-within:ring-1 focus-within:ring-indigo-500/30 transition-all">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isGenerating}
            placeholder={
              isGenerating
                ? 'Gemini is responding... (Press Esc or click Stop to cancel)'
                : placeholder
            }
            rows={2}
            maxLength={4000}
            className={`w-full bg-transparent text-[#f4f4f6] placeholder-[#908fa0] text-sm p-1.5 resize-none focus:outline-none min-h-[50px] max-h-44 leading-relaxed ${
              isGenerating ? 'opacity-60 cursor-not-allowed' : ''
            }`}
          />

          {/* Action Toolbar */}
          <div className="flex items-center justify-between px-1 pt-1.5">
            <div className="flex items-center gap-1 sm:gap-1.5 text-[#908fa0]">
              <button
                type="button"
                onClick={() =>
                  insertSnippet(
                    '```typescript\n// Paste or type your code snippet here\n\n```'
                  )
                }
                className="p-1.5 rounded-lg hover:text-[#f4f4f6] hover:bg-[#2a2a2c] transition-colors"
                title="Insert code block template"
              >
                <Code2 size={16} />
              </button>

              <button
                type="button"
                onClick={toggleVoiceInput}
                className={`p-1.5 rounded-lg transition-colors ${
                  isListening
                    ? 'bg-rose-500/20 text-rose-400 animate-pulse'
                    : 'hover:text-[#f4f4f6] hover:bg-[#2a2a2c]'
                }`}
                title={isListening ? 'Stop voice listening' : 'Start voice dictation'}
              >
                {isListening ? <MicOff size={16} /> : <Mic size={16} />}
              </button>

              <div className="h-3.5 w-[1px] bg-[#2d2c33] mx-1" />
              <span className="font-mono text-[11px] text-[#908fa0]">
                {text.length} / 4000
              </span>
            </div>

            <div className="flex items-center gap-2">
              {isGenerating && onStopGeneration ? (
                <button
                  type="button"
                  onClick={onStopGeneration}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#2a2a2c] hover:bg-[#353437] text-rose-300 text-xs font-medium transition-colors shadow-sm"
                  title="Stop generating"
                >
                  <Square size={13} className="fill-current" />
                  <span>Stop</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!text.trim() || isGenerating}
                  className="flex items-center justify-center p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-all shadow-md shadow-indigo-600/20"
                  title="Send message"
                >
                  <Send size={16} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Security & Free-tier note */}
        <div className="flex items-center justify-center gap-1.5 text-center text-[#908fa0] text-[11px]">
          <ShieldCheck size={13} className="text-sky-400" />
          <span>
            Gemini API Free-Tier integration via secure server Route Handler. Keys are never exposed to client.
          </span>
        </div>
      </div>
    </div>
  );
};
