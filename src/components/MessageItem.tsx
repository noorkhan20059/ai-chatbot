import React, { useState } from 'react';
import { ChatMessage } from '../types/chat';
import { MarkdownRenderer } from './MarkdownRenderer';
import {
  Sparkles,
  User,
  Copy,
  Check,
  RotateCw,
  ThumbsUp,
  ThumbsDown,
  Trash2,
  Edit3,
  AlertCircle,
} from 'lucide-react';

interface MessageItemProps {
  message: ChatMessage;
  isStreaming?: boolean;
  onRegenerate?: () => void;
  onDelete?: () => void;
  onEditUserMessage?: (newContent: string) => void;
  onToggleFeedback?: (feedback: 'up' | 'down') => void;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  isStreaming,
  onRegenerate,
  onDelete,
  onEditUserMessage,
  onToggleFeedback,
}) => {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(message.content);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveEdit = () => {
    if (editedText.trim() && onEditUserMessage) {
      onEditUserMessage(editedText.trim());
      setIsEditing(false);
    }
  };

  const timeString = new Date(message.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const estimatedTokens = message.tokenCount || Math.ceil(message.content.length / 4);

  // USER TURN
  if (message.role === 'user') {
    return (
      <div className="flex flex-col items-end gap-1.5 max-w-2xl ml-auto group">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium text-[#908fa0]">You</span>
          <div className="w-6 h-6 rounded-full bg-[#2a2a2c] border border-[#3e3d48] flex items-center justify-center text-[#c7c4d7]">
            <User size={13} />
          </div>
        </div>

        {isEditing ? (
          <div className="w-full flex flex-col gap-2 p-3 bg-[#2a2a2c] rounded-2xl border border-indigo-500/50">
            <textarea
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              className="w-full bg-[#1c1b1d] p-2 rounded-xl text-sm text-[#f4f4f6] focus:outline-none resize-none"
              rows={3}
            />
            <div className="flex justify-end gap-2 text-xs">
              <button
                onClick={() => setIsEditing(false)}
                className="px-2.5 py-1 rounded bg-[#353437] text-[#c7c4d7] hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-medium"
              >
                Save & Update
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-[#2a2a2c] hover:bg-[#302f33] text-[#f4f4f6] p-4 rounded-2xl rounded-tr-sm shadow-sm text-sm leading-relaxed border border-[#353437] transition-colors relative">
            <p className="whitespace-pre-wrap">{message.content}</p>
          </div>
        )}

        <div className="flex items-center gap-2 text-[11px] text-[#908fa0]">
          <span>
            {timeString} · {estimatedTokens} tokens
          </span>
          {onEditUserMessage && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="opacity-0 group-hover:opacity-100 hover:text-white transition-opacity p-0.5"
              title="Edit message"
            >
              <Edit3 size={11} />
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              className="opacity-0 group-hover:opacity-100 hover:text-rose-400 transition-opacity p-0.5"
              title="Delete message"
            >
              <Trash2 size={11} />
            </button>
          )}
        </div>
      </div>
    );
  }

  // GEMINI AI ASSISTANT TURN
  return (
    <div className="flex flex-col items-start gap-2.5 w-full group">
      {/* Turn Meta Header */}
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-500 to-sky-400 p-[1px] flex items-center justify-center text-white shadow-sm">
            <div className="w-full h-full bg-[#131315] rounded-full flex items-center justify-center">
              <Sparkles size={13} className="text-indigo-400" />
            </div>
          </div>
          <span className="text-xs font-semibold text-[#f4f4f6]">Gemini AI</span>
          {message.latencyMs !== undefined && (
            <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-[#1c1b1d] border border-[#2d2c33] text-sky-400">
              {message.firstTokenMs ? `TTFT ${message.firstTokenMs}ms · ` : ''}{message.latencyMs}ms
            </span>
          )}
          <span className="font-mono text-[11px] text-[#908fa0]">
            {estimatedTokens} tokens
          </span>
        </div>

        {/* Turn Action Icons */}
        <div className="flex items-center gap-1 text-[#908fa0]">
          <button
            onClick={handleCopy}
            className="p-1 rounded-lg hover:bg-[#2a2a2c] hover:text-[#f4f4f6] transition-colors"
            title="Copy Text"
          >
            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
          </button>
          {onRegenerate && (
            <button
              onClick={onRegenerate}
              className="p-1 rounded-lg hover:bg-[#2a2a2c] hover:text-[#f4f4f6] transition-colors"
              title="Regenerate Response"
            >
              <RotateCw size={14} />
            </button>
          )}
          {onToggleFeedback && (
            <>
              <button
                onClick={() => onToggleFeedback('up')}
                className={`p-1 rounded-lg hover:bg-[#2a2a2c] transition-colors ${
                  message.feedback === 'up' ? 'text-emerald-400 bg-[#2a2a2c]' : 'hover:text-[#f4f4f6]'
                }`}
                title="Helpful"
              >
                <ThumbsUp size={14} />
              </button>
              <button
                onClick={() => onToggleFeedback('down')}
                className={`p-1 rounded-lg hover:bg-[#2a2a2c] transition-colors ${
                  message.feedback === 'down' ? 'text-rose-400 bg-[#2a2a2c]' : 'hover:text-[#f4f4f6]'
                }`}
                title="Not helpful"
              >
                <ThumbsDown size={14} />
              </button>
            </>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              className="p-1 rounded-lg hover:bg-[#2a2a2c] hover:text-rose-400 transition-colors opacity-0 group-hover:opacity-100"
              title="Delete message"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Message Body Content */}
      <div
        className={`w-full p-5 rounded-2xl rounded-tl-sm shadow-sm font-normal text-sm text-[#f4f4f6] border transition-colors ${
          message.error
            ? 'bg-rose-950/20 border-rose-500/30'
            : 'bg-[#18181b] border-[#2d2c33]'
        }`}
      >
        {message.error ? (
          <div className="flex items-start gap-3 text-rose-300">
            <AlertCircle size={18} className="text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-2">
              <p className="font-semibold text-rose-200">Unable to generate Gemini response</p>
              <p className="text-xs text-rose-300/80">{message.content}</p>
              {onRegenerate && (
                <button
                  onClick={onRegenerate}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-xs font-medium transition-colors"
                >
                  <RotateCw size={13} />
                  <span>Retry Request</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <MarkdownRenderer content={message.content} isStreaming={isStreaming} />
        )}
      </div>
    </div>
  );
};
