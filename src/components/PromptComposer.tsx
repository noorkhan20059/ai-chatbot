import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Square,
  Image as ImageIcon,
  Paperclip,
  Mic,
  MicOff,
  Sparkles,
  ShieldCheck,
  X,
  FileText,
  FileCode,
  FileSpreadsheet,
  Volume2,
  Play,
  Pause,
} from 'lucide-react';
export interface MessageAttachment {
  id: string;
  name: string;
  type: 'image' | 'document' | 'audio';
  mimeType: string;
  size: number;
  previewUrl?: string;
  textPreview?: string;
  durationSec?: number;
}

export interface ComposerAttachment extends MessageAttachment {
  base64Data?: string;
  textContent?: string;
}

// Safe IndexedDB persistence helper (runs in browser, fails silently if unavailable)
async function saveAttachmentLocally(attachment: {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  dataBase64: string;
  createdAt: number;
}) {
  try {
    if (typeof window === 'undefined' || !window.indexedDB) return;
    const request = indexedDB.open('gemini_multimodal_db_v1', 1);
    request.onupgradeneeded = (e: any) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('attachments')) {
        db.createObjectStore('attachments', { keyPath: 'id' });
      }
    };
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction('attachments', 'readwrite');
      tx.objectStore('attachments').put(attachment);
    };
  } catch {}
}

interface PromptComposerProps {
  onSendMessage: (text: string, attachments?: ComposerAttachment[]) => void;
  isGenerating: boolean;
  onStopGeneration?: () => void;
  placeholder?: string;
}

const SUGGESTIONS = [
  'Analyze this diagram or UI screenshot',
  'Summarize the uploaded document',
  'Explain the data in this CSV table',
  'Explain Next.js 14 Server Actions with Gemini',
  'Debug hydration error in dynamic AI render',
];

