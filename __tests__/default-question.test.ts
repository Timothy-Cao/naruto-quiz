import { describe, it, expect } from "vitest";
import { defaultQuestion } from "@/lib/builder/default-question";
import { QuestionSchema } from "@/lib/quiz-schema";

describe("defaultQuestion", () => {
  it("creates valid mc-single", () => {
    const q = defaultQuestion("mc-single");
    expect(QuestionSchema.safeParse(q).success).toBe(true);
    expect(q.type).toBe("mc-single");
  });
  it("creates valid mc-multi", () => {
    const q = defaultQuestion("mc-multi");
    expect(QuestionSchema.safeParse(q).success).toBe(true);
  });
  it("creates valid categorize", () => {
    const q = defaultQuestion("categorize");
    expect(QuestionSchema.safeParse(q).success).toBe(true);
  });
  it("creates valid order", () => {
    const q = defaultQuestion("order");
    expect(QuestionSchema.safeParse(q).success).toBe(true);
  });
  it("creates valid slider", () => {
    const q = defaultQuestion("slider");
    expect(QuestionSchema.safeParse(q).success).toBe(true);
  });
  it("creates valid name", () => {
    const q = defaultQuestion("name");
    expect(QuestionSchema.safeParse(q).success).toBe(true);
  });
  it("creates audio-match shell (author fills audioSrc later)", () => {
    const q = defaultQuestion("audio-match");
    expect(q.type).toBe("audio-match");
    if (q.type === "audio-match") {
      expect(q.options.length).toBeGreaterThanOrEqual(2);
      expect(q.options.some((o) => o.id === q.correctId)).toBe(true);
    }
  });
  it("each call generates a unique id", () => {
    const a = defaultQuestion("mc-single");
    const b = defaultQuestion("mc-single");
    expect(a.id).not.toBe(b.id);
  });
});
