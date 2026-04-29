# Quiz Builder + Manager (Phase 2+3) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an admin-only quiz authoring tool (Builder + Manager) that produces JSON conforming to the existing schema, plus flexible per-question scoring schemes that let questions award fractional points (per-option, per-item, per-position, tolerance bands).

**Architecture:** Static-JSON storage stays unchanged from Phase 1 — the Builder produces a downloadable file the admin commits manually. New `<QuizEditor>` client component is shared between `/builder` (empty) and `/manager/[slug]` (pre-loaded). All editor routes are server-rendered through `<AdminGate>`. Live preview pane reuses the existing `<QuestionFrame>` so the admin sees questions exactly as players will. Scoring engine returns `{ points, maxPoints }` instead of a boolean; player components display fractional totals.

**Tech Stack:** Existing Next.js 16 App Router, TypeScript, Tailwind v4, shadcn/ui, `@dnd-kit/core` + `@dnd-kit/sortable`, zod. No new runtime dependencies.

**Reference spec:** [docs/superpowers/specs/2026-04-27-quiz-builder-and-manager-design.md](../specs/2026-04-27-quiz-builder-and-manager-design.md)

---

## File Structure

Files this plan creates or modifies. Each line is the file's single responsibility.

**Schema and scoring (modified):**
- `lib/quiz-schema.ts` — adds optional `scoring` field per type; new exported type `Scoring*`
- `lib/scoring.ts` — returns `ScoreResult { points, maxPoints }`; per-type, per-scheme math
- `lib/player-reducer.ts` — `confirm` action carries `ScoreResult` instead of `correct: boolean`
- `lib/storage.ts` — `bestScore` is a float; `recordAttempt` formats correctly

**Player UI updates (modified):**
- `components/quiz/RevealPanel.tsx` — shows `points / maxPoints` when partial
- `components/quiz/Results.tsx` — totals fractional points
- `components/quiz/QuizPage.tsx` — wires up the new `ScoreResult` flow

**Builder pure logic (new, TDD):**
- `lib/builder/slugify.ts` — `slugify(title)` kebab-case helper
- `lib/builder/default-question.ts` — `defaultQuestion(type)` factory returning a fresh `Question`
- `lib/builder/download-quiz.ts` — `downloadQuiz(quiz)` browser-side blob download
- `lib/builder/drafts-storage.ts` — `loadDraft`, `saveDraft`, `deleteDraft`, `listDrafts`
- `lib/builder/editor-reducer.ts` — pure state machine for `<QuizEditor>`

**Builder UI components (new):**
- `components/builder/QuizEditor.tsx` — top-level orchestrator
- `components/builder/EditorHeader.tsx` — title/slug/description/cover row
- `components/builder/QuestionList.tsx` — sortable column of `<QuestionCard>`
- `components/builder/QuestionCard.tsx` — collapsible card hosting one form
- `components/builder/AddQuestionPopover.tsx` — `[+ Add question ▾]` dropdown
- `components/builder/ScoringFields.tsx` — shared scoring config subsection
- `components/builder/PreviewPane.tsx` — right-side `<QuestionFrame>` mirror
- `components/builder/BottomBar.tsx` — validation status + actions
- `components/builder/DraftBanner.tsx` — "Local draft from N min ago" banner
- `components/builder/forms/McSingleForm.tsx`
- `components/builder/forms/McMultiForm.tsx`
- `components/builder/forms/CategorizeForm.tsx`
- `components/builder/forms/OrderForm.tsx`
- `components/builder/forms/SliderForm.tsx`
- `components/builder/forms/NameForm.tsx`
- `components/manager/ManagerListClient.tsx` — list page with draft hydration

**App routes (modified/new):**
- `app/builder/page.tsx` — `<AdminGate>` + `<QuizEditor>` (empty)
- `app/manager/page.tsx` — `<AdminGate>` + `<ManagerListClient>`
- `app/manager/[slug]/page.tsx` — `<AdminGate>` + load quiz + `<QuizEditor initialQuiz>`

**Tests (new + modified):**
- `__tests__/quiz-schema.test.ts` — adds scoring field validation cases (modified)
- `__tests__/scoring.test.ts` — covers every scheme per type (modified)
- `__tests__/player-reducer.test.ts` — `confirm` carries ScoreResult (modified)
- `__tests__/slugify.test.ts` — new
- `__tests__/default-question.test.ts` — new
- `__tests__/drafts-storage.test.ts` — new
- `__tests__/editor-reducer.test.ts` — new

---

## Tasks

### Task 1: Add optional `scoring` field to quiz schema

**Files:**
- Modify: `lib/quiz-schema.ts`
- Modify: `__tests__/quiz-schema.test.ts`

- [ ] **Step 1: Write failing tests for the new scoring field**

Append to `__tests__/quiz-schema.test.ts`:
```ts
describe("QuizSchema scoring field", () => {
  it("accepts mc-single with optional maxPoints", () => {
    const quiz = {
      slug: "ex", title: "Ex",
      questions: [{
        ...baseQuestion, type: "mc-single",
        options: [{ id: "a", label: "A" }, { id: "b", label: "B" }],
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
        options: [{ id: "a", label: "A" }, { id: "b", label: "B" }],
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
        buckets: [{ id: "B1", label: "B1" }],
        items: [{ id: "i1", label: "Item", correctBucketId: "B1" }],
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
        items: [{ id: "x", label: "X" }, { id: "y", label: "Y" }],
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
        options: [{ id: "a", label: "A" }, { id: "b", label: "B" }],
        correctId: "a",
      }],
    };
    expect(() => QuizSchema.parse(quiz)).not.toThrow();
  });
});
```

- [ ] **Step 2: Run tests, confirm new ones fail**

```bash
npm test -- quiz-schema
```
Expected: 8 failed (the new "scoring" suite), 4 passed (existing).

- [ ] **Step 3: Update `lib/quiz-schema.ts` with scoring extensions**

Add at the top of the file (after existing zod-derived helpers, before the type definitions):
```ts
const ScoringBase = z.object({
  maxPoints: z.number().positive().optional(),
});

const ScoringWithScheme = <T extends [string, ...string[]]>(schemes: T) =>
  ScoringBase.extend({
    scheme: z.enum(schemes).optional(),
  });

const ScoringSlider = ScoringBase.extend({
  scheme: z.enum(["all-or-nothing", "tolerance"]).optional(),
  tolerance: z.number().nonnegative().optional(),
  partialCredit: z.number().min(0).max(1).optional(),
}).refine(
  (s) => {
    if (s.scheme !== "tolerance") return true;
    return typeof s.tolerance === "number" && typeof s.partialCredit === "number";
  },
  { message: "slider scoring with scheme=tolerance requires tolerance and partialCredit" },
);
```

Then update each existing question schema to add a `scoring` field. For each section, find the relevant schema and add the field BEFORE the `.refine(` calls. The exact edits:

In `McSingle`, add inside the `.object({ ... })` block:
```ts
scoring: ScoringBase.optional(),
```

In `McMulti`:
```ts
scoring: ScoringWithScheme(["all-or-nothing", "per-option"] as const).optional(),
```

In `Categorize`:
```ts
scoring: ScoringWithScheme(["all-or-nothing", "per-item"] as const).optional(),
```

In `Order`:
```ts
scoring: ScoringWithScheme(["all-or-nothing", "per-position"] as const).optional(),
```

In `Slider`:
```ts
scoring: ScoringSlider.optional(),
```

In `Name`:
```ts
scoring: ScoringBase.optional(),
```

- [ ] **Step 4: Run tests, confirm all pass**

```bash
npm test -- quiz-schema
```
Expected: 12 passed.

- [ ] **Step 5: Run full test suite**

```bash
npm test
```
Expected: 49 → 56 passing (existing 49 still pass, 7 new added). Some scoring tests we'll add later might still fail; for now we just verify quiz-schema passes and nothing else broke.

If any other tests broke, the issue is `Question` type narrowing; review and fix.

- [ ] **Step 6: Commit**

```bash
git add lib/quiz-schema.ts __tests__/quiz-schema.test.ts
git commit -m "Add optional scoring field per question type with scheme + tolerance config"
```

---

### Task 2: Update scoring engine to return ScoreResult

**Files:**
- Modify: `lib/scoring.ts`
- Modify: `__tests__/scoring.test.ts`

- [ ] **Step 1: Replace existing scoring tests with `ScoreResult`-based tests**

Replace the entire content of `__tests__/scoring.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { scoreQuestion } from "@/lib/scoring";
import type { Question } from "@/lib/quiz-schema";

const base = { id: "q", prompt: "p", explanation: "e" };

describe("scoreQuestion", () => {
  describe("mc-single", () => {
    const q: Question = { ...base, type: "mc-single",
      options: [{ id: "a", label: "A" }, { id: "b", label: "B" }],
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
      options: [{ id: "a", label: "A" }, { id: "b", label: "B" }, { id: "c", label: "C" }],
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
      options: [{ id: "a", label: "A" }, { id: "b", label: "B" }, { id: "c", label: "C" }, { id: "d", label: "D" }],
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
      buckets: [{ id: "B1", label: "B1" }, { id: "B2", label: "B2" }],
      items: [
        { id: "i1", label: "i1", correctBucketId: "B1" },
        { id: "i2", label: "i2", correctBucketId: "B2" },
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
      buckets: [{ id: "B1", label: "B1" }, { id: "B2", label: "B2" }],
      items: [
        { id: "i1", label: "i1", correctBucketId: "B1" },
        { id: "i2", label: "i2", correctBucketId: "B2" },
        { id: "i3", label: "i3", correctBucketId: "B1" },
        { id: "i4", label: "i4", correctBucketId: "B1" },
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
      items: [{ id: "x", label: "X" }, { id: "y", label: "Y" }, { id: "z", label: "Z" }],
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
      items: [{ id: "x", label: "X" }, { id: "y", label: "Y" }, { id: "z", label: "Z" }, { id: "w", label: "W" }],
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
```

- [ ] **Step 2: Run tests, confirm they fail (signature mismatch)**

```bash
npm test -- scoring
```
Expected: failures referencing `boolean`/`object` mismatch.

- [ ] **Step 3: Replace `lib/scoring.ts`**

```ts
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
```

- [ ] **Step 4: Run scoring tests, confirm pass**

```bash
npm test -- scoring
```
Expected: all scoring suites pass.

- [ ] **Step 5: Run full test suite**

```bash
npm test
```
Some tests likely fail now (player-reducer.test.ts will break, since `confirm` action signature is about to change in Task 3). That's OK — note which fail so we know what Task 3 fixes. The schema and scoring suites should be green.

- [ ] **Step 6: Commit**

```bash
git add lib/scoring.ts __tests__/scoring.test.ts
git commit -m "Replace boolean scoring with ScoreResult covering every per-type scheme"
```

---

### Task 3: Update player reducer + storage for fractional scores

**Files:**
- Modify: `lib/player-reducer.ts`
- Modify: `__tests__/player-reducer.test.ts`
- Modify: `lib/storage.ts` (signatures unchanged but doc updates)

- [ ] **Step 1: Update `lib/player-reducer.ts`**

Replace the file:
```ts
import type { Quiz } from "@/lib/quiz-schema";
import type { AnswerValue, ScoreResult } from "@/lib/scoring";

export type AnswerState =
  | { status: "unanswered" }
  | { status: "draft"; value: AnswerValue }
  | {
      status: "confirmed";
      value: AnswerValue;
      result: ScoreResult;
      correct: boolean;
    };

export type PlayerState = {
  currentIndex: number;
  answers: Record<string, AnswerState>;
};

export type PlayerAction =
  | { type: "setDraft"; id: string; value: AnswerValue }
  | { type: "confirm"; id: string; result: ScoreResult }
  | { type: "next" }
  | { type: "prev" }
  | { type: "jumpTo"; index: number }
  | { type: "reset"; quiz: Quiz };

export function initialState(quiz: Quiz): PlayerState {
  const answers: Record<string, AnswerState> = {};
  for (const q of quiz.questions) {
    answers[q.id] = { status: "unanswered" };
  }
  return { currentIndex: 0, answers };
}

export function playerReducer(state: PlayerState, action: PlayerAction): PlayerState {
  switch (action.type) {
    case "setDraft":
      return {
        ...state,
        answers: {
          ...state.answers,
          [action.id]: { status: "draft", value: action.value },
        },
      };
    case "confirm": {
      const a = state.answers[action.id];
      if (!a || a.status !== "draft") return state;
      const correct = action.result.points === action.result.maxPoints;
      return {
        ...state,
        answers: {
          ...state.answers,
          [action.id]: {
            status: "confirmed",
            value: a.value,
            result: action.result,
            correct,
          },
        },
      };
    }
    case "next":
      return { ...state, currentIndex: state.currentIndex + 1 };
    case "prev":
      return { ...state, currentIndex: Math.max(0, state.currentIndex - 1) };
    case "jumpTo":
      return { ...state, currentIndex: Math.max(0, action.index) };
    case "reset":
      return initialState(action.quiz);
  }
}
```

- [ ] **Step 2: Update `__tests__/player-reducer.test.ts`**

Replace just the affected sections (the `confirm` test cases):
```ts
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
```

- [ ] **Step 3: Verify `lib/storage.ts` handles floats**

The existing `storage.ts` uses `Math.max(prev.bestScore, score)` which works fine with floats. No code changes needed; the JSON-serialized scores will just have decimals. Verify the existing tests still pass:

```bash
npm test -- storage
```
Expected: all 5 storage tests pass unchanged.

- [ ] **Step 4: Run the full test suite**

```bash
npm test
```
Expected: scoring + player-reducer + quiz-schema all pass. Total should be back to roughly the previous count.

- [ ] **Step 5: Commit**

```bash
git add lib/player-reducer.ts __tests__/player-reducer.test.ts
git commit -m "Update player-reducer confirm action to carry ScoreResult"
```

