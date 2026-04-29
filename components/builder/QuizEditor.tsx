"use client";
import { useEffect, useReducer, useRef } from "react";
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

const BLANK_QUIZ: Quiz = {
  slug: "new-quiz",
  title: "New quiz",
  questions: [],
};

export function QuizEditor({ initialQuiz }: { initialQuiz?: Quiz }) {
  const seed = initialQuiz ?? BLANK_QUIZ;
  const [state, dispatch] = useReducer(editorReducer, seed, initialEditorState);
  const initialDraftCheckedRef = useRef(false);

  // On mount: check for an existing draft for this slug.
  useEffect(() => {
    if (initialDraftCheckedRef.current) return;
    initialDraftCheckedRef.current = true;
    const draft = loadDraft(seed.slug);
    if (draft && JSON.stringify(draft.quiz) !== JSON.stringify(seed)) {
      // Stash the draft so the user can choose; we don't auto-load.
      dispatch({ type: "loadDraft", draft });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Autosave to localStorage on every change (debounced).
  useEffect(() => {
    if (!state.isDirty) return;
    const t = setTimeout(() => {
      saveDraft(state.quiz.slug, state.quiz);
    }, 500);
    return () => clearTimeout(t);
  }, [state.quiz, state.isDirty]);

  // Warn before unload if dirty.
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
    <div className="grid grid-cols-1 lg:grid-cols-[1fr,1fr] gap-0 h-[calc(100vh-5rem)]">
      <div className="overflow-auto p-4 grid gap-4 content-start">
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

      <div className="hidden lg:block">
        <PreviewPane
          questions={state.quiz.questions}
          selectedIndex={selectedIndex >= 0 ? selectedIndex : 0}
          onSelectIndex={(i) => {
            const q = state.quiz.questions[i];
            if (q) dispatch({ type: "selectQuestion", id: q.id });
          }}
        />
      </div>
    </div>
  );
}
