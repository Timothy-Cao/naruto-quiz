"use client";
import { useReducer, useMemo } from "react";
import type { Quiz } from "@/lib/quiz-schema";
import { initialState, playerReducer, type AnswerState } from "@/lib/player-reducer";
import { scoreQuestion, type AnswerValue } from "@/lib/scoring";
import { QuizHeader } from "./QuizHeader";
import { QuestionFrame } from "./QuestionFrame";
import { NavBar } from "./NavBar";
import { Results } from "./Results";
import { useAudio } from "@/lib/audio/audio-context";

export function QuizPage({ quiz }: { quiz: Quiz }) {
  const [state, dispatch] = useReducer(playerReducer, quiz, initialState);
  const { playSfx } = useAudio();

  const total = quiz.questions.length;
  const isResults = state.currentIndex >= total;
  const currentQuestion = isResults ? null : quiz.questions[state.currentIndex];
  const currentAnswer: AnswerState | null = currentQuestion
    ? state.answers[currentQuestion.id]
    : null;

  const statusByIndex = useMemo(
    () => quiz.questions.map((q) => state.answers[q.id]?.status ?? "unanswered"),
    [state.answers, quiz.questions],
  );

  function handleChange(value: AnswerValue) {
    if (!currentQuestion || !currentAnswer) return;
    if (currentAnswer.status === "confirmed") return; // read-only
    dispatch({ type: "setDraft", id: currentQuestion.id, value });
  }

  function handleConfirm() {
    if (!currentQuestion || !currentAnswer || currentAnswer.status !== "draft") return;
    const result = scoreQuestion(currentQuestion, currentAnswer.value);
    playSfx(result.points === result.maxPoints ? "correct" : "wrong");
    dispatch({ type: "confirm", id: currentQuestion.id, result });
  }

  return (
    <main className="max-w-3xl mx-auto p-4 sm:p-6 grid gap-2">
      <QuizHeader
        title={quiz.title}
        total={total}
        currentIndex={Math.min(state.currentIndex, total - 1)}
        statusByIndex={statusByIndex}
        onJump={(i) => dispatch({ type: "jumpTo", index: i })}
      />
      {isResults ? (
        <Results
          quiz={quiz}
          answers={state.answers}
          onRetry={() => dispatch({ type: "reset", quiz })}
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
