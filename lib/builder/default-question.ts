import type { Question } from "@/lib/quiz-schema";

type QuestionType = Question["type"];

let counter = 0;
function genId(prefix: string): string {
  counter++;
  return `${prefix}-${Date.now().toString(36)}-${counter}`;
}

export function defaultQuestion(type: QuestionType): Question {
  const id = genId("q");
  const base = {
    id,
    prompt: { text: "New question" },
    explanation: { text: "Explanation goes here." },
  };
  switch (type) {
    case "mc-single":
      return {
        ...base,
        type: "mc-single",
        options: [
          { id: `${id}-opt-a`, text: "Option A" },
          { id: `${id}-opt-b`, text: "Option B" },
        ],
        correctId: `${id}-opt-a`,
      };
    case "mc-multi":
      return {
        ...base,
        type: "mc-multi",
        options: [
          { id: `${id}-opt-a`, text: "Option A" },
          { id: `${id}-opt-b`, text: "Option B" },
          { id: `${id}-opt-c`, text: "Option C" },
        ],
        correctIds: [`${id}-opt-a`],
      };
    case "categorize":
      return {
        ...base,
        type: "categorize",
        buckets: [
          { id: `${id}-bucket-1`, text: "Bucket 1" },
          { id: `${id}-bucket-2`, text: "Bucket 2" },
        ],
        items: [
          { id: `${id}-item-1`, text: "Item 1", correctBucketId: `${id}-bucket-1` },
          { id: `${id}-item-2`, text: "Item 2", correctBucketId: `${id}-bucket-2` },
        ],
      };
    case "order":
      return {
        ...base,
        type: "order",
        items: [
          { id: `${id}-item-1`, text: "First" },
          { id: `${id}-item-2`, text: "Second" },
        ],
        axis: "vertical",
        startLabel: "Start",
        endLabel: "End",
        correctOrder: [`${id}-item-1`, `${id}-item-2`],
      };
    case "slider":
      return {
        ...base,
        type: "slider",
        min: 0,
        max: 10,
        step: 1,
        correctValue: 5,
      };
    case "name":
      return {
        ...base,
        type: "name",
        acceptedAnswers: ["New answer"],
      };
    case "letters":
      return {
        ...base,
        type: "letters",
        answer: "ITACHI",
        hint: "Sasuke's older brother",
      };
  }
}
