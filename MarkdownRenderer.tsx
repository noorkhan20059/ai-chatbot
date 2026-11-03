import React, { useState, useMemo } from 'react';
import { marked } from 'marked';
import { Copy, Check } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
  isStreaming?: boolean;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, isStreaming }) => {
  const renderedHtml = useMemo(() => {
    // Configure marked options
    marked.setOptions({
      gfm: true,
      breaks: true,
    });
    return marked.parse(content) as string;
  }, [content]);

  return (
    <div className="relative chat-prose">
      <div
        dangerouslySetInnerHTML={{ __html: renderedHtml }}
        className="text-[14px] leading-relaxed break-words space-y-3"
      />
      {isStreaming && (
        <span className="inline-block w-2 h-4 ml-1 bg-indigo-400 animate-pulse align-middle" />
      )}
    </div>
  );
};

export const CodeBlockCard: React.FC<{
  code: string;
  language?: string;
  filename?: string;
}> = ({ code, language = 'text', filename }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl overflow-hidden bg-[#1c1b1d] border border-[#2d2c33] my-3 shadow-md">
      <div className="h-9 px-3.5 bg-[#2a2a2c] flex items-center justify-between text-xs text-[#c7c4d7]">
        <div className="flex items-center gap-2">
          <span className="font-mono text-purple-300 uppercase text-[11px] font-semibold tracking-wider">
            {language}
          </span>
          {filename && <span className="font-mono text-[#908fa0]">{filename}</span>}
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-[#353437] text-[#c7c4d7] hover:text-white transition-colors"
          title="Copy Code"
        >
          {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
          <span className="text-[11px] font-medium">{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <div className="p-4 overflow-x-auto bg-[#0e0e10] text-[#e5e1e4] font-mono text-[13px] leading-relaxed">
        <pre className="m-0">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
};
