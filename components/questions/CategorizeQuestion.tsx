"use client";
import { useEffect, useState } from "react";
import type { CategorizeQuestion, CategorizeItemT, OptionT } from "@/lib/quiz-schema";
import type { QuestionProps } from "./types";
import { MediaBlock } from "@/components/quiz/MediaBlock";
import { cn } from "@/lib/utils";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { GripVertical } from "lucide-react";

const TRAY_ID = "__tray__";

function DraggableChip({
  item,
  disabled,
  isDragging,
  hint,
}: {
  item: CategorizeItemT;
  disabled: boolean;
  isDragging?: boolean;
  hint?: "correct" | "incorrect" | null;
}) {
  const { attributes, listeners, setNodeRef } = useDraggable({ id: item.id, disabled });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={cn(
        "group inline-flex items-center gap-2 px-3 py-2 rounded-md border bg-[var(--color-surface-2)] text-[var(--color-text)] text-sm select-none",
        "border-[var(--color-border-2)] shadow-sm",
        !disabled && "cursor-grab active:cursor-grabbing hover:border-[var(--color-accent)] hover:shadow-md transition-all",
        isDragging && "opacity-30",
        hint === "correct" && "border-[var(--color-correct)]",
        hint === "incorrect" && "border-[var(--color-incorrect)]",
      )}
    >
      {!disabled && <GripVertical className="w-3.5 h-3.5 text-[var(--color-text-dim)] opacity-60 group-hover:opacity-100" />}
      <MediaBlock block={item} size="chip" inlineText />
    </div>
  );
}

function Bucket({
  bucket,
  contents,
  disabled,
  highlight,
  itemHint,
}: {
  bucket: OptionT;
  contents: CategorizeItemT[];
  disabled: boolean;
  highlight: boolean;
  itemHint: (itemId: string) => "correct" | "incorrect" | null;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: bucket.id });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "rounded-lg border-2 border-dashed transition-colors",
        "border-[var(--color-border-2)] bg-[var(--color-surface)]",
        isOver && !disabled && "border-[var(--color-accent)] bg-[var(--color-surface-2)]",
        highlight && "border-solid",
      )}
    >
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[var(--color-border)]">
        <div className="font-[family-name:var(--font-display)] text-lg tracking-wide text-[var(--color-text)]">
          <MediaBlock block={bucket} size="chip" inlineText />
        </div>
        <span className="ml-auto text-xs text-[var(--color-text-dim)] font-mono">
          {contents.length}
        </span>
      </div>
      <div className="p-3 min-h-[5rem] flex flex-wrap gap-2 content-start">
        {contents.length === 0 ? (
          <span className="text-xs text-[var(--color-text-dim)] italic self-center mx-auto">
            Drop here
          </span>
        ) : (
          contents.map((it) => (
            <DraggableChip
              key={it.id}
              item={it}
              disabled={disabled}
              hint={itemHint(it.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function Tray({
  items,
  disabled,
}: {
  items: CategorizeItemT[];
  disabled: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: TRAY_ID });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "rounded-lg border bg-[var(--color-bg)] p-3 transition-colors",
        "border-[var(--color-border)]",
        isOver && !disabled && "border-[var(--color-accent)]",
      )}
    >
      <div className="text-xs uppercase tracking-wide text-[var(--color-text-dim)] mb-2">
        Drag from here
      </div>
      <div className="flex flex-wrap gap-2 min-h-[3rem]">
        {items.length === 0 ? (
          <span className="text-xs text-[var(--color-text-dim)] italic self-center mx-auto">
            All placed
          </span>
        ) : (
          items.map((it) => (
            <DraggableChip key={it.id} item={it} disabled={disabled} />
          ))
        )}
      </div>
    </div>
  );
}

export function CategorizeQuestionRenderer({
  question,
  state,
  onChange,
}: QuestionProps<CategorizeQuestion, Record<string, string>>) {
  const locked = state.status === "confirmed";

  const initialPlacement: Record<string, string> =
    state.status === "unanswered" ? {} : (state.value as Record<string, string>);

  const [placement, setPlacement] = useState<Record<string, string>>(initialPlacement);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (state.status === "unanswered") setPlacement({});
    else setPlacement(state.value as Record<string, string>);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.status]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
  );

  const itemsById: Record<string, CategorizeItemT> = {};
  for (const it of question.items) itemsById[it.id] = it;

  const trayItems = question.items.filter((it) => !placement[it.id]);
  const bucketContents: Record<string, CategorizeItemT[]> = {};
  for (const b of question.buckets) bucketContents[b.id] = [];
  for (const it of question.items) {
    const b = placement[it.id];
    if (b && bucketContents[b]) bucketContents[b].push(it);
  }

  function handleDragStart(e: DragStartEvent) {
    setActiveId(e.active.id as string);
  }

  function handleDragEnd(e: DragEndEvent) {
    setActiveId(null);
    if (locked) return;
    const itemId = e.active.id as string;
    const target = e.over?.id as string | undefined;
    if (!target) return;
    const next = { ...placement };
    if (target === TRAY_ID) {
      delete next[itemId];
    } else {
      next[itemId] = target;
    }
    setPlacement(next);
    onChange(next);
  }

  function itemHintFor(itemId: string): "correct" | "incorrect" | null {
    if (!locked) return null;
    const placed = placement[itemId];
    const correct = itemsById[itemId]?.correctBucketId;
    if (!placed) return "incorrect";
    return placed === correct ? "correct" : "incorrect";
  }

  const activeItem = activeId ? itemsById[activeId] : null;

  return (
    <div className="grid gap-4">
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
          {question.buckets.map((b) => (
            <Bucket
              key={b.id}
              bucket={b}
              contents={bucketContents[b.id]}
              disabled={locked}
              highlight={locked}
              itemHint={itemHintFor}
            />
          ))}
        </div>

        <Tray items={trayItems} disabled={locked} />

        <DragOverlay dropAnimation={{ duration: 180, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" }}>
          {activeItem ? (
            <div className="inline-flex items-center gap-2 px-3 py-2 rounded-md border bg-[var(--color-surface-2)] text-[var(--color-text)] text-sm shadow-2xl scale-105 border-[var(--color-accent)] cursor-grabbing">
              <MediaBlock block={activeItem} size="chip" inlineText />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {locked && (
        <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)] p-3 grid gap-1">
          <p className="text-xs uppercase tracking-wide text-[var(--color-text-dim)] mb-1">
            Misplaced or unplaced
          </p>
          {question.items
            .filter((it) => placement[it.id] !== it.correctBucketId)
            .map((it) => {
              const correctBucket = question.buckets.find((b) => b.id === it.correctBucketId);
              return (
                <p key={it.id} className="text-sm text-[var(--color-text)]">
                  <span className="text-[var(--color-incorrect)]">{it.text ?? it.id}</span>
                  <span className="text-[var(--color-text-dim)]"> → should be in </span>
                  <span className="text-[var(--color-correct)]">{correctBucket?.text ?? correctBucket?.id}</span>
                </p>
              );
            })}
          {question.items.every((it) => placement[it.id] === it.correctBucketId) && (
            <p className="text-sm text-[var(--color-correct)]">All items correctly placed.</p>
          )}
        </div>
      )}
    </div>
  );
}
