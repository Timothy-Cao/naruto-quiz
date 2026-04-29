import { describe, it, expect } from "vitest";
import { initialState, playerReducer, type PlayerState } from "@/lib/player-reducer";
import type { Quiz } from "@/lib/quiz-schema";

const quiz: Quiz = {
  slug: "ex", title: "Ex",
  questions: [
    { id: "q1", type: "mc-single", prompt: "p1", explanation: "e1",
      options: [{ id: "a", label: "A" }, { id: "b", label: "B" }],
      correctId: "a" },
    { id: "q2", type: "mc-single", prompt: "p2", explanation: "e2",
      options: [{ id: "x", label: "X" }, { id: "y", label: "Y" }],
      correctId: "x" },
  ],
};

describe("playerReducer", () => {
  it("starts unanswered at index 0", () => {
    const s = initialState(quiz);
    expect(s.currentIndex).toBe(0);
    expect(s.answers["q1"]).toEqual({ status: "unanswered" });
    expect(s.answers["q2"]).toEqual({ status: "unanswered" });
  });

  it("setDraft moves question to draft state", () => {
    let s: PlayerState = initialState(quiz);
    s = playerReducer(s, { type: "setDraft", id: "q1", value: "a" });
    expect(s.answers["q1"]).toEqual({ status: "draft", value: "a" });
  });

  it("confirm moves draft to confirmed with full credit result", () => {
    let s = initialState(quiz);
    s = playerReducer(s, { type: "setDraft", id: "q1", value: "a" });
    s = playerReducer(s, { type: "confirm", id: "q1", result: { points: 1, maxPoints: 1 } });
    expect(s.answers["q1"]).toEqual({
      status: "confirmed", value: "a",
      result: { points: 1, maxPoints: 1 },
      correct: true,
    });
  });

  it("confirm with partial points sets correct=false", () => {
    let s = initialState(quiz);
    s = playerReducer(s, { type: "setDraft", id: "q1", value: "a" });
    s = playerReducer(s, { type: "confirm", id: "q1", result: { points: 0.5, maxPoints: 1 } });
    expect(s.answers["q1"]).toMatchObject({
      status: "confirmed",
      result: { points: 0.5, maxPoints: 1 },
      correct: false,
    });
  });

  it("confirm is a no-op if not in draft", () => {
    let s = initialState(quiz);
    s = playerReducer(s, { type: "confirm", id: "q1", result: { points: 1, maxPoints: 1 } });
    expect(s.answers["q1"]).toEqual({ status: "unanswered" });
  });

  it("next advances index", () => {
    let s = initialState(quiz);
    s = playerReducer(s, { type: "next" });
    expect(s.currentIndex).toBe(1);
  });

  it("prev decrements index but not below 0", () => {
    let s = initialState(quiz);
    s = playerReducer(s, { type: "prev" });
    expect(s.currentIndex).toBe(0);
    s = playerReducer(s, { type: "next" });
    s = playerReducer(s, { type: "prev" });
    expect(s.currentIndex).toBe(0);
  });

  it("next can advance to questions.length (results sentinel)", () => {
    let s = initialState(quiz);
    s = playerReducer(s, { type: "next" });
    s = playerReducer(s, { type: "next" });
    expect(s.currentIndex).toBe(2);
  });

  it("jumpTo sets index", () => {
    let s = initialState(quiz);
    s = playerReducer(s, { type: "next" });
    s = playerReducer(s, { type: "jumpTo", index: 0 });
    expect(s.currentIndex).toBe(0);
  });

  it("reset returns to initial state", () => {
    let s = initialState(quiz);
    s = playerReducer(s, { type: "setDraft", id: "q1", value: "a" });
    s = playerReducer(s, { type: "confirm", id: "q1", result: { points: 1, maxPoints: 1 } });
    s = playerReducer(s, { type: "next" });
    s = playerReducer(s, { type: "reset", quiz });
    expect(s).toEqual(initialState(quiz));
  });
});
