"use client";
import type { Question } from "@/lib/quiz-schema";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { QuestionCard } from "./QuestionCard";

type Props = {
  questions: Question[];
  selectedQuestionId: string | null;
  onSelect: (id: string) => void;
  onUpdate: (q: Question) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onReorder: (ids: string[]) => void;
};

export function QuestionList({
  questions,
  selectedQuestionId,
  onSelect,
  onUpdate,
  onDuplicate,
  onDelete,
  onReorder,
}: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIdx = questions.findIndex((q) => q.id === active.id);
    const newIdx = questions.findIndex((q) => q.id === over.id);
    if (oldIdx === -1 || newIdx === -1) return;
    const reordered = arrayMove(questions, oldIdx, newIdx);
    onReorder(reordered.map((q) => q.id));
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={questions.map((q) => q.id)} strategy={verticalListSortingStrategy}>
        <div className="grid gap-2">
          {questions.map((q, i) => (
            <QuestionCard
              key={q.id}
              question={q}
              index={i}
              isSelected={selectedQuestionId === q.id}
              onChange={onUpdate}
              onSelect={() => onSelect(q.id)}
              onDuplicate={() => onDuplicate(q.id)}
              onDelete={() => onDelete(q.id)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
