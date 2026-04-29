"use client";
import type { McSingleQuestion } from "@/lib/quiz-schema";
import { Trash2, Plus } from "lucide-react";
import { ScoringFields } from "../ScoringFields";

type Props = {
  question: McSingleQuestion;
  onChange: (q: McSingleQuestion) => void;
};

export function McSingleForm({ question, onChange }: Props) {
  function setOption(id: string, patch: Partial<{ label: string; thumbnail?: string }>) {
    onChange({
      ...question,
      options: question.options.map((o) => (o.id === id ? { ...o, ...patch } : o)),
    });
  }

  function addOption() {
    const newId = `${question.id}-opt-${Date.now().toString(36)}`;
    onChange({
      ...question,
      options: [...question.options, { id: newId, label: "New option" }],
    });
  }

  function removeOption(id: string) {
    if (question.options.length <= 2) return; // schema requires min 2
    const next = question.options.filter((o) => o.id !== id);
    onChange({
      ...question,
      options: next,
      correctId: question.correctId === id ? next[0].id : question.correctId,
    });
  }

  function setPrompt(prompt: string) { onChange({ ...question, prompt }); }
  function setImage(image: string) {
    onChange({ ...question, image: image || undefined });
  }
  function setExplanation(explanation: string) { onChange({ ...question, explanation }); }

  return (
    <div className="grid gap-3">
      <Field label="Prompt">
        <textarea
          value={question.prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={2}
          className="textarea"
        />
      </Field>

      <Field label="Image (URL or /quiz-images/...)">
        <input
          type="text"
          value={question.image ?? ""}
          onChange={(e) => setImage(e.target.value)}
          placeholder="optional"
          className="input"
        />
      </Field>

      <fieldset className="grid gap-2">
        <legend className="text-xs uppercase tracking-wide text-[var(--color-text-dim)]">
          Options (pick one as correct)
        </legend>
        {question.options.map((opt) => (
          <div key={opt.id} className="grid grid-cols-[auto,1fr,1fr,auto] gap-2 items-center">
            <input
              type="radio"
              name={`${question.id}-correct`}
              checked={question.correctId === opt.id}
              onChange={() => onChange({ ...question, correctId: opt.id })}
              className="accent-[var(--color-accent)]"
            />
            <input
              type="text"
              value={opt.label}
              onChange={(e) => setOption(opt.id, { label: e.target.value })}
              placeholder="Label"
              className="input"
            />
            <input
              type="text"
              value={opt.thumbnail ?? ""}
              onChange={(e) => setOption(opt.id, { thumbnail: e.target.value || undefined })}
              placeholder="Thumbnail URL (optional)"
              className="input"
            />
            <button
              type="button"
              onClick={() => removeOption(opt.id)}
              disabled={question.options.length <= 2}
              className="p-1.5 rounded text-[var(--color-text-dim)] hover:text-[var(--color-incorrect)] disabled:opacity-40"
              aria-label="Remove option"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addOption}
          className="self-start mt-1 px-2 py-1 text-xs rounded bg-[var(--color-surface-2)] hover:bg-[var(--color-border-2)] text-[var(--color-text)] flex items-center gap-1"
        >
          <Plus className="w-3 h-3" /> Add option
        </button>
      </fieldset>

      <Field label="Explanation">
        <textarea
          value={question.explanation}
          onChange={(e) => setExplanation(e.target.value)}
          rows={3}
          className="textarea"
        />
      </Field>

      <ScoringFields question={question} onChange={(q) => onChange(q as McSingleQuestion)} />

      <style jsx>{`
        .input, :global(.input) {
          padding: 0.375rem 0.625rem;
          border-radius: 6px;
          border: 1px solid var(--color-border);
          background: var(--color-bg);
          color: var(--color-text);
          font-size: 0.875rem;
        }
        .textarea, :global(.textarea) {
          padding: 0.5rem;
          border-radius: 6px;
          border: 1px solid var(--color-border);
          background: var(--color-bg);
          color: var(--color-text);
          font-size: 0.875rem;
          font-family: inherit;
          resize: vertical;
        }
      `}</style>
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
