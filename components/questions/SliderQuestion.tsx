"use client";
import type { SliderQuestion } from "@/lib/quiz-schema";
import type { QuestionProps } from "./types";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

export function SliderQuestionRenderer({
  question,
  state,
  onChange,
}: QuestionProps<SliderQuestion, number>) {
  const locked = state.status === "confirmed";
  const value: number =
    state.status === "unanswered"
      ? question.min
      : (state.value as number);

  // Mark interaction by always firing onChange — the player reducer treats
  // any onChange as "draft". The user moving away from min is a real interaction;
  // if they want min as their answer, they need to nudge and return.
  return (
    <div className="grid gap-4">
      <div className="flex items-baseline justify-between">
        <span className="text-xs uppercase tracking-wide text-[var(--color-text-dim)]">
          Your value
        </span>
        <span className="font-mono text-2xl text-[var(--color-text)]">{value}</span>
      </div>
      <Slider
        min={question.min}
        max={question.max}
        step={question.step}
        value={[value]}
        disabled={locked}
        onValueChange={(v) => onChange(Array.isArray(v) ? v[0] : (v as number))}
      />
      <div className="flex justify-between text-xs text-[var(--color-text-dim)]">
        <span>{question.min}</span>
        <span>{question.max}</span>
      </div>
      {locked && (
        <div className={cn(
          "flex justify-between font-mono text-sm rounded-md p-3 border",
          state.status === "confirmed" && state.correct
            ? "border-[var(--color-correct)] bg-[var(--color-correct)]/10"
            : "border-[var(--color-incorrect)] bg-[var(--color-incorrect)]/10",
        )}>
          <span>You: {value}</span>
          <span>Correct: {question.correctValue}</span>
        </div>
      )}
    </div>
  );
}
