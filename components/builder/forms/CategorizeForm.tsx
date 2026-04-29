"use client";
import type { CategorizeQuestion } from "@/lib/quiz-schema";
import { Trash2, Plus } from "lucide-react";
import { ScoringFields } from "../ScoringFields";
import { inputCls, textareaCls } from "../form-styles";
import { usePermissions } from "@/lib/builder/permissions";

type Props = {
  question: CategorizeQuestion;
  onChange: (q: CategorizeQuestion) => void;
};

export function CategorizeForm({ question, onChange }: Props) {
  const { isAdmin, limit } = usePermissions();
  function addBucket() {
    const newId = `${question.id}-bucket-${Date.now().toString(36)}`;
    onChange({
      ...question,
      buckets: [...question.buckets, { id: newId, label: "New bucket" }],
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

  function addItem() {
    const newId = `${question.id}-item-${Date.now().toString(36)}`;
    onChange({
      ...question,
      items: [
        ...question.items,
        { id: newId, label: "New item", correctBucketId: question.buckets[0].id },
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

      <fieldset className="grid gap-2">
        <legend className="text-xs uppercase tracking-wide text-[var(--color-text-dim)]">Buckets</legend>
        {question.buckets.map((b) => (
          <div
            key={b.id}
            className={
              isAdmin
                ? "grid grid-cols-[1fr,1fr,auto] gap-2 items-center"
                : "grid grid-cols-[1fr,auto] gap-2 items-center"
            }
          >
            <input
              type="text"
              value={b.label}
              onChange={(e) =>
                onChange({
                  ...question,
                  buckets: question.buckets.map((x) =>
                    x.id === b.id ? { ...x, label: e.target.value } : x,
                  ),
                })
              }
              placeholder="Bucket label"
              maxLength={limit("bucketLabel")}
              className={inputCls}
            />
            {isAdmin && (
              <input
                type="text"
                value={b.thumbnail ?? ""}
                onChange={(e) =>
                  onChange({
                    ...question,
                    buckets: question.buckets.map((x) =>
                      x.id === b.id ? { ...x, thumbnail: e.target.value || undefined } : x,
                    ),
                  })
                }
                placeholder="Thumbnail URL (optional)"
                className={inputCls}
              />
            )}
            <button
              type="button"
              onClick={() => removeBucket(b.id)}
              disabled={question.buckets.length <= 1}
              className="p-1.5 rounded text-[var(--color-text-dim)] hover:text-[var(--color-incorrect)] disabled:opacity-40"
              aria-label="Remove bucket"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
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
        {question.items.map((it) => (
          <div
            key={it.id}
            className={
              isAdmin
                ? "grid grid-cols-[1fr,140px,1fr,auto] gap-2 items-center"
                : "grid grid-cols-[1fr,140px,auto] gap-2 items-center"
            }
          >
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
              maxLength={limit("itemLabel")}
              className={inputCls}
            />
            <select
              value={it.correctBucketId}
              onChange={(e) =>
                onChange({
                  ...question,
                  items: question.items.map((x) =>
                    x.id === it.id ? { ...x, correctBucketId: e.target.value } : x,
                  ),
                })
              }
              className={inputCls}
            >
              {question.buckets.map((b) => (
                <option key={b.id} value={b.id}>{b.label}</option>
              ))}
            </select>
            {isAdmin && (
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
            )}
            <button
              type="button"
              onClick={() => removeItem(it.id)}
              disabled={question.items.length <= 1}
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
          maxLength={limit("questionExplanation")}
          className={textareaCls}
        />
      </label>

      <ScoringFields question={question} onChange={(q) => onChange(q as CategorizeQuestion)} />
    </div>
  );
}
