"use client";
import { useState } from "react";
import type { Question } from "@/lib/quiz-schema";
import { ChevronDown, ChevronRight, Copy, Trash2, GripVertical } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { McSingleForm } from "./forms/McSingleForm";
import { McMultiForm } from "./forms/McMultiForm";
import { CategorizeForm } from "./forms/CategorizeForm";
import { OrderForm } from "./forms/OrderForm";
import { SliderForm } from "./forms/SliderForm";
import { NameForm } from "./forms/NameForm";
import { LettersForm } from "./forms/LettersForm";
import { cn } from "@/lib/utils";

type Props = {
  question: Question;
  index: number;
  isSelected: boolean;
  onChange: (q: Question) => void;
  onSelect: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  // When true, hides the drag handle (used in paginated mode where dnd
  // reordering doesn't make sense).
  hideDragHandle?: boolean;
};

const TYPE_LABEL: Record<Question["type"], string> = {
  "mc-single": "MC single",
  "mc-multi": "MC multi",
  categorize: "Categorize",
  order: "Order",
  slider: "Slider",
  name: "Name",
  letters: "Letters",
};

export function QuestionCard({
  question,
  index,
  isSelected,
  onChange,
  onSelect,
  onDuplicate,
  onDelete,
  hideDragHandle = false,
}: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: question.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onSelect}
      className={cn(
        "rounded-lg border bg-[var(--color-surface)] transition-colors cursor-pointer",
        isSelected ? "border-[var(--color-accent)]" : "border-[var(--color-border)]",
        isDragging && "opacity-60",
      )}
    >
      <div className="flex items-center gap-2 p-3 border-b border-[var(--color-border)]">
        {!hideDragHandle && (
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-[var(--color-text-dim)] hover:text-[var(--color-text)]"
            aria-label="Drag to reorder"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="w-4 h-4" />
          </button>
        )}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setCollapsed((c) => !c);
          }}
          className="text-[var(--color-text-dim)] hover:text-[var(--color-text)]"
          aria-label={collapsed ? "Expand" : "Collapse"}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        <span className="font-mono text-xs text-[var(--color-text-dim)]">#{index + 1}</span>
        <span className="text-xs uppercase tracking-wide px-2 py-0.5 rounded bg-[var(--color-surface-2)] text-[var(--color-text-dim)]">
          {TYPE_LABEL[question.type]}
        </span>
        <span className="text-sm text-[var(--color-text)] truncate flex-1">
          {question.prompt.text || <span className="italic text-[var(--color-text-dim)]">untitled question</span>}
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDuplicate();
          }}
          className="p-1.5 rounded text-[var(--color-text-dim)] hover:text-[var(--color-text)]"
          aria-label="Duplicate question"
        >
          <Copy className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (confirm("Delete this question?")) onDelete();
          }}
          className="p-1.5 rounded text-[var(--color-text-dim)] hover:text-[var(--color-incorrect)]"
          aria-label="Delete question"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {!collapsed && (
        <div className="p-3" onClick={(e) => e.stopPropagation()}>
          <Form question={question} onChange={onChange} />
        </div>
      )}
    </div>
  );
}

function Form({
  question,
  onChange,
}: {
  question: Question;
  onChange: (q: Question) => void;
}) {
  switch (question.type) {
    case "mc-single":
      return <McSingleForm question={question} onChange={onChange} />;
    case "mc-multi":
      return <McMultiForm question={question} onChange={onChange} />;
    case "categorize":
      return <CategorizeForm question={question} onChange={onChange} />;
    case "order":
      return <OrderForm question={question} onChange={onChange} />;
    case "slider":
      return <SliderForm question={question} onChange={onChange} />;
    case "name":
      return <NameForm question={question} onChange={onChange} />;
    case "letters":
      return <LettersForm question={question} onChange={onChange} />;
  }
}
