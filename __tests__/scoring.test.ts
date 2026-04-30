import { describe, it, expect } from "vitest";
import { scoreQuestion } from "@/lib/scoring";
import type { Question } from "@/lib/quiz-schema";

const base = { id: "q", prompt: { text: "p" }, explanation: "e" };

describe("scoreQuestion", () => {
  describe("mc-single", () => {
    const q: Question = { ...base, type: "mc-single",
      options: [{ id: "a", text: "A" }, { id: "b", text: "B" }],
      correctId: "a" } as Question;

    it("full points on correct", () => {
      expect(scoreQuestion(q, "a")).toEqual({ points: 1, maxPoints: 1 });
    });
    it("zero points on wrong", () => {
      expect(scoreQuestion(q, "b")).toEqual({ points: 0, maxPoints: 1 });
    });
    it("respects custom maxPoints", () => {
      const q2 = { ...q, scoring: { maxPoints: 3 } } as Question;
      expect(scoreQuestion(q2, "a")).toEqual({ points: 3, maxPoints: 3 });
      expect(scoreQuestion(q2, "b")).toEqual({ points: 0, maxPoints: 3 });
    });
  });

  describe("mc-multi all-or-nothing (default)", () => {
    const q: Question = { ...base, type: "mc-multi",
      options: [{ id: "a", text: "A" }, { id: "b", text: "B" }, { id: "c", text: "C" }],
      correctIds: ["a", "c"] } as Question;

    it("full points when set matches", () => {
      expect(scoreQuestion(q, ["c", "a"])).toEqual({ points: 1, maxPoints: 1 });
    });
    it("zero on partial", () => {
      expect(scoreQuestion(q, ["a"])).toEqual({ points: 0, maxPoints: 1 });
    });
    it("zero on extra wrong picks", () => {
      expect(scoreQuestion(q, ["a", "b", "c"])).toEqual({ points: 0, maxPoints: 1 });
    });
  });

  describe("mc-multi per-option", () => {
    const q: Question = { ...base, type: "mc-multi",
      options: [{ id: "a", text: "A" }, { id: "b", text: "B" }, { id: "c", text: "C" }, { id: "d", text: "D" }],
      correctIds: ["a", "c"],
      scoring: { maxPoints: 1, scheme: "per-option" },
    } as Question;

    it("full points when all 4 options match expected (2 selected, 2 not)", () => {
      expect(scoreQuestion(q, ["a", "c"])).toEqual({ points: 1, maxPoints: 1 });
    });
    it("0.75 when 3 of 4 align", () => {
      // expected: a yes, b no, c yes, d no
      // got: a yes, b no, c no, d no -> matches on a, b, d but misses c -> 3/4
      const r = scoreQuestion(q, ["a"]);
      expect(r.maxPoints).toBe(1);
      expect(r.points).toBeCloseTo(0.75);
    });
    it("0.5 when 2 of 4 align", () => {
      // got: nothing selected -> matches on b, d (correctly not selected); misses a, c -> 2/4
      const r = scoreQuestion(q, []);
      expect(r.points).toBeCloseTo(0.5);
    });
    it("scales by maxPoints", () => {
      const q2 = { ...q, scoring: { maxPoints: 4, scheme: "per-option" } } as Question;
      // 3/4 -> 3.0
      expect(scoreQuestion(q2, ["a"]).points).toBeCloseTo(3);
    });
  });

  describe("categorize all-or-nothing (default)", () => {
    const q: Question = { ...base, type: "categorize",
      buckets: [{ id: "B1", text: "B1" }, { id: "B2", text: "B2" }],
      items: [
        { id: "i1", text: "i1", correctBucketId: "B1" },
        { id: "i2", text: "i2", correctBucketId: "B2" },
      ],
    } as Question;

    it("full points when every item placed correctly", () => {
      expect(scoreQuestion(q, { i1: "B1", i2: "B2" })).toEqual({ points: 1, maxPoints: 1 });
    });
    it("zero on any miss", () => {
      expect(scoreQuestion(q, { i1: "B1", i2: "B1" })).toEqual({ points: 0, maxPoints: 1 });
    });
  });

  describe("categorize per-item", () => {
    const q: Question = { ...base, type: "categorize",
      buckets: [{ id: "B1", text: "B1" }, { id: "B2", text: "B2" }],
      items: [
        { id: "i1", text: "i1", correctBucketId: "B1" },
        { id: "i2", text: "i2", correctBucketId: "B2" },
        { id: "i3", text: "i3", correctBucketId: "B1" },
        { id: "i4", text: "i4", correctBucketId: "B1" },
      ],
      scoring: { maxPoints: 1, scheme: "per-item" },
    } as Question;

    it("full points when all 4 items placed", () => {
      expect(scoreQuestion(q, { i1: "B1", i2: "B2", i3: "B1", i4: "B1" })).toEqual({ points: 1, maxPoints: 1 });
    });
    it("0.5 when half right", () => {
      const r = scoreQuestion(q, { i1: "B1", i2: "B2" }); // i3 + i4 unplaced
      expect(r.points).toBeCloseTo(0.5);
    });
    it("0 when none placed", () => {
      expect(scoreQuestion(q, {}).points).toBe(0);
    });
  });

  describe("order all-or-nothing (default)", () => {
    const q: Question = { ...base, type: "order",
      items: [{ id: "x", text: "X" }, { id: "y", text: "Y" }, { id: "z", text: "Z" }],
      axis: "horizontal", startLabel: "S", endLabel: "E",
      correctOrder: ["x", "y", "z"],
    } as Question;

    it("full points on exact match", () => {
      expect(scoreQuestion(q, ["x", "y", "z"])).toEqual({ points: 1, maxPoints: 1 });
    });
    it("zero on any swap", () => {
      expect(scoreQuestion(q, ["y", "x", "z"])).toEqual({ points: 0, maxPoints: 1 });
    });
  });

  describe("order per-position", () => {
    const q: Question = { ...base, type: "order",
      items: [{ id: "x", text: "X" }, { id: "y", text: "Y" }, { id: "z", text: "Z" }, { id: "w", text: "W" }],
      axis: "horizontal", startLabel: "S", endLabel: "E",
      correctOrder: ["x", "y", "z", "w"],
      scoring: { maxPoints: 1, scheme: "per-position" },
    } as Question;

    it("full points on exact", () => {
      expect(scoreQuestion(q, ["x", "y", "z", "w"]).points).toBe(1);
    });
    it("0.5 when 2 of 4 in correct slots", () => {
      // correct: x y z w; given: x w z y -> x✓ w✗ z✓ y✗ = 2/4
      const r = scoreQuestion(q, ["x", "w", "z", "y"]);
      expect(r.points).toBeCloseTo(0.5);
    });
  });

  describe("slider all-or-nothing (default)", () => {
    const q: Question = { ...base, type: "slider",
      min: 0, max: 10, step: 1, correctValue: 9 } as Question;

    it("full on exact", () => {
      expect(scoreQuestion(q, 9)).toEqual({ points: 1, maxPoints: 1 });
    });
    it("zero on any other value", () => {
      expect(scoreQuestion(q, 8)).toEqual({ points: 0, maxPoints: 1 });
    });
  });

  describe("slider tolerance", () => {
    const q: Question = { ...base, type: "slider",
      min: 0, max: 10, step: 1, correctValue: 9,
      scoring: { maxPoints: 1, scheme: "tolerance", tolerance: 1, partialCredit: 0.5 },
    } as Question;

    it("full on exact", () => {
      expect(scoreQuestion(q, 9).points).toBe(1);
    });
    it("partial within tolerance", () => {
      expect(scoreQuestion(q, 8).points).toBeCloseTo(0.5);
      expect(scoreQuestion(q, 10).points).toBeCloseTo(0.5);
    });
    it("zero outside tolerance", () => {
      expect(scoreQuestion(q, 7).points).toBe(0);
    });
  });

  describe("mc-single with audio prompt (former audio-match shape)", () => {
    const q: Question = { ...base,
      prompt: { text: "Which scene plays this?", audioSrc: "/music/Hyouhaku.mp3" },
      type: "mc-single",
      options: [{ id: "a", text: "Sasuke training" }, { id: "b", text: "Itachi flashback" }],
      correctId: "a" } as Question;
    it("full points on correct option", () => {
      expect(scoreQuestion(q, "a")).toEqual({ points: 1, maxPoints: 1 });
    });
    it("zero on wrong option", () => {
      expect(scoreQuestion(q, "b")).toEqual({ points: 0, maxPoints: 1 });
    });
  });

  describe("name", () => {
    const q: Question = { ...base, type: "name",
      acceptedAnswers: ["Itachi Uchiha", "Itachi"] } as Question;

    it("full on substring match", () => {
      expect(scoreQuestion(q, "itachi").points).toBe(1);
    });
    it("zero on miss", () => {
      expect(scoreQuestion(q, "Sasuke").points).toBe(0);
    });
  });
});
