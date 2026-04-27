"use client";
import { useEffect } from "react";
import type { Quiz } from "@/lib/quiz-schema";
import type { AnswerState } from "@/lib/player-reducer";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { recordAttempt } from "@/lib/storage";
import { Check, X } from "lucide-react";
import Link from "next/link";

type Props = {
  quiz: Quiz;
  answers: Record<string, AnswerState>;
  onRetry: () => void;
  onJumpTo: (index: number) => void;
};

export function Results({ quiz, answers, onRetry, onJumpTo }: Props) {
  const total = quiz.questions.length;
  const score = quiz.questions.reduce((acc, q) => {
    const a = answers[q.id];
    return acc + (a?.status === "confirmed" && a.correct ? 1 : 0);
  }, 0);

  useEffect(() => {
    recordAttempt(quiz.slug, score, total);
  }, [quiz.slug, score, total]);

  return (
    <Card className="p-6 bg-[var(--color-surface)] border-[var(--color-border)]">
      <div className="text-center mb-6">
        <p className="text-xs uppercase tracking-widest text-[var(--color-text-dim)]">Final score</p>
        <p className="font-[family-name:var(--font-display)] text-7xl text-[var(--color-accent)] tracking-wide">
          {score} <span className="text-[var(--color-text-dim)]">/ {total}</span>
        </p>
      </div>
      <ul className="grid gap-2 mb-6">
        {quiz.questions.map((q, i) => {
          const a = answers[q.id];
          const correct = a?.status === "confirmed" && a.correct;
          return (
            <li key={q.id}>
              <button
                type="button"
                onClick={() => onJumpTo(i)}
                className="w-full flex items-center gap-3 p-3 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)] hover:border-[var(--color-border-2)] text-left"
              >
                {correct ? (
                  <Check className="w-5 h-5 text-[var(--color-correct)] shrink-0" />
                ) : (
                  <X className="w-5 h-5 text-[var(--color-incorrect)] shrink-0" />
                )}
                <span className="text-sm text-[var(--color-text)] flex-1">{q.prompt}</span>
                <span className="text-xs text-[var(--color-text-dim)]">Review</span>
              </button>
            </li>
          );
        })}
      </ul>
      <div className="flex justify-between">
        <Link href="/quizzes" className={buttonVariants({ variant: "ghost" })}>
          Back to quizzes
        </Link>
        <Button
          onClick={onRetry}
          className="bg-[var(--color-accent)] hover:bg-[var(--color-accent)]/90 text-white"
        >
          Retry quiz
        </Button>
      </div>
    </Card>
  );
}
