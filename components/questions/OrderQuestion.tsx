"use client";
import { useEffect, useState } from "react";
import type { OrderQuestion } from "@/lib/quiz-schema";
import type { QuestionProps } from "./types";
import { ZoomableImage } from "@/components/quiz/ZoomableImage";
import { cn } from "@/lib/utils";
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowRight, ArrowDown } from "lucide-react";

function SortableItem({
  id,
  label,
  thumbnail,
  axis,
  borderClass,
}: {
  id: string;
  label: string;
  thumbnail?: string;
  axis: "horizontal" | "vertical";
  borderClass: string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "p-3 rounded-md border bg-[var(--color-surface)] cursor-grab active:cursor-grabbing select-none",
        "flex items-center gap-2 text-[var(--color-text)]",
        axis === "horizontal" ? "min-w-[120px]" : "w-full",
        borderClass,
        isDragging && "opacity-60",
      )}
    >
      {thumbnail && <ZoomableImage src={thumbnail} alt={label} className="w-8 h-8 shrink-0" />}
      <span className="text-sm">{label}</span>
    </div>
  );
}

export function OrderQuestionRenderer({
  question,
  state,
  onChange,
}: QuestionProps<OrderQuestion, string[]>) {
  const locked = state.status === "confirmed";

  const initial =
    state.status === "unanswered"
      ? question.items.map((i) => i.id)
      : (state.value as string[]);

  const [order, setOrder] = useState<string[]>(initial);

  // If parent state changes (e.g., reset), sync.
  useEffect(() => {
    if (state.status === "unanswered") setOrder(question.items.map((i) => i.id));
    else setOrder(state.value as string[]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.status]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(e: DragEndEvent) {
    if (locked) return;
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = order.indexOf(active.id as string);
    const newIndex = order.indexOf(over.id as string);
    const next = arrayMove(order, oldIndex, newIndex);
    setOrder(next);
    onChange(next);
  }

  const labelById: Record<string, { label: string; thumbnail?: string }> = {};
  for (const item of question.items) labelById[item.id] = item;

  const Arrow = question.axis === "horizontal" ? ArrowRight : ArrowDown;

  return (
    <div className="grid gap-3">
      <div
        className={cn(
          "flex items-center gap-2 text-xs uppercase tracking-wide text-[var(--color-text-dim)]",
          question.axis === "vertical" && "flex-col items-stretch",
        )}
      >
        <span>{question.startLabel}</span>
        <Arrow className="w-4 h-4 text-[var(--color-accent)]" />
        <span>{question.endLabel}</span>
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext
          items={order}
          strategy={
            question.axis === "horizontal"
              ? horizontalListSortingStrategy
              : verticalListSortingStrategy
          }
        >
          <div
            className={cn(
              "gap-2",
              question.axis === "horizontal" ? "flex flex-wrap" : "grid",
            )}
          >
            {order.map((id, i) => {
              const correctAtI = locked && question.correctOrder[i] === id;
              const wrongAtI = locked && !correctAtI;
              const item = labelById[id];
              return (
                <SortableItem
                  key={id}
                  id={id}
                  label={item.label}
                  thumbnail={item.thumbnail}
                  axis={question.axis}
                  borderClass={cn(
                    "border-[var(--color-border)]",
                    correctAtI && "border-[var(--color-correct)] border-l-4",
                    wrongAtI && "border-[var(--color-incorrect)] border-l-4",
                  )}
                />
              );
            })}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
