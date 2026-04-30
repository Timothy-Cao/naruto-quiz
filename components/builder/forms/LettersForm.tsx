"use client";
import type { LettersQuestion, MediaBlockT } from "@/lib/quiz-schema";
import { ScoringFields } from "../ScoringFields";
import { inputCls, textareaCls } from "../form-styles";
import { usePermissions } from "@/lib/builder/permissions";
import { MediaBlockEditor } from "../MediaBlockEditor";
import { cn } from "@/lib/utils";

type Props = {
  question: LettersQuestion;
  onChange: (q: LettersQuestion) => void;
};

export function LettersForm({ question, onChange }: Props) {
  const { limit } = usePermissions();

  function setPrompt(prompt: MediaBlockT) {
    onChange({ ...question, prompt });
  }
  function setExplanation(explanation: MediaBlockT) {
    onChange({ ...question, explanation });
  }

  const letterCount = question.answer.replace(/\s+/g, "").length;
  const wordCount = question.answer.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="grid gap-4">
      <label className="grid gap-1 text-sm">
        <span className="text-xs uppercase tracking-wide text-[var(--color-text-dim)]">Prompt</span>
        <MediaBlockEditor
          block={question.prompt}
          onChange={setPrompt}
          textRows={2}
          textMaxLength={limit("questionPrompt")}
        />
      </label>

      <label className="grid gap-1 text-sm">
        <span className="text-xs uppercase tracking-wide text-[var(--color-text-dim)]">
          Hint (shown to player above the letter boxes)
        </span>
        <input
          type="text"
          value={question.hint}
          onChange={(e) => onChange({ ...question, hint: e.target.value })}
          maxLength={limit("questionPrompt")}
          placeholder="e.g. Sasuke's older brother — six letters"
          className={cn(inputCls, "w-full")}
        />
      </label>

      <label className="grid gap-1 text-sm">
        <span className="text-xs uppercase tracking-wide text-[var(--color-text-dim)]">
          Answer ({letterCount} letter{letterCount === 1 ? "" : "s"}
          {wordCount > 1 ? `, ${wordCount} words` : ""})
        </span>
        <input
          type="text"
          value={question.answer}
          onChange={(e) => onChange({ ...question, answer: e.target.value.toUpperCase() })}
          placeholder="e.g. ITACHI"
          className={cn(inputCls, "w-full font-mono uppercase")}
        />
        <span className="text-[10px] text-[var(--color-text-dim)]">
          Spaces become visual gaps between word groups. Comparison is case-insensitive.
        </span>
      </label>

      <label className="grid gap-1 text-sm">
        <span className="text-xs uppercase tracking-wide text-[var(--color-text-dim)]">
          Explanation (shown after confirm — supports media)
        </span>
        <MediaBlockEditor
          block={question.explanation}
          onChange={setExplanation}
          textRows={3}
          textMaxLength={limit("questionExplanation")}
        />
      </label>

      <ScoringFields question={question} onChange={(q) => onChange(q as LettersQuestion)} />
    </div>
  );
}
