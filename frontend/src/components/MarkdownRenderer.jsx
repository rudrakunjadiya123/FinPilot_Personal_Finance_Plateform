import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/**
 * Premium markdown renderer for AI chatbot responses.
 * Renders headings, bold, italic, lists, tables, code blocks, and links
 * with clean, ChatGPT-quality formatting.
 */
export default function MarkdownRenderer({ content }) {
  if (!content) return null;

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        // ── Headings ──
        h1: ({ children }) => (
          <h1 className="text-base font-bold text-ink mt-3 mb-2 first:mt-0 font-display tracking-tight">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-[15px] font-bold text-ink mt-3 mb-1.5 first:mt-0 font-display tracking-tight">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-sm font-bold text-ink mt-2.5 mb-1 first:mt-0 font-display">{children}</h3>
        ),

        // ── Paragraphs ──
        p: ({ children }) => (
          <p className="text-[13px] leading-[1.7] text-ink mb-2 last:mb-0">{children}</p>
        ),

        // ── Bold & Italic ──
        strong: ({ children }) => (
          <strong className="font-semibold text-ink">{children}</strong>
        ),
        em: ({ children }) => (
          <em className="italic text-ink-soft">{children}</em>
        ),

        // ── Lists ──
        ul: ({ children }) => (
          <ul className="space-y-1.5 my-2 last:mb-0">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="space-y-1.5 my-2 last:mb-0 list-decimal list-inside">{children}</ol>
        ),
        li: ({ children, ordered }) => (
          <li className="text-[13px] leading-[1.6] text-ink flex items-start gap-2">
            <span className="mt-[7px] w-1.5 h-1.5 rounded-full bg-accent shrink-0 inline-block" />
            <span className="flex-1">{children}</span>
          </li>
        ),

        // ── Code ──
        code: ({ inline, className, children }) => {
          if (inline) {
            return (
              <code className="bg-paper-sunken border border-border-default text-accent text-xs px-1.5 py-0.5 rounded-md font-mono">
                {children}
              </code>
            );
          }
          return (
            <pre className="bg-paper-sunken border border-border-default rounded-lg p-3 my-2 overflow-x-auto">
              <code className="text-xs font-mono text-ink leading-relaxed">{children}</code>
            </pre>
          );
        },

        // ── Tables ──
        table: ({ children }) => (
          <div className="overflow-x-auto my-2 rounded-lg border border-border-default">
            <table className="w-full text-xs">{children}</table>
          </div>
        ),
        thead: ({ children }) => (
          <thead className="bg-paper-sunken border-b border-border-default">{children}</thead>
        ),
        th: ({ children }) => (
          <th className="px-3 py-2 text-left text-[11px] font-semibold text-ink-soft uppercase tracking-wider">{children}</th>
        ),
        td: ({ children }) => (
          <td className="px-3 py-2 text-[12px] text-ink border-t border-border-default">{children}</td>
        ),

        // ── Links ──
        a: ({ href, children }) => (
          <a href={href} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline font-medium">
            {children}
          </a>
        ),

        // ── Blockquotes ──
        blockquote: ({ children }) => (
          <blockquote className="border-l-[3px] border-accent pl-3 my-2 text-ink-soft italic">
            {children}
          </blockquote>
        ),

        // ── Horizontal Rules ──
        hr: () => (
          <hr className="border-border-default my-3" />
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
