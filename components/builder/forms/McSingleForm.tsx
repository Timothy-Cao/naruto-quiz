"use client";
import type { McSingleQuestion, MediaBlockT, OptionT } from "@/lib/quiz-schema";
import { Trash2, Plus } from "lucide-react";
import { ScoringFields } from "../ScoringFields";
import { textareaCls } from "../form-styles";
import { usePermissions } from "@/lib/builder/permissions";
import { MediaBlockEditor } from "../MediaBlockEditor";
import { cn } from "@/lib/utils";

type Props = {
  question: McSingleQuestion;
  onChange: (q: McSingleQuestion) => void;
};

export function McSingleForm({ question, onChange }: Props) {
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
    const next = question.options.filter((o) => o.id !== id);
    onChange({
      ...question,
      options: next,
      correctId: question.correctId === id ? next[0].id : question.correctId,
    });
  }

  function setPrompt(prompt: MediaBlockT) {
    onChange({ ...question, prompt });
  }

  return (
    <div className="grid gap-4">
      <Field label="Prompt">
        <MediaBlockEditor
          block={question.prompt}
          onChange={setPrompt}
          textRows={2}
          textPlaceholder="Type the question prompt…"
          textMaxLength={limit("questionPrompt")}
        />
      </Field>

      <fieldset className="grid gap-2">
        <legend className="text-xs uppercase tracking-wide text-[var(--color-text-dim)]">
          Options — pick the correct one
        </legend>
        <div className="grid gap-2 grid-cols-1 md:grid-cols-2">
          {question.options.map((opt) => (
            <OptionCard
              key={opt.id}
              option={opt}
              isCorrect={question.correctId === opt.id}
              onSelectCorrect={() => onChange({ ...question, correctId: opt.id })}
              onChange={(patch) => setOption(opt.id, patch)}
              onRemove={() => removeOption(opt.id)}
              canRemove={question.options.length > 2}
              maxLength={limit("optionLabel")}
              textOptional
            />
          ))}
        </div>
        <button
          type="button"
          onClick={addOption}
          className="self-start mt-1 px-2 py-1 text-xs rounded bg-[var(--color-surface-2)] hover:bg-[var(--color-border-2)] text-[var(--color-text)] flex items-center gap-1"
        >
          <Plus className="w-3 h-3" /> Add option
        </button>
      </fieldset>

      <Field label="Explanation (post-confirm answer key — supports media)">
        <MediaBlockEditor
          block={question.explanation}
          onChange={(explanation) => onChange({ ...question, explanation })}
          textRows={3}
          textMaxLength={limit("questionExplanation")}
        />
      </Field>

      <ScoringFields question={question} onChange={(q) => onChange(q as McSingleQuestion)} />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="text-xs uppercase tracking-wide text-[var(--color-text-dim)]">{label}</span>
      {children}
    </label>
  );
}

/**
 * One option as a tile in the option card grid. Holds its own MediaBlockEditor
 * so authors can attach an image or audio to any individual option (the new
 * shape: e.g. audio-on-options for "which clip is X?").
 */
export function OptionCard({
  option,
  isCorrect,
  onSelectCorrect,
  onChange,
  onRemove,
  canRemove,
  maxLength,
  textOptional = false,
  showCorrectToggle = true,
}: {
  option: OptionT;
  isCorrect?: boolean;
  onSelectCorrect?: () => void;
  onChange: (patch: Partial<OptionT>) => void;
  onRemove: () => void;
  canRemove: boolean;
  maxLength?: number;
  textOptional?: boolean;
  showCorrectToggle?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-md border p-3 grid gap-2 bg-[var(--color-surface)]",
        isCorrect
          ? "border-[var(--color-correct)]"
          : "border-[var(--color-border)]",
      )}
    >
      <div className="flex items-center gap-2">
        {showCorrectToggle && onSelectCorrect && (
          <button
            type="button"
            onClick={onSelectCorrect}
            className={cn(
              "text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full border",
              isCorrect
                ? "bg-[var(--color-correct)] text-white border-[var(--color-correct)]"
                : "border-[var(--color-border-2)] text-[var(--color-text-dim)] hover:border-[var(--color-correct)]",
            )}
          >
            {isCorrect ? "Correct" : "Mark correct"}
          </button>
        )}
        <span className="ml-auto text-[10px] font-mono text-[var(--color-text-dim)]">
          {option.id}
        </span>
        <button
          type="button"
          onClick={onRemove}
          disabled={!canRemove}
          className="p-1 rounded text-[var(--color-text-dim)] hover:text-[var(--color-incorrect)] disabled:opacity-40"
          aria-label="Remove option"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
      <MediaBlockEditor
        block={option}
        onChange={(patch) => onChange(patch)}
        textRows={1}
        textPlaceholder="Option text"
        textMaxLength={maxLength}
        compact
        textOptional={textOptional}
      />
    </div>
  );
}
