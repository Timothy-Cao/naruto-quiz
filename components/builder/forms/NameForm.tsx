"use client";
import type { NameQuestion, MediaBlockT } from "@/lib/quiz-schema";
import { Trash2, Plus } from "lucide-react";
import { ScoringFields } from "../ScoringFields";
import { inputCls, textareaCls } from "../form-styles";
import { usePermissions } from "@/lib/builder/permissions";
import { MediaBlockEditor } from "../MediaBlockEditor";
import { cn } from "@/lib/utils";

type Props = {
  question: NameQuestion;
  onChange: (q: NameQuestion) => void;
};

export function NameForm({ question, onChange }: Props) {
  const { limit } = usePermissions();

  function setAnswer(idx: number, value: string) {
    const next = [...question.acceptedAnswers];
    next[idx] = value;
    onChange({ ...question, acceptedAnswers: next });
  }
  function addAnswer() {
    onChange({ ...question, acceptedAnswers: [...question.acceptedAnswers, ""] });
  }
  function removeAnswer(idx: number) {
    if (question.acceptedAnswers.length <= 1) return;
    onChange({
      ...question,
      acceptedAnswers: question.acceptedAnswers.filter((_, i) => i !== idx),
    });
  }
  function setPrompt(prompt: MediaBlockT) {
    onChange({ ...question, prompt });
  }

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

      <fieldset className="grid gap-2">
        <legend className="text-xs uppercase tracking-wide text-[var(--color-text-dim)]">
          Accepted answers (case-insensitive substring match)
        </legend>
        {question.acceptedAnswers.map((a, i) => (
          <div key={i} className="grid grid-cols-[1fr,auto] gap-2 items-center">
            <input
              type="text"
              value={a}
              onChange={(e) => setAnswer(i, e.target.value)}
              placeholder="e.g., Itachi Uchiha"
              maxLength={limit("acceptedAnswer")}
              className={inputCls}
            />
            <button
              type="button"
              onClick={() => removeAnswer(i)}
              disabled={question.acceptedAnswers.length <= 1}
              className="p-1.5 rounded text-[var(--color-text-dim)] hover:text-[var(--color-incorrect)] disabled:opacity-40"
              aria-label="Remove answer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addAnswer}
          className="self-start mt-1 px-2 py-1 text-xs rounded bg-[var(--color-surface-2)] hover:bg-[var(--color-border-2)] text-[var(--color-text)] flex items-center gap-1"
        >
          <Plus className="w-3 h-3" /> Add accepted answer
        </button>
      </fieldset>

      <label className="grid gap-1 text-sm">
        <span className="text-xs uppercase tracking-wide text-[var(--color-text-dim)]">Explanation</span>
        <textarea
          value={question.explanation}
          onChange={(e) => onChange({ ...question, explanation: e.target.value })}
          rows={3}
          maxLength={limit("questionExplanation")}
          className={cn(textareaCls, "w-full")}
        />
      </label>

      <ScoringFields question={question} onChange={(q) => onChange(q as NameQuestion)} />
    </div>
  );
}
