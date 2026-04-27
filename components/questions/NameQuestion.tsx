"use client";
import { useMemo, useState } from "react";
import type { NameQuestion } from "@/lib/quiz-schema";
import type { QuestionProps } from "./types";
import { matchName } from "@/lib/match-name";
import { cn } from "@/lib/utils";
import characters from "@/data/characters.json";

export function NameQuestionRenderer({
  question,
  state,
  onChange,
}: QuestionProps<NameQuestion, string>) {
  const locked = state.status === "confirmed";
  const value: string =
    state.status === "unanswered" ? "" : (state.value as string);
  const [open, setOpen] = useState(false);

  const suggestions = useMemo(() => {
    if (!value.trim()) return [];
    const lower = value.trim().toLowerCase();
    return (characters as string[])
      .filter((c) => c.toLowerCase().includes(lower))
      .slice(0, 8);
  }, [value]);

  const correct = state.status === "confirmed" ? state.correct : false;

  return (
    <div className="grid gap-2 relative">
      <input
        type="text"
        value={value}
        disabled={locked}
        autoComplete="off"
        placeholder="Type a character name..."
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onFocus={() => setOpen(true)}
        className={cn(
          "w-full px-3 py-2 rounded-md border bg-[var(--color-surface)] text-[var(--color-text)] outline-none",
          "border-[var(--color-border)] focus:border-[var(--color-accent)]",
          locked && correct && "border-[var(--color-correct)]",
          locked && !correct && "border-[var(--color-incorrect)]",
        )}
      />
      {open && suggestions.length > 0 && !locked && (
        <ul className="absolute top-full left-0 right-0 z-10 mt-1 max-h-56 overflow-auto rounded-md border border-[var(--color-border-2)] bg-[var(--color-surface)] shadow-lg">
          {suggestions.map((s) => (
            <li key={s}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onChange(s);
                  setOpen(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-[var(--color-surface-2)] text-[var(--color-text)]"
              >
                {s}
              </button>
            </li>
          ))}
        </ul>
      )}
      {locked && !correct && (
        <p className="text-sm text-[var(--color-text-dim)]">
          Correct: <span className="text-[var(--color-correct)]">{question.acceptedAnswers[0]}</span>
        </p>
      )}
    </div>
  );
}