export const PromptComposer: React.FC<PromptComposerProps> = ({
  onSendMessage,
  isGenerating,
  onStopGeneration,
  placeholder = 'Ask Gemini anything... (Shift + Enter for new line, Enter to send)',
}) => {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<ComposerAttachment[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isDictating, setIsDictating] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<any>(null);
  const speechRecognitionRef = useRef<any>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 180)}px`;
    }
  }, [text]);

  // Global Escape key cancels generation or recording
  useEffect(() => {
    const handleGlobalEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isGenerating && onStopGeneration) {
          onStopGeneration();
        }
        if (isRecording) {
          cancelRecording();
        }
      }
    };
    window.addEventListener('keydown', handleGlobalEsc);
    return () => window.removeEventListener('keydown', handleGlobalEsc);
  }, [isGenerating, isRecording, onStopGeneration]);

  // Handle Send
  const handleSend = () => {
    if ((!text.trim() && attachments.length === 0) || isGenerating) return;
    onSendMessage(text.trim(), attachments);
    setText('');
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Image Upload Handler
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      // Validate file size (max 15MB)
      if (file.size > 15 * 1024 * 1024) {
        alert(`Image "${file.name}" exceeds the 15MB size limit.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = async () => {
        const dataUrl = reader.result as string;
        const base64Data = dataUrl.replace(/^data:[^;]+;base64,/, '');
        const id = `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

        const newAttachment: ComposerAttachment = {
          id,
          name: file.name,
          type: 'image',
          mimeType: file.type || 'image/jpeg',
          size: file.size,
          previewUrl: dataUrl,
          base64Data,
        };

        // Save binary to IndexedDB off LocalStorage
        saveAttachmentLocally({
          id,
          name: file.name,
          mimeType: file.type || 'image/jpeg',
          size: file.size,
          dataBase64: base64Data,
          createdAt: Date.now(),
        });

        setAttachments((prev) => [...prev, newAttachment]);
      };
      reader.readAsDataURL(file);
    });

    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  // Document/File Upload Handler
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (file.size > 15 * 1024 * 1024) {
        alert(`File "${file.name}" exceeds the 15MB size limit.`);
        return;
      }

      const id = `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf');

      if (isPdf) {
        // PDFs are read as base64 for Gemini PDF native understanding
        const reader = new FileReader();
        reader.onload = async () => {
          const dataUrl = reader.result as string;
          const base64Data = dataUrl.replace(/^data:[^;]+;base64,/, '');

          const newAttachment: ComposerAttachment = {
            id,
            name: file.name,
            type: 'document',
            mimeType: 'application/pdf',
            size: file.size,
            base64Data,
          };

          saveAttachmentLocally({
            id,
            name: file.name,
            mimeType: 'application/pdf',
            size: file.size,
            dataBase64: base64Data,
            createdAt: Date.now(),
          });

          setAttachments((prev) => [...prev, newAttachment]);
        };
        reader.readAsDataURL(file);
      } else {
        // Text, CSV, Markdown, JSON read as text
        const reader = new FileReader();
        reader.onload = async () => {
          const textContent = reader.result as string;
          const newAttachment: ComposerAttachment = {
            id,
            name: file.name,
            type: 'document',
            mimeType: file.type || 'text/plain',
            size: file.size,
            textContent,
            textPreview: textContent.slice(0, 300),
          };

          setAttachments((prev) => [...prev, newAttachment]);
        };
        reader.readAsText(file);
      }
    });

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Voice Recording with MediaRecorder
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        // Stop audio tracks
        stream.getTracks().forEach((track) => track.stop());

        if (audioBlob.size > 0) {
          const reader = new FileReader();
          reader.onload = async () => {
            const dataUrl = reader.result as string;
            const base64Data = dataUrl.replace(/^data:[^;]+;base64,/, '');
            const id = `att-${Date.now()}-audio`;

            const audioAttachment: ComposerAttachment = {
              id,
              name: `Voice_Message_${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.webm`,
              type: 'audio',
              mimeType: 'audio/webm',
              size: audioBlob.size,
              previewUrl: dataUrl,
              durationSec: recordingSeconds,
              base64Data,
            };

            saveAttachmentLocally({
              id,
              name: audioAttachment.name,
              mimeType: 'audio/webm',
              size: audioBlob.size,
              dataBase64: base64Data,
              createdAt: Date.now(),
            });

            setAttachments((prev) => [...prev, audioAttachment]);
          };
          reader.readAsDataURL(audioBlob);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error('Microphone error:', err);
      alert('Microphone access was denied or is not available. Please allow microphone permissions in your browser.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(recordingTimerRef.current);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      audioChunksRef.current = [];
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(recordingTimerRef.current);
      setRecordingSeconds(0);
    }
  };

  // Live Speech-to-Text Dictation
  const toggleDictation = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech-to-text dictation is not supported in this browser. Please use Chrome or Edge, or use Voice Recording.');
      return;
    }

    if (isDictating) {
      speechRecognitionRef.current?.stop();
      setIsDictating(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsDictating(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setText((prev) => (prev ? `${prev} ${transcript}` : transcript));
      };

      recognition.onerror = (e: any) => {
        console.warn('Speech recognition error:', e);
        setIsDictating(false);
      };

      recognition.onend = () => {
        setIsDictating(false);
      };

      speechRecognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Dictation error:', err);
      setIsDictating(false);
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="p-4 sm:px-6 bg-[#0e0e10] border-t border-[#2d2c33] transition-colors">
      <div className="max-w-4xl mx-auto flex flex-col gap-2.5">
        {/* Suggestion Pills */}
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

        {/* Attachment Previews Area */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 p-2 bg-[#18181b] rounded-xl border border-[#2d2c33]">
            {attachments.map((att) => (
              <div
                key={att.id}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#201f22] border border-[#353437] text-xs text-[#f4f4f6] relative group max-w-xs truncate"
              >
                {att.type === 'image' && att.previewUrl ? (
                  <img
                    src={att.previewUrl}
                    alt={att.name}
                    className="w-7 h-7 object-cover rounded shadow-sm"
                  />
                ) : att.type === 'audio' ? (
                  <Volume2 size={16} className="text-purple-400 shrink-0" />
                ) : att.mimeType === 'application/pdf' ? (
                  <FileText size={16} className="text-rose-400 shrink-0" />
                ) : att.name.endsWith('.csv') ? (
                  <FileSpreadsheet size={16} className="text-emerald-400 shrink-0" />
                ) : (
                  <FileCode size={16} className="text-sky-400 shrink-0" />
                )}

                <div className="flex flex-col min-w-0 pr-4">
                  <span className="truncate font-medium text-[12px]">{att.name}</span>
                  <span className="text-[10px] text-[#908fa0]">
                    {formatFileSize(att.size)}
                    {att.durationSec ? ` · ${formatSeconds(att.durationSec)}` : ''}
                  </span>
                </div>

                <button
                  onClick={() => removeAttachment(att.id)}
                  className="absolute right-1 top-1 text-[#908fa0] hover:text-rose-400 p-0.5 rounded transition-colors"
                  title="Remove attachment"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Voice Recording Active Bar */}
        {isRecording && (
          <div className="flex items-center justify-between p-3 rounded-xl bg-purple-950/30 border border-purple-500/40 text-purple-200 animate-in fade-in">
            <div className="flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500" />
              </span>
              <span className="text-xs font-semibold">Recording voice message...</span>
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-black/40 text-purple-300">
                {formatSeconds(recordingSeconds)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={cancelRecording}
                className="px-2.5 py-1 rounded-lg text-xs font-medium text-rose-300 hover:bg-rose-500/20 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={stopRecording}
                className="px-3 py-1 rounded-lg text-xs font-medium bg-purple-600 hover:bg-purple-500 text-white shadow transition-colors flex items-center gap-1.5"
              >
                <Square size={12} className="fill-current" />
                Done & Attach
              </button>
            </div>
          </div>
        )}

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
                : isDictating
                ? 'Listening to speech... speak now...'
                : placeholder
            }
            rows={2}
            maxLength={4000}
            className={`w-full bg-transparent text-[#f4f4f6] placeholder-[#908fa0] text-sm p-1.5 resize-none focus:outline-none min-h-[50px] max-h-44 leading-relaxed ${
              isGenerating ? 'opacity-60 cursor-not-allowed' : ''
            }`}
          />

          {/* Action Toolbar */}
          <div className="flex items-center justify-between px-1 pt-1.5 flex-wrap gap-2">
            <div className="flex items-center gap-1 sm:gap-1.5 text-[#908fa0]">
              {/* Image Upload Button */}
              <input
                ref={imageInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                multiple
                className="hidden"
                onChange={handleImageSelect}
              />
              <button
                type="button"
                disabled={isGenerating}
                onClick={() => imageInputRef.current?.click()}
                className="p-1.5 rounded-lg hover:text-[#f4f4f6] hover:bg-[#2a2a2c] disabled:opacity-40 transition-colors flex items-center gap-1"
                title="Attach image (PNG, JPG, WebP)"
              >
                <ImageIcon size={16} className="text-sky-400" />
                <span className="hidden sm:inline text-[11px] font-medium">Image</span>
              </button>

              {/* Document Upload Button */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt,.csv,.md,.json"
                multiple
                className="hidden"
                onChange={handleFileSelect}
              />
              <button
                type="button"
                disabled={isGenerating}
                onClick={() => fileInputRef.current?.click()}
                className="p-1.5 rounded-lg hover:text-[#f4f4f6] hover:bg-[#2a2a2c] disabled:opacity-40 transition-colors flex items-center gap-1"
                title="Attach file (PDF, TXT, CSV, MD, JSON)"
              >
                <Paperclip size={16} className="text-amber-400" />
                <span className="hidden sm:inline text-[11px] font-medium">Doc</span>
              </button>

              {/* Voice Message Record Button */}
              <button
                type="button"
                disabled={isGenerating || isRecording}
                onClick={startRecording}
                className="p-1.5 rounded-lg hover:text-[#f4f4f6] hover:bg-[#2a2a2c] disabled:opacity-40 transition-colors flex items-center gap-1"
                title="Record voice message audio"
              >
                <Mic size={16} className="text-purple-400" />
                <span className="hidden sm:inline text-[11px] font-medium">Voice</span>
              </button>

              {/* Live Speech Dictation */}
              <button
                type="button"
                disabled={isGenerating}
                onClick={toggleDictation}
                className={`p-1.5 rounded-lg transition-colors ${
                  isDictating
                    ? 'bg-rose-500/20 text-rose-400 animate-pulse'
                    : 'hover:text-[#f4f4f6] hover:bg-[#2a2a2c]'
                }`}
                title={isDictating ? 'Stop speech dictation' : 'Voice to text dictation'}
              >
                {isDictating ? <MicOff size={16} /> : <Mic size={16} className="text-indigo-400" />}
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
                  disabled={(!text.trim() && attachments.length === 0) || isGenerating}
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
            Multimodal input (Images, PDFs, Docs, Audio) processed securely via Google Gemini.
          </span>
        </div>
      </div>
    </div>
  );
};
