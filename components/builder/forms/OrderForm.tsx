"use client";
import type { OrderQuestion } from "@/lib/quiz-schema";
import { Trash2, Plus, ArrowDown, ArrowRight } from "lucide-react";
import { ScoringFields } from "../ScoringFields";

type Props = {
  question: OrderQuestion;
  onChange: (q: OrderQuestion) => void;
};

const inputCls =
  "px-2 py-1 rounded border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm";

export function OrderForm({ question, onChange }: Props) {
  function addItem() {
    const newId = `${question.id}-item-${Date.now().toString(36)}`;
    onChange({
      ...question,
      items: [...question.items, { id: newId, label: "New item" }],
      correctOrder: [...question.correctOrder, newId],
    });
  }
  function removeItem(id: string) {
    if (question.items.length <= 2) return;
    onChange({
      ...question,
      items: question.items.filter((it) => it.id !== id),
      correctOrder: question.correctOrder.filter((cid) => cid !== id),
    });
  }
  function moveItem(id: string, dir: -1 | 1) {
    const idx = question.correctOrder.indexOf(id);
    const target = idx + dir;
    if (target < 0 || target >= question.correctOrder.length) return;
    const next = [...question.correctOrder];
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange({ ...question, correctOrder: next });
  }

  // Render in correctOrder order so the form mirrors the "answer".
  const orderedItems = question.correctOrder
    .map((id) => question.items.find((it) => it.id === id))
    .filter((x): x is NonNullable<typeof x> => x !== undefined);

  return (
    <div className="grid gap-3">
      <label className="grid gap-1 text-sm">
        <span className="text-xs uppercase tracking-wide text-[var(--color-text-dim)]">Prompt</span>
        <textarea
          value={question.prompt}
          onChange={(e) => onChange({ ...question, prompt: e.target.value })}
          rows={2}
          className="px-2 py-1.5 rounded border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm resize-y font-sans"
        />
      </label>

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

      <div className="grid grid-cols-[1fr,1fr,1fr] gap-3">
        <label className="grid gap-1 text-sm">
          <span className="text-xs uppercase tracking-wide text-[var(--color-text-dim)]">Axis</span>
          <select
            value={question.axis}
            onChange={(e) => onChange({ ...question, axis: e.target.value as "horizontal" | "vertical" })}
            className={inputCls}
          >
            <option value="vertical">Vertical (top → bottom)</option>
            <option value="horizontal">Horizontal (left → right)</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-xs uppercase tracking-wide text-[var(--color-text-dim)]">Start label</span>
          <input
            type="text"
            value={question.startLabel}
            onChange={(e) => onChange({ ...question, startLabel: e.target.value })}
            className={inputCls}
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-xs uppercase tracking-wide text-[var(--color-text-dim)]">End label</span>
          <input
            type="text"
            value={question.endLabel}
            onChange={(e) => onChange({ ...question, endLabel: e.target.value })}
            className={inputCls}
          />
        </label>
      </div>

      <fieldset className="grid gap-2">
        <legend className="text-xs uppercase tracking-wide text-[var(--color-text-dim)] flex items-center gap-1">
          Items in correct order {question.axis === "vertical" ? <ArrowDown className="w-3 h-3" /> : <ArrowRight className="w-3 h-3" />}
        </legend>
        {orderedItems.map((it, i) => (
          <div key={it.id} className="grid grid-cols-[auto,1fr,1fr,auto,auto,auto] gap-2 items-center">
            <span className="font-mono text-xs text-[var(--color-text-dim)] w-6 text-right">#{i + 1}</span>
            <input
              type="text"
              value={it.label}
              onChange={(e) =>
                onChange({
                  ...question,
                  items: question.items.map((x) =>
                    x.id === it.id ? { ...x, label: e.target.value } : x,
                  ),
                })
              }
              placeholder="Item label"
              className={inputCls}
            />
            <input
              type="text"
              value={it.thumbnail ?? ""}
              onChange={(e) =>
                onChange({
                  ...question,
                  items: question.items.map((x) =>
                    x.id === it.id ? { ...x, thumbnail: e.target.value || undefined } : x,
                  ),
                })
              }
              placeholder="Thumbnail URL (optional)"
              className={inputCls}
            />
            <button
              type="button"
              onClick={() => moveItem(it.id, -1)}
              disabled={i === 0}
              className="p-1 text-[var(--color-text-dim)] hover:text-[var(--color-text)] disabled:opacity-30"
              aria-label="Move up"
            >
              ↑
            </button>
            <button
              type="button"
              onClick={() => moveItem(it.id, 1)}
              disabled={i === orderedItems.length - 1}
              className="p-1 text-[var(--color-text-dim)] hover:text-[var(--color-text)] disabled:opacity-30"
              aria-label="Move down"
            >
              ↓
            </button>
            <button
              type="button"
              onClick={() => removeItem(it.id)}
              disabled={question.items.length <= 2}
              className="p-1.5 rounded text-[var(--color-text-dim)] hover:text-[var(--color-incorrect)] disabled:opacity-40"
              aria-label="Remove item"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addItem}
          className="self-start mt-1 px-2 py-1 text-xs rounded bg-[var(--color-surface-2)] hover:bg-[var(--color-border-2)] text-[var(--color-text)] flex items-center gap-1"
        >
          <Plus className="w-3 h-3" /> Add item
        </button>
      </fieldset>

      <label className="grid gap-1 text-sm">
        <span className="text-xs uppercase tracking-wide text-[var(--color-text-dim)]">Explanation</span>
        <textarea
          value={question.explanation}
          onChange={(e) => onChange({ ...question, explanation: e.target.value })}
          rows={3}
          className="px-2 py-1.5 rounded border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm resize-y font-sans"
        />
      </label>

      <ScoringFields question={question} onChange={(q) => onChange(q as OrderQuestion)} />
    </div>
  );
}
