"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import { buildGlossaryPattern, lookupGlossary } from "@/lib/glossary";
import { GlossaryTerm } from "./GlossaryTerm";

/**
 * Walk a tree of React children and replace any string segments that match
 * a glossary key with a <GlossaryTerm> element. Non-string children pass
 * through unchanged — react-markdown's component overrides handle each
 * level (p, li, strong, em, etc.), so nested formatting is preserved
 * because each level recurses through the same helper.
 */
function applyGlossary(children: React.ReactNode): React.ReactNode {
  const pattern = buildGlossaryPattern();
  if (!pattern) return children;
  return React.Children.map(children, (child) => {
    if (typeof child !== "string") return child;
    const parts = child.split(pattern);
    if (parts.length === 1) return child;
    return parts.map((part, i) => {
      const def = lookupGlossary(part);
      if (def) return <GlossaryTerm key={i} surface={part} definition={def} />;
      return part;
    });
  });
}

/**
 * Constrained markdown renderer for quiz prompts and explanations.
 *
 * Supports: bold, italic, inline code, lists (ordered + unordered),
 * paragraphs, blockquotes, links, line breaks. Strips raw HTML by default
 * (react-markdown's default behavior — no `rehype-raw` plugin loaded).
 *
 * Headings (h1-h6) render at smaller sizes than the default browser CSS
 * so authors can use `## Section` inside a question prompt without
 * blowing up the layout.
 */
export function Markdown({
  children,
  className,
  inline = false,
}: {
  children: string;
  className?: string;
  /** When true, renders without paragraph wrappers (for one-line use). */
  inline?: boolean;
}) {
  // Component overrides that run text through applyGlossary at every
  // nestable level, so glossary terms get wrapped regardless of inline
  // formatting (bold, italic, lists, etc.).
  const components = {
    p: ({ children }: { children?: React.ReactNode }) => <p>{applyGlossary(children)}</p>,
    li: ({ children }: { children?: React.ReactNode }) => <li>{applyGlossary(children)}</li>,
    strong: ({ children }: { children?: React.ReactNode }) => <strong>{applyGlossary(children)}</strong>,
    em: ({ children }: { children?: React.ReactNode }) => <em>{applyGlossary(children)}</em>,
    h1: ({ children }: { children?: React.ReactNode }) => <h1>{applyGlossary(children)}</h1>,
    h2: ({ children }: { children?: React.ReactNode }) => <h2>{applyGlossary(children)}</h2>,
    h3: ({ children }: { children?: React.ReactNode }) => <h3>{applyGlossary(children)}</h3>,
    h4: ({ children }: { children?: React.ReactNode }) => <h4>{applyGlossary(children)}</h4>,
  };

  if (inline) {
    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          ...components,
          p: ({ children }) => <>{applyGlossary(children)}</>,
        }}
      >
        {children}
      </ReactMarkdown>
    );
  }

  return (
    <div className={cn("md-content", className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>{children}</ReactMarkdown>
      <style jsx>{`
        .md-content :global(p) {
          margin: 0 0 0.75em;
        }
        .md-content :global(p:last-child) {
          margin-bottom: 0;
        }
        .md-content :global(strong) {
          font-weight: 600;
          color: var(--color-text);
        }
        .md-content :global(em) {
          font-style: italic;
        }
        .md-content :global(code) {
          font-family: var(--font-mono);
          font-size: 0.875em;
          padding: 0.1em 0.35em;
          border-radius: 4px;
          background: var(--color-surface-2);
          color: var(--color-text);
        }
        .md-content :global(pre) {
          font-family: var(--font-mono);
          padding: 0.75rem;
          border-radius: 8px;
          background: var(--color-surface-2);
          overflow-x: auto;
          margin: 0.75em 0;
        }
        .md-content :global(pre code) {
          padding: 0;
          background: transparent;
        }
        .md-content :global(ul),
        .md-content :global(ol) {
          margin: 0.5em 0 0.75em;
          padding-left: 1.5em;
        }
        .md-content :global(ul) {
          list-style: disc;
        }
        .md-content :global(ol) {
          list-style: decimal;
        }
        .md-content :global(li) {
          margin: 0.15em 0;
        }
        .md-content :global(li::marker) {
          color: var(--color-text-dim);
        }
        .md-content :global(blockquote) {
          margin: 0.5em 0;
          padding-left: 0.75rem;
          border-left: 3px solid var(--color-accent);
          color: var(--color-text-dim);
        }
        .md-content :global(a) {
          color: var(--color-accent);
          text-decoration: underline;
        }
        .md-content :global(a:hover) {
          color: var(--color-accent-2);
        }
        .md-content :global(h1),
        .md-content :global(h2),
        .md-content :global(h3),
        .md-content :global(h4) {
          font-weight: 600;
          margin: 0.5em 0 0.35em;
          line-height: 1.25;
        }
        .md-content :global(h1) {
          font-size: 1.25em;
        }
        .md-content :global(h2) {
          font-size: 1.15em;
        }
        .md-content :global(h3) {
          font-size: 1.05em;
        }
        .md-content :global(h4) {
          font-size: 1em;
        }
        .md-content :global(hr) {
          margin: 1em 0;
          border: 0;
          border-top: 1px solid var(--color-border);
        }
      `}</style>
    </div>
  );
}
