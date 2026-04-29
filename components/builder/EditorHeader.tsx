"use client";
import { useState, useEffect } from "react";
import type { Quiz } from "@/lib/quiz-schema";
import { slugify } from "@/lib/builder/slugify";
import { Edit2 } from "lucide-react";
import { inputLargeCls } from "./form-styles";
import { usePermissions } from "@/lib/builder/permissions";

type Props = {
  quiz: Quiz;
  onTitleChange: (title: string) => void;
  onSlugChange: (slug: string) => void;
  onDescriptionChange: (description: string | undefined) => void;
  onCoverImageChange: (coverImage: string | undefined) => void;
};

export function EditorHeader({
  quiz,
  onTitleChange,
  onSlugChange,
  onDescriptionChange,
  onCoverImageChange,
}: Props) {
  const [autoSlug, setAutoSlug] = useState(true);
  const { isAdmin, limit } = usePermissions();

  // When auto is on, recompute slug from title.
  useEffect(() => {
    if (autoSlug) {
      const next = slugify(quiz.title);
      if (next !== quiz.slug) onSlugChange(next);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quiz.title, autoSlug]);

  return (
    <div className="grid gap-3 p-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
      <label className="grid gap-1">
        <span className="text-xs uppercase tracking-wide text-[var(--color-text-dim)]">Title</span>
        <input
          type="text"
          value={quiz.title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Naruto Knowledge — Sample Quiz"
          maxLength={limit("quizTitle")}
          className={`${inputLargeCls} text-lg`}
        />
      </label>

      <label className="grid gap-1">
        <span className="text-xs uppercase tracking-wide text-[var(--color-text-dim)] flex items-center gap-2">
          Slug
          <button
            type="button"
            onClick={() => setAutoSlug((a) => !a)}
            className="text-[var(--color-accent)] hover:underline normal-case tracking-normal"
          >
            <Edit2 className="w-3 h-3 inline mr-1" />
            {autoSlug ? "auto from title" : "manual"}
          </button>
        </span>
        <input
          type="text"
          value={quiz.slug}
          onChange={(e) => {
            setAutoSlug(false);
            onSlugChange(e.target.value);
          }}
          placeholder="kebab-case-slug"
          disabled={autoSlug}
          className={`${inputLargeCls} font-mono ${autoSlug ? "opacity-60" : ""}`}
        />
      </label>

      <label className="grid gap-1">
        <span className="text-xs uppercase tracking-wide text-[var(--color-text-dim)]">Description (optional)</span>
        <textarea
          value={quiz.description ?? ""}
          onChange={(e) => onDescriptionChange(e.target.value || undefined)}
          rows={2}
          maxLength={limit("quizDescription")}
          className={`${inputLargeCls} resize-y font-sans`}
        />
      </label>

      {isAdmin && (
        <label className="grid gap-1">
          <span className="text-xs uppercase tracking-wide text-[var(--color-text-dim)]">Cover image (optional)</span>
          <input
            type="text"
            value={quiz.coverImage ?? ""}
            onChange={(e) => onCoverImageChange(e.target.value || undefined)}
            placeholder="URL or /quiz-images/..."
            className={inputLargeCls}
          />
        </label>
      )}
    </div>
  );
}
