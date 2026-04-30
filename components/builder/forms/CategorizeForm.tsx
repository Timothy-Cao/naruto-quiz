"use client";
import type { CategorizeQuestion, CategorizeItemT, MediaBlockT, OptionT } from "@/lib/quiz-schema";
import { Trash2, Plus } from "lucide-react";
import { ScoringFields } from "../ScoringFields";
import { textareaCls, inputCls } from "../form-styles";
import { usePermissions } from "@/lib/builder/permissions";
import { MediaBlockEditor } from "../MediaBlockEditor";
import { cn } from "@/lib/utils";

type Props = {
  question: CategorizeQuestion;
  onChange: (q: CategorizeQuestion) => void;
};

export function CategorizeForm({ question, onChange }: Props) {
  const { limit } = usePermissions();

  function addBucket() {
    const newId = `${question.id}-bucket-${Date.now().toString(36)}`;
    onChange({
      ...question,
      buckets: [...question.buckets, { id: newId, text: "New bucket" }],
    });
  }
  function removeBucket(id: string) {
    if (question.buckets.length <= 1) return;
    const remainingFirst = question.buckets.find((b) => b.id !== id)?.id;
    onChange({
      ...question,
      buckets: question.buckets.filter((b) => b.id !== id),
      items: question.items.map((it) =>
        it.correctBucketId === id && remainingFirst
          ? { ...it, correctBucketId: remainingFirst }
          : it,
      ),
    });
  }
  function patchBucket(id: string, patch: Partial<OptionT>) {
    onChange({
      ...question,
      buckets: question.buckets.map((b) => (b.id === id ? { ...b, ...patch } : b)),
    });
  }

  function addItem() {
    const newId = `${question.id}-item-${Date.now().toString(36)}`;
    onChange({
      ...question,
      items: [
        ...question.items,
        { id: newId, text: "New item", correctBucketId: question.buckets[0].id },
      ],
    });
  }
  function removeItem(id: string) {
    if (question.items.length <= 1) return;
    onChange({
      ...question,
      items: question.items.filter((it) => it.id !== id),
    });
  }
  function patchItem(id: string, patch: Partial<CategorizeItemT>) {
    onChange({
      ...question,
      items: question.items.map((it) => (it.id === id ? { ...it, ...patch } : it)),
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
        <legend className="text-xs uppercase tracking-wide text-[var(--color-text-dim)]">Buckets</legend>
        <div className="grid gap-2 grid-cols-1 md:grid-cols-2">
          {question.buckets.map((b) => (
            <div
              key={b.id}
              className="rounded-md border border-[var(--color-border)] p-3 bg-[var(--color-surface)] grid gap-2"
            >
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-wide text-[var(--color-text-dim)]">Bucket</span>
                <span className="ml-auto text-[10px] font-mono text-[var(--color-text-dim)]">{b.id}</span>
                <button
                  type="button"
                  onClick={() => removeBucket(b.id)}
                  disabled={question.buckets.length <= 1}
                  className="p-1 rounded text-[var(--color-text-dim)] hover:text-[var(--color-incorrect)] disabled:opacity-40"
                  aria-label="Remove bucket"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <MediaBlockEditor
                block={b}
                onChange={(patch) => patchBucket(b.id, patch)}
                textRows={1}
                textPlaceholder="Bucket label"
                textMaxLength={limit("bucketLabel")}
                compact
              />
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addBucket}
          className="self-start mt-1 px-2 py-1 text-xs rounded bg-[var(--color-surface-2)] hover:bg-[var(--color-border-2)] text-[var(--color-text)] flex items-center gap-1"
        >
          <Plus className="w-3 h-3" /> Add bucket
        </button>
      </fieldset>

      <fieldset className="grid gap-2">
        <legend className="text-xs uppercase tracking-wide text-[var(--color-text-dim)]">Items</legend>
        <div className="grid gap-2 grid-cols-1 md:grid-cols-2">
          {question.items.map((it) => (
            <div
              key={it.id}
              className="rounded-md border border-[var(--color-border)] p-3 bg-[var(--color-surface)] grid gap-2"
            >
              <div className="flex items-center gap-2">
                <select
                  value={it.correctBucketId}
                  onChange={(e) => patchItem(it.id, { correctBucketId: e.target.value })}
                  className={cn(inputCls, "max-w-[10rem]")}
                  aria-label="Correct bucket for this item"
                >
                  {question.buckets.map((b) => (
                    <option key={b.id} value={b.id}>
                      → {b.text ?? b.id}
                    </option>
                  ))}
                </select>
                <span className="ml-auto text-[10px] font-mono text-[var(--color-text-dim)]">{it.id}</span>
                <button
                  type="button"
                  onClick={() => removeItem(it.id)}
                  disabled={question.items.length <= 1}
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
                textOptional
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

      <ScoringFields question={question} onChange={(q) => onChange(q as CategorizeQuestion)} />
    </div>
  );
}