---

### Task 4: Update player UI components for fractional scoring

**Files:**
- Modify: `components/quiz/RevealPanel.tsx`
- Modify: `components/quiz/Results.tsx`
- Modify: `components/quiz/QuizPage.tsx`

- [ ] **Step 1: Update `components/quiz/RevealPanel.tsx`**

Replace the file:
```tsx
import { Check, X, CircleDashed } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ScoreResult } from "@/lib/scoring";

export function RevealPanel({
  result,
  explanation,
}: {
  result: ScoreResult;
  explanation: string;
}) {
  const fullCredit = result.points === result.maxPoints;
  const partial = result.points > 0 && result.points < result.maxPoints;
  const wrong = result.points === 0;

  const Icon = fullCredit ? Check : partial ? CircleDashed : X;
  const iconColor = fullCredit
    ? "text-[var(--color-correct)]"
    : partial
      ? "text-[var(--color-accent)]"
      : "text-[var(--color-incorrect)]";
  const borderColor = fullCredit
    ? "border-[var(--color-correct)] bg-[var(--color-correct)]/10"
    : partial
      ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10"
      : "border-[var(--color-incorrect)] bg-[var(--color-incorrect)]/10";
  const headline = fullCredit ? "Correct" : partial ? "Partial credit" : "Incorrect";

  // Format points: drop trailing zeros, max 2 decimals.
  const fmt = (n: number) =>
    Number.isInteger(n) ? n.toString() : n.toFixed(2).replace(/\.?0+$/, "");

  return (
    <div
      className={cn(
        "mt-4 p-4 rounded-md border animate-in slide-in-from-top-2 duration-250",
        borderColor,
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon className={cn("w-5 h-5", iconColor)} />
        <span className="font-semibold text-[var(--color-text)]">{headline}</span>
        {(partial || result.maxPoints !== 1) && (
          <span className="ml-auto font-mono text-xs text-[var(--color-text-dim)]">
            {fmt(result.points)} / {fmt(result.maxPoints)}
          </span>
        )}
      </div>
      <p className="text-sm text-[var(--color-text)] leading-relaxed">{explanation}</p>
    </div>
  );
}
```

- [ ] **Step 2: Update `components/quiz/QuestionFrame.tsx` to pass result**

The QuestionFrame currently passes `correct: state.correct` to RevealPanel. Update the call:

Find:
```tsx
{state.status === "confirmed" && (
  <RevealPanel correct={state.correct} explanation={question.explanation} />
)}
```
Replace with:
```tsx
{state.status === "confirmed" && (
  <RevealPanel result={state.result} explanation={question.explanation} />
)}
```

- [ ] **Step 3: Update `components/quiz/Results.tsx`**

Replace the file:
```tsx
"use client";
import { useEffect } from "react";
import type { Quiz } from "@/lib/quiz-schema";
import type { AnswerState } from "@/lib/player-reducer";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { recordAttempt } from "@/lib/storage";
import { Check, X, CircleDashed } from "lucide-react";
import Link from "next/link";

type Props = {
  quiz: Quiz;
  answers: Record<string, AnswerState>;
  onRetry: () => void;
  onJumpTo: (index: number) => void;
};

function fmt(n: number) {
  return Number.isInteger(n) ? n.toString() : n.toFixed(2).replace(/\.?0+$/, "");
}

export function Results({ quiz, answers, onRetry, onJumpTo }: Props) {
  const totals = quiz.questions.reduce(
    (acc, q) => {
      const a = answers[q.id];
      if (a?.status === "confirmed") {
        acc.points += a.result.points;
        acc.maxPoints += a.result.maxPoints;
      } else {
        // Use defaults for unanswered: maxPoints is 1 unless overridden in scoring config.
        acc.maxPoints += q.scoring?.maxPoints ?? 1;
      }
      return acc;
    },
    { points: 0, maxPoints: 0 },
  );

  useEffect(() => {
    recordAttempt(quiz.slug, totals.points, totals.maxPoints);
  }, [quiz.slug, totals.points, totals.maxPoints]);

  return (
    <Card className="p-6 bg-[var(--color-surface)] border-[var(--color-border)]">
      <div className="text-center mb-6">
        <p className="text-xs uppercase tracking-widest text-[var(--color-text-dim)]">Final score</p>
        <p className="font-[family-name:var(--font-display)] text-7xl text-[var(--color-accent)] tracking-wide">
          {fmt(totals.points)}{" "}
          <span className="text-[var(--color-text-dim)]">/ {fmt(totals.maxPoints)}</span>
        </p>
      </div>
      <ul className="grid gap-2 mb-6">
        {quiz.questions.map((q, i) => {
          const a = answers[q.id];
          const confirmed = a?.status === "confirmed";
          const fullCredit = confirmed && a.result.points === a.result.maxPoints;
          const partial = confirmed && a.result.points > 0 && a.result.points < a.result.maxPoints;

          const Icon = !confirmed
            ? X
            : fullCredit
              ? Check
              : partial
                ? CircleDashed
                : X;
          const iconColor = !confirmed
            ? "text-[var(--color-text-dim)]"
            : fullCredit
              ? "text-[var(--color-correct)]"
              : partial
                ? "text-[var(--color-accent)]"
                : "text-[var(--color-incorrect)]";

          return (
            <li key={q.id}>
              <button
                type="button"
                onClick={() => onJumpTo(i)}
                className="w-full flex items-center gap-3 p-3 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)] hover:border-[var(--color-border-2)] text-left"
              >
                <Icon className={`w-5 h-5 shrink-0 ${iconColor}`} />
                <span className="text-sm text-[var(--color-text)] flex-1">{q.prompt}</span>
                <span className="text-xs text-[var(--color-text-dim)] font-mono">
                  {confirmed ? `${fmt(a.result.points)} / ${fmt(a.result.maxPoints)}` : "—"}
                </span>
                <span className="text-xs text-[var(--color-text-dim)]">Review</span>
              </button>
            </li>
          );
        })}
      </ul>
      <div className="flex justify-between">
        <Link href="/quizzes" className={buttonVariants({ variant: "ghost" })}>
          Back to quizzes
        </Link>
        <Button
          onClick={onRetry}
          className="bg-[var(--color-accent)] hover:bg-[var(--color-accent)]/90 text-white"
        >
          Retry quiz
        </Button>
      </div>
    </Card>
  );
}
```

- [ ] **Step 4: Update `components/quiz/QuizPage.tsx` to dispatch result**

Find the `handleConfirm` function. It currently scores and dispatches `correct: boolean`. Update to dispatch the full `ScoreResult`:
```tsx
function handleConfirm() {
  if (!currentQuestion || !currentAnswer || currentAnswer.status !== "draft") return;
  const result = scoreQuestion(currentQuestion, currentAnswer.value);
  playSfx(result.points === result.maxPoints ? "correct" : "wrong");
  dispatch({ type: "confirm", id: currentQuestion.id, result });
}
```

(Replaces the `const correct = ...` line and the `dispatch({ type: "confirm", id: ..., correct })` line.)

- [ ] **Step 5: Verify build + tests**

```bash
npm run build 2>&1 | tail -8
npm test 2>&1 | tail -5
```
Expected: build clean, tests pass.

- [ ] **Step 6: Smoke-test the player on the example quiz**

```bash
npm run dev > /tmp/dev.log 2>&1 &
DEV_PID=$!
sleep 5
PORT=$(grep -oE 'http://localhost:[0-9]+' /tmp/dev.log | head -1 | grep -oE '[0-9]+$')
PORT=${PORT:-3000}
curl -s -o /dev/null -w "/quizzes/example: %{http_code}\n" "http://localhost:$PORT/quizzes/example"
kill $DEV_PID 2>/dev/null
wait 2>/dev/null
```
Expected: 200. (Open in a browser if you want to play through; not required for the task.)

- [ ] **Step 7: Commit**

```bash
git add components/quiz/RevealPanel.tsx components/quiz/QuestionFrame.tsx components/quiz/Results.tsx components/quiz/QuizPage.tsx
git commit -m "Display fractional scores in reveal panel and results screen"
```

---

### Task 5: Builder pure helpers (slugify, default-question, download-quiz)

**Files:**
- Create: `lib/builder/slugify.ts`
- Create: `lib/builder/default-question.ts`
- Create: `lib/builder/download-quiz.ts`
- Create: `__tests__/slugify.test.ts`
- Create: `__tests__/default-question.test.ts`

- [ ] **Step 1: Write slugify tests**

`__tests__/slugify.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { slugify } from "@/lib/builder/slugify";

describe("slugify", () => {
  it("lowercases and joins with dashes", () => {
    expect(slugify("Hidden Leaf Trivia")).toBe("hidden-leaf-trivia");
  });
  it("strips non-alphanumeric", () => {
    expect(slugify("Naruto: Shippuden #1!")).toBe("naruto-shippuden-1");
  });
  it("collapses repeated dashes", () => {
    expect(slugify("a---b   c")).toBe("a-b-c");
  });
  it("trims leading/trailing dashes", () => {
    expect(slugify(" -hello- ")).toBe("hello");
  });
  it("returns empty string on no usable chars", () => {
    expect(slugify("!!!")).toBe("");
  });
  it("handles unicode by stripping it", () => {
    expect(slugify("Tōru's Quiz")).toBe("trus-quiz");
  });
});
```

- [ ] **Step 2: Run, confirm fail**

```bash
npm test -- slugify
```

- [ ] **Step 3: Implement slugify**

`lib/builder/slugify.ts`:
```ts
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}
```

- [ ] **Step 4: Run tests, confirm pass**

```bash
npm test -- slugify
```

- [ ] **Step 5: Write default-question tests**

`__tests__/default-question.test.ts`:
```ts
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
  it("each call generates a unique id", () => {
    const a = defaultQuestion("mc-single");
    const b = defaultQuestion("mc-single");
    expect(a.id).not.toBe(b.id);
  });
});
```

- [ ] **Step 6: Run, confirm fail**

```bash
npm test -- default-question
```

- [ ] **Step 7: Implement default-question**

`lib/builder/default-question.ts`:
```ts
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
    prompt: "New question",
    explanation: "Explanation goes here.",
  };
  switch (type) {
    case "mc-single":
      return {
        ...base,
        type: "mc-single",
        options: [
          { id: `${id}-opt-a`, label: "Option A" },
          { id: `${id}-opt-b`, label: "Option B" },
        ],
        correctId: `${id}-opt-a`,
      };
    case "mc-multi":
      return {
        ...base,
        type: "mc-multi",
        options: [
          { id: `${id}-opt-a`, label: "Option A" },
          { id: `${id}-opt-b`, label: "Option B" },
          { id: `${id}-opt-c`, label: "Option C" },
        ],
        correctIds: [`${id}-opt-a`],
      };
    case "categorize":
      return {
        ...base,
        type: "categorize",
        buckets: [
          { id: `${id}-bucket-1`, label: "Bucket 1" },
          { id: `${id}-bucket-2`, label: "Bucket 2" },
        ],
        items: [
          { id: `${id}-item-1`, label: "Item 1", correctBucketId: `${id}-bucket-1` },
          { id: `${id}-item-2`, label: "Item 2", correctBucketId: `${id}-bucket-2` },
        ],
      };
    case "order":
      return {
        ...base,
        type: "order",
        items: [
          { id: `${id}-item-1`, label: "First" },
          { id: `${id}-item-2`, label: "Second" },
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
  }
}
```

- [ ] **Step 8: Run tests, confirm pass**

```bash
npm test -- default-question
```

- [ ] **Step 9: Implement download-quiz (no test — DOM API)**

`lib/builder/download-quiz.ts`:
```ts
"use client";
import type { Quiz } from "@/lib/quiz-schema";

export function downloadQuiz(quiz: Quiz): void {
  if (typeof window === "undefined") return;
  const json = JSON.stringify(quiz, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${quiz.slug}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 100);
}
```

- [ ] **Step 10: Run full test suite**

```bash
npm test
```
Expected: all green.

- [ ] **Step 11: Commit**

```bash
git add lib/builder/ __tests__/slugify.test.ts __tests__/default-question.test.ts
git commit -m "Add builder pure helpers: slugify, defaultQuestion, downloadQuiz"
```

---

### Task 6: Drafts storage (localStorage)

**Files:**
- Create: `lib/builder/drafts-storage.ts`
- Create: `__tests__/drafts-storage.test.ts`

- [ ] **Step 1: Write tests**

`__tests__/drafts-storage.test.ts`:
```ts
import { beforeEach, describe, it, expect } from "vitest";
import {
  loadDraft,
  saveDraft,
  deleteDraft,
  listDrafts,
} from "@/lib/builder/drafts-storage";
import type { Quiz } from "@/lib/quiz-schema";

const sampleQuiz: Quiz = {
  slug: "ex",
  title: "Ex",
  questions: [
    {
      id: "q1",
      type: "mc-single",
      prompt: "p",
      explanation: "e",
      options: [{ id: "a", label: "A" }, { id: "b", label: "B" }],
      correctId: "a",
    },
  ],
};

beforeEach(() => {
  localStorage.clear();
});

describe("drafts-storage", () => {
  it("returns null when no draft", () => {
    expect(loadDraft("ex")).toBeNull();
  });

  it("round-trips a save/load", () => {
    saveDraft("ex", sampleQuiz);
    const draft = loadDraft("ex");
    expect(draft?.quiz).toEqual(sampleQuiz);
    expect(typeof draft?.savedAt).toBe("string");
  });

  it("listDrafts returns all slugs with savedAt", () => {
    saveDraft("a", { ...sampleQuiz, slug: "a" });
    saveDraft("b", { ...sampleQuiz, slug: "b" });
    const drafts = listDrafts();
    expect(Object.keys(drafts).sort()).toEqual(["a", "b"]);
    expect(drafts.a.quiz.slug).toBe("a");
  });

  it("deleteDraft removes one entry", () => {
    saveDraft("a", { ...sampleQuiz, slug: "a" });
    saveDraft("b", { ...sampleQuiz, slug: "b" });
    deleteDraft("a");
    expect(loadDraft("a")).toBeNull();
    expect(loadDraft("b")?.quiz.slug).toBe("b");
  });

  it("survives malformed JSON in storage", () => {
    localStorage.setItem("naruto-quiz:builder-drafts", "{not json");
    expect(loadDraft("ex")).toBeNull();
    expect(listDrafts()).toEqual({});
  });
});
```

