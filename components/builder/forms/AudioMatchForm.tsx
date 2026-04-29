"use client";
import type { AudioMatchQuestion } from "@/lib/quiz-schema";
import { Trash2, Plus } from "lucide-react";
import { ScoringFields } from "../ScoringFields";
import { inputCls, textareaCls } from "../form-styles";
import { usePermissions } from "@/lib/builder/permissions";

type Props = {
  question: AudioMatchQuestion;
  onChange: (q: AudioMatchQuestion) => void;
};

export function AudioMatchForm({ question, onChange }: Props) {
  const { isAdmin, limit } = usePermissions();

  function setOption(id: string, patch: Partial<{ label: string }>) {
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
    if (question.options.length <= 2) return;
    const next = question.options.filter((o) => o.id !== id);
    onChange({
      ...question,
      options: next,
      correctId: question.correctId === id ? next[0].id : question.correctId,
    });
  }

  return (
    <div className="grid gap-3">
      <label className="grid gap-1 text-sm">
        <span className="text-xs uppercase tracking-wide text-[var(--color-text-dim)]">
          Prompt
        </span>
        <textarea
          value={question.prompt}
          onChange={(e) => onChange({ ...question, prompt: e.target.value })}
          rows={2}
          maxLength={limit("questionPrompt")}
          className={textareaCls}
          placeholder="e.g., Which scene plays this music?"
        />
      </label>

      {/* Audio source. Hidden for non-admins — they can't host or link
          arbitrary clips. Admin uses an existing /music/ track or a
          committed /quiz-audio/ clip. */}
      {isAdmin && (
        <label className="grid gap-1 text-sm">
          <span className="text-xs uppercase tracking-wide text-[var(--color-text-dim)]">
            Audio source
          </span>
          <input
            type="text"
            value={question.audioSrc}
            onChange={(e) => onChange({ ...question, audioSrc: e.target.value })}
            placeholder="/music/Hyouhaku.mp3 or full URL"
            className={inputCls}
          />
        </label>
      )}

      <fieldset className="grid gap-2">
        <legend className="text-xs uppercase tracking-wide text-[var(--color-text-dim)]">
          Options (pick one as correct)
        </legend>
        {question.options.map((opt) => (
          <div
            key={opt.id}
            className="grid grid-cols-[auto,1fr,auto] gap-2 items-center"
          >
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
              maxLength={limit("optionLabel")}
              className={inputCls}
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

      <label className="grid gap-1 text-sm">
        <span className="text-xs uppercase tracking-wide text-[var(--color-text-dim)]">
          Explanation
        </span>
        <textarea
          value={question.explanation}
          onChange={(e) => onChange({ ...question, explanation: e.target.value })}
          rows={3}
          maxLength={limit("questionExplanation")}
          className={textareaCls}
        />
      </label>

      <ScoringFields question={question} onChange={(q) => onChange(q as AudioMatchQuestion)} />
    </div>
  );
}
