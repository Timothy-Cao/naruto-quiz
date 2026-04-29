import type { Quiz } from "@/lib/quiz-schema";
import type { AnswerValue, ScoreResult } from "@/lib/scoring";

export type AnswerState =
  | { status: "unanswered" }
  | { status: "draft"; value: AnswerValue }
  | {
      status: "confirmed";
      value: AnswerValue;
      result: ScoreResult;
      correct: boolean;
    };

export type PlayerState = {
  currentIndex: number;
  answers: Record<string, AnswerState>;
};

export type PlayerAction =
  | { type: "setDraft"; id: string; value: AnswerValue }
  | { type: "confirm"; id: string; result: ScoreResult }
  | { type: "next" }
  | { type: "prev" }
  | { type: "jumpTo"; index: number }
  | { type: "reset"; quiz: Quiz };

export function initialState(quiz: Quiz): PlayerState {
  const answers: Record<string, AnswerState> = {};
  for (const q of quiz.questions) {
    answers[q.id] = { status: "unanswered" };
  }
  return { currentIndex: 0, answers };
}

export function playerReducer(state: PlayerState, action: PlayerAction): PlayerState {
  switch (action.type) {
    case "setDraft":
      return {
        ...state,
        answers: {
          ...state.answers,
          [action.id]: { status: "draft", value: action.value },
        },
      };
    case "confirm": {
      const a = state.answers[action.id];
      if (!a || a.status !== "draft") return state;
      const correct = action.result.points === action.result.maxPoints;
      return {
        ...state,
        answers: {
          ...state.answers,
          [action.id]: {
            status: "confirmed",
            value: a.value,
            result: action.result,
            correct,
          },
        },
      };
    }
    case "next":
      return { ...state, currentIndex: state.currentIndex + 1 };
    case "prev":
      return { ...state, currentIndex: Math.max(0, state.currentIndex - 1) };
    case "jumpTo":
      return { ...state, currentIndex: Math.max(0, action.index) };
    case "reset":
      return initialState(action.quiz);
  }
}
