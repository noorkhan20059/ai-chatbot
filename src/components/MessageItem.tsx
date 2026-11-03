import React, { useState } from 'react';
import { ChatMessage, MessageAttachment } from '../types/chat';
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
  FileText,
  FileSpreadsheet,
  FileCode,
  Volume2,
  X,
  Maximize2,
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
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

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

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Render attachment item
  const renderAttachment = (att: MessageAttachment) => {
    if (att.type === 'image' && att.previewUrl) {
      return (
        <div
          key={att.id}
          onClick={() => setSelectedImage(att.previewUrl || null)}
          className="relative group/img cursor-pointer rounded-xl overflow-hidden border border-[#3e3d48] max-w-xs shadow-md hover:border-indigo-400 transition-all"
        >
          <img
            src={att.previewUrl}
            alt={att.name}
            className="w-full max-h-48 object-cover rounded-xl"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white">
            <Maximize2 size={18} />
          </div>
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-1.5 text-[10px] text-white/90 truncate">
            {att.name} ({formatFileSize(att.size)})
          </div>
        </div>
      );
    }

    if (att.type === 'audio') {
      return (
        <div
          key={att.id}
          className="flex flex-col gap-1.5 p-2.5 rounded-xl bg-[#201f22] border border-[#3e3d48] text-xs text-[#f4f4f6]"
        >
          <div className="flex items-center gap-2">
            <Volume2 size={16} className="text-purple-400 shrink-0" />
            <span className="font-medium truncate text-[11px]">{att.name}</span>
            <span className="text-[10px] text-[#908fa0] ml-auto">
              {formatFileSize(att.size)}
            </span>
          </div>
          {att.previewUrl && (
            <audio controls src={att.previewUrl} className="h-8 w-60 rounded" />
          )}
        </div>
      );
    }

    // Document
    return (
      <div
        key={att.id}
        className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-[#201f22] border border-[#3e3d48] text-xs text-[#f4f4f6] max-w-xs truncate shadow-sm"
      >
        {att.mimeType === 'application/pdf' ? (
          <FileText size={16} className="text-rose-400 shrink-0" />
        ) : att.name.endsWith('.csv') ? (
          <FileSpreadsheet size={16} className="text-emerald-400 shrink-0" />
        ) : (
          <FileCode size={16} className="text-sky-400 shrink-0" />
        )}
        <div className="flex flex-col min-w-0">
          <span className="font-medium truncate text-[11px]">{att.name}</span>
          <span className="text-[10px] text-[#908fa0]">{formatFileSize(att.size)}</span>
        </div>
      </div>
    );
  };

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

        {/* Attached media previews */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="flex flex-wrap justify-end gap-2 my-1">
            {message.attachments.map(renderAttachment)}
          </div>
        )}

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
          message.content && (
            <div className="bg-[#2a2a2c] hover:bg-[#302f33] text-[#f4f4f6] p-4 rounded-2xl rounded-tr-sm shadow-sm text-sm leading-relaxed border border-[#353437] transition-colors relative">
              <p className="whitespace-pre-wrap">{message.content}</p>
            </div>
          )
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

        {/* Image Modal Lightbox */}
        {selectedImage && (
          <div
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm p-4 flex items-center justify-center animate-in fade-in"
            onClick={() => setSelectedImage(null)}
          >
            <div className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl">
              <img
                src={selectedImage}
                alt="Enlarged view"
                className="max-w-full max-h-[85vh] object-contain rounded-2xl"
              />
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        )}
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
