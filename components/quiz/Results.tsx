"use client";
import { useEffect, useRef } from "react";
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

  const recordedRef = useRef(false);
  useEffect(() => {
    if (recordedRef.current) return;
    recordedRef.current = true;
    recordAttempt(quiz.slug, totals.points, totals.maxPoints);
  }, [quiz.slug, totals.points, totals.maxPoints]);

  const pct = totals.maxPoints > 0 ? Math.round((totals.points / totals.maxPoints) * 100) : 0;

  return (
    <Card className="p-4 sm:p-6 bg-[var(--color-surface)] border-[var(--color-border)] min-w-0 shadow-sm">
      <div className="text-center mb-8">
        <p className="text-xs uppercase tracking-widest text-[var(--color-text-dim)] mb-2">Final score</p>
        <p className="font-[family-name:var(--font-display)] text-5xl sm:text-7xl text-[var(--color-accent)] tracking-wide break-words leading-none">
          {fmt(totals.points)}
          <span className="text-[var(--color-text-dim)] text-3xl sm:text-5xl"> / {fmt(totals.maxPoints)}</span>
        </p>
        <div className="mt-4 mx-auto max-w-xs">
          <div className="h-2 rounded-full bg-[var(--color-border-2)] overflow-hidden">
            <div
              className="h-full rounded-full bg-[var(--color-accent)] transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-xs text-[var(--color-text-dim)] mt-1.5">{pct}%</p>
        </div>
      </div>

      <div className="mb-6">
        <p className="text-xs uppercase tracking-wide text-[var(--color-text-dim)] mb-3">Question breakdown</p>
        <ul className="grid gap-1.5">
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
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] hover:border-[var(--color-border-2)] hover:bg-[var(--color-surface-2)]/80 text-left transition-colors"
                >
                  <span className="text-xs text-[var(--color-text-dim)] font-mono w-5 text-right shrink-0">{i + 1}</span>
                  <Icon className={`w-4 h-4 shrink-0 ${iconColor}`} />
                  <span className="text-sm text-[var(--color-text)] flex-1 truncate">
                    {q.prompt.text ?? `Question ${i + 1}`}
                  </span>
                  <span className="text-xs text-[var(--color-text-dim)] font-mono shrink-0">
                    {confirmed ? `${fmt(a.result.points)}/${fmt(a.result.maxPoints)}` : "—"}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="flex justify-between items-center pt-2 border-t border-[var(--color-border)]">
        <Link href="/quizzes" className={buttonVariants({ variant: "ghost" })}>
          Back to quizzes
        </Link>
        <Button
          onClick={onRetry}
          className="bg-[var(--color-accent)] hover:bg-[var(--color-accent)]/90 text-white px-5"
        >
          Retry quiz
        </Button>
      </div>
    </Card>
  );
}
