"use client";

import { ChevronLeft, ChevronRight, ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  total: number;
  current: number;
  onSelect: (index: number) => void;
  onMoveLeft?: () => void; // reorder current question one slot earlier
  onMoveRight?: () => void; // reorder current question one slot later
  // When set, page index 0 renders this label instead of the number "1".
  // Used to mark the metadata page distinctly.
  infoLabel?: string;
};

const WINDOW = 3; // pages on each side of current to show before ellipsis

/**
 * Builds a page list like [0, "...", 4, 5, 6, [7], 8, 9, 10, "...", 19].
 * Uses 0-based indices internally; the renderer adds +1 for display.
 */
function buildPages(total: number, current: number): (number | "...")[] {
  if (total <= 9) {
    return Array.from({ length: total }, (_, i) => i);
  }
  const out: (number | "...")[] = [];
  const start = Math.max(1, current - WINDOW);
  const end = Math.min(total - 2, current + WINDOW);

  out.push(0);
  if (start > 1) out.push("...");
  for (let i = start; i <= end; i++) out.push(i);
  if (end < total - 2) out.push("...");
  out.push(total - 1);
  return out;
}

export function QuestionPagination({
  total,
  current,
  onSelect,
  onMoveLeft,
  onMoveRight,
  infoLabel,
}: Props) {
  if (total === 0) return null;
  const pages = buildPages(total, current);
  const canPrev = current > 0;
  const canNext = current < total - 1;

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
      <button
        type="button"
        onClick={() => canPrev && onSelect(current - 1)}
        disabled={!canPrev}
        aria-label="Previous question"
        className="px-2 py-1 rounded text-[var(--color-text-dim)] hover:text-[var(--color-text)] disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      <div className="flex items-center gap-1 flex-1 justify-center">
        {pages.map((p, i) =>
          p === "..." ? (
            <span
              key={`ellipsis-${i}`}
              className="px-1.5 text-xs text-[var(--color-text-dim)] select-none"
            >
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onSelect(p)}
              aria-current={p === current ? "page" : undefined}
              className={cn(
                "min-w-[28px] px-2 py-1 rounded text-xs transition-colors",
                p === 0 && infoLabel ? "font-medium" : "font-mono",
                p === current
                  ? "bg-[var(--color-accent)] text-white"
                  : "text-[var(--color-text-dim)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)]",
              )}
            >
              {p === 0 && infoLabel ? infoLabel : p + 1}
            </button>
          ),
        )}
      </div>

      <button
        type="button"
        onClick={() => canNext && onSelect(current + 1)}
        disabled={!canNext}
        aria-label="Next question"
        className="px-2 py-1 rounded text-[var(--color-text-dim)] hover:text-[var(--color-text)] disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      {(onMoveLeft || onMoveRight) && (
        <span className="ml-2 pl-2 border-l border-[var(--color-border)] flex items-center gap-1">
          <button
            type="button"
            onClick={() => onMoveLeft?.()}
            disabled={!onMoveLeft || !canPrev}
            aria-label="Move this question earlier"
            title="Move earlier"
            className="px-2 py-1 rounded text-xs text-[var(--color-text-dim)] hover:text-[var(--color-text)] disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Move
          </button>
          <button
            type="button"
            onClick={() => onMoveRight?.()}
            disabled={!onMoveRight || !canNext}
            aria-label="Move this question later"
            title="Move later"
            className="px-2 py-1 rounded text-xs text-[var(--color-text-dim)] hover:text-[var(--color-text)] disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1"
          >
            Move <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </span>
      )}
    </div>
  );
}
