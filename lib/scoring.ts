import type { Question } from "@/lib/quiz-schema";
import { matchName } from "@/lib/match-name";

export type AnswerValue =
  | string                              // mc-single, name
  | string[]                            // mc-multi, order
  | Record<string, string>              // match: leftId -> rightId
  | number;                             // slider

export function scoreQuestion(q: Question, value: AnswerValue): boolean {
  switch (q.type) {
    case "mc-single":
      return value === q.correctId;
    case "mc-multi": {
      if (!Array.isArray(value)) return false;
      const a = new Set(value as string[]);
      const b = new Set(q.correctIds);
      if (a.size !== b.size) return false;
      for (const id of a) if (!b.has(id)) return false;
      return true;
    }
    case "match": {
      if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
      const v = value as Record<string, string>;
      if (Object.keys(v).length !== q.correctPairs.length) return false;
      return q.correctPairs.every((p) => v[p.leftId] === p.rightId);
    }
    case "order": {
      if (!Array.isArray(value)) return false;
      const arr = value as string[];
      if (arr.length !== q.correctOrder.length) return false;
      return arr.every((id, i) => id === q.correctOrder[i]);
    }
    case "slider":
      return typeof value === "number" && value === q.correctValue;
    case "name":
      return typeof value === "string" && matchName(value, q.acceptedAnswers);
  }
}
