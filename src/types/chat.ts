export type MessageRole = 'user' | 'assistant';

export interface MessageAttachment {
  id: string;
  name: string;
  type: 'image' | 'document' | 'audio';
  mimeType: string;
  size: number;
  previewUrl?: string; // Short data URL for images or icon reference
  textPreview?: string; // Snippet of text or transcription
  durationSec?: number; // For audio recordings
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  latencyMs?: number;
  firstTokenMs?: number;
  tokenCount?: number;
  error?: boolean;
  feedback?: 'up' | 'down' | null;
  attachments?: MessageAttachment[];
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  model: string;
  systemPrompt?: string;
  messages: ChatMessage[];
}

export interface ModelOption {
  id: string;
  name: string;
  description: string;
  speed: string;
  default?: boolean;
}
