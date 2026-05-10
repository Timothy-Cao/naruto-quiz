import { Check, X, CircleDashed } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ScoreResult } from "@/lib/scoring";
import type { MediaBlockT } from "@/lib/quiz-schema";
import { MediaBlock } from "./MediaBlock";
import { DifficultyRater } from "./DifficultyRater";

export function RevealPanel({
  result,
  explanation,
  quizSlug,
  questionId,
}: {
  result: ScoreResult;
  /** The post-confirm answer key. A MediaBlock so authors can reveal an
   *  image (e.g. the actual scene) or audio (e.g. play the right OST after
   *  the user picks) alongside the text walkthrough. */
  explanation: MediaBlockT;
  quizSlug: string;
  questionId: string;
}) {
  const fullCredit = result.points === result.maxPoints;
  const partial = result.points > 0 && result.points < result.maxPoints;

  const Icon = fullCredit ? Check : partial ? CircleDashed : X;
  const iconColor = fullCredit
    ? "text-[var(--color-correct)]"
    : partial
      ? "text-[var(--color-accent)]"
      : "text-[var(--color-incorrect)]";
  const borderColor = fullCredit
    ? "border-[var(--color-correct)] bg-[var(--color-correct)]/10"
    : partial
      ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10"
      : "border-[var(--color-incorrect)] bg-[var(--color-incorrect)]/10";
  const headline = fullCredit ? "Correct" : partial ? "Partial credit" : "Incorrect";

  const fmt = (n: number) =>
    Number.isInteger(n) ? n.toString() : n.toFixed(2).replace(/\.?0+$/, "");

  return (
    <div
      className={cn(
        "mt-5 p-4 rounded-lg border animate-in fade-in slide-in-from-bottom-1 duration-300",
        borderColor,
      )}
    >
      <div className="flex items-center gap-2 mb-3">
        <Icon className={cn("w-5 h-5", iconColor)} />
        <span className="font-semibold text-[var(--color-text)]">{headline}</span>
        {(partial || result.maxPoints !== 1) && (
          <span className="ml-auto font-mono text-xs text-[var(--color-text-dim)]">
            {fmt(result.points)} / {fmt(result.maxPoints)}
          </span>
        )}
      </div>
      <div className="text-sm text-[var(--color-text)]/90 leading-relaxed">
        <MediaBlock block={explanation} size="prompt" />
      </div>
      <DifficultyRater quizSlug={quizSlug} questionId={questionId} />
    </div>
  );
}
