# Gemini Next — Fast & Precise AI Chatbot

A simple, ultra-fast, modern, and fully responsive AI chatbot application powered by **Google Gemini API** (`@google/genai`), built with Next.js Route Handler architecture, Tailwind CSS, Local Storage persistence, and conversation CRUD.

## ⚡ Accuracy & Speed Optimizations

1. **Direct, Precision-First System Instruction:**
   - Enforces immediate direct answers without conversational filler or generic preambles.
   - Structured formatting (bullet points, numbered lists, clean code blocks) by default.
   - Low temperature (`0.3`) for reliable, hallucination-free, consistent output.
   - One-question clarification policy if a prompt is ambiguous.

2. **Ultra-Low Latency & High Throughput:**
   - Powered by **Gemini 3.1 Flash Lite** (~65 tokens/sec) for instant response initiation.
   - **IPv4-First DNS Order Optimization:** Eliminates standard 20-second Node.js IPv6 timeout stalls, reducing Time To First Token (TTFT) to ~1.1s.
   - **Rolling Context Window:** Keeps the prompt lean by sending the most relevant recent 8 turns, maintaining context while saving token compute time.
   - Output token cap at 2048 tokens to prevent runaway generation.

3. **Real-Time Token Streaming & Cancellation:**
   - Live Server-Sent Events (SSE) streaming with live TTFT (`TTFT 1114ms`) and total latency tracking.
   - Instant response cancellation via `Escape` key or the **Stop** button with `AbortController`.
   - Form inputs and suggestion buttons are locked during generation to prevent duplicate requests.

4. **Conversation CRUD & Local Storage:**
   - **Create:** Start new sessions via "+ New Chat" button or `⌘K` / `Ctrl+K`.
   - **Read:** Categorized into time buckets (*Today*, *Yesterday*, *Previous 7 Days*, *Older*). Real-time prompt search.
   - **Update:** Rename titles in real time via pencil icon or Rename Modal. Edit user prompts with inline re-generation.
   - **Delete:** Remove individual chats or clear current message threads.
   - **Storage Sync:** Real-time quota calculation displaying browser storage utilization (`14.2 KB / 5 MB`).

5. **Security & Server-Side Route Handler:**
   - The Google Gemini API key is isolated strictly in server-side runtime (`process.env.GEMINI_API_KEY`).
   - Zero exposure to client browser scripts or bundles.

---

## 📁 Project Structure

```
├── app/ (or src/ for React client)
│   ├── components/
│   │   ├── ChatHeader.tsx       # Model switcher, export menu, theme toggle, Direct Mode badge
│   │   ├── DocsModal.tsx        # In-app architecture & setup guide
│   │   ├── MarkdownRenderer.tsx # Code block card with copy & rich markdown renderer
│   │   ├── MessageItem.tsx      # User/AI message bubbles with TTFT & turn actions
│   │   ├── PromptComposer.tsx   # Auto-expand input with duplicate prevention & Esc stop
│   │   ├── RenameModal.tsx      # Conversation title rename modal
│   │   └── Sidebar.tsx          # History CRUD, search, and storage meter
│   ├── types/
│   │   └── chat.ts              # TypeScript interfaces (ChatMessage, Conversation)
│   ├── utils/
│   │   └── storage.ts           # LocalStorage CRUD & byte quota calculation
│   ├── App.tsx                  # Root state machine & orchestration
│   ├── index.css                # Tailwind design tokens & dark/light styles
│   └── main.tsx                 # Client entry point
├── server.ts                    # Full-stack Route Handler (/api/chat) with temperature 0.3
├── .env.local.example           # Environment variable template
└── package.json                 # Dependencies & scripts
```

---

## ⚙️ Installation & Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variable
Copy `.env.local.example` to `.env.local` (or configure in AI Studio Secrets):
```bash
cp .env.local.example .env.local
```
Add your free Google Gemini API key from [Google AI Studio](https://aistudio.google.com/):
```env
GEMINI_API_KEY="your-gemini-api-key-here"
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.
