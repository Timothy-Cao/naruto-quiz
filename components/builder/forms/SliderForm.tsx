"use client";
import type { SliderQuestion } from "@/lib/quiz-schema";
import { ScoringFields } from "../ScoringFields";
import { inputCls, textareaCls } from "../form-styles";
import { usePermissions } from "@/lib/builder/permissions";

type Props = {
  question: SliderQuestion;
  onChange: (q: SliderQuestion) => void;
};

export function SliderForm({ question, onChange }: Props) {
  const { isAdmin, limit } = usePermissions();
  return (
    <div className="grid gap-3">
      <label className="grid gap-1 text-sm">
        <span className="text-xs uppercase tracking-wide text-[var(--color-text-dim)]">Prompt</span>
        <textarea
          value={question.prompt}
          onChange={(e) => onChange({ ...question, prompt: e.target.value })}
          rows={2}
          maxLength={limit("questionPrompt")}
          className={textareaCls}
        />
      </label>

      {isAdmin && (
        <label className="grid gap-1 text-sm">
          <span className="text-xs uppercase tracking-wide text-[var(--color-text-dim)]">Image</span>
          <input
            type="text"
            value={question.image ?? ""}
            onChange={(e) => onChange({ ...question, image: e.target.value || undefined })}
            placeholder="URL or /quiz-images/... (optional)"
            className={inputCls}
          />
        </label>
      )}

      <div className="grid grid-cols-4 gap-3">
        <label className="grid gap-1 text-sm">
          <span className="text-xs uppercase tracking-wide text-[var(--color-text-dim)]">Min</span>
          <input
            type="number"
            value={question.min}
            onChange={(e) => onChange({ ...question, min: parseInt(e.target.value) })}
            className={inputCls}
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-xs uppercase tracking-wide text-[var(--color-text-dim)]">Max</span>
          <input
            type="number"
            value={question.max}
            onChange={(e) => onChange({ ...question, max: parseInt(e.target.value) })}
            className={inputCls}
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-xs uppercase tracking-wide text-[var(--color-text-dim)]">Step</span>
          <input
            type="number"
            value={question.step}
            min={1}
            onChange={(e) => onChange({ ...question, step: parseInt(e.target.value) || 1 })}
            className={inputCls}
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-xs uppercase tracking-wide text-[var(--color-text-dim)]">Correct value</span>
          <input
            type="number"
            value={question.correctValue}
            onChange={(e) => onChange({ ...question, correctValue: parseInt(e.target.value) })}
            className={inputCls}
          />
        </label>
      </div>

      <label className="grid gap-1 text-sm">
        <span className="text-xs uppercase tracking-wide text-[var(--color-text-dim)]">Explanation</span>
        <textarea
          value={question.explanation}
          onChange={(e) => onChange({ ...question, explanation: e.target.value })}
          rows={3}
          maxLength={limit("questionExplanation")}
          className={textareaCls}
        />
      </label>

      <ScoringFields question={question} onChange={(q) => onChange(q as SliderQuestion)} />
    </div>
  );
}
