import { describe, it, expect } from "vitest";
import { scoreQuestion } from "@/lib/scoring";
import type { Question } from "@/lib/quiz-schema";

const base = { id: "q", prompt: "p", explanation: "e" };

describe("scoreQuestion", () => {
  it("mc-single: correct id", () => {
    const q: Question = { ...base, type: "mc-single",
      options: [{ id: "a", label: "A" }, { id: "b", label: "B" }],
      correctId: "a" } as Question;
    expect(scoreQuestion(q, "a")).toBe(true);
    expect(scoreQuestion(q, "b")).toBe(false);
  });

  it("mc-multi: set equality regardless of order", () => {
    const q: Question = { ...base, type: "mc-multi",
      options: [{ id: "a", label: "A" }, { id: "b", label: "B" }, { id: "c", label: "C" }],
      correctIds: ["a", "c"] } as Question;
    expect(scoreQuestion(q, ["c", "a"])).toBe(true);
    expect(scoreQuestion(q, ["a"])).toBe(false);
    expect(scoreQuestion(q, ["a", "b", "c"])).toBe(false);
  });

  it("match: every pair correct", () => {
    const q: Question = { ...base, type: "match",
      left: [{ id: "L1", label: "L1" }, { id: "L2", label: "L2" }],
      right: [{ id: "R1", label: "R1" }, { id: "R2", label: "R2" }],
      correctPairs: [{ leftId: "L1", rightId: "R2" }, { leftId: "L2", rightId: "R1" }] } as Question;
    expect(scoreQuestion(q, { L1: "R2", L2: "R1" })).toBe(true);
    expect(scoreQuestion(q, { L1: "R1", L2: "R2" })).toBe(false);
    expect(scoreQuestion(q, { L1: "R2" })).toBe(false);
  });

  it("order: deep equality of arrays", () => {
    const q: Question = { ...base, type: "order",
      items: [{ id: "x", label: "X" }, { id: "y", label: "Y" }, { id: "z", label: "Z" }],
      axis: "horizontal", startLabel: "Start", endLabel: "End",
      correctOrder: ["x", "y", "z"] } as Question;
    expect(scoreQuestion(q, ["x", "y", "z"])).toBe(true);
    expect(scoreQuestion(q, ["z", "y", "x"])).toBe(false);
  });

  it("slider: exact value", () => {
    const q: Question = { ...base, type: "slider",
      min: 0, max: 10, step: 1, correctValue: 9 } as Question;
    expect(scoreQuestion(q, 9)).toBe(true);
    expect(scoreQuestion(q, 8)).toBe(false);
  });

  it("name: matchName semantics", () => {
    const q: Question = { ...base, type: "name",
      acceptedAnswers: ["Itachi Uchiha", "Itachi"] } as Question;
    expect(scoreQuestion(q, "itachi")).toBe(true);
    expect(scoreQuestion(q, "Sasuke")).toBe(false);
  });
});
