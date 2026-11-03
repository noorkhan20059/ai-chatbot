# Gemini Next — Multimodal AI Chatbot (Text, Image, Document, Voice)

A fast, responsive, and modern full-stack AI chatbot built with **Google Gemini API** (`@google/genai`), Next.js / Vercel Serverless Route Handler architecture, Tailwind CSS, Local Storage, and IndexedDB.

## 🚀 Key Features

### 1. Multimodal Input Support
- **Images:** Upload JPG, JPEG, PNG, and WebP images. Gemini analyzes visual details, extracts visible text, explains diagrams, and answers image queries. Includes image lightbox view.
- **Documents & Files:** Attach PDF documents (processed natively via Gemini's document understanding), CSV tables, TXT, and Markdown files.
- **Voice Messages & Audio:** Record audio messages with browser microphone (live elapsed timer, stop, cancel, and audio playback), or dictate using speech-to-text.
- **Attachment Previews:** Visual previews for images, document pills, and audio players with 1-click removal before sending.

### 2. High-Performance Architecture
- **Model:** Powered by **Gemini 3.1 Flash Lite** (with auto-failover to Gemini 3.5 Flash).
- **Fast DNS (IPv4-first):** Eliminates 20-second Node.js IPv6 stalls, yielding ~1.1s first-token response times.
- **Low Temperature (`0.3`):** High factual accuracy, concise formatting, and zero conversational fluff.
- **Rolling Context Window:** Retains the 8 most recent conversation turns to keep prompt token latency low while maintaining follow-up context.

### 3. Local Storage + IndexedDB Persistence
- **Lightweight LocalStorage:** Preserves conversation titles, metadata, turn feedback, and message history without exceeding browser quotas.
- **IndexedDB Binary Storage:** Automatically stores heavy binary attachments (images, audio recordings, PDFs) in an IndexedDB object store (`gemini_multimodal_db_v1`) to prevent LocalStorage 5MB quota overflows.
- **Full CRUD:** Create new chats (`⌘K`), search history, rename conversation titles, delete chats, and export to JSON or Markdown (`.md`).

### 4. Vercel Deployment Ready (Fixes HTTP 404)
- **Vercel Serverless Function:** `api/chat.ts` is automatically detected by Vercel's serverless runtime.
- **Vercel Routing:** `vercel.json` uses non-capturing rewrites (`/((?!api/.*).*)`) so `/api/chat` and `/api/health` routes never return 404 on Vercel.

---

## ⚙️ Vercel Deployment Instructions

1. Push this project to your GitHub repository.
2. In your **[Vercel Dashboard](https://vercel.com)**, import the repository.
3. In **Settings** → **Environment Variables**, add:
   - **Key:** `GEMINI_API_KEY`
   - **Value:** `AQ.Ab8RN6KyEVPKDi53bBYId6awYNXqJrhuyybOvQ1XCG2J4-rfgQ` (or your personal key from [Google AI Studio](https://aistudio.google.com/apikey))
4. Deploy your project. Both the client SPA and `/api/chat` serverless backend will be live.

---

## 📁 Project Structure

```
├── api/
│   ├── chat.ts                  # Multimodal Serverless Function (Vercel & Express)
│   └── health.ts                # Serverless Health Check
├── src/
│   ├── components/
│   │   ├── ChatHeader.tsx       # Model switcher, export menu, theme toggle
│   │   ├── DocsModal.tsx        # Vercel setup & architecture guide
│   │   ├── MarkdownRenderer.tsx # Code block card & rich markdown renderer
│   │   ├── MessageItem.tsx      # Turns with image lightbox, audio player, docs
│   │   ├── PromptComposer.tsx   # Image, doc, voice recorder, & dictation
│   │   ├── RenameModal.tsx      # Conversation rename modal
│   │   └── Sidebar.tsx          # History CRUD, search, and storage meter
│   ├── types/
│   │   └── chat.ts              # TypeScript interfaces (MessageAttachment, ChatMessage)
│   ├── utils/
│   │   ├── attachmentStorage.ts # IndexedDB binary storage helper
│   │   └── storage.ts           # LocalStorage CRUD & byte quota calculation
│   ├── App.tsx                  # Root state machine & multimodal orchestration
│   ├── index.css                # Tailwind design tokens & dark/light styles
│   └── main.tsx                 # Client entry point
├── vercel.json                  # Non-capturing Vercel rewrite configuration
├── server.ts                    # Local development Express server
├── .env.local                   # Active GEMINI_API_KEY
└── package.json                 # Dependencies & scripts
```
