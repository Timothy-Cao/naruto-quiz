"use client";
import { useEffect, useRef } from "react";
import type { LettersQuestion } from "@/lib/quiz-schema";
import type { QuestionProps } from "./types";
import { cn } from "@/lib/utils";

/**
 * Crossword-style typing question. Renders one box per letter (spaces in the
 * canonical answer become visual gaps between word groups). The user types
 * letters; auto-advance to the next box on input, backspace goes back.
 *
 * The stored answer value is just the concatenated letters typed by the user
 * (no spaces). Scoring normalizes both sides to lowercased-no-whitespace.
 */
export function LettersQuestionRenderer({
  question,
  state,
  onChange,
}: QuestionProps<LettersQuestion, string>) {
  const locked = state.status === "confirmed";
  const stored: string =
    state.status === "unanswered" ? "" : (state.value as string);

  // Build the layout: one slot per non-space char, with a gap marker between words.
  const slots: { letter: string; isCorrect: boolean | null; index: number }[] = [];
  const wordBreaks: number[] = []; // slot indices BEFORE which a gap goes
  let typedIndex = 0;
  for (let i = 0; i < question.answer.length; i++) {
    const ch = question.answer[i];
    if (ch === " ") {
      wordBreaks.push(slots.length);
      continue;
    }
    const userChar = stored[typedIndex] ?? "";
    const isCorrect = locked
      ? userChar.toLowerCase() === ch.toLowerCase()
      : null;
    slots.push({ letter: userChar, isCorrect, index: typedIndex });
    typedIndex++;
  }
  const totalLetters = slots.length;

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, totalLetters);
  }, [totalLetters]);

  function setCharAt(idx: number, ch: string) {
    const next = stored.padEnd(totalLetters, " ").split("");
    next[idx] = ch;
    // Trim trailing spaces but keep internal spaces (which there shouldn't be).
    const joined = next.join("").replace(/\s+$/, "");
    onChange(joined);
  }

  function handleInput(idx: number, raw: string) {
    if (locked) return;
    const ch = raw.slice(-1).toUpperCase();
    if (!ch.match(/[A-Za-z0-9]/)) return;
    setCharAt(idx, ch);
    // Auto-advance.
    if (idx + 1 < totalLetters) {
      inputRefs.current[idx + 1]?.focus();
    }
  }

  function handleKeyDown(idx: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (locked) return;
    if (e.key === "Backspace") {
      if ((stored[idx] ?? "") !== "") {
        setCharAt(idx, "");
        return;
      }
      if (idx > 0) {
        e.preventDefault();
        setCharAt(idx - 1, "");
        inputRefs.current[idx - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && idx > 0) {
      e.preventDefault();
      inputRefs.current[idx - 1]?.focus();
    } else if (e.key === "ArrowRight" && idx + 1 < totalLetters) {
      e.preventDefault();
      inputRefs.current[idx + 1]?.focus();
    }
  }

  // Build display: emit a gap span at each wordBreak position.
  const elements: React.ReactNode[] = [];
  let nextBreak = 0;
  slots.forEach((slot, i) => {
    while (nextBreak < wordBreaks.length && wordBreaks[nextBreak] === i) {
      elements.push(<span key={`gap-${i}-${nextBreak}`} className="w-4" />);
      nextBreak++;
    }
    elements.push(
      <input
        key={`slot-${i}`}
        ref={(el) => {
          inputRefs.current[i] = el;
        }}
        type="text"
        inputMode="text"
        autoComplete="off"
        autoCapitalize="characters"
        maxLength={1}
        value={slot.letter}
        disabled={locked}
        onChange={(e) => handleInput(i, e.target.value)}
        onKeyDown={(e) => handleKeyDown(i, e)}
        className={cn(
          "w-9 h-11 text-center font-mono text-lg uppercase rounded-md border bg-[var(--color-surface)]",
          "border-[var(--color-border)] focus:border-[var(--color-accent)] focus:outline-none",
          locked && slot.isCorrect && "border-[var(--color-correct)] bg-[var(--color-correct)]/10",
          locked && slot.isCorrect === false && "border-[var(--color-incorrect)] bg-[var(--color-incorrect)]/10",
        )}
      />,
    );
  });

  return (
    <div className="grid gap-3">
      <p className="text-sm text-[var(--color-text-dim)]">
        <span className="text-[var(--color-text)] font-medium">Hint:</span> {question.hint}
      </p>
      <div className="flex flex-wrap items-center gap-1.5">{elements}</div>
      {locked && (
        <p className="text-xs text-[var(--color-text-dim)]">
          Answer: <span className="font-mono text-[var(--color-correct)]">{question.answer}</span>
        </p>
      )}
    </div>
  );
}
