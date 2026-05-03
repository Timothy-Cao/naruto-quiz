"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { getAllScores, type ScoreStore } from "@/lib/storage";

type ListItem = {
  slug: string;
  title: string;
  description: string | null;
  questionCount: number;
  coverImage: string | null;
  author: string | null;
  isCommunity?: boolean;
};

export function QuizListClient({ quizzes }: { quizzes: ListItem[] }) {
  const [scores, setScores] = useState<ScoreStore>({});

  useEffect(() => {
    setScores(getAllScores());
  }, []);

  return (
    <div className="grid gap-3">
      {quizzes.map((q) => {
        const score = scores[q.slug];
        return (
          <Link key={q.slug} href={`/quizzes/${q.slug}`}>
            <Card className="p-3 sm:p-4 bg-[var(--color-surface)] border-[var(--color-border)] hover:border-[var(--color-accent)] transition-colors flex items-center gap-3 sm:gap-4 min-w-0">
              {q.coverImage && (
                <img
                  src={q.coverImage}
                  alt={q.title}
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded object-cover shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-[family-name:var(--font-display)] text-xl sm:text-2xl text-[var(--color-text)] break-words">
                  {q.title}
                </h3>
                {q.description && (
                  <p className="text-sm text-[var(--color-text-dim)] truncate">{q.description}</p>
                )}
                <p className="text-xs text-[var(--color-text-dim)] mt-1 break-words">
                  {q.questionCount} questions
                  {q.author && (
                    <>
                      {" · "}
                      By <span className="text-[var(--color-text)]">{q.author}</span>
                    </>
                  )}
                  {q.isCommunity && (
                    <>
                      {" · "}
                      <span className="text-[var(--color-accent)]">Community</span>
                    </>
                  )}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[10px] sm:text-xs uppercase tracking-wide text-[var(--color-text-dim)]">Top score</p>
                <p className="font-mono text-base sm:text-lg text-[var(--color-accent)]">
                  {score ? `${score.bestScore} / ${score.bestOutOf}` : "—"}
                </p>
              </div>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
