import { beforeEach, describe, it, expect } from "vitest";
import { getScore, recordAttempt, getAllScores } from "@/lib/storage";

beforeEach(() => {
  localStorage.clear();
});

describe("storage", () => {
  it("returns null for never-attempted quiz", () => {
    expect(getScore("nope")).toBeNull();
  });

  it("records an attempt and returns it", () => {
    recordAttempt("ex", 3, 5);
    expect(getScore("ex")).toEqual(expect.objectContaining({
      bestScore: 3, bestOutOf: 5, attempts: 1,
    }));
  });

  it("only updates bestScore when beaten", () => {
    recordAttempt("ex", 3, 5);
    recordAttempt("ex", 2, 5);
    const s = getScore("ex");
    expect(s?.bestScore).toBe(3);
    expect(s?.attempts).toBe(2);
  });

  it("updates bestScore when surpassed", () => {
    recordAttempt("ex", 3, 5);
    recordAttempt("ex", 4, 5);
    expect(getScore("ex")?.bestScore).toBe(4);
  });

  it("getAllScores returns the full map", () => {
    recordAttempt("a", 1, 2);
    recordAttempt("b", 2, 2);
    expect(Object.keys(getAllScores())).toEqual(expect.arrayContaining(["a", "b"]));
  });
});
