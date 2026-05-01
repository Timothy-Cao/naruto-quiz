"use client";
import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * A glossary term inline in quiz text. Renders dotted underline + hover/tap
 * tooltip showing the definition. The Markdown component automatically
 * wraps matching terms — authors don't add this manually.
 *
 * Implemented as a <span> (not a <button>) so the global "button hover →
 * filter brightness" rule doesn't fire on it; that filter caused a visible
 * flash on hover when stacked with the term's own color transition. The
 * span carries tabIndex + Enter/Space handling for keyboard parity.
 *
 * Mobile: native hover doesn't fire on touch, so we also toggle on tap and
 * keep open until tap-elsewhere or blur.
 */
export function GlossaryTerm({
  surface,
  definition,
}: {
  surface: string;
  definition: string;
}) {
  const [tapOpen, setTapOpen] = useState(false);

  return (
    <span className="relative inline-block group">
      <span
        className={cn(
          "glossary-term-trigger",
          "border-b border-dotted cursor-help select-none",
          "border-[var(--color-accent)] text-[var(--color-accent)]",
          "hover:text-[var(--color-text)] hover:border-[var(--color-text)]",
        )}
        tabIndex={0}
        onClick={(e) => {
          e.stopPropagation();
          setTapOpen((o) => !o);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setTapOpen((o) => !o);
          }
        }}
        onBlur={() => setTapOpen(false)}
      >
        {surface}
      </span>
      <span
        role="tooltip"
        className={cn(
          "absolute left-0 top-full mt-1 z-50 max-w-xs px-2.5 py-1.5",
          "rounded border border-[var(--color-border-2)] bg-[var(--color-surface-2)]",
          "text-[var(--color-text)] text-xs leading-snug shadow-2xl",
          "pointer-events-none transition-opacity duration-150",
          tapOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100",
        )}
      >
        {definition}
      </span>
    </span>
  );
}
