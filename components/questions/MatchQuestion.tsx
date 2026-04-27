"use client";
import { useEffect, useState } from "react";
import type { MatchQuestion } from "@/lib/quiz-schema";
import type { QuestionProps } from "./types";
import { ZoomableImage } from "@/components/quiz/ZoomableImage";
import { cn } from "@/lib/utils";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragEndEvent,
} from "@dnd-kit/core";

function Draggable({
  id,
  label,
  thumbnail,
  disabled,
}: {
  id: string;
  label: string;
  thumbnail?: string;
  disabled: boolean;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id, disabled });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={cn(
        "p-2 rounded-md border bg-[var(--color-surface-2)] cursor-grab active:cursor-grabbing",
        "flex items-center gap-2 text-sm text-[var(--color-text)] select-none",
        "border-[var(--color-border-2)]",
        isDragging && "opacity-40",
        disabled && "cursor-default",
      )}
    >
      {thumbnail && <ZoomableImage src={thumbnail} alt={label} className="w-8 h-8 shrink-0" />}
      <span>{label}</span>
    </div>
  );
}

function Droppable({
  id,
  children,
  highlight,
}: {
  id: string;
  children: React.ReactNode;
  highlight: "none" | "correct" | "incorrect";
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "min-h-[3.25rem] p-2 rounded-md border-2 border-dashed flex items-center",
        "border-[var(--color-border-2)] bg-[var(--color-surface)]",
        isOver && "border-[var(--color-accent)]",
        highlight === "correct" && "border-[var(--color-correct)] border-solid",
        highlight === "incorrect" && "border-[var(--color-incorrect)] border-solid",
      )}
    >
      {children}
    </div>
  );
}

export function MatchQuestionRenderer({
  question,
  state,
  onChange,
}: QuestionProps<MatchQuestion, Record<string, string>>) {
  const locked = state.status === "confirmed";
  const initial: Record<string, string> =
    state.status === "unanswered" ? {} : (state.value as Record<string, string>);

  const [pairs, setPairs] = useState<Record<string, string>>(initial);

  useEffect(() => {
    if (state.status === "unanswered") setPairs({});
    else setPairs(state.value as Record<string, string>);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.status]);

  const sensors = useSensors(useSensor(PointerSensor));

  function handleDragEnd(e: DragEndEvent) {
    if (locked) return;
    const rightId = e.active.id as string;
    const leftId = e.over?.id as string | undefined;
    if (!leftId) return;
    // remove rightId from any other slot, then assign
    const next: Record<string, string> = {};
    for (const [k, v] of Object.entries(pairs)) {
      if (v !== rightId) next[k] = v;
    }
    next[leftId] = rightId;
    setPairs(next);
    onChange(next);
  }

  const labelOnRight: Record<string, { label: string; thumbnail?: string }> = {};
  for (const r of question.right) labelOnRight[r.id] = r;

  const correctMap: Record<string, string> = {};
  for (const p of question.correctPairs) correctMap[p.leftId] = p.rightId;

  const placedRightIds = new Set(Object.values(pairs));
  const tray = question.right.filter((r) => !placedRightIds.has(r.id));

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-[1fr,1fr] gap-4">
        {/* Left fixed column with drop zones */}
        <div className="grid gap-2">
          <p className="text-xs uppercase tracking-wide text-[var(--color-text-dim)]">Pairs</p>
          {question.left.map((l) => {
            const placedRightId = pairs[l.id];
            const placed = placedRightId ? labelOnRight[placedRightId] : null;
            const highlight: "none" | "correct" | "incorrect" =
              !locked || !placedRightId
                ? "none"
                : correctMap[l.id] === placedRightId
                ? "correct"
                : "incorrect";
            return (
              <div key={l.id} className="grid grid-cols-[max-content,1fr] gap-2 items-center">
                <div className="p-2 rounded-md border bg-[var(--color-surface-2)] text-sm text-[var(--color-text)] flex items-center gap-2 border-[var(--color-border)]">
                  {l.thumbnail && (
                    <ZoomableImage src={l.thumbnail} alt={l.label} className="w-8 h-8 shrink-0" />
                  )}
                  <span>{l.label}</span>
                </div>
                <Droppable id={l.id} highlight={highlight}>
                  {placed ? (
                    <Draggable id={placedRightId} label={placed.label} thumbnail={placed.thumbnail} disabled={locked} />
                  ) : (
                    <span className="text-xs text-[var(--color-text-dim)]">Drop here</span>
                  )}
                </Droppable>
                {locked && correctMap[l.id] !== placedRightId && (
                  <p className="col-span-2 text-xs text-[var(--color-text-dim)]">
                    Correct: <span className="text-[var(--color-correct)]">{labelOnRight[correctMap[l.id]].label}</span>
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Right tray of unplaced items */}
        <div className="grid gap-2">
          <p className="text-xs uppercase tracking-wide text-[var(--color-text-dim)]">Drag from</p>
          <div className="grid gap-2">
            {tray.map((r) => (
              <Draggable key={r.id} id={r.id} label={r.label} thumbnail={r.thumbnail} disabled={locked} />
            ))}
            {tray.length === 0 && (
              <p className="text-xs text-[var(--color-text-dim)]">All placed.</p>
            )}
          </div>
        </div>
      </div>
    </DndContext>
  );
}