- [ ] **Step 2: Run, confirm fail**

```bash
npm test -- drafts-storage
```

- [ ] **Step 3: Implement**

`lib/builder/drafts-storage.ts`:
```ts
import type { Quiz } from "@/lib/quiz-schema";

const KEY = "naruto-quiz:builder-drafts";

export type Draft = {
  quiz: Quiz;
  savedAt: string; // ISO 8601
};

export type DraftMap = Record<string, Draft>;

function readMap(): DraftMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return {};
    return parsed as DraftMap;
  } catch {
    return {};
  }
}

function writeMap(map: DraftMap): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(map));
}

export function loadDraft(slug: string): Draft | null {
  return readMap()[slug] ?? null;
}

export function saveDraft(slug: string, quiz: Quiz): Draft {
  const map = readMap();
  const draft: Draft = { quiz, savedAt: new Date().toISOString() };
  map[slug] = draft;
  writeMap(map);
  return draft;
}

export function deleteDraft(slug: string): void {
  const map = readMap();
  delete map[slug];
  writeMap(map);
}

export function listDrafts(): DraftMap {
  return readMap();
}
```

- [ ] **Step 4: Run tests, confirm pass**

```bash
npm test -- drafts-storage
```

- [ ] **Step 5: Commit**

```bash
git add lib/builder/drafts-storage.ts __tests__/drafts-storage.test.ts
git commit -m "Add localStorage drafts adapter for builder"
```

---

### Task 7: Editor reducer

**Files:**
- Create: `lib/builder/editor-reducer.ts`
- Create: `__tests__/editor-reducer.test.ts`

- [ ] **Step 1: Write tests**

`__tests__/editor-reducer.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import {
  initialEditorState,
  editorReducer,
  type EditorState,
} from "@/lib/builder/editor-reducer";
import type { Quiz } from "@/lib/quiz-schema";

const blank: Quiz = {
  slug: "new",
  title: "New quiz",
  questions: [],
};

const seeded: Quiz = {
  slug: "seed",
  title: "Seed",
  questions: [
    {
      id: "q1",
      type: "mc-single",
      prompt: "p",
      explanation: "e",
      options: [{ id: "a", label: "A" }, { id: "b", label: "B" }],
      correctId: "a",
    },
  ],
};

describe("editorReducer", () => {
  it("initialEditorState seeds isDirty=false", () => {
    const s = initialEditorState(blank);
    expect(s.quiz).toEqual(blank);
    expect(s.isDirty).toBe(false);
    expect(s.selectedQuestionId).toBeNull();
  });

  it("setTitle updates title and marks dirty", () => {
    let s: EditorState = initialEditorState(blank);
    s = editorReducer(s, { type: "setTitle", title: "Better" });
    expect(s.quiz.title).toBe("Better");
    expect(s.isDirty).toBe(true);
  });

  it("setSlug updates slug", () => {
    let s = initialEditorState(blank);
    s = editorReducer(s, { type: "setSlug", slug: "kebab-name" });
    expect(s.quiz.slug).toBe("kebab-name");
  });

  it("setDescription stores description", () => {
    let s = initialEditorState(blank);
    s = editorReducer(s, { type: "setDescription", description: "abc" });
    expect(s.quiz.description).toBe("abc");
    s = editorReducer(s, { type: "setDescription", description: undefined });
    expect(s.quiz.description).toBeUndefined();
  });

  it("addQuestion appends and selects", () => {
    let s = initialEditorState(blank);
    s = editorReducer(s, { type: "addQuestion", questionType: "slider" });
    expect(s.quiz.questions).toHaveLength(1);
    expect(s.quiz.questions[0].type).toBe("slider");
    expect(s.selectedQuestionId).toBe(s.quiz.questions[0].id);
  });

  it("removeQuestion removes by id and clears selection if it was selected", () => {
    let s = initialEditorState(seeded);
    s = editorReducer(s, { type: "selectQuestion", id: "q1" });
    s = editorReducer(s, { type: "removeQuestion", id: "q1" });
    expect(s.quiz.questions).toHaveLength(0);
    expect(s.selectedQuestionId).toBeNull();
  });

  it("duplicateQuestion creates a copy with new id", () => {
    let s = initialEditorState(seeded);
    s = editorReducer(s, { type: "duplicateQuestion", id: "q1" });
    expect(s.quiz.questions).toHaveLength(2);
    expect(s.quiz.questions[1].id).not.toBe("q1");
    expect(s.quiz.questions[1].prompt).toBe("p");
  });

  it("reorderQuestions rearranges by id list", () => {
    const seeded2: Quiz = {
      ...seeded,
      questions: [
        ...seeded.questions,
        {
          id: "q2",
          type: "mc-single",
          prompt: "p2",
          explanation: "e2",
          options: [{ id: "x", label: "X" }, { id: "y", label: "Y" }],
          correctId: "x",
        },
      ],
    };
    let s = initialEditorState(seeded2);
    s = editorReducer(s, { type: "reorderQuestions", ids: ["q2", "q1"] });
    expect(s.quiz.questions.map((q) => q.id)).toEqual(["q2", "q1"]);
  });

  it("updateQuestion replaces a question by id", () => {
    let s = initialEditorState(seeded);
    const updated = { ...seeded.questions[0], prompt: "new prompt" };
    s = editorReducer(s, { type: "updateQuestion", question: updated });
    expect(s.quiz.questions[0].prompt).toBe("new prompt");
  });

  it("selectQuestion sets selectedQuestionId", () => {
    let s = initialEditorState(seeded);
    s = editorReducer(s, { type: "selectQuestion", id: "q1" });
    expect(s.selectedQuestionId).toBe("q1");
  });

  it("markClean unsets isDirty without changing the quiz", () => {
    let s = initialEditorState(blank);
    s = editorReducer(s, { type: "setTitle", title: "Whatever" });
    expect(s.isDirty).toBe(true);
    s = editorReducer(s, { type: "markClean" });
    expect(s.isDirty).toBe(false);
    expect(s.quiz.title).toBe("Whatever");
  });

  it("loadDraft replaces the quiz and records draftLoadedAt", () => {
    let s = initialEditorState(blank);
    s = editorReducer(s, {
      type: "loadDraft",
      draft: { quiz: seeded, savedAt: "2026-01-01T00:00:00Z" },
    });
    expect(s.quiz).toEqual(seeded);
    expect(s.draftLoadedAt).toBe("2026-01-01T00:00:00Z");
  });

  it("validation flags missing options for mc-single", () => {
    const broken: Quiz = {
      slug: "ex",
      title: "Ex",
      questions: [{
        id: "q1",
        type: "mc-single",
        prompt: "",
        explanation: "",
        options: [{ id: "a", label: "A" }],
        correctId: "z",
      }],
    };
    const s = initialEditorState(broken);
    expect(s.validation.length).toBeGreaterThan(0);
  });

  it("validation is empty for a valid quiz", () => {
    const s = initialEditorState(seeded);
    expect(s.validation).toEqual([]);
  });
});
```

- [ ] **Step 2: Run, confirm fail**

```bash
npm test -- editor-reducer
```

- [ ] **Step 3: Implement**

`lib/builder/editor-reducer.ts`:
```ts
import { type ZodIssue } from "zod";
import { QuizSchema, type Question, type Quiz } from "@/lib/quiz-schema";
import { defaultQuestion } from "@/lib/builder/default-question";

export type EditorState = {
  quiz: Quiz;
  selectedQuestionId: string | null;
  validation: ZodIssue[];
  isDirty: boolean;
  draftLoadedAt: string | null;
};

export type EditorAction =
  | { type: "setTitle"; title: string }
  | { type: "setSlug"; slug: string }
  | { type: "setDescription"; description: string | undefined }
  | { type: "setCoverImage"; coverImage: string | undefined }
  | { type: "addQuestion"; questionType: Question["type"] }
  | { type: "removeQuestion"; id: string }
  | { type: "duplicateQuestion"; id: string }
  | { type: "reorderQuestions"; ids: string[] }
  | { type: "updateQuestion"; question: Question }
  | { type: "selectQuestion"; id: string | null }
  | { type: "loadDraft"; draft: { quiz: Quiz; savedAt: string } }
  | { type: "discardDraft" }
  | { type: "markClean" }
  | { type: "reset"; quiz: Quiz };

function validate(quiz: Quiz): ZodIssue[] {
  const r = QuizSchema.safeParse(quiz);
  return r.success ? [] : r.error.issues;
}

export function initialEditorState(quiz: Quiz): EditorState {
  return {
    quiz,
    selectedQuestionId: quiz.questions[0]?.id ?? null,
    validation: validate(quiz),
    isDirty: false,
    draftLoadedAt: null,
  };
}

function withQuiz(state: EditorState, quiz: Quiz, markDirty = true): EditorState {
  return {
    ...state,
    quiz,
    validation: validate(quiz),
    isDirty: state.isDirty || markDirty,
  };
}

export function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case "setTitle":
      return withQuiz(state, { ...state.quiz, title: action.title });
    case "setSlug":
      return withQuiz(state, { ...state.quiz, slug: action.slug });
    case "setDescription":
      return withQuiz(state, { ...state.quiz, description: action.description });
    case "setCoverImage":
      return withQuiz(state, { ...state.quiz, coverImage: action.coverImage });

    case "addQuestion": {
      const newQ = defaultQuestion(action.questionType);
      const next = withQuiz(state, {
        ...state.quiz,
        questions: [...state.quiz.questions, newQ],
      });
      return { ...next, selectedQuestionId: newQ.id };
    }

    case "removeQuestion": {
      const next = withQuiz(state, {
        ...state.quiz,
        questions: state.quiz.questions.filter((q) => q.id !== action.id),
      });
      const stillExists = next.quiz.questions.some((q) => q.id === state.selectedQuestionId);
      return {
        ...next,
        selectedQuestionId: stillExists ? state.selectedQuestionId : null,
      };
    }

    case "duplicateQuestion": {
      const idx = state.quiz.questions.findIndex((q) => q.id === action.id);
      if (idx === -1) return state;
      const original = state.quiz.questions[idx];
      const copy: Question = {
        ...JSON.parse(JSON.stringify(original)),
        id: `${original.id}-copy-${Date.now().toString(36)}`,
      };
      const newQuestions = [
        ...state.quiz.questions.slice(0, idx + 1),
        copy,
        ...state.quiz.questions.slice(idx + 1),
      ];
      return withQuiz(state, { ...state.quiz, questions: newQuestions });
    }

    case "reorderQuestions": {
      const lookup = new Map(state.quiz.questions.map((q) => [q.id, q]));
      const reordered = action.ids
        .map((id) => lookup.get(id))
        .filter((q): q is Question => q !== undefined);
      return withQuiz(state, { ...state.quiz, questions: reordered });
    }

    case "updateQuestion": {
      const newQuestions = state.quiz.questions.map((q) =>
        q.id === action.question.id ? action.question : q,
      );
      return withQuiz(state, { ...state.quiz, questions: newQuestions });
    }

    case "selectQuestion":
      return { ...state, selectedQuestionId: action.id };

    case "loadDraft":
      return {
        ...state,
        quiz: action.draft.quiz,
        validation: validate(action.draft.quiz),
        isDirty: true,
        draftLoadedAt: action.draft.savedAt,
        selectedQuestionId: action.draft.quiz.questions[0]?.id ?? null,
      };

    case "discardDraft":
      return { ...state, draftLoadedAt: null };

    case "markClean":
      return { ...state, isDirty: false };

    case "reset":
      return initialEditorState(action.quiz);
  }
}
```

- [ ] **Step 4: Run tests, confirm pass**

```bash
npm test -- editor-reducer
```

- [ ] **Step 5: Commit**

```bash
git add lib/builder/editor-reducer.ts __tests__/editor-reducer.test.ts
git commit -m "Add editor state reducer with full action coverage and zod validation"
```

---

### Task 8: ScoringFields shared component

**Files:**
- Create: `components/builder/ScoringFields.tsx`

- [ ] **Step 1: Implement**

