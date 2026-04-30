import { describe, it, expect } from "vitest";
import { QuizSchema, MediaBlock } from "@/lib/quiz-schema";

const baseQuestion = {
  id: "q1",
  prompt: { text: "Sample prompt?" },
  explanation: "Because so.",
};

describe("MediaBlock", () => {
  it("accepts text-only", () => {
    expect(() => MediaBlock.parse({ text: "hi" })).not.toThrow();
  });
  it("accepts image-only", () => {
    expect(() => MediaBlock.parse({ imageSrc: "/img/foo.png" })).not.toThrow();
  });
  it("accepts audio-only", () => {
    expect(() => MediaBlock.parse({ audioSrc: "/audio/foo.mp3" })).not.toThrow();
  });
  it("accepts text + image", () => {
    expect(() => MediaBlock.parse({ text: "hi", imageSrc: "/img/foo.png" })).not.toThrow();
  });
  it("rejects empty", () => {
    expect(() => MediaBlock.parse({})).toThrow();
  });
  it("rejects image + audio together", () => {
    expect(() =>
      MediaBlock.parse({ imageSrc: "/img/foo.png", audioSrc: "/audio/foo.mp3" }),
    ).toThrow();
  });
});

describe("QuizSchema", () => {
  it("accepts a valid mc-single quiz", () => {
    const quiz = {
      slug: "ex",
      title: "Example",
      questions: [{
        ...baseQuestion,
        type: "mc-single",
        options: [
          { id: "a", text: "A" },
          { id: "b", text: "B" },
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
        options: [{ id: "a", text: "A" }, { id: "b", text: "B" }],
        correctId: "z",
      }],
    };
    expect(() => QuizSchema.parse(quiz)).toThrow();
  });

  it("accepts mc-single with audio on the prompt (former audio-match shape)", () => {
    const quiz = {
      slug: "ex",
      title: "Example",
      questions: [{
        ...baseQuestion,
        prompt: { text: "Which OST plays?", audioSrc: "/music/foo.mp3" },
        type: "mc-single",
        options: [
          { id: "a", text: "A" },
          { id: "b", text: "B" },
        ],
        correctId: "a",
      }],
    };
    expect(() => QuizSchema.parse(quiz)).not.toThrow();
  });

  it("accepts mc-single with audio on each option", () => {
    const quiz = {
      slug: "ex",
      title: "Example",
      questions: [{
        ...baseQuestion,
        prompt: { text: "Which clip is Samidare?" },
        type: "mc-single",
        options: [
          { id: "a", audioSrc: "/music/a.mp3" },
          { id: "b", audioSrc: "/music/b.mp3" },
        ],
        correctId: "a",
      }],
    };
    expect(() => QuizSchema.parse(quiz)).not.toThrow();
  });

  it("accepts every supported question type", () => {
    const quiz = {
      slug: "all-types",
      title: "All",
      questions: [
        { ...baseQuestion, id: "q1", type: "mc-single",
          options: [{ id: "a", text: "A" }, { id: "b", text: "B" }],
          correctId: "a" },
        { ...baseQuestion, id: "q2", type: "mc-multi",
          options: [{ id: "a", text: "A" }, { id: "b", text: "B" }, { id: "c", text: "C" }],
          correctIds: ["a", "c"] },
        { ...baseQuestion, id: "q3", type: "categorize",
          buckets: [{ id: "B1", text: "B1" }, { id: "B2", text: "B2" }],
          items: [
            { id: "i1", text: "Item 1", correctBucketId: "B1" },
            { id: "i2", text: "Item 2", correctBucketId: "B2" },
            { id: "i3", text: "Item 3", correctBucketId: "B1" },
          ] },
        { ...baseQuestion, id: "q4", type: "order",
          items: [{ id: "x", text: "X" }, { id: "y", text: "Y" }],
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
        buckets: [{ id: "B1", text: "B1" }],
        items: [{ id: "i1", text: "Item 1", correctBucketId: "GHOST" }],
      }],
    };
    expect(() => QuizSchema.parse(quiz)).toThrow();
  });

  it("rejects an option that has both image and audio", () => {
    const quiz = {
      slug: "ex",
      title: "Ex",
      questions: [{
        ...baseQuestion,
        type: "mc-single",
        options: [
          { id: "a", imageSrc: "/img/a.png", audioSrc: "/audio/a.mp3" },
          { id: "b", text: "B" },
        ],
        correctId: "a",
      }],
    };
    expect(() => QuizSchema.parse(quiz)).toThrow();
  });

  it("rejects an option with no text or media", () => {
    const quiz = {
      slug: "ex",
      title: "Ex",
      questions: [{
        ...baseQuestion,
        type: "mc-single",
        options: [{ id: "a" }, { id: "b", text: "B" }],
        correctId: "a",
      }],
    };
    expect(() => QuizSchema.parse(quiz)).toThrow();
  });
});

describe("QuizSchema scoring field", () => {
  it("accepts mc-single with optional maxPoints", () => {
    const quiz = {
      slug: "ex", title: "Ex",
      questions: [{
        ...baseQuestion, type: "mc-single",
        options: [{ id: "a", text: "A" }, { id: "b", text: "B" }],
        correctId: "a",
        scoring: { maxPoints: 2 },
      }],
    };
    expect(() => QuizSchema.parse(quiz)).not.toThrow();
  });

  it("accepts mc-multi with per-option scheme", () => {
    const quiz = {
      slug: "ex", title: "Ex",
      questions: [{
        ...baseQuestion, type: "mc-multi",
        options: [{ id: "a", text: "A" }, { id: "b", text: "B" }],
        correctIds: ["a"],
        scoring: { maxPoints: 1, scheme: "per-option" },
      }],
    };
    expect(() => QuizSchema.parse(quiz)).not.toThrow();
  });

  it("accepts categorize with per-item scheme", () => {
    const quiz = {
      slug: "ex", title: "Ex",
      questions: [{
        ...baseQuestion, type: "categorize",
        buckets: [{ id: "B1", text: "B1" }],
        items: [{ id: "i1", text: "Item", correctBucketId: "B1" }],
        scoring: { maxPoints: 1, scheme: "per-item" },
      }],
    };
    expect(() => QuizSchema.parse(quiz)).not.toThrow();
  });

  it("accepts order with per-position scheme", () => {
    const quiz = {
      slug: "ex", title: "Ex",
      questions: [{
        ...baseQuestion, type: "order",
        items: [{ id: "x", text: "X" }, { id: "y", text: "Y" }],
        axis: "horizontal", startLabel: "S", endLabel: "E",
        correctOrder: ["x", "y"],
        scoring: { maxPoints: 1, scheme: "per-position" },
      }],
    };
    expect(() => QuizSchema.parse(quiz)).not.toThrow();
  });

  it("accepts slider with tolerance scheme + required tolerance/partialCredit", () => {
    const quiz = {
      slug: "ex", title: "Ex",
      questions: [{
        ...baseQuestion, type: "slider",
        min: 0, max: 10, step: 1, correctValue: 5,
        scoring: { maxPoints: 1, scheme: "tolerance", tolerance: 1, partialCredit: 0.5 },
      }],
    };
    expect(() => QuizSchema.parse(quiz)).not.toThrow();
  });

  it("rejects slider tolerance scheme without tolerance/partialCredit", () => {
    const quiz = {
      slug: "ex", title: "Ex",
      questions: [{
        ...baseQuestion, type: "slider",
        min: 0, max: 10, step: 1, correctValue: 5,
        scoring: { maxPoints: 1, scheme: "tolerance" },
      }],
    };
    expect(() => QuizSchema.parse(quiz)).toThrow();
  });

  it("rejects slider with partialCredit > 1", () => {
    const quiz = {
      slug: "ex", title: "Ex",
      questions: [{
        ...baseQuestion, type: "slider",
        min: 0, max: 10, step: 1, correctValue: 5,
        scoring: { maxPoints: 1, scheme: "tolerance", tolerance: 1, partialCredit: 1.5 },
      }],
    };
    expect(() => QuizSchema.parse(quiz)).toThrow();
  });

  it("accepts a question without any scoring field (defaults to all-or-nothing 1pt)", () => {
    const quiz = {
      slug: "ex", title: "Ex",
      questions: [{
        ...baseQuestion, type: "mc-single",
        options: [{ id: "a", text: "A" }, { id: "b", text: "B" }],
        correctId: "a",
      }],
    };
    expect(() => QuizSchema.parse(quiz)).not.toThrow();
  });
});
