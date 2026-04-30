"use client";
import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * A glossary term inline in quiz text. Renders dotted underline + hover/tap
 * tooltip showing the definition. The Markdown component automatically
 * wraps matching terms — authors don't add this manually.
 *
 * Mobile: native hover doesn't fire on touch, so we also toggle on tap and
 * keep open until tap-elsewhere.
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
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setTapOpen((o) => !o);
        }}
        onBlur={() => setTapOpen(false)}
        className={cn(
          "border-b border-dotted cursor-help bg-transparent p-0 text-inherit font-inherit",
          "border-[var(--color-accent)] text-[var(--color-accent)]",
          "hover:text-[var(--color-text)] hover:border-[var(--color-text)]",
        )}
      >
        {surface}
      </button>
      <span
        role="tooltip"
        className={cn(
          "absolute left-0 top-full mt-1 z-50 max-w-xs px-2.5 py-1.5",
          "rounded border border-[var(--color-border-2)] bg-[var(--color-surface-2)]",
          "text-[var(--color-text)] text-xs leading-snug shadow-2xl",
          "pointer-events-none transition-opacity duration-150",
          tapOpen
            ? "opacity-100"
            : "opacity-0 group-hover:opacity-100",
        )}
      >
        {definition}
      </span>
    </span>
  );
}