`components/builder/ScoringFields.tsx`:
```tsx
"use client";
import type { Question } from "@/lib/quiz-schema";

type Props = {
  question: Question;
  onChange: (next: Question) => void;
};

const SCHEMES_BY_TYPE: Record<Question["type"], { value: string; label: string }[]> = {
  "mc-single": [{ value: "all-or-nothing", label: "All or nothing" }],
  "mc-multi": [
    { value: "all-or-nothing", label: "All or nothing" },
    { value: "per-option", label: "Per-option (correct selects + correct skips)" },
  ],
  categorize: [
    { value: "all-or-nothing", label: "All or nothing" },
    { value: "per-item", label: "Per-item (one credit per correctly placed item)" },
  ],
  order: [
    { value: "all-or-nothing", label: "All or nothing" },
    { value: "per-position", label: "Per-position (one credit per correct slot)" },
  ],
  slider: [
    { value: "all-or-nothing", label: "Exact only" },
    { value: "tolerance", label: "Tolerance bands" },
  ],
  name: [{ value: "all-or-nothing", label: "All or nothing" }],
};

export function ScoringFields({ question, onChange }: Props) {
  const max = question.scoring?.maxPoints ?? 1;
  const currentScheme =
    "scoring" in question && question.scoring && "scheme" in question.scoring
      ? (question.scoring.scheme ?? "all-or-nothing")
      : "all-or-nothing";

  const schemes = SCHEMES_BY_TYPE[question.type];
  const showSchemeDropdown = schemes.length > 1;

  function setMax(value: number) {
    onChange({
      ...question,
      scoring: { ...(question.scoring ?? {}), maxPoints: value },
    } as Question);
  }

  function setScheme(scheme: string) {
    onChange({
      ...question,
      scoring: { ...(question.scoring ?? {}), maxPoints: max, scheme },
    } as Question);
  }

  function setTolerance(tolerance: number) {
    if (question.type !== "slider") return;
    onChange({
      ...question,
      scoring: {
        ...(question.scoring ?? { maxPoints: max }),
        scheme: "tolerance",
        tolerance,
        partialCredit: question.scoring?.partialCredit ?? 0.5,
      },
    });
  }

  function setPartialCredit(partialCredit: number) {
    if (question.type !== "slider") return;
    onChange({
      ...question,
      scoring: {
        ...(question.scoring ?? { maxPoints: max }),
        scheme: "tolerance",
        tolerance: question.scoring?.tolerance ?? 1,
        partialCredit,
      },
    });
  }

  return (
    <fieldset className="grid gap-3 mt-3 p-3 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)]">
      <legend className="text-xs uppercase tracking-wide text-[var(--color-text-dim)] px-1">
        Scoring
      </legend>

      <label className="grid grid-cols-[140px,1fr] gap-3 items-center text-sm">
        <span className="text-[var(--color-text-dim)]">Max points</span>
        <input
          type="number"
          step={0.5}
          min={0.5}
          value={max}
          onChange={(e) => setMax(parseFloat(e.target.value) || 1)}
          className="px-2 py-1 rounded border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)]"
        />
      </label>

      {showSchemeDropdown && (
        <label className="grid grid-cols-[140px,1fr] gap-3 items-center text-sm">
          <span className="text-[var(--color-text-dim)]">Scheme</span>
          <select
            value={currentScheme}
            onChange={(e) => setScheme(e.target.value)}
            className="px-2 py-1 rounded border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)]"
          >
            {schemes.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </label>
      )}

      {question.type === "slider" && currentScheme === "tolerance" && (
        <>
          <label className="grid grid-cols-[140px,1fr] gap-3 items-center text-sm">
            <span className="text-[var(--color-text-dim)]">Tolerance ±</span>
            <input
              type="number"
              min={0}
              step={1}
              value={question.scoring?.tolerance ?? 1}
              onChange={(e) => setTolerance(parseFloat(e.target.value) || 0)}
              className="px-2 py-1 rounded border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)]"
            />
          </label>
          <label className="grid grid-cols-[140px,1fr] gap-3 items-center text-sm">
            <span className="text-[var(--color-text-dim)]">Partial credit (0–1)</span>
            <input
              type="number"
              min={0}
              max={1}
              step={0.05}
              value={question.scoring?.partialCredit ?? 0.5}
              onChange={(e) => setPartialCredit(parseFloat(e.target.value) || 0)}
              className="px-2 py-1 rounded border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)]"
            />
          </label>
        </>
      )}
    </fieldset>
  );
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build 2>&1 | tail -8
```

- [ ] **Step 3: Commit**

```bash
git add components/builder/ScoringFields.tsx
git commit -m "Add ScoringFields component shared across all question forms"
```

---

### Task 9: McSingleForm + McMultiForm

**Files:**
- Create: `components/builder/forms/McSingleForm.tsx`
- Create: `components/builder/forms/McMultiForm.tsx`

- [ ] **Step 1: Implement McSingleForm**

`components/builder/forms/McSingleForm.tsx`:
```tsx
"use client";
import type { McSingleQuestion } from "@/lib/quiz-schema";
import { Trash2, Plus } from "lucide-react";
import { ScoringFields } from "../ScoringFields";

type Props = {
  question: McSingleQuestion;
  onChange: (q: McSingleQuestion) => void;
};

export function McSingleForm({ question, onChange }: Props) {
  function setOption(id: string, patch: Partial<{ label: string; thumbnail?: string }>) {
    onChange({
      ...question,
      options: question.options.map((o) => (o.id === id ? { ...o, ...patch } : o)),
    });
  }

  function addOption() {
    const newId = `${question.id}-opt-${Date.now().toString(36)}`;
    onChange({
      ...question,
      options: [...question.options, { id: newId, label: "New option" }],
    });
  }

  function removeOption(id: string) {
    if (question.options.length <= 2) return; // schema requires min 2
    const next = question.options.filter((o) => o.id !== id);
    onChange({
      ...question,
      options: next,
      correctId: question.correctId === id ? next[0].id : question.correctId,
    });
  }

  function setPrompt(prompt: string) { onChange({ ...question, prompt }); }
  function setImage(image: string) {
    onChange({ ...question, image: image || undefined });
  }
  function setExplanation(explanation: string) { onChange({ ...question, explanation }); }

  return (
    <div className="grid gap-3">
      <Field label="Prompt">
        <textarea
          value={question.prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={2}
          className="textarea"
        />
      </Field>

      <Field label="Image (URL or /quiz-images/...)">
        <input
          type="text"
          value={question.image ?? ""}
          onChange={(e) => setImage(e.target.value)}
          placeholder="optional"
          className="input"
        />
      </Field>

      <fieldset className="grid gap-2">
        <legend className="text-xs uppercase tracking-wide text-[var(--color-text-dim)]">
          Options (pick one as correct)
        </legend>
        {question.options.map((opt) => (
          <div key={opt.id} className="grid grid-cols-[auto,1fr,1fr,auto] gap-2 items-center">
            <input
              type="radio"
              name={`${question.id}-correct`}
              checked={question.correctId === opt.id}
              onChange={() => onChange({ ...question, correctId: opt.id })}
              className="accent-[var(--color-accent)]"
            />
            <input
              type="text"
              value={opt.label}
              onChange={(e) => setOption(opt.id, { label: e.target.value })}
              placeholder="Label"
              className="input"
            />
            <input
              type="text"
              value={opt.thumbnail ?? ""}
              onChange={(e) => setOption(opt.id, { thumbnail: e.target.value || undefined })}
              placeholder="Thumbnail URL (optional)"
              className="input"
            />
            <button
              type="button"
              onClick={() => removeOption(opt.id)}
              disabled={question.options.length <= 2}
              className="p-1.5 rounded text-[var(--color-text-dim)] hover:text-[var(--color-incorrect)] disabled:opacity-40"
              aria-label="Remove option"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addOption}
          className="self-start mt-1 px-2 py-1 text-xs rounded bg-[var(--color-surface-2)] hover:bg-[var(--color-border-2)] text-[var(--color-text)] flex items-center gap-1"
        >
          <Plus className="w-3 h-3" /> Add option
        </button>
      </fieldset>

      <Field label="Explanation">
        <textarea
          value={question.explanation}
          onChange={(e) => setExplanation(e.target.value)}
          rows={3}
          className="textarea"
        />
      </Field>

      <ScoringFields question={question} onChange={(q) => onChange(q as McSingleQuestion)} />

      <style jsx>{`
        .input, :global(.input) {
          padding: 0.375rem 0.625rem;
          border-radius: 6px;
          border: 1px solid var(--color-border);
          background: var(--color-bg);
          color: var(--color-text);
          font-size: 0.875rem;
        }
        .textarea, :global(.textarea) {
          padding: 0.5rem;
          border-radius: 6px;
          border: 1px solid var(--color-border);
          background: var(--color-bg);
          color: var(--color-text);
          font-size: 0.875rem;
          font-family: inherit;
          resize: vertical;
        }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="text-xs uppercase tracking-wide text-[var(--color-text-dim)]">{label}</span>
      {children}
    </label>
  );
}
```

- [ ] **Step 2: Implement McMultiForm**

`components/builder/forms/McMultiForm.tsx`:
```tsx
"use client";
import type { McMultiQuestion } from "@/lib/quiz-schema";
import { Trash2, Plus } from "lucide-react";
import { ScoringFields } from "../ScoringFields";

type Props = {
  question: McMultiQuestion;
  onChange: (q: McMultiQuestion) => void;
};

