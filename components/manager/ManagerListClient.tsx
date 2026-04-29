"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { listDrafts, type DraftMap } from "@/lib/builder/drafts-storage";
import { Plus, Edit2, FileWarning } from "lucide-react";

type ListItem = {
  slug: string;
  title: string;
  questionCount: number;
};

export function ManagerListClient({
  committed,
}: {
  committed: ListItem[];
}) {
  const [drafts, setDrafts] = useState<DraftMap>({});

  useEffect(() => {
    setDrafts(listDrafts());
  }, []);

  const committedSlugs = new Set(committed.map((q) => q.slug));
  const draftOnlySlugs = Object.keys(drafts).filter((s) => !committedSlugs.has(s));

  return (
    <div className="grid gap-3">
      <Link
        href="/builder"
        className="self-start flex items-center gap-2 px-3 py-2 rounded bg-[var(--color-accent)] hover:bg-[var(--color-accent)]/90 text-white text-sm"
      >
        <Plus className="w-4 h-4" /> New quiz
      </Link>

      {committed.length === 0 && draftOnlySlugs.length === 0 && (
        <p className="text-[var(--color-text-dim)] text-sm">No quizzes yet.</p>
      )}

      {committed.map((q) => {
        const hasDraft = drafts[q.slug] !== undefined;
        return (
          <Link key={q.slug} href={`/manager/${q.slug}`}>
            <Card className="p-4 bg-[var(--color-surface)] border-[var(--color-border)] hover:border-[var(--color-accent)] flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="font-[family-name:var(--font-display)] text-2xl text-[var(--color-text)]">
                  {q.title}
                </h3>
                <p className="text-xs text-[var(--color-text-dim)]">
                  {q.questionCount} questions {hasDraft && <span className="text-[var(--color-accent)] ml-2">• Edited locally</span>}
                </p>
              </div>
              <Edit2 className="w-4 h-4 text-[var(--color-text-dim)]" />
            </Card>
          </Link>
        );
      })}

      {draftOnlySlugs.map((slug) => {
        const d = drafts[slug];
        return (
          <Link key={slug} href={`/builder?draft=${encodeURIComponent(slug)}`}>
            <Card className="p-4 bg-[var(--color-surface)] border-[var(--color-border)] hover:border-[var(--color-accent)] flex items-center gap-4 border-dashed">
              <FileWarning className="w-5 h-5 text-[var(--color-accent)]" />
              <div className="flex-1 min-w-0">
                <h3 className="font-[family-name:var(--font-display)] text-2xl text-[var(--color-text)]">
                  {d.quiz.title} <span className="text-xs text-[var(--color-text-dim)]">(draft only)</span>
                </h3>
                <p className="text-xs text-[var(--color-text-dim)]">
                  {d.quiz.questions.length} questions • Not yet committed
                </p>
              </div>
              <Edit2 className="w-4 h-4 text-[var(--color-text-dim)]" />
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
