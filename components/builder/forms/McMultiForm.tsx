"use client";
import type { McMultiQuestion, MediaBlockT, OptionT } from "@/lib/quiz-schema";
import { Plus, Trash2 } from "lucide-react";
import { ScoringFields } from "../ScoringFields";
import { textareaCls } from "../form-styles";
import { usePermissions } from "@/lib/builder/permissions";
import { MediaBlockEditor } from "../MediaBlockEditor";
import { cn } from "@/lib/utils";

type Props = {
  question: McMultiQuestion;
  onChange: (q: McMultiQuestion) => void;
};

export function McMultiForm({ question, onChange }: Props) {
  const { limit } = usePermissions();

  function setOption(id: string, patch: Partial<OptionT>) {
    onChange({
      ...question,
      options: question.options.map((o) => (o.id === id ? { ...o, ...patch } : o)),
    });
  }

  function addOption() {
    const newId = `${question.id}-opt-${Date.now().toString(36)}`;
    onChange({
      ...question,
      options: [...question.options, { id: newId, text: "New option" }],
    });
  }

  function removeOption(id: string) {
    if (question.options.length <= 2) return;
    onChange({
      ...question,
      options: question.options.filter((o) => o.id !== id),
      correctIds: question.correctIds.filter((cid) => cid !== id),
    });
  }

  function toggleCorrect(id: string) {
    const isCorrect = question.correctIds.includes(id);
    const next = isCorrect
      ? question.correctIds.filter((cid) => cid !== id)
      : [...question.correctIds, id];
    onChange({ ...question, correctIds: next });
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
          textPlaceholder="Type the question prompt…"
          textMaxLength={limit("questionPrompt")}
        />
      </label>

      <fieldset className="grid gap-2">
        <legend className="text-xs uppercase tracking-wide text-[var(--color-text-dim)]">
          Options — check each correct one
        </legend>
        <div className="grid gap-2 grid-cols-1 md:grid-cols-2">
          {question.options.map((opt) => {
            const isCorrect = question.correctIds.includes(opt.id);
            return (
              <div
                key={opt.id}
                className={cn(
                  "rounded-md border p-3 grid gap-2 bg-[var(--color-surface)]",
                  isCorrect
                    ? "border-[var(--color-correct)]"
                    : "border-[var(--color-border)]",
                )}
              >
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleCorrect(opt.id)}
                    className={cn(
                      "text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full border",
                      isCorrect
                        ? "bg-[var(--color-correct)] text-white border-[var(--color-correct)]"
                        : "border-[var(--color-border-2)] text-[var(--color-text-dim)] hover:border-[var(--color-correct)]",
                    )}
                  >
                    {isCorrect ? "Correct ✓" : "Mark correct"}
                  </button>
                  <span className="ml-auto text-[10px] font-mono text-[var(--color-text-dim)]">
                    {opt.id}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeOption(opt.id)}
                    disabled={question.options.length <= 2}
                    className="p-1 rounded text-[var(--color-text-dim)] hover:text-[var(--color-incorrect)] disabled:opacity-40"
                    aria-label="Remove option"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <MediaBlockEditor
                  block={opt}
                  onChange={(patch) => setOption(opt.id, patch)}
                  textRows={1}
                  textPlaceholder="Option text"
                  textMaxLength={limit("optionLabel")}
                  compact
                  textOptional
                />
              </div>
            );
          })}
        </div>
        <button
          type="button"
          onClick={addOption}
          className="self-start mt-1 px-2 py-1 text-xs rounded bg-[var(--color-surface-2)] hover:bg-[var(--color-border-2)] text-[var(--color-text)] flex items-center gap-1"
        >
          <Plus className="w-3 h-3" /> Add option
        </button>
      </fieldset>

      <label className="grid gap-1 text-sm">
        <span className="text-xs uppercase tracking-wide text-[var(--color-text-dim)]">Explanation (post-confirm answer key — supports media)</span>
        <MediaBlockEditor
          block={question.explanation}
          onChange={(explanation) => onChange({ ...question, explanation })}
          textRows={3}
          textMaxLength={limit("questionExplanation")}
        />
      </label>

      <ScoringFields question={question} onChange={(q) => onChange(q as McMultiQuestion)} />
    </div>
  );
}
