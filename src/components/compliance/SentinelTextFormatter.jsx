import React from 'react';
import ReactMarkdown from 'react-markdown';

/**
 * Formats SENTINEL AI text output into clean, structured, readable HTML.
 * Removes ugly [FONTE: ...] brackets and converts them to styled citations.
 * Splits paragraphs, detects bullet points, and applies business-friendly formatting.
 */

function cleanSentinelText(text) {
  if (!text) return '';
  
  let cleaned = text;
  
  // Convert [FONTE: ...] into styled markers — will be picked up by markdown
  cleaned = cleaned.replace(/\[FONTE:\s*([^\]]+)\]/g, '(*$1*)');
  
  // Convert [FONTE ...] variant
  cleaned = cleaned.replace(/\[FONTE\s+([^\]]+)\]/g, '(*$1*)');
  
  // Convert [fonte: ...] lowercase
  cleaned = cleaned.replace(/\[fonte:\s*([^\]]+)\]/gi, '(*$1*)');
  
  // Convert standalone [...] source references
  cleaned = cleaned.replace(/\[([A-Z][^\]]{3,80})\]/g, '(*$1*)');
  
  // Convert numbered lists like "1. " or "1) " at start of line
  cleaned = cleaned.replace(/^(\d+)[.)]\s+/gm, '- **$1.** ');
  
  // Ensure double newlines between paragraphs for markdown
  cleaned = cleaned.replace(/\n(?!\n)/g, '\n\n');
  
  // Remove excessive newlines
  cleaned = cleaned.replace(/\n{4,}/g, '\n\n\n');
  
  return cleaned.trim();
}

export default function SentinelTextFormatter({ text, variant = 'default' }) {
  if (!text) return null;
  
  const formatted = cleanSentinelText(text);
  
  const baseClasses = variant === 'compact' 
    ? 'text-xs leading-relaxed' 
    : 'text-sm leading-relaxed';
  
  return (
    <div className={`sentinel-formatted ${baseClasses}`}>
      <ReactMarkdown
        components={{
          p: ({ children }) => (
            <p className="mb-3 last:mb-0 text-[var(--pagsmile-blue)]/80">{children}</p>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-[var(--pagsmile-blue)]">{children}</strong>
          ),
          em: ({ children }) => {
            // Check if this is a source citation (wrapped in parens)
            const text = String(children);
            if (text.startsWith('(') && text.endsWith(')')) {
              const source = text.slice(1, -1);
              return (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-indigo-50 text-[10px] font-medium text-indigo-600 border border-indigo-100 mx-0.5 align-middle">
                  {source}
                </span>
              );
            }
            return <em className="text-[var(--pagsmile-blue)]/70 not-italic">{children}</em>;
          },
          ul: ({ children }) => (
            <ul className="space-y-2 my-3">{children}</ul>
          ),
          li: ({ children }) => (
            <li className="flex items-start gap-2 p-2 bg-slate-50/80 rounded-lg text-[var(--pagsmile-blue)]/80">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--pagsmile-green)] flex-shrink-0 mt-1.5" />
              <span className="flex-1">{children}</span>
            </li>
          ),
          h1: ({ children }) => (
            <h3 className="text-base font-bold text-[var(--pagsmile-blue)] mt-4 mb-2 pb-1 border-b border-slate-200">{children}</h3>
          ),
          h2: ({ children }) => (
            <h4 className="text-sm font-bold text-[var(--pagsmile-blue)] mt-3 mb-1.5">{children}</h4>
          ),
          h3: ({ children }) => (
            <h5 className="text-xs font-bold text-[var(--pagsmile-blue)] mt-2 mb-1 uppercase tracking-wide">{children}</h5>
          ),
          code: ({ children }) => (
            <code className="px-1.5 py-0.5 rounded bg-slate-100 text-[11px] font-mono text-[var(--pagsmile-blue)]">{children}</code>
          ),
        }}
      >
        {formatted}
      </ReactMarkdown>
    </div>
  );
}