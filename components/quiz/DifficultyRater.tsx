"use client";

import { useEffect, useState } from "react";
import { Star, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { rateQuestion, getMyRating, type Rating } from "@/lib/quiz/ratings";

const STAR_LABELS: Record<Rating, string> = {
  1: "Dur",
  2: "Easy",
  3: "Balanced",
  4: "Challenging",
  5: "Brain boggle",
};

/**
 * Optional, dismissable difficulty rating. Shown at the bottom of the
 * RevealPanel after the user confirms an answer — when their feel for the
 * question is freshest.
 *
 * Five stars with hover labels (1: Dur, 2: Easy, 3: Balanced, 4: Challenging,
 * 5: Brain boggle). Pre-fills with the user's previous rating if any.
 * Click X to hide for this view (re-shows on next confirm). No commitment;
 * fully ignorable.
 */
export function DifficultyRater({
  quizSlug,
  questionId,
}: {
  quizSlug: string;
  questionId: string;
}) {
  const [rating, setRating] = useState<Rating | null>(null);
  const [hover, setHover] = useState<Rating | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setRating(getMyRating(quizSlug, questionId));
    setDismissed(false);
  }, [quizSlug, questionId]);

  if (dismissed) return null;

  const display = hover ?? rating;
  const labelText = display ? STAR_LABELS[display] : "Rate difficulty (optional)";

  function handleClick(value: Rating) {
    setRating(value);
    rateQuestion(quizSlug, questionId, value).catch(() => {});
  }

  return (
    <div
      data-no-sfx
      className="mt-3 pt-3 border-t border-[var(--color-border)]/50 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs"
    >
      <span className="text-[var(--color-text-dim)]">{labelText}</span>
      <div className="flex items-center gap-0.5 ml-auto">
        {[1, 2, 3, 4, 5].map((value) => {
          const v = value as Rating;
          const filled = display !== null && v <= display;
          return (
            <button
              key={v}
              type="button"
              onMouseEnter={() => setHover(v)}
              onMouseLeave={() => setHover(null)}
              onClick={() => handleClick(v)}
              aria-label={`${v} stars: ${STAR_LABELS[v]}`}
              title={STAR_LABELS[v]}
              className="p-1"
            >
              <Star
                className={cn(
                  "w-4 h-4 transition-colors",
                  filled
                    ? "fill-[var(--color-accent)] text-[var(--color-accent)]"
                    : "text-[var(--color-text-dim)] hover:text-[var(--color-text)]",
                )}
              />
            </button>
          );
        })}
      </div>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss rating prompt"
        title="Hide for this question"
        className="p-1 text-[var(--color-text-dim)] hover:text-[var(--color-text)]"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
