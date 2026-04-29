"use client";
import { useEffect, useState } from "react";
import type { OrderQuestion } from "@/lib/quiz-schema";
import type { QuestionProps } from "./types";
import { ZoomableImage } from "@/components/quiz/ZoomableImage";
import { cn } from "@/lib/utils";
import {
  DndContext,
  PointerSensor,
  TouchSensor,
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
import { ArrowRight, GripVertical } from "lucide-react";

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
        "flex items-center gap-2 text-[var(--color-text)] shadow-sm hover:border-[var(--color-border-2)] transition-colors",
        axis === "horizontal" ? "min-w-[120px]" : "w-full",
        borderClass,
        isDragging && "opacity-60 shadow-2xl",
      )}
    >
      <GripVertical className="w-4 h-4 text-[var(--color-text-dim)] shrink-0" />
      {thumbnail && <ZoomableImage src={thumbnail} alt={label} className="w-8 h-8 shrink-0" />}
      <span className="text-sm">{label}</span>
    </div>
  );
}

function VerticalAxis({ startLabel, endLabel }: { startLabel: string; endLabel: string }) {
  return (
    <div className="flex flex-col items-center w-12 shrink-0 self-stretch py-1">
      <span className="text-xs uppercase tracking-wide text-[var(--color-text-dim)] font-[family-name:var(--font-display)] text-base">
        {startLabel}
      </span>
      <div className="flex-1 my-2 w-1 rounded-full bg-gradient-to-b from-[var(--color-accent)] to-[var(--color-accent-2)] relative">
        <span
          className="absolute left-1/2 bottom-0 -translate-x-1/2 translate-y-1/2 w-0 h-0
                     border-l-[8px] border-l-transparent
                     border-r-[8px] border-r-transparent
                     border-t-[10px] border-t-[var(--color-accent-2)]"
        />
      </div>
      <span className="text-xs uppercase tracking-wide text-[var(--color-text-dim)] font-[family-name:var(--font-display)] text-base mt-1">
        {endLabel}
      </span>
    </div>
  );
}

function HorizontalAxis({ startLabel, endLabel }: { startLabel: string; endLabel: string }) {
  return (
    <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-[var(--color-text-dim)]">
      <span>{startLabel}</span>
      <ArrowRight className="w-4 h-4 text-[var(--color-accent)]" />
      <span>{endLabel}</span>
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

  useEffect(() => {
    if (state.status === "unanswered") setOrder(question.items.map((i) => i.id));
    else setOrder(state.value as string[]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.status]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
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

  const isVertical = question.axis === "vertical";

  const itemList = (
    <div
      className={cn(
        "gap-2 flex-1",
        isVertical ? "grid" : "flex flex-wrap",
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
  );

  return (
    <div className="grid gap-3">
      {!isVertical && <HorizontalAxis startLabel={question.startLabel} endLabel={question.endLabel} />}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext
          items={order}
          strategy={isVertical ? verticalListSortingStrategy : horizontalListSortingStrategy}
        >
          {isVertical ? (
            <div className="flex items-stretch gap-3">
              <VerticalAxis startLabel={question.startLabel} endLabel={question.endLabel} />
              {itemList}
            </div>
          ) : (
            itemList
          )}
        </SortableContext>
      </DndContext>
    </div>
  );
}
