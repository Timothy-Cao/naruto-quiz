"use client";
import { useState } from "react";
import type { Question } from "@/lib/quiz-schema";
import { Plus, ListChecks, ListPlus, Layers, ArrowDown, Sliders, Type } from "lucide-react";

type QuestionType = Question["type"];

const TYPES: { type: QuestionType; label: string; icon: React.ElementType; desc: string }[] = [
  { type: "mc-single", label: "MC single", icon: ListChecks, desc: "Pick one correct option" },
  { type: "mc-multi", label: "MC multi", icon: ListPlus, desc: "Pick all that apply" },
  { type: "categorize", label: "Categorize", icon: Layers, desc: "Drag items into buckets" },
  { type: "order", label: "Order", icon: ArrowDown, desc: "Sort items along an axis" },
  { type: "slider", label: "Slider", icon: Sliders, desc: "Pick a number on a range" },
  { type: "name", label: "Name", icon: Type, desc: "Type a name with autocomplete" },
];

export function AddQuestionPopover({
  onAdd,
  disabled = false,
  disabledReason,
}: {
  onAdd: (type: QuestionType) => void;
  disabled?: boolean;
  disabledReason?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        title={disabled ? disabledReason : undefined}
        className="px-3 py-2 rounded bg-[var(--color-accent)] hover:bg-[var(--color-accent)]/90 text-white text-sm flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Plus className="w-4 h-4" /> Add question
      </button>
      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <div className="absolute z-20 mt-2 w-72 rounded-md border border-[var(--color-border-2)] bg-[var(--color-surface)] shadow-2xl p-1">
            {TYPES.map(({ type, label, icon: Icon, desc }) => (
              <button
                key={type}
                type="button"
                onClick={() => {
                  onAdd(type);
                  setOpen(false);
                }}
                className="w-full flex items-start gap-3 p-2 rounded hover:bg-[var(--color-surface-2)] text-left"
              >
                <Icon className="w-4 h-4 mt-1 text-[var(--color-accent)]" />
                <div>
                  <p className="text-sm text-[var(--color-text)]">{label}</p>
                  <p className="text-xs text-[var(--color-text-dim)]">{desc}</p>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
