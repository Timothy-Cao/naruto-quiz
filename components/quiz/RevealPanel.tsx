import { Check, X, CircleDashed } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ScoreResult } from "@/lib/scoring";
import { Markdown } from "./Markdown";

export function RevealPanel({
  result,
  explanation,
}: {
  result: ScoreResult;
  explanation: string;
}) {
  const fullCredit = result.points === result.maxPoints;
  const partial = result.points > 0 && result.points < result.maxPoints;
  const wrong = result.points === 0;

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

  // Format points: drop trailing zeros, max 2 decimals.
  const fmt = (n: number) =>
    Number.isInteger(n) ? n.toString() : n.toFixed(2).replace(/\.?0+$/, "");

  return (
    <div
      className={cn(
        "mt-4 p-4 rounded-md border animate-in slide-in-from-top-2 duration-250",
        borderColor,
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon className={cn("w-5 h-5", iconColor)} />
        <span className="font-semibold text-[var(--color-text)]">{headline}</span>
        {(partial || result.maxPoints !== 1) && (
          <span className="ml-auto font-mono text-xs text-[var(--color-text-dim)]">
            {fmt(result.points)} / {fmt(result.maxPoints)}
          </span>
        )}
      </div>
      <div className="text-sm text-[var(--color-text)] leading-relaxed">
        <Markdown>{explanation}</Markdown>
      </div>
    </div>
  );
}
