"use client";
import type { McSingleQuestion } from "@/lib/quiz-schema";
import type { QuestionProps } from "./types";
import { MediaBlock } from "@/components/quiz/MediaBlock";
import { cn } from "@/lib/utils";
import { Check, X } from "lucide-react";

export function McSingleQuestionRenderer({
  question,
  state,
  onChange,
}: QuestionProps<McSingleQuestion, string>) {
  const locked = state.status === "confirmed";
  const selected =
    state.status === "unanswered" ? null : (state.value as string);

  return (
    <div className="grid gap-2">
      {question.options.map((opt) => {
        const isSelected = selected === opt.id;
        const isCorrect = opt.id === question.correctId;
        const showCorrect = locked && isCorrect;
        const showWrong = locked && isSelected && !isCorrect;
        return (
          <button
            type="button"
            key={opt.id}
            disabled={locked}
            onClick={() => onChange(opt.id)}
            className={cn(
              "flex items-center gap-3 p-3 rounded-lg border text-left transition-all duration-150",
              "bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text)]",
              !locked && "hover:border-[var(--color-border-2)] hover:bg-[var(--color-surface-2)]/50",
              isSelected && !locked && "border-[var(--color-accent)] bg-[var(--color-surface-2)]",
              showCorrect && "border-[var(--color-correct)] bg-[var(--color-correct)]/5",
              showWrong && "border-[var(--color-incorrect)] bg-[var(--color-incorrect)]/5",
            )}
          >
            <span
              className={cn(
                "w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors",
                isSelected && !locked && "border-[var(--color-accent)]",
                !isSelected && !locked && "border-[var(--color-border-2)]",
                showCorrect && "border-[var(--color-correct)]",
                showWrong && "border-[var(--color-incorrect)]",
              )}
            >
              {isSelected && !locked && <span className="w-2 h-2 rounded-full bg-[var(--color-accent)]" />}
              {showCorrect && <span className="w-2 h-2 rounded-full bg-[var(--color-correct)]" />}
              {showWrong && <span className="w-2 h-2 rounded-full bg-[var(--color-incorrect)]" />}
            </span>
            <span className="flex-1 min-w-0 break-words">
              <MediaBlock block={opt} size="option" />
            </span>
            {showCorrect && <Check className="w-5 h-5 text-[var(--color-correct)] shrink-0" />}
            {showWrong && <X className="w-5 h-5 text-[var(--color-incorrect)] shrink-0" />}
          </button>
        );
      })}
    </div>
  );
}
