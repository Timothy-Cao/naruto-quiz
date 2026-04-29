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
    <header className="grid gap-3 mb-6">
      <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-wide text-[var(--color-text)]">
        {title}
      </h1>
      <div className="flex flex-wrap items-center gap-2">
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
                "w-2.5 h-2.5 rounded-full transition-colors",
                status === "confirmed"
                  ? "bg-[var(--color-accent)]"
                  : "bg-[var(--color-border-2)]",
                isCurrent && "ring-2 ring-[var(--color-accent)] ring-offset-2 ring-offset-[var(--color-bg)]",
                clickable ? "cursor-pointer hover:scale-110" : "cursor-not-allowed opacity-60",
              )}
            />
          );
        })}
        <span className="ml-2 text-xs text-[var(--color-text-dim)]">
          {Math.min(currentIndex + 1, total)} / {total}
        </span>
      </div>
    </header>
  );
}
