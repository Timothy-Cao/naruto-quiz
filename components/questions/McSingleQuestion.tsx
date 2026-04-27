"use client";
import type { McSingleQuestion } from "@/lib/quiz-schema";
import type { QuestionProps } from "./types";
import { ZoomableImage } from "@/components/quiz/ZoomableImage";
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
              "flex items-center gap-3 p-3 rounded-md border text-left transition-colors",
              "bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text)]",
              !locked && "hover:border-[var(--color-border-2)]",
              isSelected && !locked && "border-[var(--color-accent)] bg-[var(--color-surface-2)]",
              showCorrect && "border-[var(--color-correct)]",
              showWrong && "border-[var(--color-incorrect)]",
            )}
          >
            {opt.thumbnail && (
              <ZoomableImage
                src={opt.thumbnail}
                alt={opt.label}
                className="w-12 h-12 shrink-0"
              />
            )}
            <span className="flex-1">{opt.label}</span>
            {showCorrect && <Check className="w-5 h-5 text-[var(--color-correct)]" />}
            {showWrong && <X className="w-5 h-5 text-[var(--color-incorrect)]" />}
          </button>
        );
      })}
    </div>
  );
}
