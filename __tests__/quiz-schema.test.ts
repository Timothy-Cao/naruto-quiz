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
        { ...baseQuestion, id: "q3", type: "match",
          left: [{ id: "L1", label: "L1" }, { id: "L2", label: "L2" }],
          right: [{ id: "R1", label: "R1" }, { id: "R2", label: "R2" }],
          correctPairs: [{ leftId: "L1", rightId: "R2" }, { leftId: "L2", rightId: "R1" }] },
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

  it("rejects match where correctPairs length differs from left length", () => {
    const quiz = {
      slug: "ex",
      title: "Ex",
      questions: [{
        ...baseQuestion,
        type: "match",
        left: [{ id: "L1", label: "a" }, { id: "L2", label: "b" }],
        right: [{ id: "R1", label: "a" }, { id: "R2", label: "b" }],
        correctPairs: [{ leftId: "L1", rightId: "R1" }],
      }],
    };
    expect(() => QuizSchema.parse(quiz)).toThrow();
  });
});
