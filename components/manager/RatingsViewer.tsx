"use client";

import { useEffect, useState } from "react";
import { fetchQuizRatings, type AggregatedRating } from "@/lib/quiz/ratings";
import { Star } from "lucide-react";

type ListedQuiz = {
  slug: string;
  title: string;
  questions: Array<{ id: string; prompt: { text?: string }; type: string }>;
};

const STAR_LABELS: Record<number, string> = {
  1: "Dur",
  2: "Easy",
  3: "Balanced",
  4: "Challenging",
  5: "Brain boggle",
};

const TYPE_LABEL: Record<string, string> = {
  "mc-single": "MC single",
  "mc-multi": "MC multi",
  categorize: "Categorize",
  order: "Order",
  slider: "Slider",
  name: "Name",
  letters: "Letters",
};

export function RatingsViewer({ quizzes }: { quizzes: ListedQuiz[] }) {
  const [byQuiz, setByQuiz] = useState<
    Record<string, Record<string, AggregatedRating>>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all(
      quizzes.map((q) =>
        fetchQuizRatings(q.slug).then((r) => [q.slug, r] as const),
      ),
    )
      .then((entries) => setByQuiz(Object.fromEntries(entries)))
      .catch((err) => setError(String(err?.message ?? err)))
      .finally(() => setLoading(false));
  }, [quizzes]);

  if (loading)
    return (
      <p className="text-sm text-[var(--color-text-dim)]">Loading ratings…</p>
    );

  if (error)
    return (
      <p className="text-sm text-[var(--color-incorrect)]">
        Failed to load ratings: {error}. Did the SQL migration run yet?
      </p>
    );

  return (
    <div className="grid gap-6">
      {quizzes.map((quiz) => {
        const ratings = byQuiz[quiz.slug] ?? {};
        const totalCount = Object.values(ratings).reduce(
          (acc, r) => acc + r.count,
          0,
        );
        return (
          <section key={quiz.slug} className="grid gap-3">
            <div className="flex items-baseline justify-between">
              <h2 className="font-[family-name:var(--font-display)] text-3xl text-[var(--color-text)]">
                {quiz.title}
              </h2>
              <span className="text-xs text-[var(--color-text-dim)]">
                {totalCount} total rating{totalCount === 1 ? "" : "s"}
              </span>
            </div>
            <div className="grid gap-2">
              {quiz.questions.map((q, i) => {
                const r = ratings[q.id];
                return (
                  <div
                    key={q.id}
                    className="p-3 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] grid gap-2"
                  >
                    <div className="flex items-baseline gap-2">
                      <span className="font-mono text-xs text-[var(--color-text-dim)] shrink-0">
                        #{i + 1}
                      </span>
                      <span className="text-xs uppercase tracking-wide px-1.5 py-0.5 rounded bg-[var(--color-surface-2)] text-[var(--color-text-dim)] shrink-0">
                        {TYPE_LABEL[q.type] ?? q.type}
                      </span>
                      <p className="text-sm text-[var(--color-text)] truncate">
                        {q.prompt.text ?? q.id}
                      </p>
                    </div>
                    {r && r.count > 0 ? (
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                        <span className="flex items-center gap-1 text-[var(--color-accent)] font-mono">
                          <Star className="w-3.5 h-3.5 fill-current" />
                          {r.avg.toFixed(2)}
                        </span>
                        <span className="text-[var(--color-text-dim)]">
                          {STAR_LABELS[Math.round(r.avg)]}
                        </span>
                        <span className="text-[var(--color-text-dim)]">
                          n = {r.count}
                        </span>
                        <span className="font-mono text-[10px] text-[var(--color-text-dim)] tabular-nums">
                          {[1, 2, 3, 4, 5]
                            .map(
                              (rt) =>
                                `${rt}★:${r.distribution[rt as 1 | 2 | 3 | 4 | 5]}`,
                            )
                            .join(" · ")}
                        </span>
                      </div>
                    ) : (
                      <p className="text-xs text-[var(--color-text-dim)] italic">
                        No ratings yet
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
