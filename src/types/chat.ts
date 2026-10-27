export type MessageRole = 'user' | 'assistant';

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
