"use client";
import { useEffect } from "react";
import type { Quiz } from "@/lib/quiz-schema";
import type { AnswerState } from "@/lib/player-reducer";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { recordAttempt } from "@/lib/storage";
import { Check, X, CircleDashed } from "lucide-react";
import Link from "next/link";

type Props = {
  quiz: Quiz;
  answers: Record<string, AnswerState>;
  onRetry: () => void;
  onJumpTo: (index: number) => void;
};

function fmt(n: number) {
  return Number.isInteger(n) ? n.toString() : n.toFixed(2).replace(/\.?0+$/, "");
}

export function Results({ quiz, answers, onRetry, onJumpTo }: Props) {
  const totals = quiz.questions.reduce(
    (acc, q) => {
      const a = answers[q.id];
      if (a?.status === "confirmed") {
        acc.points += a.result.points;
        acc.maxPoints += a.result.maxPoints;
      } else {
        // Use defaults for unanswered: maxPoints is 1 unless overridden in scoring config.
        acc.maxPoints += q.scoring?.maxPoints ?? 1;
      }
      return acc;
    },
    { points: 0, maxPoints: 0 },
  );

  useEffect(() => {
    recordAttempt(quiz.slug, totals.points, totals.maxPoints);
  }, [quiz.slug, totals.points, totals.maxPoints]);

  return (
    <Card className="p-6 bg-[var(--color-surface)] border-[var(--color-border)]">
      <div className="text-center mb-6">
        <p className="text-xs uppercase tracking-widest text-[var(--color-text-dim)]">Final score</p>
        <p className="font-[family-name:var(--font-display)] text-7xl text-[var(--color-accent)] tracking-wide">
          {fmt(totals.points)}{" "}
          <span className="text-[var(--color-text-dim)]">/ {fmt(totals.maxPoints)}</span>
        </p>
      </div>
      <ul className="grid gap-2 mb-6">
        {quiz.questions.map((q, i) => {
          const a = answers[q.id];
          const confirmed = a?.status === "confirmed";
          const fullCredit = confirmed && a.result.points === a.result.maxPoints;
          const partial = confirmed && a.result.points > 0 && a.result.points < a.result.maxPoints;

          const Icon = !confirmed
            ? X
            : fullCredit
              ? Check
              : partial
                ? CircleDashed
                : X;
          const iconColor = !confirmed
            ? "text-[var(--color-text-dim)]"
            : fullCredit
              ? "text-[var(--color-correct)]"
              : partial
                ? "text-[var(--color-accent)]"
                : "text-[var(--color-incorrect)]";

          return (
            <li key={q.id}>
              <button
                type="button"
                onClick={() => onJumpTo(i)}
                className="w-full flex items-center gap-3 p-3 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)] hover:border-[var(--color-border-2)] text-left"
              >
                <Icon className={`w-5 h-5 shrink-0 ${iconColor}`} />
                <span className="text-sm text-[var(--color-text)] flex-1">{q.prompt}</span>
                <span className="text-xs text-[var(--color-text-dim)] font-mono">
                  {confirmed ? `${fmt(a.result.points)} / ${fmt(a.result.maxPoints)}` : "—"}
                </span>
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
