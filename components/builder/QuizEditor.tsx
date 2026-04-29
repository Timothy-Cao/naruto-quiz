"use client";
import { useEffect, useReducer, useRef, useState } from "react";
import type { Quiz } from "@/lib/quiz-schema";
import {
  initialEditorState,
  editorReducer,
} from "@/lib/builder/editor-reducer";
import {
  loadDraft,
  saveDraft,
  deleteDraft,
} from "@/lib/builder/drafts-storage";
import { downloadQuiz } from "@/lib/builder/download-quiz";
import { EditorHeader } from "./EditorHeader";
import { QuestionList } from "./QuestionList";
import { AddQuestionPopover } from "./AddQuestionPopover";
import { PreviewPane } from "./PreviewPane";
import { BottomBar } from "./BottomBar";
import { DraftBanner } from "./DraftBanner";
import { Pencil, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

const BLANK_QUIZ: Quiz = {
  slug: "new-quiz",
  title: "New quiz",
  questions: [],
};

type ViewMode = "edit" | "preview";

export function QuizEditor({ initialQuiz }: { initialQuiz?: Quiz }) {
  const seed = initialQuiz ?? BLANK_QUIZ;
  const [state, dispatch] = useReducer(editorReducer, seed, initialEditorState);
  const initialDraftCheckedRef = useRef(false);
  // Snapshot seed JSON to gate autosave on actual user changes.
  const seedJsonRef = useRef<string>(JSON.stringify(seed));
  const [viewMode, setViewMode] = useState<ViewMode>("edit");

  useEffect(() => {
    if (initialDraftCheckedRef.current) return;
    initialDraftCheckedRef.current = true;
    const draft = loadDraft(seed.slug);
    if (draft && JSON.stringify(draft.quiz) !== JSON.stringify(seed)) {
      dispatch({ type: "loadDraft", draft });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Autosave only when the user has actually changed something from the seed.
  useEffect(() => {
    if (!state.isDirty) return;
    const currentJson = JSON.stringify(state.quiz);
    if (currentJson === seedJsonRef.current) return;
    const t = setTimeout(() => {
      saveDraft(state.quiz.slug, state.quiz);
    }, 500);
    return () => clearTimeout(t);
  }, [state.quiz, state.isDirty]);

  useEffect(() => {
    if (!state.isDirty) return;
    function onBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [state.isDirty]);

  function handleDownload() {
    downloadQuiz(state.quiz);
    deleteDraft(state.quiz.slug);
    dispatch({ type: "markClean" });
  }

  function handleDiscardDraft() {
    deleteDraft(state.quiz.slug);
    dispatch({ type: "reset", quiz: seed });
  }

  const selectedIndex = state.selectedQuestionId
    ? state.quiz.questions.findIndex((q) => q.id === state.selectedQuestionId)
    : 0;

  return (
    <div className="grid gap-3">
      <ViewToggleBar viewMode={viewMode} onChange={setViewMode} />

      {viewMode === "edit" ? (
        <div className="grid gap-4">
          {state.draftLoadedAt && (
            <DraftBanner
              savedAt={state.draftLoadedAt}
              onUseDraft={() => dispatch({ type: "discardDraft" })}
              onDiscard={() => {
                deleteDraft(state.quiz.slug);
                dispatch({ type: "reset", quiz: seed });
              }}
            />
          )}

          <EditorHeader
            quiz={state.quiz}
            onTitleChange={(title) => dispatch({ type: "setTitle", title })}
            onSlugChange={(slug) => dispatch({ type: "setSlug", slug })}
            onDescriptionChange={(description) => dispatch({ type: "setDescription", description })}
            onCoverImageChange={(coverImage) => dispatch({ type: "setCoverImage", coverImage })}
          />

          <div className="grid gap-2">
            <h2 className="text-xs uppercase tracking-wide text-[var(--color-text-dim)]">Questions</h2>
            <QuestionList
              questions={state.quiz.questions}
              selectedQuestionId={state.selectedQuestionId}
              onSelect={(id) => dispatch({ type: "selectQuestion", id })}
              onUpdate={(q) => dispatch({ type: "updateQuestion", question: q })}
              onDuplicate={(id) => dispatch({ type: "duplicateQuestion", id })}
              onDelete={(id) => dispatch({ type: "removeQuestion", id })}
              onReorder={(ids) => dispatch({ type: "reorderQuestions", ids })}
            />
            <AddQuestionPopover
              onAdd={(questionType) => dispatch({ type: "addQuestion", questionType })}
            />
          </div>

          <BottomBar
            validation={state.validation}
            isDirty={state.isDirty}
            hasDraft={state.draftLoadedAt !== null}
            onDownload={handleDownload}
            onDiscardDraft={handleDiscardDraft}
          />
        </div>
      ) : (
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden min-h-[60vh]">
          <PreviewPane
            questions={state.quiz.questions}
            selectedIndex={selectedIndex >= 0 ? selectedIndex : 0}
            onSelectIndex={(i) => {
              const q = state.quiz.questions[i];
              if (q) dispatch({ type: "selectQuestion", id: q.id });
            }}
          />
        </div>
      )}
    </div>
  );
}

function ViewToggleBar({
  viewMode,
  onChange,
}: {
  viewMode: ViewMode;
  onChange: (m: ViewMode) => void;
}) {
  return (
    <div className="flex items-center gap-1 p-1 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] self-center">
      <ToggleButton
        active={viewMode === "edit"}
        onClick={() => onChange("edit")}
        icon={<Pencil className="w-3.5 h-3.5" />}
        label="Edit"
      />
      <ToggleButton
        active={viewMode === "preview"}
        onClick={() => onChange("preview")}
        icon={<Eye className="w-3.5 h-3.5" />}
        label="Preview"
      />
    </div>
  );
}

function ToggleButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "px-4 py-1.5 rounded-full text-sm flex items-center gap-1.5 transition-colors",
        active
          ? "bg-[var(--color-accent)] text-white"
          : "text-[var(--color-text-dim)] hover:text-[var(--color-text)]",
      )}
    >
      {icon}
      {label}
    </button>
  );
}
