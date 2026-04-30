"use client";
import type { OrderQuestion, OptionT, MediaBlockT } from "@/lib/quiz-schema";
import { Trash2, Plus, ArrowDown, ArrowRight } from "lucide-react";
import { ScoringFields } from "../ScoringFields";
import { inputCls, textareaCls } from "../form-styles";
import { usePermissions } from "@/lib/builder/permissions";
import { MediaBlockEditor } from "../MediaBlockEditor";
import { cn } from "@/lib/utils";

type Props = {
  question: OrderQuestion;
  onChange: (q: OrderQuestion) => void;
};

export function OrderForm({ question, onChange }: Props) {
  const { limit } = usePermissions();

  function addItem() {
    const newId = `${question.id}-item-${Date.now().toString(36)}`;
    onChange({
      ...question,
      items: [...question.items, { id: newId, text: "New item" }],
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
  function patchItem(id: string, patch: Partial<OptionT>) {
    onChange({
      ...question,
      items: question.items.map((x) => (x.id === id ? { ...x, ...patch } : x)),
    });
  }

  function setPrompt(prompt: MediaBlockT) {
    onChange({ ...question, prompt });
  }

  const orderedItems = question.correctOrder
    .map((id) => question.items.find((it) => it.id === id))
    .filter((x): x is NonNullable<typeof x> => x !== undefined);

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
            maxLength={limit("axisLabel")}
            className={inputCls}
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-xs uppercase tracking-wide text-[var(--color-text-dim)]">End label</span>
          <input
            type="text"
            value={question.endLabel}
            onChange={(e) => onChange({ ...question, endLabel: e.target.value })}
            maxLength={limit("axisLabel")}
            className={inputCls}
          />
        </label>
      </div>

      <fieldset className="grid gap-2">
        <legend className="text-xs uppercase tracking-wide text-[var(--color-text-dim)] flex items-center gap-1">
          Items in correct order {question.axis === "vertical" ? <ArrowDown className="w-3 h-3" /> : <ArrowRight className="w-3 h-3" />}
        </legend>
        <div className="grid gap-2">
          {orderedItems.map((it, i) => (
            <div
              key={it.id}
              className="rounded-md border border-[var(--color-border)] p-3 bg-[var(--color-surface)] grid gap-2"
            >
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-[var(--color-accent)] w-6 text-right">#{i + 1}</span>
                <span className="ml-auto text-[10px] font-mono text-[var(--color-text-dim)]">{it.id}</span>
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
                  className="p-1 rounded text-[var(--color-text-dim)] hover:text-[var(--color-incorrect)] disabled:opacity-40"
                  aria-label="Remove item"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <MediaBlockEditor
                block={it}
                onChange={(patch) => patchItem(it.id, patch)}
                textRows={1}
                textPlaceholder="Item label"
                textMaxLength={limit("itemLabel")}
                compact
              />
            </div>
          ))}
        </div>
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
          maxLength={limit("questionExplanation")}
          className={cn(textareaCls, "w-full")}
        />
      </label>

      <ScoringFields question={question} onChange={(q) => onChange(q as OrderQuestion)} />
    </div>
  );
}
