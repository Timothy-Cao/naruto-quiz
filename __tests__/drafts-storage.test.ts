import { beforeEach, describe, it, expect } from "vitest";
import {
  loadDraft,
  saveDraft,
  deleteDraft,
  listDrafts,
} from "@/lib/builder/drafts-storage";
import type { Quiz } from "@/lib/quiz-schema";

const sampleQuiz: Quiz = {
  slug: "ex",
  title: "Ex",
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

beforeEach(() => {
  localStorage.clear();
});

describe("drafts-storage", () => {
  it("returns null when no draft", () => {
    expect(loadDraft("ex")).toBeNull();
  });

  it("round-trips a save/load", () => {
    saveDraft("ex", sampleQuiz);
    const draft = loadDraft("ex");
    expect(draft?.quiz).toEqual(sampleQuiz);
    expect(typeof draft?.savedAt).toBe("string");
  });

  it("listDrafts returns all slugs with savedAt", () => {
    saveDraft("a", { ...sampleQuiz, slug: "a" });
    saveDraft("b", { ...sampleQuiz, slug: "b" });
    const drafts = listDrafts();
    expect(Object.keys(drafts).sort()).toEqual(["a", "b"]);
    expect(drafts.a.quiz.slug).toBe("a");
  });

  it("deleteDraft removes one entry", () => {
    saveDraft("a", { ...sampleQuiz, slug: "a" });
    saveDraft("b", { ...sampleQuiz, slug: "b" });
    deleteDraft("a");
    expect(loadDraft("a")).toBeNull();
    expect(loadDraft("b")?.quiz.slug).toBe("b");
  });

  it("survives malformed JSON in storage", () => {
    localStorage.setItem("naruto-quiz:builder-drafts", "{not json");
    expect(loadDraft("ex")).toBeNull();
    expect(listDrafts()).toEqual({});
  });
});