export function McMultiForm({ question, onChange }: Props) {
  function setOption(id: string, patch: Partial<{ label: string; thumbnail?: string }>) {
    onChange({
      ...question,
      options: question.options.map((o) => (o.id === id ? { ...o, ...patch } : o)),
    });
  }

  function addOption() {
    const newId = `${question.id}-opt-${Date.now().toString(36)}`;
    onChange({
      ...question,
      options: [...question.options, { id: newId, label: "New option" }],
    });
  }

  function removeOption(id: string) {
    if (question.options.length <= 2) return;
    onChange({
      ...question,
      options: question.options.filter((o) => o.id !== id),
      correctIds: question.correctIds.filter((cid) => cid !== id),
    });
  }

  function toggleCorrect(id: string) {
    const isCorrect = question.correctIds.includes(id);
    const next = isCorrect
      ? question.correctIds.filter((cid) => cid !== id)
      : [...question.correctIds, id];
    onChange({ ...question, correctIds: next });
  }

  return (
    <div className="grid gap-3">
      <label className="grid gap-1 text-sm">
        <span className="text-xs uppercase tracking-wide text-[var(--color-text-dim)]">Prompt</span>
        <textarea
          value={question.prompt}
          onChange={(e) => onChange({ ...question, prompt: e.target.value })}
          rows={2}
          className="px-2 py-1.5 rounded border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm font-sans resize-y"
        />
      </label>

      <label className="grid gap-1 text-sm">
        <span className="text-xs uppercase tracking-wide text-[var(--color-text-dim)]">Image (URL or /quiz-images/...)</span>
        <input
          type="text"
          value={question.image ?? ""}
          onChange={(e) => onChange({ ...question, image: e.target.value || undefined })}
          placeholder="optional"
          className="px-2 py-1 rounded border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm"
        />
      </label>

      <fieldset className="grid gap-2">
        <legend className="text-xs uppercase tracking-wide text-[var(--color-text-dim)]">
          Options (check each correct one)
        </legend>
        {question.options.map((opt) => (
          <div key={opt.id} className="grid grid-cols-[auto,1fr,1fr,auto] gap-2 items-center">
            <input
              type="checkbox"
              checked={question.correctIds.includes(opt.id)}
              onChange={() => toggleCorrect(opt.id)}
              className="accent-[var(--color-accent)]"
            />
            <input
              type="text"
              value={opt.label}
              onChange={(e) => setOption(opt.id, { label: e.target.value })}
              placeholder="Label"
              className="px-2 py-1 rounded border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm"
            />
            <input
              type="text"
              value={opt.thumbnail ?? ""}
              onChange={(e) => setOption(opt.id, { thumbnail: e.target.value || undefined })}
              placeholder="Thumbnail URL (optional)"
              className="px-2 py-1 rounded border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm"
            />
            <button
              type="button"
              onClick={() => removeOption(opt.id)}
              disabled={question.options.length <= 2}
              className="p-1.5 rounded text-[var(--color-text-dim)] hover:text-[var(--color-incorrect)] disabled:opacity-40"
              aria-label="Remove option"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addOption}
          className="self-start mt-1 px-2 py-1 text-xs rounded bg-[var(--color-surface-2)] hover:bg-[var(--color-border-2)] text-[var(--color-text)] flex items-center gap-1"
        >
          <Plus className="w-3 h-3" /> Add option
        </button>
      </fieldset>

      <label className="grid gap-1 text-sm">
        <span className="text-xs uppercase tracking-wide text-[var(--color-text-dim)]">Explanation</span>
        <textarea
          value={question.explanation}
          onChange={(e) => onChange({ ...question, explanation: e.target.value })}
          rows={3}
          className="px-2 py-1.5 rounded border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm font-sans resize-y"
        />
      </label>

      <ScoringFields question={question} onChange={(q) => onChange(q as McMultiQuestion)} />
    </div>
  );
}
```

- [ ] **Step 3: Verify build**

```bash
npm run build 2>&1 | tail -8
```

- [ ] **Step 4: Commit**

```bash
git add components/builder/forms/McSingleForm.tsx components/builder/forms/McMultiForm.tsx
git commit -m "Add McSingleForm and McMultiForm builder components"
```

---

### Task 10: CategorizeForm + OrderForm

**Files:**
- Create: `components/builder/forms/CategorizeForm.tsx`
- Create: `components/builder/forms/OrderForm.tsx`

- [ ] **Step 1: Implement CategorizeForm**

`components/builder/forms/CategorizeForm.tsx`:
```tsx
"use client";
import type { CategorizeQuestion } from "@/lib/quiz-schema";
import { Trash2, Plus } from "lucide-react";
import { ScoringFields } from "../ScoringFields";

type Props = {
  question: CategorizeQuestion;
  onChange: (q: CategorizeQuestion) => void;
};

const inputCls =
  "px-2 py-1 rounded border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm";

export function CategorizeForm({ question, onChange }: Props) {
  function addBucket() {
    const newId = `${question.id}-bucket-${Date.now().toString(36)}`;
    onChange({
      ...question,
      buckets: [...question.buckets, { id: newId, label: "New bucket" }],
    });
  }
  function removeBucket(id: string) {
    if (question.buckets.length <= 1) return;
    const remainingFirst = question.buckets.find((b) => b.id !== id)?.id;
    onChange({
      ...question,
      buckets: question.buckets.filter((b) => b.id !== id),
      items: question.items.map((it) =>
        it.correctBucketId === id && remainingFirst
          ? { ...it, correctBucketId: remainingFirst }
          : it,
      ),
    });
  }

  function addItem() {
    const newId = `${question.id}-item-${Date.now().toString(36)}`;
    onChange({
      ...question,
      items: [
        ...question.items,
        { id: newId, label: "New item", correctBucketId: question.buckets[0].id },
      ],
    });
  }
  function removeItem(id: string) {
    if (question.items.length <= 1) return;
    onChange({
      ...question,
      items: question.items.filter((it) => it.id !== id),
    });
  }

  return (
    <div className="grid gap-3">
      <label className="grid gap-1 text-sm">
        <span className="text-xs uppercase tracking-wide text-[var(--color-text-dim)]">Prompt</span>
        <textarea
          value={question.prompt}
          onChange={(e) => onChange({ ...question, prompt: e.target.value })}
          rows={2}
          className="px-2 py-1.5 rounded border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm resize-y font-sans"
        />
      </label>

      <label className="grid gap-1 text-sm">
        <span className="text-xs uppercase tracking-wide text-[var(--color-text-dim)]">Image</span>
        <input
          type="text"
          value={question.image ?? ""}
          onChange={(e) => onChange({ ...question, image: e.target.value || undefined })}
          placeholder="URL or /quiz-images/... (optional)"
          className={inputCls}
        />
      </label>

      <fieldset className="grid gap-2">
        <legend className="text-xs uppercase tracking-wide text-[var(--color-text-dim)]">Buckets</legend>
        {question.buckets.map((b) => (
          <div key={b.id} className="grid grid-cols-[1fr,1fr,auto] gap-2 items-center">
            <input
              type="text"
              value={b.label}
              onChange={(e) =>
                onChange({
                  ...question,
                  buckets: question.buckets.map((x) =>
                    x.id === b.id ? { ...x, label: e.target.value } : x,
                  ),
                })
              }
              placeholder="Bucket label"
              className={inputCls}
            />
            <input
              type="text"
              value={b.thumbnail ?? ""}
              onChange={(e) =>
                onChange({
                  ...question,
                  buckets: question.buckets.map((x) =>
                    x.id === b.id ? { ...x, thumbnail: e.target.value || undefined } : x,
                  ),
                })
              }
              placeholder="Thumbnail URL (optional)"
              className={inputCls}
            />
            <button
              type="button"
              onClick={() => removeBucket(b.id)}
              disabled={question.buckets.length <= 1}
              className="p-1.5 rounded text-[var(--color-text-dim)] hover:text-[var(--color-incorrect)] disabled:opacity-40"
              aria-label="Remove bucket"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addBucket}
          className="self-start mt-1 px-2 py-1 text-xs rounded bg-[var(--color-surface-2)] hover:bg-[var(--color-border-2)] text-[var(--color-text)] flex items-center gap-1"
        >
          <Plus className="w-3 h-3" /> Add bucket
        </button>
      </fieldset>

      <fieldset className="grid gap-2">
        <legend className="text-xs uppercase tracking-wide text-[var(--color-text-dim)]">Items</legend>
        {question.items.map((it) => (
          <div key={it.id} className="grid grid-cols-[1fr,140px,1fr,auto] gap-2 items-center">
            <input
              type="text"
              value={it.label}
              onChange={(e) =>
                onChange({
                  ...question,
                  items: question.items.map((x) =>
                    x.id === it.id ? { ...x, label: e.target.value } : x,
                  ),
                })
              }
              placeholder="Item label"
              className={inputCls}
            />
            <select
              value={it.correctBucketId}
              onChange={(e) =>
                onChange({
                  ...question,
                  items: question.items.map((x) =>
                    x.id === it.id ? { ...x, correctBucketId: e.target.value } : x,
                  ),
                })
              }
              className={inputCls}
            >
              {question.buckets.map((b) => (
                <option key={b.id} value={b.id}>{b.label}</option>
              ))}
            </select>
            <input
              type="text"
              value={it.thumbnail ?? ""}
              onChange={(e) =>
                onChange({
                  ...question,
                  items: question.items.map((x) =>
                    x.id === it.id ? { ...x, thumbnail: e.target.value || undefined } : x,
                  ),
                })
              }
              placeholder="Thumbnail URL (optional)"
              className={inputCls}
            />
            <button
              type="button"
              onClick={() => removeItem(it.id)}
              disabled={question.items.length <= 1}
              className="p-1.5 rounded text-[var(--color-text-dim)] hover:text-[var(--color-incorrect)] disabled:opacity-40"
              aria-label="Remove item"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addItem}
          className="self-start mt-1 px-2 py-1 text-xs rounded bg-[var(--color-surface-2)] hover:bg-[var(--color-border-2)] text-[var(--color-text)] flex items-center gap-1"
        >
          <Plus className="w-3 h-3" /> Add item
        </button>
      </fieldset>

      <label className="grid gap-1 text-sm">
        <span className="text-xs uppercase tracking-wide text-[var(--color-text-dim)]">Explanation</span>
        <textarea
          value={question.explanation}
          onChange={(e) => onChange({ ...question, explanation: e.target.value })}
          rows={3}
          className="px-2 py-1.5 rounded border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm resize-y font-sans"
        />
      </label>

      <ScoringFields question={question} onChange={(q) => onChange(q as CategorizeQuestion)} />
    </div>
  );
}
```

- [ ] **Step 2: Implement OrderForm**

`components/builder/forms/OrderForm.tsx`:
```tsx
"use client";
import type { OrderQuestion } from "@/lib/quiz-schema";
import { Trash2, Plus, ArrowDown, ArrowRight } from "lucide-react";
import { ScoringFields } from "../ScoringFields";

type Props = {
  question: OrderQuestion;
  onChange: (q: OrderQuestion) => void;
};

const inputCls =
  "px-2 py-1 rounded border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm";

export function OrderForm({ question, onChange }: Props) {
  function addItem() {
    const newId = `${question.id}-item-${Date.now().toString(36)}`;
    onChange({
      ...question,
      items: [...question.items, { id: newId, label: "New item" }],
      correctOrder: [...question.correctOrder, newId],
    });
  }
  function removeItem(id: string) {
    if (question.items.length <= 2) return;
    onChange({
      ...question,
      items: question.items.filter((it) => it.id !== id),
      correctOrder: question.correctOrder.filter((cid) => cid !== id),
    });
  }
  function moveItem(id: string, dir: -1 | 1) {
    const idx = question.correctOrder.indexOf(id);
    const target = idx + dir;
    if (target < 0 || target >= question.correctOrder.length) return;
    const next = [...question.correctOrder];
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange({ ...question, correctOrder: next });
  }

  // Render in correctOrder order so the form mirrors the "answer".
  const orderedItems = question.correctOrder
    .map((id) => question.items.find((it) => it.id === id))
    .filter((x): x is NonNullable<typeof x> => x !== undefined);

  return (
    <div className="grid gap-3">
      <label className="grid gap-1 text-sm">
        <span className="text-xs uppercase tracking-wide text-[var(--color-text-dim)]">Prompt</span>
        <textarea
          value={question.prompt}
          onChange={(e) => onChange({ ...question, prompt: e.target.value })}
          rows={2}
          className="px-2 py-1.5 rounded border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm resize-y font-sans"
        />
      </label>

      <label className="grid gap-1 text-sm">
        <span className="text-xs uppercase tracking-wide text-[var(--color-text-dim)]">Image</span>
        <input
          type="text"
          value={question.image ?? ""}
          onChange={(e) => onChange({ ...question, image: e.target.value || undefined })}
          placeholder="URL or /quiz-images/... (optional)"
          className={inputCls}
        />
      </label>

      <div className="grid grid-cols-[1fr,1fr,1fr] gap-3">
        <label className="grid gap-1 text-sm">
          <span className="text-xs uppercase tracking-wide text-[var(--color-text-dim)]">Axis</span>
          <select
            value={question.axis}
            onChange={(e) => onChange({ ...question, axis: e.target.value as "horizontal" | "vertical" })}
            className={inputCls}
          >
            <option value="vertical">Vertical (top → bottom)</option>
            <option value="horizontal">Horizontal (left → right)</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-xs uppercase tracking-wide text-[var(--color-text-dim)]">Start label</span>
          <input
            type="text"
            value={question.startLabel}
            onChange={(e) => onChange({ ...question, startLabel: e.target.value })}
            className={inputCls}
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-xs uppercase tracking-wide text-[var(--color-text-dim)]">End label</span>
          <input
            type="text"
            value={question.endLabel}
            onChange={(e) => onChange({ ...question, endLabel: e.target.value })}
            className={inputCls}
          />
        </label>
      </div>

      <fieldset className="grid gap-2">
        <legend className="text-xs uppercase tracking-wide text-[var(--color-text-dim)] flex items-center gap-1">
          Items in correct order {question.axis === "vertical" ? <ArrowDown className="w-3 h-3" /> : <ArrowRight className="w-3 h-3" />}
        </legend>
        {orderedItems.map((it, i) => (
          <div key={it.id} className="grid grid-cols-[auto,1fr,1fr,auto,auto,auto] gap-2 items-center">
            <span className="font-mono text-xs text-[var(--color-text-dim)] w-6 text-right">#{i + 1}</span>
            <input
              type="text"
              value={it.label}
              onChange={(e) =>
                onChange({
                  ...question,
                  items: question.items.map((x) =>
                    x.id === it.id ? { ...x, label: e.target.value } : x,
                  ),
                })
              }
              placeholder="Item label"
              className={inputCls}
            />
            <input
              type="text"
              value={it.thumbnail ?? ""}
              onChange={(e) =>
                onChange({
                  ...question,
                  items: question.items.map((x) =>
                    x.id === it.id ? { ...x, thumbnail: e.target.value || undefined } : x,
                  ),
                })
              }
              placeholder="Thumbnail URL (optional)"
              className={inputCls}
            />
            <button
              type="button"
              onClick={() => moveItem(it.id, -1)}
              disabled={i === 0}
              className="p-1 text-[var(--color-text-dim)] hover:text-[var(--color-text)] disabled:opacity-30"
              aria-label="Move up"
            >
              ↑
            </button>
            <button
              type="button"
              onClick={() => moveItem(it.id, 1)}
              disabled={i === orderedItems.length - 1}
              className="p-1 text-[var(--color-text-dim)] hover:text-[var(--color-text)] disabled:opacity-30"
              aria-label="Move down"
            >
              ↓
            </button>
            <button
              type="button"
              onClick={() => removeItem(it.id)}
              disabled={question.items.length <= 2}
              className="p-1.5 rounded text-[var(--color-text-dim)] hover:text-[var(--color-incorrect)] disabled:opacity-40"
              aria-label="Remove item"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addItem}
          className="self-start mt-1 px-2 py-1 text-xs rounded bg-[var(--color-surface-2)] hover:bg-[var(--color-border-2)] text-[var(--color-text)] flex items-center gap-1"
        >
          <Plus className="w-3 h-3" /> Add item
        </button>
      </fieldset>

      <label className="grid gap-1 text-sm">
        <span className="text-xs uppercase tracking-wide text-[var(--color-text-dim)]">Explanation</span>
        <textarea
          value={question.explanation}
          onChange={(e) => onChange({ ...question, explanation: e.target.value })}
          rows={3}
          className="px-2 py-1.5 rounded border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm resize-y font-sans"
        />
      </label>

      <ScoringFields question={question} onChange={(q) => onChange(q as OrderQuestion)} />
    </div>
  );
}
```

- [ ] **Step 3: Verify build**

```bash
npm run build 2>&1 | tail -8
```

- [ ] **Step 4: Commit**

```bash
git add components/builder/forms/CategorizeForm.tsx components/builder/forms/OrderForm.tsx
git commit -m "Add CategorizeForm and OrderForm builder components"
```

---

### Task 11: SliderForm + NameForm

**Files:**
- Create: `components/builder/forms/SliderForm.tsx`
- Create: `components/builder/forms/NameForm.tsx`

- [ ] **Step 1: Implement SliderForm**

`components/builder/forms/SliderForm.tsx`:
```tsx
"use client";
import type { SliderQuestion } from "@/lib/quiz-schema";
import { ScoringFields } from "../ScoringFields";

type Props = {
  question: SliderQuestion;
  onChange: (q: SliderQuestion) => void;
};

const inputCls =
  "px-2 py-1 rounded border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm";

export function SliderForm({ question, onChange }: Props) {
  return (
    <div className="grid gap-3">
      <label className="grid gap-1 text-sm">
        <span className="text-xs uppercase tracking-wide text-[var(--color-text-dim)]">Prompt</span>
        <textarea
          value={question.prompt}
          onChange={(e) => onChange({ ...question, prompt: e.target.value })}
          rows={2}
          className="px-2 py-1.5 rounded border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm resize-y font-sans"
        />
      </label>

      <label className="grid gap-1 text-sm">
        <span className="text-xs uppercase tracking-wide text-[var(--color-text-dim)]">Image</span>
        <input
          type="text"
          value={question.image ?? ""}
          onChange={(e) => onChange({ ...question, image: e.target.value || undefined })}
          placeholder="URL or /quiz-images/... (optional)"
          className={inputCls}
        />
      </label>

      <div className="grid grid-cols-4 gap-3">
        <label className="grid gap-1 text-sm">
          <span className="text-xs uppercase tracking-wide text-[var(--color-text-dim)]">Min</span>
          <input
            type="number"
            value={question.min}
            onChange={(e) => onChange({ ...question, min: parseInt(e.target.value) })}
            className={inputCls}
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-xs uppercase tracking-wide text-[var(--color-text-dim)]">Max</span>
          <input
            type="number"
            value={question.max}
            onChange={(e) => onChange({ ...question, max: parseInt(e.target.value) })}
            className={inputCls}
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-xs uppercase tracking-wide text-[var(--color-text-dim)]">Step</span>
          <input
            type="number"
            value={question.step}
            min={1}
            onChange={(e) => onChange({ ...question, step: parseInt(e.target.value) || 1 })}
            className={inputCls}
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-xs uppercase tracking-wide text-[var(--color-text-dim)]">Correct value</span>
          <input
            type="number"
            value={question.correctValue}
            onChange={(e) => onChange({ ...question, correctValue: parseInt(e.target.value) })}
            className={inputCls}
          />
        </label>
      </div>

      <label className="grid gap-1 text-sm">
        <span className="text-xs uppercase tracking-wide text-[var(--color-text-dim)]">Explanation</span>
        <textarea
          value={question.explanation}
          onChange={(e) => onChange({ ...question, explanation: e.target.value })}
          rows={3}
          className="px-2 py-1.5 rounded border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm resize-y font-sans"
        />
      </label>

      <ScoringFields question={question} onChange={(q) => onChange(q as SliderQuestion)} />
    </div>
  );
}
```

- [ ] **Step 2: Implement NameForm**

`components/builder/forms/NameForm.tsx`:
```tsx
"use client";
import type { NameQuestion } from "@/lib/quiz-schema";
import { Trash2, Plus } from "lucide-react";
import { ScoringFields } from "../ScoringFields";

type Props = {
  question: NameQuestion;
  onChange: (q: NameQuestion) => void;
};

const inputCls =
  "px-2 py-1 rounded border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm";

export function NameForm({ question, onChange }: Props) {
  function setAnswer(idx: number, value: string) {
    const next = [...question.acceptedAnswers];
    next[idx] = value;
    onChange({ ...question, acceptedAnswers: next });
  }
  function addAnswer() {
    onChange({ ...question, acceptedAnswers: [...question.acceptedAnswers, ""] });
  }
  function removeAnswer(idx: number) {
    if (question.acceptedAnswers.length <= 1) return;
    onChange({
      ...question,
      acceptedAnswers: question.acceptedAnswers.filter((_, i) => i !== idx),
    });
  }

  return (
    <div className="grid gap-3">
      <label className="grid gap-1 text-sm">
        <span className="text-xs uppercase tracking-wide text-[var(--color-text-dim)]">Prompt</span>
        <textarea
          value={question.prompt}
          onChange={(e) => onChange({ ...question, prompt: e.target.value })}
          rows={2}
          className="px-2 py-1.5 rounded border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm resize-y font-sans"
        />
      </label>

      <label className="grid gap-1 text-sm">
        <span className="text-xs uppercase tracking-wide text-[var(--color-text-dim)]">Image</span>
        <input
          type="text"
          value={question.image ?? ""}
          onChange={(e) => onChange({ ...question, image: e.target.value || undefined })}
          placeholder="URL or /quiz-images/... (optional)"
          className={inputCls}
        />
      </label>

      <fieldset className="grid gap-2">
        <legend className="text-xs uppercase tracking-wide text-[var(--color-text-dim)]">
          Accepted answers (case-insensitive substring match)
        </legend>
        {question.acceptedAnswers.map((a, i) => (
          <div key={i} className="grid grid-cols-[1fr,auto] gap-2 items-center">
            <input
              type="text"
              value={a}
              onChange={(e) => setAnswer(i, e.target.value)}
              placeholder="e.g., Itachi Uchiha"
              className={inputCls}
            />
            <button
              type="button"
              onClick={() => removeAnswer(i)}
              disabled={question.acceptedAnswers.length <= 1}
              className="p-1.5 rounded text-[var(--color-text-dim)] hover:text-[var(--color-incorrect)] disabled:opacity-40"
              aria-label="Remove answer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addAnswer}
          className="self-start mt-1 px-2 py-1 text-xs rounded bg-[var(--color-surface-2)] hover:bg-[var(--color-border-2)] text-[var(--color-text)] flex items-center gap-1"
        >
          <Plus className="w-3 h-3" /> Add accepted answer
        </button>
      </fieldset>

      <label className="grid gap-1 text-sm">
        <span className="text-xs uppercase tracking-wide text-[var(--color-text-dim)]">Explanation</span>
        <textarea
          value={question.explanation}
          onChange={(e) => onChange({ ...question, explanation: e.target.value })}
          rows={3}
          className="px-2 py-1.5 rounded border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm resize-y font-sans"
        />
      </label>

      <ScoringFields question={question} onChange={(q) => onChange(q as NameQuestion)} />
    </div>
  );
}
```

- [ ] **Step 3: Verify build**

```bash
npm run build 2>&1 | tail -8
```

- [ ] **Step 4: Commit**

```bash
git add components/builder/forms/SliderForm.tsx components/builder/forms/NameForm.tsx
git commit -m "Add SliderForm and NameForm builder components"
```

---

### Task 12: QuestionCard, AddQuestionPopover

**Files:**
- Create: `components/builder/QuestionCard.tsx`
- Create: `components/builder/AddQuestionPopover.tsx`

- [ ] **Step 1: Implement QuestionCard**

`components/builder/QuestionCard.tsx`:
```tsx
"use client";
import { useState } from "react";
import type { Question } from "@/lib/quiz-schema";
import { ChevronDown, ChevronRight, Copy, Trash2, GripVertical } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { McSingleForm } from "./forms/McSingleForm";
import { McMultiForm } from "./forms/McMultiForm";
import { CategorizeForm } from "./forms/CategorizeForm";
import { OrderForm } from "./forms/OrderForm";
import { SliderForm } from "./forms/SliderForm";
import { NameForm } from "./forms/NameForm";
import { cn } from "@/lib/utils";

type Props = {
  question: Question;
  index: number;
  isSelected: boolean;
  onChange: (q: Question) => void;
  onSelect: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
};

const TYPE_LABEL: Record<Question["type"], string> = {
  "mc-single": "MC single",
  "mc-multi": "MC multi",
  categorize: "Categorize",
  order: "Order",
  slider: "Slider",
  name: "Name",
};

export function QuestionCard({
  question,
  index,
  isSelected,
  onChange,
  onSelect,
  onDuplicate,
  onDelete,
}: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: question.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onSelect}
      className={cn(
        "rounded-lg border bg-[var(--color-surface)] transition-colors cursor-pointer",
        isSelected ? "border-[var(--color-accent)]" : "border-[var(--color-border)]",
        isDragging && "opacity-60",
      )}
    >
      <div className="flex items-center gap-2 p-3 border-b border-[var(--color-border)]">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-[var(--color-text-dim)] hover:text-[var(--color-text)]"
          aria-label="Drag to reorder"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setCollapsed((c) => !c);
          }}
          className="text-[var(--color-text-dim)] hover:text-[var(--color-text)]"
          aria-label={collapsed ? "Expand" : "Collapse"}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        <span className="font-mono text-xs text-[var(--color-text-dim)]">#{index + 1}</span>
        <span className="text-xs uppercase tracking-wide px-2 py-0.5 rounded bg-[var(--color-surface-2)] text-[var(--color-text-dim)]">
          {TYPE_LABEL[question.type]}
        </span>
        <span className="text-sm text-[var(--color-text)] truncate flex-1">
          {question.prompt || <span className="italic text-[var(--color-text-dim)]">untitled question</span>}
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDuplicate();
          }}
          className="p-1.5 rounded text-[var(--color-text-dim)] hover:text-[var(--color-text)]"
          aria-label="Duplicate question"
        >
          <Copy className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (confirm("Delete this question?")) onDelete();
          }}
          className="p-1.5 rounded text-[var(--color-text-dim)] hover:text-[var(--color-incorrect)]"
          aria-label="Delete question"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {!collapsed && (
        <div className="p-3" onClick={(e) => e.stopPropagation()}>
          <Form question={question} onChange={onChange} />
        </div>
      )}
    </div>
  );
}

function Form({
  question,
  onChange,
}: {
  question: Question;
  onChange: (q: Question) => void;
}) {
  switch (question.type) {
    case "mc-single":
      return <McSingleForm question={question} onChange={onChange} />;
    case "mc-multi":
      return <McMultiForm question={question} onChange={onChange} />;
    case "categorize":
      return <CategorizeForm question={question} onChange={onChange} />;
    case "order":
      return <OrderForm question={question} onChange={onChange} />;
    case "slider":
      return <SliderForm question={question} onChange={onChange} />;
    case "name":
      return <NameForm question={question} onChange={onChange} />;
  }
}
```

- [ ] **Step 2: Implement AddQuestionPopover**

`components/builder/AddQuestionPopover.tsx`:
```tsx
"use client";
import { useState } from "react";
import type { Question } from "@/lib/quiz-schema";
import { Plus, ListChecks, ListPlus, Layers, ArrowDown, Sliders, Type } from "lucide-react";

type QuestionType = Question["type"];

const TYPES: { type: QuestionType; label: string; icon: React.ElementType; desc: string }[] = [
  { type: "mc-single", label: "MC single", icon: ListChecks, desc: "Pick one correct option" },
  { type: "mc-multi", label: "MC multi", icon: ListPlus, desc: "Pick all that apply" },
  { type: "categorize", label: "Categorize", icon: Layers, desc: "Drag items into buckets" },
  { type: "order", label: "Order", icon: ArrowDown, desc: "Sort items along an axis" },
  { type: "slider", label: "Slider", icon: Sliders, desc: "Pick a number on a range" },
  { type: "name", label: "Name", icon: Type, desc: "Type a name with autocomplete" },
];

export function AddQuestionPopover({
  onAdd,
}: {
  onAdd: (type: QuestionType) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="px-3 py-2 rounded bg-[var(--color-accent)] hover:bg-[var(--color-accent)]/90 text-white text-sm flex items-center gap-2"
      >
        <Plus className="w-4 h-4" /> Add question
      </button>
      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <div className="absolute z-20 mt-2 w-72 rounded-md border border-[var(--color-border-2)] bg-[var(--color-surface)] shadow-2xl p-1">
            {TYPES.map(({ type, label, icon: Icon, desc }) => (
              <button
                key={type}
                type="button"
                onClick={() => {
                  onAdd(type);
                  setOpen(false);
                }}
                className="w-full flex items-start gap-3 p-2 rounded hover:bg-[var(--color-surface-2)] text-left"
              >
                <Icon className="w-4 h-4 mt-1 text-[var(--color-accent)]" />
                <div>
                  <p className="text-sm text-[var(--color-text)]">{label}</p>
                  <p className="text-xs text-[var(--color-text-dim)]">{desc}</p>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Verify build**

```bash
npm run build 2>&1 | tail -8
```

- [ ] **Step 4: Commit**

```bash
git add components/builder/QuestionCard.tsx components/builder/AddQuestionPopover.tsx
git commit -m "Add QuestionCard (sortable, collapsible) and AddQuestionPopover"
```

---

### Task 13: EditorHeader, BottomBar, DraftBanner

**Files:**
- Create: `components/builder/EditorHeader.tsx`
- Create: `components/builder/BottomBar.tsx`
- Create: `components/builder/DraftBanner.tsx`

- [ ] **Step 1: Implement EditorHeader**

`components/builder/EditorHeader.tsx`:
```tsx
"use client";
import { useState, useEffect } from "react";
import type { Quiz } from "@/lib/quiz-schema";
import { slugify } from "@/lib/builder/slugify";
import { Edit2 } from "lucide-react";

type Props = {
  quiz: Quiz;
  onTitleChange: (title: string) => void;
  onSlugChange: (slug: string) => void;
  onDescriptionChange: (description: string | undefined) => void;
  onCoverImageChange: (coverImage: string | undefined) => void;
};

const inputCls =
  "px-3 py-2 rounded border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm w-full";

export function EditorHeader({
  quiz,
  onTitleChange,
  onSlugChange,
  onDescriptionChange,
  onCoverImageChange,
}: Props) {
  const [autoSlug, setAutoSlug] = useState(true);

  // When auto is on, recompute slug from title.
  useEffect(() => {
    if (autoSlug) {
      const next = slugify(quiz.title);
      if (next !== quiz.slug) onSlugChange(next);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quiz.title, autoSlug]);

  return (
    <div className="grid gap-3 p-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
      <label className="grid gap-1">
        <span className="text-xs uppercase tracking-wide text-[var(--color-text-dim)]">Title</span>
        <input
          type="text"
          value={quiz.title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Naruto Knowledge — Sample Quiz"
          className={`${inputCls} text-lg`}
        />
      </label>

      <label className="grid gap-1">
        <span className="text-xs uppercase tracking-wide text-[var(--color-text-dim)] flex items-center gap-2">
          Slug
          <button
            type="button"
            onClick={() => setAutoSlug((a) => !a)}
            className="text-[var(--color-accent)] hover:underline normal-case tracking-normal"
          >
            <Edit2 className="w-3 h-3 inline mr-1" />
            {autoSlug ? "auto from title" : "manual"}
          </button>
        </span>
        <input
          type="text"
          value={quiz.slug}
          onChange={(e) => {
            setAutoSlug(false);
            onSlugChange(e.target.value);
          }}
          placeholder="kebab-case-slug"
          disabled={autoSlug}
          className={`${inputCls} font-mono ${autoSlug ? "opacity-60" : ""}`}
        />
      </label>

      <label className="grid gap-1">
        <span className="text-xs uppercase tracking-wide text-[var(--color-text-dim)]">Description (optional)</span>
        <textarea
          value={quiz.description ?? ""}
          onChange={(e) => onDescriptionChange(e.target.value || undefined)}
          rows={2}
          className={`${inputCls} resize-y font-sans`}
        />
      </label>

      <label className="grid gap-1">
        <span className="text-xs uppercase tracking-wide text-[var(--color-text-dim)]">Cover image (optional)</span>
        <input
          type="text"
          value={quiz.coverImage ?? ""}
          onChange={(e) => onCoverImageChange(e.target.value || undefined)}
          placeholder="URL or /quiz-images/..."
          className={inputCls}
        />
      </label>
    </div>
  );
}
```

- [ ] **Step 2: Implement BottomBar**

`components/builder/BottomBar.tsx`:
```tsx
"use client";
import { useState } from "react";
import type { ZodIssue } from "zod";
import { Check, AlertCircle, Download, Trash2 } from "lucide-react";

type Props = {
  validation: ZodIssue[];
  isDirty: boolean;
  hasDraft: boolean;
  onDownload: () => void;
  onDiscardDraft: () => void;
};

export function BottomBar({
  validation,
  isDirty,
  hasDraft,
  onDownload,
  onDiscardDraft,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const valid = validation.length === 0;

  return (
    <div className="sticky bottom-0 bg-[var(--color-bg)]/90 backdrop-blur border-t border-[var(--color-border)] p-3">
      <div className="flex items-center gap-3">
        {valid ? (
          <span className="flex items-center gap-2 text-[var(--color-correct)] text-sm">
            <Check className="w-4 h-4" /> Valid
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            className="flex items-center gap-2 text-[var(--color-incorrect)] text-sm hover:underline"
          >
            <AlertCircle className="w-4 h-4" />
            {validation.length} {validation.length === 1 ? "issue" : "issues"}
          </button>
        )}
        {isDirty && (
          <span className="text-xs text-[var(--color-text-dim)]">Unsaved changes</span>
        )}
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={onDiscardDraft}
            disabled={!hasDraft}
            className="px-3 py-2 rounded text-sm text-[var(--color-text-dim)] hover:text-[var(--color-incorrect)] disabled:opacity-40 flex items-center gap-1.5"
          >
            <Trash2 className="w-4 h-4" /> Discard draft
          </button>
          <button
            type="button"
            onClick={onDownload}
            disabled={!valid}
            className="px-4 py-2 rounded bg-[var(--color-accent)] hover:bg-[var(--color-accent)]/90 text-white text-sm font-medium disabled:opacity-40 flex items-center gap-2"
          >
            <Download className="w-4 h-4" /> Download JSON
          </button>
        </div>
      </div>

      {expanded && !valid && (
        <ul className="mt-3 text-xs grid gap-1 max-h-40 overflow-auto">
          {validation.map((issue, i) => (
            <li key={i} className="text-[var(--color-incorrect)] font-mono">
              <span className="text-[var(--color-text-dim)]">{issue.path.join(".") || "(root)"}:</span>{" "}
              {issue.message}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Implement DraftBanner**

`components/builder/DraftBanner.tsx`:
```tsx
"use client";
import { Clock } from "lucide-react";

type Props = {
  savedAt: string;
  onUseDraft: () => void;
  onDiscard: () => void;
};

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const sec = Math.floor((now - then) / 1000);
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} min ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} hr ago`;
  const day = Math.floor(hr / 24);
  return `${day} day${day === 1 ? "" : "s"} ago`;
}

export function DraftBanner({ savedAt, onUseDraft, onDiscard }: Props) {
  return (
    <div className="p-3 rounded-md border border-[var(--color-accent)] bg-[var(--color-accent)]/10 flex items-center gap-3 mb-3">
      <Clock className="w-4 h-4 text-[var(--color-accent)] shrink-0" />
      <p className="text-sm text-[var(--color-text)] flex-1">
        Local draft from <strong>{relativeTime(savedAt)}</strong>. Use it or discard?
      </p>
      <button
        type="button"
        onClick={onUseDraft}
        className="px-3 py-1 rounded bg-[var(--color-accent)] text-white text-xs"
      >
        Use draft
      </button>
      <button
        type="button"
        onClick={onDiscard}
        className="px-3 py-1 rounded border border-[var(--color-border-2)] text-xs text-[var(--color-text)]"
      >
        Discard
      </button>
    </div>
  );
}
```

- [ ] **Step 4: Verify build**

```bash
npm run build 2>&1 | tail -8
```

- [ ] **Step 5: Commit**

```bash
git add components/builder/EditorHeader.tsx components/builder/BottomBar.tsx components/builder/DraftBanner.tsx
git commit -m "Add EditorHeader, BottomBar, and DraftBanner builder shell components"
```

---

### Task 14: PreviewPane

**Files:**
- Create: `components/builder/PreviewPane.tsx`

- [ ] **Step 1: Implement**

`components/builder/PreviewPane.tsx`:
```tsx
"use client";
import { useState } from "react";
import type { Question } from "@/lib/quiz-schema";
import type { AnswerState } from "@/lib/player-reducer";
import type { AnswerValue } from "@/lib/scoring";
import { QuestionFrame } from "@/components/quiz/QuestionFrame";
import { ChevronLeft, ChevronRight, Eye, EyeOff } from "lucide-react";
import { scoreQuestion } from "@/lib/scoring";

type Props = {
  questions: Question[];
  selectedIndex: number;
  onSelectIndex: (i: number) => void;
};

function fmt(n: number) {
  return Number.isInteger(n) ? n.toString() : n.toFixed(2).replace(/\.?0+$/, "");
}

export function PreviewPane({ questions, selectedIndex, onSelectIndex }: Props) {
  const [interactive, setInteractive] = useState(false);
  const [answer, setAnswer] = useState<AnswerValue | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const question = questions[selectedIndex];

  // Reset preview answer when navigating between questions.
  function jump(delta: number) {
    const next = Math.min(Math.max(0, selectedIndex + delta), questions.length - 1);
    onSelectIndex(next);
    setAnswer(null);
    setConfirmed(false);
  }

  if (!question) {
    return (
      <div className="p-6 text-center text-[var(--color-text-dim)] border-l border-[var(--color-border)]">
        <p>No questions yet — add one to preview.</p>
      </div>
    );
  }

  // Compose an AnswerState for QuestionFrame.
  let state: AnswerState = { status: "unanswered" };
  if (interactive && answer !== null) {
    if (confirmed) {
      const result = scoreQuestion(question, answer);
      state = { status: "confirmed", value: answer, result, correct: result.points === result.maxPoints };
    } else {
      state = { status: "draft", value: answer };
    }
  }

  // Show example score outcomes for this question's scoring config.
  const exampleOutcomes = generateExampleOutcomes(question);

  return (
    <div className="border-l border-[var(--color-border)] flex flex-col h-full overflow-hidden">
      <div className="flex items-center gap-2 p-3 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        <button
          type="button"
          onClick={() => jump(-1)}
          disabled={selectedIndex <= 0}
          className="p-1 rounded text-[var(--color-text-dim)] hover:text-[var(--color-text)] disabled:opacity-30"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-xs text-[var(--color-text-dim)]">
          Preview — {selectedIndex + 1} of {questions.length}
        </span>
        <button
          type="button"
          onClick={() => jump(1)}
          disabled={selectedIndex >= questions.length - 1}
          className="p-1 rounded text-[var(--color-text-dim)] hover:text-[var(--color-text)] disabled:opacity-30"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => {
            setInteractive((i) => !i);
            setAnswer(null);
            setConfirmed(false);
          }}
          className="ml-auto px-2 py-1 rounded text-xs flex items-center gap-1 bg-[var(--color-surface-2)] hover:bg-[var(--color-border-2)] text-[var(--color-text)]"
        >
          {interactive ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
          {interactive ? "Static" : "Try interactions"}
        </button>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <QuestionFrame
          question={question}
          state={state}
          onChange={(v) => {
            if (interactive) setAnswer(v);
          }}
        />
        {interactive && answer !== null && !confirmed && (
          <button
            type="button"
            onClick={() => setConfirmed(true)}
            className="mt-3 px-4 py-2 rounded bg-[var(--color-accent)] text-white text-sm"
          >
            Confirm (preview)
          </button>
        )}
      </div>

      <div className="p-3 border-t border-[var(--color-border)] bg-[var(--color-surface)]">
        <p className="text-xs uppercase tracking-wide text-[var(--color-text-dim)] mb-2">
          Scoring outcomes
        </p>
        <ul className="grid gap-1 text-xs">
          {exampleOutcomes.map((o, i) => (
            <li key={i} className="font-mono text-[var(--color-text-dim)]">
              <span className="text-[var(--color-text)]">{o.label}:</span> {fmt(o.points)} / {fmt(o.maxPoints)}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function generateExampleOutcomes(q: Question): { label: string; points: number; maxPoints: number }[] {
  const out: { label: string; points: number; maxPoints: number }[] = [];
  switch (q.type) {
    case "mc-single": {
      out.push({ label: "Correct answer", ...scoreQuestion(q, q.correctId) });
      const wrong = q.options.find((o) => o.id !== q.correctId);
      if (wrong) out.push({ label: "Wrong answer", ...scoreQuestion(q, wrong.id) });
      break;
    }
    case "mc-multi": {
      out.push({ label: "All correct", ...scoreQuestion(q, q.correctIds) });
      out.push({ label: "Half correct picks", ...scoreQuestion(q, q.correctIds.slice(0, Math.ceil(q.correctIds.length / 2))) });
      out.push({ label: "None selected", ...scoreQuestion(q, []) });
      break;
    }
    case "categorize": {
      const allCorrect: Record<string, string> = {};
      for (const it of q.items) allCorrect[it.id] = it.correctBucketId;
      const halfCorrect: Record<string, string> = {};
      const half = Math.ceil(q.items.length / 2);
      for (let i = 0; i < q.items.length; i++) {
        if (i < half) halfCorrect[q.items[i].id] = q.items[i].correctBucketId;
      }
      out.push({ label: "All placed correctly", ...scoreQuestion(q, allCorrect) });
      out.push({ label: `${half} of ${q.items.length} correct`, ...scoreQuestion(q, halfCorrect) });
      out.push({ label: "None placed", ...scoreQuestion(q, {}) });
      break;
    }
    case "order": {
      out.push({ label: "Correct order", ...scoreQuestion(q, q.correctOrder) });
      const reversed = [...q.correctOrder].reverse();
      out.push({ label: "Reversed", ...scoreQuestion(q, reversed) });
      break;
    }
    case "slider": {
      out.push({ label: `Exact (${q.correctValue})`, ...scoreQuestion(q, q.correctValue) });
      if (q.scoring?.scheme === "tolerance") {
        const tol = q.scoring.tolerance ?? 1;
        const within = q.correctValue + tol;
        if (within <= q.max) out.push({ label: `Within tolerance (${within})`, ...scoreQuestion(q, within) });
      }
      const farOff = q.correctValue + (q.scoring?.tolerance ?? 1) + 1;
      if (farOff <= q.max) out.push({ label: `Off by ${(q.scoring?.tolerance ?? 0) + 1}`, ...scoreQuestion(q, farOff) });
      break;
    }
    case "name": {
      out.push({ label: "Correct name", ...scoreQuestion(q, q.acceptedAnswers[0]) });
      out.push({ label: "Wrong name", ...scoreQuestion(q, "Definitely Not Right") });
      break;
    }
  }
  return out;
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build 2>&1 | tail -8
```

- [ ] **Step 3: Commit**

```bash
git add components/builder/PreviewPane.tsx
git commit -m "Add PreviewPane with live <QuestionFrame> mirror and scoring outcome examples"
```

---

### Task 15: QuestionList + QuizEditor (top-level)

**Files:**
- Create: `components/builder/QuestionList.tsx`
- Create: `components/builder/QuizEditor.tsx`

- [ ] **Step 1: Implement QuestionList**

`components/builder/QuestionList.tsx`:
```tsx
"use client";
import type { Question } from "@/lib/quiz-schema";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { QuestionCard } from "./QuestionCard";

type Props = {
  questions: Question[];
  selectedQuestionId: string | null;
  onSelect: (id: string) => void;
  onUpdate: (q: Question) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onReorder: (ids: string[]) => void;
};

export function QuestionList({
  questions,
  selectedQuestionId,
  onSelect,
  onUpdate,
  onDuplicate,
  onDelete,
  onReorder,
}: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIdx = questions.findIndex((q) => q.id === active.id);
    const newIdx = questions.findIndex((q) => q.id === over.id);
    if (oldIdx === -1 || newIdx === -1) return;
    const reordered = arrayMove(questions, oldIdx, newIdx);
    onReorder(reordered.map((q) => q.id));
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={questions.map((q) => q.id)} strategy={verticalListSortingStrategy}>
        <div className="grid gap-2">
          {questions.map((q, i) => (
            <QuestionCard
              key={q.id}
              question={q}
              index={i}
              isSelected={selectedQuestionId === q.id}
              onChange={onUpdate}
              onSelect={() => onSelect(q.id)}
              onDuplicate={() => onDuplicate(q.id)}
              onDelete={() => onDelete(q.id)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
```

- [ ] **Step 2: Implement QuizEditor**

`components/builder/QuizEditor.tsx`:
```tsx
"use client";
import { useEffect, useReducer, useRef } from "react";
import type { Quiz } from "@/lib/quiz-schema";
import {
  initialEditorState,
  editorReducer,
} from "@/lib/builder/editor-reducer";
import {
  loadDraft,
  saveDraft,
  deleteDraft,
} from "@/lib/builder/drafts-storage";
import { downloadQuiz } from "@/lib/builder/download-quiz";
import { EditorHeader } from "./EditorHeader";
import { QuestionList } from "./QuestionList";
import { AddQuestionPopover } from "./AddQuestionPopover";
import { PreviewPane } from "./PreviewPane";
import { BottomBar } from "./BottomBar";
import { DraftBanner } from "./DraftBanner";

const BLANK_QUIZ: Quiz = {
  slug: "new-quiz",
  title: "New quiz",
  questions: [],
};

export function QuizEditor({ initialQuiz }: { initialQuiz?: Quiz }) {
  const seed = initialQuiz ?? BLANK_QUIZ;
  const [state, dispatch] = useReducer(editorReducer, seed, initialEditorState);
  const initialDraftCheckedRef = useRef(false);

  // On mount: check for an existing draft for this slug.
  useEffect(() => {
    if (initialDraftCheckedRef.current) return;
    initialDraftCheckedRef.current = true;
    const draft = loadDraft(seed.slug);
    if (draft && JSON.stringify(draft.quiz) !== JSON.stringify(seed)) {
      // Stash the draft so the user can choose; we don't auto-load.
      dispatch({ type: "loadDraft", draft });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Autosave to localStorage on every change (debounced).
  useEffect(() => {
    if (!state.isDirty) return;
    const t = setTimeout(() => {
      saveDraft(state.quiz.slug, state.quiz);
    }, 500);
    return () => clearTimeout(t);
  }, [state.quiz, state.isDirty]);

  // Warn before unload if dirty.
  useEffect(() => {
    if (!state.isDirty) return;
    function onBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [state.isDirty]);

  function handleDownload() {
    downloadQuiz(state.quiz);
    deleteDraft(state.quiz.slug);
    dispatch({ type: "markClean" });
  }

  function handleDiscardDraft() {
    deleteDraft(state.quiz.slug);
    dispatch({ type: "reset", quiz: seed });
  }

  const selectedIndex = state.selectedQuestionId
    ? state.quiz.questions.findIndex((q) => q.id === state.selectedQuestionId)
    : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr,1fr] gap-0 h-[calc(100vh-5rem)]">
      <div className="overflow-auto p-4 grid gap-4 content-start">
        {state.draftLoadedAt && (
          <DraftBanner
            savedAt={state.draftLoadedAt}
            onUseDraft={() => dispatch({ type: "discardDraft" })}
            onDiscard={() => {
              deleteDraft(state.quiz.slug);
              dispatch({ type: "reset", quiz: seed });
            }}
          />
        )}

        <EditorHeader
          quiz={state.quiz}
          onTitleChange={(title) => dispatch({ type: "setTitle", title })}
          onSlugChange={(slug) => dispatch({ type: "setSlug", slug })}
          onDescriptionChange={(description) => dispatch({ type: "setDescription", description })}
          onCoverImageChange={(coverImage) => dispatch({ type: "setCoverImage", coverImage })}
        />

        <div className="grid gap-2">
          <h2 className="text-xs uppercase tracking-wide text-[var(--color-text-dim)]">Questions</h2>
          <QuestionList
            questions={state.quiz.questions}
            selectedQuestionId={state.selectedQuestionId}
            onSelect={(id) => dispatch({ type: "selectQuestion", id })}
            onUpdate={(q) => dispatch({ type: "updateQuestion", question: q })}
            onDuplicate={(id) => dispatch({ type: "duplicateQuestion", id })}
            onDelete={(id) => dispatch({ type: "removeQuestion", id })}
            onReorder={(ids) => dispatch({ type: "reorderQuestions", ids })}
          />
          <AddQuestionPopover
            onAdd={(questionType) => dispatch({ type: "addQuestion", questionType })}
          />
        </div>

        <BottomBar
          validation={state.validation}
          isDirty={state.isDirty}
          hasDraft={state.draftLoadedAt !== null}
          onDownload={handleDownload}
          onDiscardDraft={handleDiscardDraft}
        />
      </div>

      <div className="hidden lg:block">
        <PreviewPane
          questions={state.quiz.questions}
          selectedIndex={selectedIndex >= 0 ? selectedIndex : 0}
          onSelectIndex={(i) => {
            const q = state.quiz.questions[i];
            if (q) dispatch({ type: "selectQuestion", id: q.id });
          }}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify build**

```bash
npm run build 2>&1 | tail -8
```

- [ ] **Step 4: Commit**

```bash
git add components/builder/QuestionList.tsx components/builder/QuizEditor.tsx
git commit -m "Add QuestionList and QuizEditor top-level orchestrator"
```

---

### Task 16: Wire up `/builder` and `/manager/[slug]` routes

**Files:**
- Modify: `app/builder/page.tsx`
- Create: `app/manager/[slug]/page.tsx`

- [ ] **Step 1: Update `app/builder/page.tsx`**

Replace its contents:
```tsx
import Link from "next/link";
import { getCurrentAuthUser, isSupabaseAuthReady } from "@/lib/auth";
import { AdminGate } from "@/components/auth/AdminGate";
import { QuizEditor } from "@/components/builder/QuizEditor";

export default async function BuilderPage() {
  const user = isSupabaseAuthReady() ? await getCurrentAuthUser() : null;

  return (
    <main className="max-w-7xl mx-auto p-4 grid gap-4">
      <Link href="/" className="text-sm text-[var(--color-text-dim)] hover:text-[var(--color-text)]">
        ← Main menu
      </Link>
      <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--color-text)]">
        Quiz Builder
      </h1>
      <AdminGate user={user}>
        <QuizEditor />
      </AdminGate>
    </main>
  );
}
```

- [ ] **Step 2: Create `app/manager/[slug]/page.tsx`**

```tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentAuthUser, isSupabaseAuthReady } from "@/lib/auth";
import { AdminGate } from "@/components/auth/AdminGate";
import { QuizEditor } from "@/components/builder/QuizEditor";
import { loadQuizzes } from "@/lib/load-quizzes";

export async function generateStaticParams() {
  return loadQuizzes().map((q) => ({ slug: q.slug }));
}

export default async function ManagerEditPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = isSupabaseAuthReady() ? await getCurrentAuthUser() : null;
  const quiz = loadQuizzes().find((q) => q.slug === slug);
  if (!quiz) notFound();

  return (
    <main className="max-w-7xl mx-auto p-4 grid gap-4">
      <Link href="/manager" className="text-sm text-[var(--color-text-dim)] hover:text-[var(--color-text)]">
        ← Manager
      </Link>
      <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--color-text)]">
        Editing: {quiz.title}
      </h1>
      <AdminGate user={user}>
        <QuizEditor initialQuiz={quiz} />
      </AdminGate>
    </main>
  );
}
```

- [ ] **Step 3: Verify build**

```bash
npm run build 2>&1 | tail -10
```

Expected: build succeeds with both `/builder` and `/manager/[slug]` listed in the route output.

- [ ] **Step 4: Smoke test**

```bash
npm run dev > /tmp/dev.log 2>&1 &
DEV_PID=$!
sleep 5
PORT=$(grep -oE 'http://localhost:[0-9]+' /tmp/dev.log | head -1 | grep -oE '[0-9]+$')
PORT=${PORT:-3000}
for path in "builder" "manager/example"; do
  echo -n "/$path: "
  curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:$PORT/$path"
