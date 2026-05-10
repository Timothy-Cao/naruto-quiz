"use client";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  total: number;
  currentIndex: number;
  statusByIndex: Array<"unanswered" | "draft" | "confirmed">;
  onJump: (index: number) => void;
};

export function QuizHeader({ title, total, currentIndex, statusByIndex, onJump }: Props) {
  return (
    <header className="grid gap-3 mb-4 min-w-0">
      <div className="flex items-baseline justify-between gap-4">
        <h1 className="font-[family-name:var(--font-display)] text-2xl sm:text-3xl tracking-wide text-[var(--color-text)] break-words">
          {title}
        </h1>
        <span className="text-sm tabular-nums text-[var(--color-text-dim)] shrink-0">
          {Math.min(currentIndex + 1, total)}<span className="opacity-50"> / {total}</span>
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {Array.from({ length: total }).map((_, i) => {
          const status = statusByIndex[i];
          const isCurrent = i === currentIndex;
          const clickable = isCurrent || status === "confirmed";
          return (
            <button
              key={i}
              type="button"
              disabled={!clickable}
              onClick={() => clickable && onJump(i)}
              aria-label={`Question ${i + 1}`}
              className={cn(
                "h-1.5 rounded-full transition-all duration-200",
                total <= 20 ? "flex-1" : "w-2.5",
                status === "confirmed"
                  ? "bg-[var(--color-accent)]"
                  : "bg-[var(--color-border-2)]",
                isCurrent && "bg-[var(--color-text)] scale-y-150",
                clickable ? "cursor-pointer hover:opacity-80" : "cursor-default",
              )}
            />
          );
        })}
      </div>
    </header>
  );
}
