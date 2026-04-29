"use client";
import type { Question } from "@/lib/quiz-schema";
import { inputCls } from "./form-styles";

type Props = {
  question: Question;
  onChange: (next: Question) => void;
};

const SCHEMES_BY_TYPE: Record<Question["type"], { value: string; label: string }[]> = {
  "mc-single": [{ value: "all-or-nothing", label: "All or nothing" }],
  "mc-multi": [
    { value: "all-or-nothing", label: "All or nothing" },
    { value: "per-option", label: "Per-option (correct selects + correct skips)" },
  ],
  categorize: [
    { value: "all-or-nothing", label: "All or nothing" },
    { value: "per-item", label: "Per-item (one credit per correctly placed item)" },
  ],
  order: [
    { value: "all-or-nothing", label: "All or nothing" },
    { value: "per-position", label: "Per-position (one credit per correct slot)" },
  ],
  slider: [
    { value: "all-or-nothing", label: "Exact only" },
    { value: "tolerance", label: "Tolerance bands" },
  ],
  name: [{ value: "all-or-nothing", label: "All or nothing" }],
  "audio-match": [{ value: "all-or-nothing", label: "All or nothing" }],
};

export function ScoringFields({ question, onChange }: Props) {
  const max = question.scoring?.maxPoints ?? 1;
  const currentScheme =
    "scoring" in question && question.scoring && "scheme" in question.scoring
      ? (question.scoring.scheme ?? "all-or-nothing")
      : "all-or-nothing";

  const schemes = SCHEMES_BY_TYPE[question.type];
  const showSchemeDropdown = schemes.length > 1;

  function setMax(value: number) {
    onChange({
      ...question,
      scoring: { ...(question.scoring ?? {}), maxPoints: value },
    } as Question);
  }

  function setScheme(scheme: string) {
    onChange({
      ...question,
      scoring: { ...(question.scoring ?? {}), maxPoints: max, scheme },
    } as Question);
  }

  function setTolerance(tolerance: number) {
    if (question.type !== "slider") return;
    onChange({
      ...question,
      scoring: {
        ...(question.scoring ?? { maxPoints: max }),
        scheme: "tolerance",
        tolerance,
        partialCredit: question.scoring?.partialCredit ?? 0.5,
      },
    });
  }

  function setPartialCredit(partialCredit: number) {
    if (question.type !== "slider") return;
    onChange({
      ...question,
      scoring: {
        ...(question.scoring ?? { maxPoints: max }),
        scheme: "tolerance",
        tolerance: question.scoring?.tolerance ?? 1,
        partialCredit,
      },
    });
  }

  return (
    <fieldset className="grid gap-3 mt-3 p-3 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)]">
      <legend className="text-xs uppercase tracking-wide text-[var(--color-text-dim)] px-1">
        Scoring
      </legend>

      <label className="grid grid-cols-[140px,1fr] gap-3 items-center text-sm">
        <span className="text-[var(--color-text-dim)]">Max points</span>
        <input
          type="number"
          step={0.5}
          min={0.5}
          value={max}
          onChange={(e) => setMax(parseFloat(e.target.value) || 1)}
          className={inputCls}
        />
      </label>

      {showSchemeDropdown && (
        <label className="grid grid-cols-[140px,1fr] gap-3 items-center text-sm">
          <span className="text-[var(--color-text-dim)]">Scheme</span>
          <select
            value={currentScheme}
            onChange={(e) => setScheme(e.target.value)}
            className={inputCls}
          >
            {schemes.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </label>
      )}

      {question.type === "slider" && currentScheme === "tolerance" && (
        <>
          <label className="grid grid-cols-[140px,1fr] gap-3 items-center text-sm">
            <span className="text-[var(--color-text-dim)]">Tolerance ±</span>
            <input
              type="number"
              min={0}
              step={1}
              value={question.scoring?.tolerance ?? 1}
              onChange={(e) => setTolerance(parseFloat(e.target.value) || 0)}
              className={inputCls}
            />
          </label>
          <label className="grid grid-cols-[140px,1fr] gap-3 items-center text-sm">
            <span className="text-[var(--color-text-dim)]">Partial credit (0–1)</span>
            <input
              type="number"
              min={0}
              max={1}
              step={0.05}
              value={question.scoring?.partialCredit ?? 0.5}
              onChange={(e) => setPartialCredit(parseFloat(e.target.value) || 0)}
              className={inputCls}
            />
          </label>
        </>
      )}
    </fieldset>
  );
}