done
kill $DEV_PID 2>/dev/null
wait 2>/dev/null
```
Expected: both 200.

- [ ] **Step 5: Commit**

```bash
git add app/builder/page.tsx app/manager/
git commit -m "Wire /builder and /manager/[slug] routes to <QuizEditor>"
```

---

### Task 17: Manager list page (ManagerListClient)

**Files:**
- Create: `components/manager/ManagerListClient.tsx`
- Modify: `app/manager/page.tsx`

- [ ] **Step 1: Implement ManagerListClient**

`components/manager/ManagerListClient.tsx`:
```tsx
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { listDrafts, type DraftMap } from "@/lib/builder/drafts-storage";
import { Plus, Edit2, FileWarning } from "lucide-react";

type ListItem = {
  slug: string;
  title: string;
  questionCount: number;
};

export function ManagerListClient({
  committed,
}: {
  committed: ListItem[];
}) {
  const [drafts, setDrafts] = useState<DraftMap>({});

  useEffect(() => {
    setDrafts(listDrafts());
  }, []);

  const committedSlugs = new Set(committed.map((q) => q.slug));
  const draftOnlySlugs = Object.keys(drafts).filter((s) => !committedSlugs.has(s));

  return (
    <div className="grid gap-3">
      <Link
        href="/builder"
        className="self-start flex items-center gap-2 px-3 py-2 rounded bg-[var(--color-accent)] hover:bg-[var(--color-accent)]/90 text-white text-sm"
      >
        <Plus className="w-4 h-4" /> New quiz
      </Link>

      {committed.length === 0 && draftOnlySlugs.length === 0 && (
        <p className="text-[var(--color-text-dim)] text-sm">No quizzes yet.</p>
      )}

      {committed.map((q) => {
        const hasDraft = drafts[q.slug] !== undefined;
        return (
          <Link key={q.slug} href={`/manager/${q.slug}`}>
            <Card className="p-4 bg-[var(--color-surface)] border-[var(--color-border)] hover:border-[var(--color-accent)] flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="font-[family-name:var(--font-display)] text-2xl text-[var(--color-text)]">
                  {q.title}
                </h3>
                <p className="text-xs text-[var(--color-text-dim)]">
                  {q.questionCount} questions {hasDraft && <span className="text-[var(--color-accent)] ml-2">• Edited locally</span>}
                </p>
              </div>
              <Edit2 className="w-4 h-4 text-[var(--color-text-dim)]" />
            </Card>
          </Link>
        );
      })}

      {draftOnlySlugs.map((slug) => {
        const d = drafts[slug];
        return (
          <Link key={slug} href={`/builder?draft=${encodeURIComponent(slug)}`}>
            <Card className="p-4 bg-[var(--color-surface)] border-[var(--color-border)] hover:border-[var(--color-accent)] flex items-center gap-4 border-dashed">
              <FileWarning className="w-5 h-5 text-[var(--color-accent)]" />
              <div className="flex-1 min-w-0">
                <h3 className="font-[family-name:var(--font-display)] text-2xl text-[var(--color-text)]">
                  {d.quiz.title} <span className="text-xs text-[var(--color-text-dim)]">(draft only)</span>
                </h3>
                <p className="text-xs text-[var(--color-text-dim)]">
                  {d.quiz.questions.length} questions • Not yet committed
                </p>
              </div>
              <Edit2 className="w-4 h-4 text-[var(--color-text-dim)]" />
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Update `app/manager/page.tsx`**

Replace its contents:
```tsx
import Link from "next/link";
import { getCurrentAuthUser, isSupabaseAuthReady } from "@/lib/auth";
import { AdminGate } from "@/components/auth/AdminGate";
import { ManagerListClient } from "@/components/manager/ManagerListClient";
import { loadQuizzes } from "@/lib/load-quizzes";

export default async function ManagerPage() {
  const user = isSupabaseAuthReady() ? await getCurrentAuthUser() : null;
  const quizzes = loadQuizzes();

  return (
    <main className="max-w-3xl mx-auto p-6 grid gap-4">
      <Link href="/" className="text-sm text-[var(--color-text-dim)] hover:text-[var(--color-text)]">
        ← Main menu
      </Link>
      <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--color-text)]">
        Quiz Manager
      </h1>
      <AdminGate user={user}>
        <ManagerListClient
          committed={quizzes.map((q) => ({
            slug: q.slug,
            title: q.title,
            questionCount: q.questions.length,
          }))}
        />
      </AdminGate>
    </main>
  );
}
```

- [ ] **Step 3: Verify build**

```bash
npm run build 2>&1 | tail -10
```

- [ ] **Step 4: Final smoke test**

```bash
npm run dev > /tmp/dev.log 2>&1 &
DEV_PID=$!
sleep 5
PORT=$(grep -oE 'http://localhost:[0-9]+' /tmp/dev.log | head -1 | grep -oE '[0-9]+$')
PORT=${PORT:-3000}
for path in "" "quizzes" "quizzes/example" "builder" "manager" "manager/example"; do
  echo -n "/$path: "
  curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:$PORT/$path"
done
kill $DEV_PID 2>/dev/null
wait 2>/dev/null
```
Expected: all 200.

- [ ] **Step 5: Run full test suite**

```bash
npm test
```
Expected: all green.

- [ ] **Step 6: Commit and push**

```bash
git add components/manager/ManagerListClient.tsx app/manager/page.tsx
git commit -m "Wire /manager list page with committed quizzes and draft hydration"
git push
```

---

## Self-Review Checklist

Run through this before declaring the plan complete.

**Spec coverage:**

- Architecture / routes (3 routes, AdminGate) → Tasks 16, 17
- Layout (split editor + preview) → Tasks 14, 15
- Schema scoring extensions per type → Task 1
- Scoring engine returns ScoreResult → Task 2
- Player reducer + storage updates → Task 3
- Player UI (RevealPanel, Results, QuizPage) → Task 4
- Editor state reducer → Task 7
- Header/slug auto-derive → Task 13
- Question list + drag reorder → Task 15 (uses dnd-kit)
- Per-type forms (×6) → Tasks 9, 10, 11
- Add question popover → Task 12
- Question card with collapse + duplicate + delete + drag handle → Task 12
- Scoring fields (shared) → Task 8
- Preview pane with mini-player + scoring outcomes → Task 14
- Drafts (localStorage) → Task 6
- Draft banner + autosave + nav guard → Task 15
- Validation feedback + bottom bar → Task 13
- Manager list with draft hydration → Task 17
- Slugify, default-question, download helpers → Task 5
- Tests on logic-heavy units (TDD) → Tasks 1–7
- Out-of-scope items NOT implemented (GitHub API, image upload, mobile, etc.) → confirmed

**Placeholder scan:** No "TBD" / "TODO" / "implement later" present. Every code-changing step has the actual code or exact diff. All commands have expected output described.

**Type consistency:**
- `ScoreResult { points; maxPoints }` defined once in `lib/scoring.ts`, imported everywhere.
- `EditorState` and `EditorAction` defined once in `lib/builder/editor-reducer.ts`, used by `<QuizEditor>`.
- `Question`, `Quiz`, and per-type aliases (`McSingleQuestion`, `McMultiQuestion`, `CategorizeQuestion`, `OrderQuestion`, `SliderQuestion`, `NameQuestion`) come from `lib/quiz-schema.ts` and are imported by their corresponding forms.
- `Draft { quiz; savedAt }` defined once in `lib/builder/drafts-storage.ts`, consumed by `<QuizEditor>` and `<ManagerListClient>`.
- `defaultQuestion(type)` signature consistent across `default-question.ts` and `editor-reducer.ts`.

Plan is complete.
