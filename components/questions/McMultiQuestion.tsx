"use client";
import type { McMultiQuestion } from "@/lib/quiz-schema";
import type { QuestionProps } from "./types";
import { MediaBlock } from "@/components/quiz/MediaBlock";
import { cn } from "@/lib/utils";
import { Check, X } from "lucide-react";

export function McMultiQuestionRenderer({
  question,
  state,
  onChange,
}: QuestionProps<McMultiQuestion, string[]>) {
  const locked = state.status === "confirmed";
  const selected: string[] =
    state.status === "unanswered" ? [] : (state.value as string[]);
  const correctSet = new Set(question.correctIds);

  function toggle(id: string) {
    const next = selected.includes(id)
      ? selected.filter((x) => x !== id)
      : [...selected, id];
    onChange(next);
  }

  return (
    <div className="grid gap-2">
      <p className="text-xs uppercase tracking-wide text-[var(--color-text-dim)]">
        Select all that apply
      </p>
      {question.options.map((opt) => {
        const isSelected = selected.includes(opt.id);
        const isCorrect = correctSet.has(opt.id);
        const showCorrect = locked && isCorrect;
        const showWrongPick = locked && isSelected && !isCorrect;
        const showMissed = locked && !isSelected && isCorrect;
        return (
          <button
            type="button"
            key={opt.id}
            disabled={locked}
            onClick={() => toggle(opt.id)}
            className={cn(
              "flex items-center gap-3 p-3 rounded-lg border text-left transition-all duration-150",
              "bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text)]",
              !locked && "hover:border-[var(--color-border-2)] hover:bg-[var(--color-surface-2)]/50",
              isSelected && !locked && "border-[var(--color-accent)] bg-[var(--color-surface-2)]",
              showCorrect && "border-[var(--color-correct)] bg-[var(--color-correct)]/5",
              showWrongPick && "border-[var(--color-incorrect)] bg-[var(--color-incorrect)]/5",
              showMissed && "border-[var(--color-correct)]/50 border-dashed",
            )}
          >
            <span
              className={cn(
                "w-[18px] h-[18px] rounded border-2 flex items-center justify-center shrink-0 transition-colors",
                isSelected && !locked && "bg-[var(--color-accent)] border-[var(--color-accent)]",
                !isSelected && !locked && "border-[var(--color-border-2)]",
                showCorrect && isSelected && "bg-[var(--color-correct)] border-[var(--color-correct)]",
                showCorrect && !isSelected && "border-[var(--color-correct)]",
                showWrongPick && "bg-[var(--color-incorrect)] border-[var(--color-incorrect)]",
              )}
            >
              {(isSelected || showMissed) && <Check className="w-3 h-3 text-white" />}
            </span>
            <span className="flex-1 min-w-0 break-words">
              <MediaBlock block={opt} size="option" />
            </span>
            {showWrongPick && <X className="w-5 h-5 text-[var(--color-incorrect)] shrink-0" />}
            {showMissed && (
              <span className="text-xs text-[var(--color-correct)] shrink-0">Missed</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
