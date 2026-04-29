import { type ZodIssue } from "zod";
import { QuizSchema, type Question, type Quiz } from "@/lib/quiz-schema";
import { defaultQuestion } from "@/lib/builder/default-question";

export type EditorState = {
  quiz: Quiz;
  selectedQuestionId: string | null;
  validation: ZodIssue[];
  isDirty: boolean;
  draftLoadedAt: string | null;
};

export type EditorAction =
  | { type: "setTitle"; title: string }
  | { type: "setSlug"; slug: string }
  | { type: "setDescription"; description: string | undefined }
  | { type: "setCoverImage"; coverImage: string | undefined }
  | { type: "addQuestion"; questionType: Question["type"] }
  | { type: "removeQuestion"; id: string }
  | { type: "duplicateQuestion"; id: string }
  | { type: "reorderQuestions"; ids: string[] }
  | { type: "updateQuestion"; question: Question }
  | { type: "selectQuestion"; id: string | null }
  | { type: "loadDraft"; draft: { quiz: Quiz; savedAt: string } }
  | { type: "discardDraft" }
  | { type: "markClean" }
  | { type: "reset"; quiz: Quiz };

function validate(quiz: Quiz): ZodIssue[] {
  const r = QuizSchema.safeParse(quiz);
  return r.success ? [] : r.error.issues;
}

export function initialEditorState(quiz: Quiz): EditorState {
  return {
    quiz,
    selectedQuestionId: quiz.questions[0]?.id ?? null,
    validation: validate(quiz),
    isDirty: false,
    draftLoadedAt: null,
  };
}

function withQuiz(state: EditorState, quiz: Quiz, markDirty = true): EditorState {
  return {
    ...state,
    quiz,
    validation: validate(quiz),
    isDirty: state.isDirty || markDirty,
  };
}

export function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case "setTitle":
      return withQuiz(state, { ...state.quiz, title: action.title });
    case "setSlug":
      return withQuiz(state, { ...state.quiz, slug: action.slug });
    case "setDescription":
      return withQuiz(state, { ...state.quiz, description: action.description });
    case "setCoverImage":
      return withQuiz(state, { ...state.quiz, coverImage: action.coverImage });

    case "addQuestion": {
      const newQ = defaultQuestion(action.questionType);
      const next = withQuiz(state, {
        ...state.quiz,
        questions: [...state.quiz.questions, newQ],
      });
      return { ...next, selectedQuestionId: newQ.id };
    }

    case "removeQuestion": {
      const next = withQuiz(state, {
        ...state.quiz,
        questions: state.quiz.questions.filter((q) => q.id !== action.id),
      });
      const stillExists = next.quiz.questions.some((q) => q.id === state.selectedQuestionId);
      return {
        ...next,
        selectedQuestionId: stillExists ? state.selectedQuestionId : null,
      };
    }

    case "duplicateQuestion": {
      const idx = state.quiz.questions.findIndex((q) => q.id === action.id);
      if (idx === -1) return state;
      const original = state.quiz.questions[idx];
      const copy: Question = {
        ...JSON.parse(JSON.stringify(original)),
        id: `${original.id}-copy-${Date.now().toString(36)}`,
      };
      const newQuestions = [
        ...state.quiz.questions.slice(0, idx + 1),
        copy,
        ...state.quiz.questions.slice(idx + 1),
      ];
      return withQuiz(state, { ...state.quiz, questions: newQuestions });
    }

    case "reorderQuestions": {
      const lookup = new Map(state.quiz.questions.map((q) => [q.id, q]));
      const reordered = action.ids
        .map((id) => lookup.get(id))
        .filter((q): q is Question => q !== undefined);
      return withQuiz(state, { ...state.quiz, questions: reordered });
    }

    case "updateQuestion": {
      const newQuestions = state.quiz.questions.map((q) =>
        q.id === action.question.id ? action.question : q,
      );
      return withQuiz(state, { ...state.quiz, questions: newQuestions });
    }

    case "selectQuestion":
      return { ...state, selectedQuestionId: action.id };

    case "loadDraft":
      return {
        ...state,
        quiz: action.draft.quiz,
        validation: validate(action.draft.quiz),
        isDirty: true,
        draftLoadedAt: action.draft.savedAt,
        selectedQuestionId: action.draft.quiz.questions[0]?.id ?? null,
      };

    case "discardDraft":
      return { ...state, draftLoadedAt: null };

    case "markClean":
      return { ...state, isDirty: false };

    case "reset":
      return initialEditorState(action.quiz);
  }
}
