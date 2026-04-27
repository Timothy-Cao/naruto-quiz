import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function RevealPanel({ correct, explanation }: { correct: boolean; explanation: string }) {
  return (
    <div
      className={cn(
        "mt-4 p-4 rounded-md border animate-in slide-in-from-top-2 duration-250",
        correct
          ? "border-[var(--color-correct)] bg-[var(--color-correct)]/10"
          : "border-[var(--color-incorrect)] bg-[var(--color-incorrect)]/10",
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        {correct ? (
          <Check className="w-5 h-5 text-[var(--color-correct)]" />
        ) : (
          <X className="w-5 h-5 text-[var(--color-incorrect)]" />
        )}
        <span className="font-semibold text-[var(--color-text)]">
          {correct ? "Correct" : "Incorrect"}
        </span>
      </div>
      <p className="text-sm text-[var(--color-text)] leading-relaxed">{explanation}</p>
    </div>
  );
}
