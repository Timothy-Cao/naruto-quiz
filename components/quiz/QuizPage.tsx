"use client";
import { useReducer, useMemo, useEffect, useRef, useState } from "react";
import type { Quiz } from "@/lib/quiz-schema";
import { initialState, playerReducer, type AnswerState } from "@/lib/player-reducer";
import { scoreQuestion, type AnswerValue } from "@/lib/scoring";
import { QuizHeader } from "./QuizHeader";
import { QuestionFrame } from "./QuestionFrame";
import { NavBar } from "./NavBar";
import { Results } from "./Results";
import { useAudio } from "@/lib/audio/audio-context";
import {
  loadSession,
  saveSession,
  clearSession,
  sessionHasProgress,
} from "@/lib/quiz/session-storage";
import { RotateCcw } from "lucide-react";

export function QuizPage({ quiz }: { quiz: Quiz }) {
  // useReducer initializer fires once on mount. On the client, restore a
  // saved session if it exists and the question count still matches (i.e.
  // the quiz hasn't been edited since the user started).
  const [state, dispatch] = useReducer(playerReducer, quiz, (q) => {
    if (typeof window !== "undefined") {
      const saved = loadSession(q.slug);
      if (saved && saved.questionCount === q.questions.length) {
        return saved.state;
      }
    }
    return initialState(q);
  });
  const { playSfx } = useAudio();

  const total = quiz.questions.length;
  const isResults = state.currentIndex >= total;
  const currentQuestion = isResults ? null : quiz.questions[state.currentIndex];
  const currentAnswer: AnswerState | null = currentQuestion
    ? state.answers[currentQuestion.id]
    : null;

  // Track whether we're currently sitting on a restored session so we can
  // show a small "resumed" banner above the question. Hides as soon as the
  // user takes any action.
  const [resumedAt, setResumedAt] = useState<string | null>(null);
  const initialMountRef = useRef(true);

  useEffect(() => {
    const saved = loadSession(quiz.slug);
    if (saved && saved.questionCount === quiz.questions.length && sessionHasProgress(saved.state)) {
      setResumedAt(saved.savedAt);
    }
    // Run once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist on every state change (skip the initial mount so we don't write
  // back the just-loaded state). On completion, clear instead of save.
  useEffect(() => {
    if (initialMountRef.current) {
      initialMountRef.current = false;
      return;
    }
    const timer = setTimeout(() => {
      if (state.currentIndex >= quiz.questions.length) {
        clearSession(quiz.slug);
      } else if (sessionHasProgress(state)) {
        saveSession(quiz.slug, state, quiz.questions.length);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [state, quiz.slug, quiz.questions.length]);

  const statusByIndex = useMemo(
    () => quiz.questions.map((q) => state.answers[q.id]?.status ?? "unanswered"),
    [state.answers, quiz.questions],
  );

  function handleChange(value: AnswerValue) {
    if (!currentQuestion || !currentAnswer) return;
    if (currentAnswer.status === "confirmed") return; // read-only
    if (resumedAt) setResumedAt(null);
    dispatch({ type: "setDraft", id: currentQuestion.id, value });
  }

  function handleConfirm() {
    if (!currentQuestion || !currentAnswer || currentAnswer.status !== "draft") return;
    const result = scoreQuestion(currentQuestion, currentAnswer.value);
    playSfx(result.points === result.maxPoints ? "correct" : "wrong");
    dispatch({ type: "confirm", id: currentQuestion.id, result });
  }

  function handleRestart() {
    clearSession(quiz.slug);
    setResumedAt(null);
    dispatch({ type: "reset", quiz });
  }

  return (
    <main className="max-w-3xl mx-auto p-3 sm:p-4 lg:p-6 grid gap-2 min-w-0">
      <QuizHeader
        title={quiz.title}
        total={total}
        currentIndex={Math.min(state.currentIndex, total - 1)}
        statusByIndex={statusByIndex}
        onJump={(i) => dispatch({ type: "jumpTo", index: i })}
      />
      {resumedAt && !isResults && (
        <ResumeBanner savedAt={resumedAt} onRestart={handleRestart} onDismiss={() => setResumedAt(null)} />
      )}
      {isResults ? (
        <Results
          quiz={quiz}
          answers={state.answers}
          onRetry={handleRestart}
          onJumpTo={(i) => dispatch({ type: "jumpTo", index: i })}
        />
      ) : (
        currentQuestion &&
        currentAnswer && (
          <>
            <QuestionFrame
              question={currentQuestion}
              state={currentAnswer}
              onChange={handleChange}
              quizSlug={quiz.slug}
            />
            <NavBar
              canPrev={state.currentIndex > 0}
              canConfirm={currentAnswer.status === "draft"}
              isConfirmed={currentAnswer.status === "confirmed"}
              isLast={state.currentIndex === total - 1}
              onPrev={() => dispatch({ type: "prev" })}
              onConfirm={handleConfirm}
              onNext={() => dispatch({ type: "next" })}
            />
          </>
        )
      )}
    </main>
  );
}

function ResumeBanner({
  savedAt,
  onRestart,
  onDismiss,
}: {
  savedAt: string;
  onRestart: () => void;
  onDismiss: () => void;
}) {
  const elapsed = formatElapsed(savedAt);
  return (
    <div className="rounded-md border border-[var(--color-accent)] bg-[var(--color-accent)]/10 px-3 py-2 flex items-center gap-3 text-sm">
      <span className="text-[var(--color-text)]">
        Resumed where you left off — last saved {elapsed}.
      </span>
      <button
        type="button"
        onClick={onRestart}
        className="ml-auto text-xs text-[var(--color-accent)] hover:underline flex items-center gap-1"
      >
        <RotateCcw className="w-3 h-3" /> Start over
      </button>
      <button
        type="button"
        onClick={onDismiss}
        className="text-xs text-[var(--color-text-dim)] hover:text-[var(--color-text)]"
        aria-label="Dismiss resume banner"
      >
        ✕
      </button>
    </div>
  );
}

function formatElapsed(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const sec = Math.max(0, Math.floor((now - then) / 1000));
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} minute${min === 1 ? "" : "s"} ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} hour${hr === 1 ? "" : "s"} ago`;
  const day = Math.floor(hr / 24);
  return `${day} day${day === 1 ? "" : "s"} ago`;
}
