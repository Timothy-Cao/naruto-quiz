import { describe, it, expect } from "vitest";
import {
  initialEditorState,
  editorReducer,
  type EditorState,
} from "@/lib/builder/editor-reducer";
import type { Quiz } from "@/lib/quiz-schema";

const blank: Quiz = {
  slug: "new",
  title: "New quiz",
  questions: [],
};

const seeded: Quiz = {
  slug: "seed",
  title: "Seed",
  questions: [
    {
      id: "q1",
      type: "mc-single",
      prompt: { text: "p" },
      explanation: { text: "e" },
      options: [{ id: "a", text: "A" }, { id: "b", text: "B" }],
      correctId: "a",
    },
  ],
};

describe("editorReducer", () => {
  it("initialEditorState seeds isDirty=false", () => {
    const s = initialEditorState(blank);
    expect(s.quiz).toEqual(blank);
    expect(s.isDirty).toBe(false);
    expect(s.selectedQuestionId).toBeNull();
  });

  it("setTitle updates title and marks dirty", () => {
    let s: EditorState = initialEditorState(blank);
    s = editorReducer(s, { type: "setTitle", title: "Better" });
    expect(s.quiz.title).toBe("Better");
    expect(s.isDirty).toBe(true);
  });

  it("setSlug updates slug", () => {
    let s = initialEditorState(blank);
    s = editorReducer(s, { type: "setSlug", slug: "kebab-name" });
    expect(s.quiz.slug).toBe("kebab-name");
  });

  it("setDescription stores description", () => {
    let s = initialEditorState(blank);
    s = editorReducer(s, { type: "setDescription", description: "abc" });
    expect(s.quiz.description).toBe("abc");
    s = editorReducer(s, { type: "setDescription", description: undefined });
    expect(s.quiz.description).toBeUndefined();
  });

  it("addQuestion appends and selects", () => {
    let s = initialEditorState(blank);
    s = editorReducer(s, { type: "addQuestion", questionType: "slider" });
    expect(s.quiz.questions).toHaveLength(1);
    expect(s.quiz.questions[0].type).toBe("slider");
    expect(s.selectedQuestionId).toBe(s.quiz.questions[0].id);
  });

  it("removeQuestion removes by id and clears selection if it was selected", () => {
    let s = initialEditorState(seeded);
    s = editorReducer(s, { type: "selectQuestion", id: "q1" });
    s = editorReducer(s, { type: "removeQuestion", id: "q1" });
    expect(s.quiz.questions).toHaveLength(0);
    expect(s.selectedQuestionId).toBeNull();
  });

  it("duplicateQuestion creates a copy with new id", () => {
    let s = initialEditorState(seeded);
    s = editorReducer(s, { type: "duplicateQuestion", id: "q1" });
    expect(s.quiz.questions).toHaveLength(2);
    expect(s.quiz.questions[1].id).not.toBe("q1");
    expect(s.quiz.questions[1].prompt).toEqual({ text: "p" });
  });

  it("reorderQuestions rearranges by id list", () => {
    const seeded2: Quiz = {
      ...seeded,
      questions: [
        ...seeded.questions,
        {
          id: "q2",
          type: "mc-single",
          prompt: { text: "p2" },
          explanation: { text: "e2" },
          options: [{ id: "x", text: "X" }, { id: "y", text: "Y" }],
          correctId: "x",
        },
      ],
    };
    let s = initialEditorState(seeded2);
    s = editorReducer(s, { type: "reorderQuestions", ids: ["q2", "q1"] });
    expect(s.quiz.questions.map((q) => q.id)).toEqual(["q2", "q1"]);
  });

  it("updateQuestion replaces a question by id", () => {
    let s = initialEditorState(seeded);
    const updated = { ...seeded.questions[0], prompt: { text: "new prompt" } };
    s = editorReducer(s, { type: "updateQuestion", question: updated });
    expect(s.quiz.questions[0].prompt).toEqual({ text: "new prompt" });
  });

  it("selectQuestion sets selectedQuestionId", () => {
    let s = initialEditorState(seeded);
    s = editorReducer(s, { type: "selectQuestion", id: "q1" });
    expect(s.selectedQuestionId).toBe("q1");
  });

  it("markClean unsets isDirty without changing the quiz", () => {
    let s = initialEditorState(blank);
    s = editorReducer(s, { type: "setTitle", title: "Whatever" });
    expect(s.isDirty).toBe(true);
    s = editorReducer(s, { type: "markClean" });
    expect(s.isDirty).toBe(false);
    expect(s.quiz.title).toBe("Whatever");
  });

  it("loadDraft replaces the quiz and records draftLoadedAt", () => {
    let s = initialEditorState(blank);
    s = editorReducer(s, {
      type: "loadDraft",
      draft: { quiz: seeded, savedAt: "2026-01-01T00:00:00Z" },
    });
    expect(s.quiz).toEqual(seeded);
    expect(s.draftLoadedAt).toBe("2026-01-01T00:00:00Z");
  });

  it("validation flags missing options for mc-single", () => {
    const broken: Quiz = {
      slug: "ex",
      title: "Ex",
      questions: [{
        id: "q1",
        type: "mc-single",
        prompt: { text: "p" },
        explanation: { text: "" },
        options: [{ id: "a", text: "A" }],
        correctId: "z",
      }],
    };
    const s = initialEditorState(broken);
    expect(s.validation.length).toBeGreaterThan(0);
  });

  it("validation is empty for a valid quiz", () => {
    const s = initialEditorState(seeded);
    expect(s.validation).toEqual([]);
  });
});
