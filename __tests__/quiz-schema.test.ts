import { describe, it, expect } from "vitest";
import { QuizSchema } from "@/lib/quiz-schema";

const baseQuestion = {
  id: "q1",
  prompt: "Sample prompt?",
  explanation: "Because so.",
};

describe("QuizSchema", () => {
  it("accepts a valid mc-single quiz", () => {
    const quiz = {
      slug: "ex",
      title: "Example",
      questions: [{
        ...baseQuestion,
        type: "mc-single",
        options: [
          { id: "a", label: "A" },
          { id: "b", label: "B" },
        ],
        correctId: "a",
      }],
    };
    expect(QuizSchema.parse(quiz)).toEqual(quiz);
  });

  it("rejects mc-single where correctId is not among option ids", () => {
    const quiz = {
      slug: "ex",
      title: "Example",
      questions: [{
        ...baseQuestion,
        type: "mc-single",
        options: [{ id: "a", label: "A" }],
        correctId: "z",
      }],
    };
    expect(() => QuizSchema.parse(quiz)).toThrow();
  });

  it("accepts every supported question type", () => {
    const quiz = {
      slug: "all-types",
      title: "All",
      questions: [
        { ...baseQuestion, id: "q1", type: "mc-single",
          options: [{ id: "a", label: "A" }, { id: "b", label: "B" }],
          correctId: "a" },
        { ...baseQuestion, id: "q2", type: "mc-multi",
          options: [{ id: "a", label: "A" }, { id: "b", label: "B" }, { id: "c", label: "C" }],
          correctIds: ["a", "c"] },
        { ...baseQuestion, id: "q3", type: "categorize",
          buckets: [{ id: "B1", label: "B1" }, { id: "B2", label: "B2" }],
          items: [
            { id: "i1", label: "Item 1", correctBucketId: "B1" },
            { id: "i2", label: "Item 2", correctBucketId: "B2" },
            { id: "i3", label: "Item 3", correctBucketId: "B1" },
          ] },
        { ...baseQuestion, id: "q4", type: "order",
          items: [{ id: "x", label: "X" }, { id: "y", label: "Y" }],
          axis: "horizontal", startLabel: "Start", endLabel: "End",
          correctOrder: ["x", "y"] },
        { ...baseQuestion, id: "q5", type: "slider",
          min: 0, max: 10, step: 1, correctValue: 9 },
        { ...baseQuestion, id: "q6", type: "name",
          acceptedAnswers: ["Itachi", "Itachi Uchiha"] },
      ],
    };
    expect(() => QuizSchema.parse(quiz)).not.toThrow();
  });

  it("rejects categorize where an item.correctBucketId doesn't match any bucket", () => {
    const quiz = {
      slug: "ex",
      title: "Ex",
      questions: [{
        ...baseQuestion,
        type: "categorize",
        buckets: [{ id: "B1", label: "B1" }],
        items: [{ id: "i1", label: "Item 1", correctBucketId: "GHOST" }],
      }],
    };
    expect(() => QuizSchema.parse(quiz)).toThrow();
  });
});
