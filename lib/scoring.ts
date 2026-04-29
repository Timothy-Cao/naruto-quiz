import type { Question } from "@/lib/quiz-schema";
import { matchName } from "@/lib/match-name";

export type AnswerValue =
  | string                              // mc-single, name
  | string[]                            // mc-multi, order
  | Record<string, string>              // categorize: itemId -> bucketId
  | number;                             // slider

export type ScoreResult = {
  points: number;
  maxPoints: number;
};

export function scoreQuestion(q: Question, value: AnswerValue): ScoreResult {
  switch (q.type) {
    case "mc-single": {
      const max = q.scoring?.maxPoints ?? 1;
      const points = value === q.correctId ? max : 0;
      return { points, maxPoints: max };
    }

    case "mc-multi": {
      const max = q.scoring?.maxPoints ?? 1;
      const scheme = q.scoring?.scheme ?? "all-or-nothing";
      const selected = new Set(Array.isArray(value) ? (value as string[]) : []);
      const correct = new Set(q.correctIds);
      if (scheme === "per-option") {
        let aligned = 0;
        for (const opt of q.options) {
          const isCorrect = correct.has(opt.id);
          const wasSelected = selected.has(opt.id);
          if (isCorrect === wasSelected) aligned++;
        }
        return { points: max * (aligned / q.options.length), maxPoints: max };
      }
      // all-or-nothing
      const matches =
        selected.size === correct.size &&
        Array.from(correct).every((id) => selected.has(id));
      return { points: matches ? max : 0, maxPoints: max };
    }

    case "categorize": {
      const max = q.scoring?.maxPoints ?? 1;
      const scheme = q.scoring?.scheme ?? "all-or-nothing";
      const placement: Record<string, string> =
        typeof value === "object" && value !== null && !Array.isArray(value)
          ? (value as Record<string, string>)
          : {};
      if (scheme === "per-item") {
        let correct = 0;
        for (const it of q.items) {
          if (placement[it.id] === it.correctBucketId) correct++;
        }
        return { points: max * (correct / q.items.length), maxPoints: max };
      }
      // all-or-nothing
      const allCorrect = q.items.every((it) => placement[it.id] === it.correctBucketId);
      return { points: allCorrect ? max : 0, maxPoints: max };
    }

    case "order": {
      const max = q.scoring?.maxPoints ?? 1;
      const scheme = q.scoring?.scheme ?? "all-or-nothing";
      const arr = Array.isArray(value) ? (value as string[]) : [];
      if (arr.length !== q.correctOrder.length) {
        return { points: 0, maxPoints: max };
      }
      if (scheme === "per-position") {
        let correct = 0;
        for (let i = 0; i < q.correctOrder.length; i++) {
          if (arr[i] === q.correctOrder[i]) correct++;
        }
        return { points: max * (correct / q.correctOrder.length), maxPoints: max };
      }
      // all-or-nothing
      const exact = arr.every((id, i) => id === q.correctOrder[i]);
      return { points: exact ? max : 0, maxPoints: max };
    }

    case "slider": {
      const max = q.scoring?.maxPoints ?? 1;
      const scheme = q.scoring?.scheme ?? "all-or-nothing";
      if (typeof value !== "number") return { points: 0, maxPoints: max };
      if (value === q.correctValue) return { points: max, maxPoints: max };
      if (scheme === "tolerance") {
        const tol = q.scoring?.tolerance ?? 0;
        const partial = q.scoring?.partialCredit ?? 0;
        if (Math.abs(value - q.correctValue) <= tol) {
          return { points: max * partial, maxPoints: max };
        }
      }
      return { points: 0, maxPoints: max };
    }

    case "name": {
      const max = q.scoring?.maxPoints ?? 1;
      const ok = typeof value === "string" && matchName(value, q.acceptedAnswers);
      return { points: ok ? max : 0, maxPoints: max };
    }
  }
}
