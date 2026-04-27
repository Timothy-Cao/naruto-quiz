# Naruto Quiz — Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up a Next.js 15 + Tailwind v4 + shadcn/ui Naruto quiz site deployed to Vercel, with a quiz player that supports six question types and a seeded example quiz exercising every type.

**Architecture:** Static-friendly Next.js App Router app. Quizzes are JSON files in the repo, validated at build time with zod. Player state is held in a single `useReducer` per quiz route. High scores are persisted in `localStorage`. Drag-drop via `@dnd-kit`. No backend in Phase 1.

**Tech Stack:** Next.js 15 (App Router), TypeScript, Tailwind CSS v4, shadcn/ui, `@dnd-kit/core`, `@dnd-kit/sortable`, `zod`, Lucide icons. Tests via Vitest + `@testing-library/react` + `jsdom`.

**Reference spec:** [docs/superpowers/specs/2026-04-27-naruto-quiz-infrastructure-design.md](../specs/2026-04-27-naruto-quiz-infrastructure-design.md)

---

## File Structure

Files this plan creates or modifies. Each line is the file's single responsibility.

**Project config:**
- `package.json`, `tsconfig.json`, `next.config.ts`, `eslint.config.mjs`, `postcss.config.mjs` — created by `create-next-app`
- `vitest.config.ts` — Vitest with jsdom + path alias
- `vitest.setup.ts` — `@testing-library/jest-dom` matchers
- `components.json` — shadcn config

**Theme & globals:**
- `app/globals.css` — Tailwind import + Dark Ninja `@theme` tokens + Bebas Neue
- `app/layout.tsx` — root layout, font loading, theme class on `<html>`

**Core lib (TDD):**
- `lib/utils.ts` — shadcn's `cn` helper
- `lib/quiz-schema.ts` — zod schemas + exported TypeScript types for every question type and the quiz envelope
- `lib/scoring.ts` — `scoreQuestion(question, value): boolean` — all-or-nothing scoring per type
- `lib/match-name.ts` — `matchName(input, accepted): boolean` — case-insensitive substring match used by `name` scoring and the autocomplete filter
- `lib/storage.ts` — `getScore(slug)`, `recordAttempt(slug, score, total)` — localStorage adapter
- `lib/load-quizzes.ts` — at build time reads `data/quizzes/*.json`, validates each, returns `Quiz[]`

**Player state (TDD):**
- `lib/player-reducer.ts` — pure state machine: `(state, action) -> state`. Owns `currentIndex`, `answers`, transitions for `setDraft`, `confirm`, `next`, `prev`, `jumpTo`, `reset`.

**Quiz UI primitives:**
- `components/ui/*` — shadcn primitives (button, dialog, slider, command, popover, badge)
- `components/quiz/ZoomableImage.tsx` — image that opens a Dialog at full size on click
- `components/quiz/QuizHeader.tsx` — title + clickable progress dots
- `components/quiz/QuestionFrame.tsx` — card wrapping prompt + central image + question body + reveal panel
- `components/quiz/RevealPanel.tsx` — correct/incorrect banner + explanation
- `components/quiz/NavBar.tsx` — Previous / (Confirm | Next | See Results) buttons
- `components/quiz/Results.tsx` — score banner + per-question breakdown table
- `components/quiz/QuizPage.tsx` — top-level client component composing the above with the reducer

**Question renderers** (one per type, all controlled inputs receiving `{ question, value, status, onChange }`):
- `components/questions/McSingleQuestion.tsx`
- `components/questions/McMultiQuestion.tsx`
- `components/questions/MatchQuestion.tsx`
- `components/questions/OrderQuestion.tsx`
- `components/questions/SliderQuestion.tsx`
- `components/questions/NameQuestion.tsx`

**App routes:**
- `app/page.tsx` — main menu (3 cards)
- `app/quizzes/page.tsx` — quiz list + top scores
- `app/quizzes/[slug]/page.tsx` — server component that loads the quiz and renders `<QuizPage>`
- `app/builder/page.tsx` — "Coming soon" stub
- `app/manager/page.tsx` — "Coming soon" stub

**Data:**
- `data/quizzes/example.json` — seeded one-of-each-type quiz
- `data/characters.json` — name-select autocomplete source (initially placeholder, replaced by scrape)
- `public/quiz-images/*.png|jpg` — local images for example quiz

**Scripts:**
- `scripts/scrape-characters.ts` — Wikipedia scraper for canonical names

**Tests:**
- `__tests__/quiz-schema.test.ts`
- `__tests__/scoring.test.ts`
- `__tests__/match-name.test.ts`
- `__tests__/storage.test.ts`
- `__tests__/load-quizzes.test.ts`
- `__tests__/player-reducer.test.ts`

---

## Tasks

### Task 1: Initialize Next.js project

**Files:**
- Create: project scaffold via `create-next-app`

- [ ] **Step 1: Run create-next-app non-interactively**

Run from the repo root:
```bash
npx -y create-next-app@latest . \
  --ts --tailwind --eslint --app --src-dir=false \
  --import-alias "@/*" --no-turbo --no-experimental-app
```

If `create-next-app` complains about non-empty directory, use `--use-npm` and pass `--yes` after confirming the only existing files are `.gitignore`, `docs/`, `.git/`, and `.superpowers/` — these are safe to keep. The scaffolder will only fail on conflicts with files it would create (`README.md`, `package.json`). If `README.md` is the only conflict, delete it first: `rm README.md`.

- [ ] **Step 2: Verify the dev server boots**

```bash
npm run dev &
sleep 4
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000
kill %1
```
Expected: `200`.

- [ ] **Step 3: Add `.next/`, `.vercel/`, `node_modules/` to .gitignore (if missing)**

The `create-next-app`-generated `.gitignore` may overwrite ours. Re-add our entries if missing:
```
.superpowers/
.next/
.vercel/
node_modules/
.env*.local
.DS_Store
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "Scaffold Next.js 15 App Router project with TypeScript and Tailwind"
```

---

### Task 2: Install runtime + dev dependencies

**Files:**
- Modify: `package.json` (via npm install)

- [ ] **Step 1: Install runtime deps**

```bash
npm install zod @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities lucide-react
```

- [ ] **Step 2: Install test deps**

```bash
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

- [ ] **Step 3: Add test scripts to `package.json`**

In `package.json`, under `"scripts"`, add:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: Verify installation**

```bash
npm ls zod @dnd-kit/core vitest
```
Expected: each package listed with a version, no `UNMET` warnings.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json
git commit -m "Add zod, dnd-kit, lucide, and Vitest test stack"
```

---

### Task 3: Configure Vitest

**Files:**
- Create: `vitest.config.ts`
- Create: `vitest.setup.ts`
- Create: `__tests__/sanity.test.ts`

- [ ] **Step 1: Create `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    globals: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
```

- [ ] **Step 2: Create `vitest.setup.ts`**

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 3: Add a sanity test**

`__tests__/sanity.test.ts`:
```ts
import { describe, it, expect } from "vitest";

describe("sanity", () => {
  it("runs", () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 4: Run the test**

```bash
npm test
```
Expected: 1 passed, exit 0.

- [ ] **Step 5: Commit**

```bash
git add vitest.config.ts vitest.setup.ts __tests__/sanity.test.ts package.json
git commit -m "Configure Vitest with jsdom, RTL setup, and a sanity test"
```

---

### Task 4: Configure Tailwind v4 with Dark Ninja theme

**Files:**
- Modify: `app/globals.css`
- Modify: `app/layout.tsx`

- [ ] **Step 1: Replace `app/globals.css` with the theme**

```css
@import "tailwindcss";

@theme {
  --color-bg: #0c0a09;
  --color-surface: #1c1917;
  --color-surface-2: #292524;
  --color-border: #292524;
  --color-border-2: #44403c;
  --color-text: #fafaf9;
  --color-text-dim: #a8a29e;
  --color-accent: #f97316;
  --color-accent-2: #dc2626;
  --color-correct: #22c55e;
  --color-incorrect: #ef4444;

  --font-display: "Bebas Neue", system-ui, sans-serif;
  --font-mono: ui-monospace, "SF Mono", Menlo, monospace;

  --radius-card: 12px;
  --radius-input: 8px;
}

html, body {
  background: var(--color-bg);
  color: var(--color-text);
  font-family: system-ui, -apple-system, sans-serif;
  min-height: 100vh;
}

* { box-sizing: border-box; }
```

- [ ] **Step 2: Load Bebas Neue and apply dark theme in `app/layout.tsx`**

Replace the file contents:
```tsx
import type { Metadata } from "next";
import { Bebas_Neue } from "next/font/google";
import "./globals.css";

const bebas = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Naruto Quiz",
  description: "Test your knowledge of Naruto and Naruto: Shippuden.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={bebas.variable}>
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 3: Verify build**

```bash
npm run build
```
Expected: build succeeds, no CSS errors.

- [ ] **Step 4: Commit**

```bash
git add app/globals.css app/layout.tsx
git commit -m "Apply Dark Ninja theme tokens and load Bebas Neue display font"
```

---

### Task 5: Initialize shadcn/ui

**Files:**
- Create: `components.json`
- Create: `lib/utils.ts`

- [ ] **Step 1: Run shadcn init non-interactively**

```bash
npx -y shadcn@latest init -y -d
```
Use `New York` style, `slate` base color, `--no-rsc=false`, CSS variables `yes`. Accept defaults. The `-d` flag accepts all defaults.

If `shadcn init` is interactive only, run it with these answers piped in: style=`new-york`, base color=`slate`, css vars=`yes`, components alias=`@/components`, utils alias=`@/lib/utils`.

- [ ] **Step 2: Add the primitives we need**

```bash
npx -y shadcn@latest add button card dialog slider command popover badge
```

- [ ] **Step 3: Verify utils file**

`lib/utils.ts` should now exist with the `cn` helper. If not, create it:
```ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 4: Verify build still works**

```bash
npm run build
```
Expected: build succeeds.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "Initialize shadcn/ui and install button, card, dialog, slider, command, popover, badge"
```

---

### Task 6: Define quiz schema (TDD)

**Files:**
- Create: `__tests__/quiz-schema.test.ts`
- Create: `lib/quiz-schema.ts`

- [ ] **Step 1: Write the failing test**

`__tests__/quiz-schema.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { QuizSchema } from "@/lib/quiz-schema";

const baseQuestion = {
  id: "q1",
  prompt: "Sample prompt?",
  explanation: "Because so.",
};

describe("QuizSchema", () => {
  it("accepts a valid mc-single quiz", () => {
    const quiz = {
      slug: "ex",
      title: "Example",
      questions: [{
        ...baseQuestion,
        type: "mc-single",
        options: [
          { id: "a", label: "A" },
          { id: "b", label: "B" },
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
        options: [{ id: "a", label: "A" }],
        correctId: "z",
      }],
    };
    expect(() => QuizSchema.parse(quiz)).toThrow();
  });

  it("accepts every supported question type", () => {
    const quiz = {
      slug: "all-types",
      title: "All",
      questions: [
        { ...baseQuestion, id: "q1", type: "mc-single",
          options: [{ id: "a", label: "A" }, { id: "b", label: "B" }],
          correctId: "a" },
        { ...baseQuestion, id: "q2", type: "mc-multi",
          options: [{ id: "a", label: "A" }, { id: "b", label: "B" }, { id: "c", label: "C" }],
          correctIds: ["a", "c"] },
        { ...baseQuestion, id: "q3", type: "match",
          left: [{ id: "L1", label: "L1" }, { id: "L2", label: "L2" }],
          right: [{ id: "R1", label: "R1" }, { id: "R2", label: "R2" }],
          correctPairs: [{ leftId: "L1", rightId: "R2" }, { leftId: "L2", rightId: "R1" }] },
        { ...baseQuestion, id: "q4", type: "order",
          items: [{ id: "x", label: "X" }, { id: "y", label: "Y" }],
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

  it("rejects match where correctPairs length differs from left length", () => {
    const quiz = {
      slug: "ex",
      title: "Ex",
      questions: [{
        ...baseQuestion,
        type: "match",
        left: [{ id: "L1", label: "a" }, { id: "L2", label: "b" }],
        right: [{ id: "R1", label: "a" }, { id: "R2", label: "b" }],
        correctPairs: [{ leftId: "L1", rightId: "R1" }],
      }],
    };
    expect(() => QuizSchema.parse(quiz)).toThrow();
  });
});
```

- [ ] **Step 2: Run the test, confirm it fails**

```bash
npm test -- quiz-schema
```
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `lib/quiz-schema.ts`**

```ts
import { z } from "zod";

const ImageRef = z.string().min(1);

const Option = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  thumbnail: ImageRef.optional(),
});

const QuestionBase = {
  id: z.string().min(1),
  prompt: z.string().min(1),
  image: ImageRef.optional(),
  explanation: z.string().min(1),
};

const McSingle = z.object({
  ...QuestionBase,
  type: z.literal("mc-single"),
  options: z.array(Option).min(2),
  correctId: z.string().min(1),
}).refine(
  (q) => q.options.some((o) => o.id === q.correctId),
  { message: "correctId must match one of options[].id" },
);

const McMulti = z.object({
  ...QuestionBase,
  type: z.literal("mc-multi"),
  options: z.array(Option).min(2),
  correctIds: z.array(z.string().min(1)).min(1),
}).refine(
  (q) => {
    const ids = new Set(q.options.map((o) => o.id));
    return q.correctIds.every((cid) => ids.has(cid));
  },
  { message: "every correctIds entry must match an option id" },
);

const Match = z.object({
  ...QuestionBase,
  type: z.literal("match"),
  left: z.array(Option).min(1),
  right: z.array(Option).min(1),
  correctPairs: z.array(z.object({
    leftId: z.string().min(1),
    rightId: z.string().min(1),
  })).min(1),
}).refine(
  (q) => q.correctPairs.length === q.left.length && q.right.length === q.left.length,
  { message: "match must be 1:1 — left, right, and correctPairs must all have equal length" },
).refine(
  (q) => {
    const lefts = new Set(q.left.map((o) => o.id));
    const rights = new Set(q.right.map((o) => o.id));
    return q.correctPairs.every((p) => lefts.has(p.leftId) && rights.has(p.rightId));
  },
  { message: "every correctPairs entry must reference valid left/right ids" },
);

const Order = z.object({
  ...QuestionBase,
  type: z.literal("order"),
  items: z.array(Option).min(2),
  axis: z.enum(["horizontal", "vertical"]),
  startLabel: z.string().min(1),
  endLabel: z.string().min(1),
  correctOrder: z.array(z.string().min(1)).min(2),
}).refine(
  (q) => q.correctOrder.length === q.items.length,
  { message: "correctOrder length must equal items length" },
).refine(
  (q) => {
    const ids = new Set(q.items.map((i) => i.id));
    return q.correctOrder.every((id) => ids.has(id));
  },
  { message: "every correctOrder id must match an item id" },
);

const Slider = z.object({
  ...QuestionBase,
  type: z.literal("slider"),
  min: z.number().int(),
  max: z.number().int(),
  step: z.number().int().positive(),
  correctValue: z.number().int(),
}).refine(
  (q) => q.min < q.max,
  { message: "min must be < max" },
).refine(
  (q) => q.correctValue >= q.min && q.correctValue <= q.max,
  { message: "correctValue must be within [min, max]" },
);

const Name = z.object({
  ...QuestionBase,
  type: z.literal("name"),
  acceptedAnswers: z.array(z.string().min(1)).min(1),
});

export const QuestionSchema = z.discriminatedUnion("type", [
  McSingle, McMulti, Match, Order, Slider, Name,
]);

export const QuizSchema = z.object({
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, "slug must be kebab-case"),
  title: z.string().min(1),
  description: z.string().optional(),
  coverImage: ImageRef.optional(),
  questions: z.array(QuestionSchema).min(1),
});

export type Quiz = z.infer<typeof QuizSchema>;
export type Question = z.infer<typeof QuestionSchema>;
export type McSingleQuestion = z.infer<typeof McSingle>;
export type McMultiQuestion = z.infer<typeof McMulti>;
export type MatchQuestion = z.infer<typeof Match>;
export type OrderQuestion = z.infer<typeof Order>;
export type SliderQuestion = z.infer<typeof Slider>;
export type NameQuestion = z.infer<typeof Name>;
```

- [ ] **Step 4: Run tests, confirm pass**

```bash
npm test -- quiz-schema
```
Expected: 4 passed.

- [ ] **Step 5: Commit**

```bash
git add lib/quiz-schema.ts __tests__/quiz-schema.test.ts
git commit -m "Add zod quiz schema with discriminated union for all 6 question types"
```

---

### Task 7: Implement name matcher (TDD)

**Files:**
- Create: `__tests__/match-name.test.ts`
- Create: `lib/match-name.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { matchName } from "@/lib/match-name";

describe("matchName", () => {
  it("matches case-insensitive substring", () => {
    expect(matchName("kakashi", ["Kakashi Hatake"])).toBe(true);
    expect(matchName("MINATO", ["Minato Namikaze"])).toBe(true);
  });

  it("matches exact answer", () => {
    expect(matchName("Itachi Uchiha", ["Itachi Uchiha", "Itachi"])).toBe(true);
  });

  it("trims whitespace", () => {
    expect(matchName("  itachi  ", ["Itachi Uchiha"])).toBe(true);
  });

  it("rejects empty input", () => {
    expect(matchName("", ["Itachi"])).toBe(false);
    expect(matchName("   ", ["Itachi"])).toBe(false);
  });

  it("rejects superstring of canonical", () => {
    expect(matchName("Kakashi Hatake the Sixth", ["Kakashi Hatake"])).toBe(false);
  });

  it("rejects no-match", () => {
    expect(matchName("Sasuke", ["Itachi Uchiha"])).toBe(false);
  });
});
```

- [ ] **Step 2: Run, confirm fail**

```bash
npm test -- match-name
```
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

`lib/match-name.ts`:
```ts
export function matchName(input: string, accepted: string[]): boolean {
  const trimmed = input.trim().toLowerCase();
  if (trimmed.length === 0) return false;
  return accepted.some((canonical) =>
    canonical.toLowerCase().includes(trimmed),
  );
}
```

- [ ] **Step 4: Run, confirm pass**

```bash
npm test -- match-name
```
Expected: 6 passed.

- [ ] **Step 5: Commit**

```bash
git add lib/match-name.ts __tests__/match-name.test.ts
git commit -m "Add matchName helper with case-insensitive substring matching"
```

---

### Task 8: Implement scoring logic (TDD)

**Files:**
- Create: `__tests__/scoring.test.ts`
- Create: `lib/scoring.ts`

- [ ] **Step 1: Write the failing test**

```ts
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
```

- [ ] **Step 2: Run, confirm fail**

```bash
npm test -- scoring
```
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

`lib/scoring.ts`:
```ts
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
```

- [ ] **Step 4: Run, confirm pass**

```bash
npm test -- scoring
```
Expected: 6 passed.

- [ ] **Step 5: Commit**

```bash
git add lib/scoring.ts __tests__/scoring.test.ts
git commit -m "Add per-type all-or-nothing scoring with discriminated dispatch"
```

---

### Task 9: Implement localStorage score adapter (TDD)

**Files:**
- Create: `__tests__/storage.test.ts`
- Create: `lib/storage.ts`

- [ ] **Step 1: Write the failing test**

```ts
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
```

- [ ] **Step 2: Run, confirm fail**

```bash
npm test -- storage
```
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

`lib/storage.ts`:
```ts
const KEY = "naruto-quiz:scores";

export type ScoreEntry = {
  bestScore: number;
  bestOutOf: number;
  bestAt: string;
  attempts: number;
};

export type ScoreStore = Record<string, ScoreEntry>;

function readStore(): ScoreStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

function writeStore(store: ScoreStore): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(store));
}

export function getAllScores(): ScoreStore {
  return readStore();
}

export function getScore(slug: string): ScoreEntry | null {
  return readStore()[slug] ?? null;
}

export function recordAttempt(slug: string, score: number, outOf: number): ScoreEntry {
  const store = readStore();
  const prev = store[slug];
  const entry: ScoreEntry = prev
    ? {
        bestScore: Math.max(prev.bestScore, score),
        bestOutOf: outOf,
        bestAt: score > prev.bestScore ? new Date().toISOString() : prev.bestAt,
        attempts: prev.attempts + 1,
      }
    : {
        bestScore: score,
        bestOutOf: outOf,
        bestAt: new Date().toISOString(),
        attempts: 1,
      };
  store[slug] = entry;
  writeStore(store);
  return entry;
}
```

- [ ] **Step 4: Run, confirm pass**

```bash
npm test -- storage
```
Expected: 5 passed.

- [ ] **Step 5: Commit**

```bash
git add lib/storage.ts __tests__/storage.test.ts
git commit -m "Add localStorage score adapter with best-of-N semantics"
```

---

### Task 10: Implement quiz loader

**Files:**
- Create: `__tests__/load-quizzes.test.ts`
- Create: `lib/load-quizzes.ts`
- Create: `data/quizzes/.gitkeep`

- [ ] **Step 1: Add `.gitkeep` to keep `data/quizzes/` in repo**

```bash
mkdir -p data/quizzes
touch data/quizzes/.gitkeep
```

- [ ] **Step 2: Write a test that checks loader behavior with a fixture**

`__tests__/load-quizzes.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { loadQuizzesFrom } from "@/lib/load-quizzes";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";

function makeFixtureDir(files: Record<string, unknown>): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "quiz-fixture-"));
  for (const [name, content] of Object.entries(files)) {
    fs.writeFileSync(path.join(dir, name), JSON.stringify(content));
  }
  return dir;
}

const validQuiz = {
  slug: "x",
  title: "X",
  questions: [{
    id: "q1", type: "mc-single", prompt: "p", explanation: "e",
    options: [{ id: "a", label: "A" }, { id: "b", label: "B" }],
    correctId: "a",
  }],
};

describe("loadQuizzesFrom", () => {
  it("loads and validates JSON files", () => {
    const dir = makeFixtureDir({ "x.json": validQuiz });
    expect(loadQuizzesFrom(dir)).toHaveLength(1);
  });

  it("throws on invalid quiz with file path in error", () => {
    const bad = { ...validQuiz, slug: "BAD SLUG" };
    const dir = makeFixtureDir({ "bad.json": bad });
    expect(() => loadQuizzesFrom(dir)).toThrow(/bad\.json/);
  });

  it("ignores non-json files and .gitkeep", () => {
    const dir = makeFixtureDir({ "x.json": validQuiz });
    fs.writeFileSync(path.join(dir, ".gitkeep"), "");
    fs.writeFileSync(path.join(dir, "README.md"), "# notes");
    expect(loadQuizzesFrom(dir)).toHaveLength(1);
  });
});
```

- [ ] **Step 3: Run, confirm fail**

```bash
npm test -- load-quizzes
```
Expected: FAIL — module not found.

- [ ] **Step 4: Implement**

`lib/load-quizzes.ts`:
```ts
import fs from "node:fs";
import path from "node:path";
import { QuizSchema, type Quiz } from "@/lib/quiz-schema";

export function loadQuizzesFrom(dir: string): Quiz[] {
  const entries = fs.readdirSync(dir);
  const quizzes: Quiz[] = [];
  for (const name of entries) {
    if (!name.endsWith(".json")) continue;
    const file = path.join(dir, name);
    const raw = fs.readFileSync(file, "utf8");
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      throw new Error(`Failed to parse ${name}: ${(err as Error).message}`);
    }
    const result = QuizSchema.safeParse(parsed);
    if (!result.success) {
      throw new Error(
        `Invalid quiz in ${name}: ${result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`,
      );
    }
    quizzes.push(result.data);
  }
  return quizzes;
}

const DEFAULT_DIR = path.join(process.cwd(), "data", "quizzes");

export function loadQuizzes(): Quiz[] {
  return loadQuizzesFrom(DEFAULT_DIR);
}
```

- [ ] **Step 5: Run, confirm pass**

```bash
npm test -- load-quizzes
```
Expected: 3 passed.

- [ ] **Step 6: Commit**

```bash
git add lib/load-quizzes.ts __tests__/load-quizzes.test.ts data/quizzes/.gitkeep
git commit -m "Add build-time quiz loader with zod validation and clear error messages"
```

---

### Task 11: Implement player state reducer (TDD)

**Files:**
- Create: `__tests__/player-reducer.test.ts`
- Create: `lib/player-reducer.ts`

- [ ] **Step 1: Write the failing test**

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

  it("confirm moves draft to confirmed with correctness", () => {
    let s = initialState(quiz);
    s = playerReducer(s, { type: "setDraft", id: "q1", value: "a" });
    s = playerReducer(s, { type: "confirm", id: "q1", correct: true });
    expect(s.answers["q1"]).toEqual({ status: "confirmed", value: "a", correct: true });
  });

  it("confirm is a no-op if not in draft", () => {
    let s = initialState(quiz);
    s = playerReducer(s, { type: "confirm", id: "q1", correct: true });
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
    s = playerReducer(s, { type: "confirm", id: "q1", correct: true });
    s = playerReducer(s, { type: "next" });
    s = playerReducer(s, { type: "reset", quiz });
    expect(s).toEqual(initialState(quiz));
  });
});
```

- [ ] **Step 2: Run, confirm fail**

```bash
npm test -- player-reducer
```
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

`lib/player-reducer.ts`:
```ts
import type { Quiz } from "@/lib/quiz-schema";
import type { AnswerValue } from "@/lib/scoring";

export type AnswerState =
  | { status: "unanswered" }
  | { status: "draft"; value: AnswerValue }
  | { status: "confirmed"; value: AnswerValue; correct: boolean };

export type PlayerState = {
  currentIndex: number;
  answers: Record<string, AnswerState>;
};

export type PlayerAction =
  | { type: "setDraft"; id: string; value: AnswerValue }
  | { type: "confirm"; id: string; correct: boolean }
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
      return {
        ...state,
        answers: {
          ...state.answers,
          [action.id]: { status: "confirmed", value: a.value, correct: action.correct },
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

- [ ] **Step 4: Run, confirm pass**

```bash
npm test -- player-reducer
```
Expected: 9 passed.

- [ ] **Step 5: Commit**

```bash
git add lib/player-reducer.ts __tests__/player-reducer.test.ts
git commit -m "Add pure player-state reducer with draft/confirm/navigate transitions"
```

---

### Task 12: Build ZoomableImage component

**Files:**
- Create: `components/quiz/ZoomableImage.tsx`

- [ ] **Step 1: Implement**

```tsx
"use client";
import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type Props = {
  src: string;
  alt: string;
  className?: string;
  thumbnailClassName?: string;
};

export function ZoomableImage({ src, alt, className, thumbnailClassName }: Props) {
  const [open, setOpen] = useState(false);
  const isExternal = src.startsWith("http");
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "block overflow-hidden rounded-md border border-[var(--color-border)] hover:border-[var(--color-accent)] transition-colors",
          className,
        )}
        aria-label={`Zoom: ${alt}`}
      >
        <img
          src={src}
          alt={alt}
          className={cn("block w-full h-full object-cover", thumbnailClassName)}
          loading="lazy"
        />
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl bg-[var(--color-bg)] border-[var(--color-border-2)]">
          <DialogTitle className="sr-only">{alt}</DialogTitle>
          <img src={src} alt={alt} className="w-full h-auto rounded" />
          {isExternal && (
            <p className="text-xs text-[var(--color-text-dim)] text-center mt-2">External image</p>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```
Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add components/quiz/ZoomableImage.tsx
git commit -m "Add ZoomableImage with click-to-open Dialog"
```

---

### Task 13: Build McSingleQuestion renderer

**Files:**
- Create: `components/questions/McSingleQuestion.tsx`

- [ ] **Step 1: Define the shared question prop contract (top of new file)**

`components/questions/types.ts`:
```ts
import type { AnswerState } from "@/lib/player-reducer";
import type { AnswerValue } from "@/lib/scoring";

export type QuestionProps<Q, V extends AnswerValue> = {
  question: Q;
  state: AnswerState;
  onChange: (value: V) => void;
};
```

- [ ] **Step 2: Implement McSingleQuestion**

`components/questions/McSingleQuestion.tsx`:
```tsx
"use client";
import type { McSingleQuestion } from "@/lib/quiz-schema";
import type { QuestionProps } from "./types";
import { ZoomableImage } from "@/components/quiz/ZoomableImage";
import { cn } from "@/lib/utils";
import { Check, X } from "lucide-react";

export function McSingleQuestionRenderer({
  question,
  state,
  onChange,
}: QuestionProps<McSingleQuestion, string>) {
  const locked = state.status === "confirmed";
  const selected =
    state.status === "unanswered" ? null : (state.value as string);

  return (
    <div className="grid gap-2">
      {question.options.map((opt) => {
        const isSelected = selected === opt.id;
        const isCorrect = opt.id === question.correctId;
        const showCorrect = locked && isCorrect;
        const showWrong = locked && isSelected && !isCorrect;
        return (
          <button
            type="button"
            key={opt.id}
            disabled={locked}
            onClick={() => onChange(opt.id)}
            className={cn(
              "flex items-center gap-3 p-3 rounded-md border text-left transition-colors",
              "bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text)]",
              !locked && "hover:border-[var(--color-border-2)]",
              isSelected && !locked && "border-[var(--color-accent)] bg-[var(--color-surface-2)]",
              showCorrect && "border-[var(--color-correct)]",
              showWrong && "border-[var(--color-incorrect)]",
            )}
          >
            {opt.thumbnail && (
              <ZoomableImage
                src={opt.thumbnail}
                alt={opt.label}
                className="w-12 h-12 shrink-0"
              />
            )}
            <span className="flex-1">{opt.label}</span>
            {showCorrect && <Check className="w-5 h-5 text-[var(--color-correct)]" />}
            {showWrong && <X className="w-5 h-5 text-[var(--color-incorrect)]" />}
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 3: Verify build**

```bash
npm run build
```
Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
git add components/questions/types.ts components/questions/McSingleQuestion.tsx
git commit -m "Add McSingleQuestion renderer with reveal styling"
```

---

### Task 14: Build McMultiQuestion renderer

**Files:**
- Create: `components/questions/McMultiQuestion.tsx`

- [ ] **Step 1: Implement**

```tsx
"use client";
import type { McMultiQuestion } from "@/lib/quiz-schema";
import type { QuestionProps } from "./types";
import { ZoomableImage } from "@/components/quiz/ZoomableImage";
import { cn } from "@/lib/utils";
import { Check, X } from "lucide-react";

export function McMultiQuestionRenderer({
  question,
  state,
  onChange,
}: QuestionProps<McMultiQuestion, string[]>) {
  const locked = state.status === "confirmed";
  const selected: string[] =
    state.status === "unanswered" ? [] : (state.value as string[]);
  const correctSet = new Set(question.correctIds);

  function toggle(id: string) {
    const next = selected.includes(id)
      ? selected.filter((x) => x !== id)
      : [...selected, id];
    onChange(next);
  }

  return (
    <div className="grid gap-2">
      <p className="text-xs uppercase tracking-wide text-[var(--color-text-dim)]">
        Select all that apply
      </p>
      {question.options.map((opt) => {
        const isSelected = selected.includes(opt.id);
        const isCorrect = correctSet.has(opt.id);
        const showCorrect = locked && isCorrect;
        const showWrongPick = locked && isSelected && !isCorrect;
        const showMissed = locked && !isSelected && isCorrect;
        return (
          <button
            type="button"
            key={opt.id}
            disabled={locked}
            onClick={() => toggle(opt.id)}
            className={cn(
              "flex items-center gap-3 p-3 rounded-md border text-left transition-colors",
              "bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text)]",
              !locked && "hover:border-[var(--color-border-2)]",
              isSelected && !locked && "border-[var(--color-accent)] bg-[var(--color-surface-2)]",
              showCorrect && "border-[var(--color-correct)]",
              showWrongPick && "border-[var(--color-incorrect)]",
              showMissed && "border-[var(--color-correct)]/50 border-dashed",
            )}
          >
            <span
              className={cn(
                "w-5 h-5 rounded border flex items-center justify-center shrink-0",
                isSelected
                  ? "bg-[var(--color-accent)] border-[var(--color-accent)]"
                  : "border-[var(--color-border-2)]",
              )}
            >
              {isSelected && <Check className="w-3 h-3 text-white" />}
            </span>
            {opt.thumbnail && (
              <ZoomableImage src={opt.thumbnail} alt={opt.label} className="w-12 h-12 shrink-0" />
            )}
            <span className="flex-1">{opt.label}</span>
            {showWrongPick && <X className="w-5 h-5 text-[var(--color-incorrect)]" />}
            {showMissed && (
              <span className="text-xs text-[var(--color-correct)]">Missed</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add components/questions/McMultiQuestion.tsx
git commit -m "Add McMultiQuestion renderer with multi-select toggling and missed-answer reveal"
```

---

### Task 15: Build SliderQuestion renderer

**Files:**
- Create: `components/questions/SliderQuestion.tsx`

- [ ] **Step 1: Implement**

```tsx
"use client";
import type { SliderQuestion } from "@/lib/quiz-schema";
import type { QuestionProps } from "./types";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

export function SliderQuestionRenderer({
  question,
  state,
  onChange,
}: QuestionProps<SliderQuestion, number>) {
  const locked = state.status === "confirmed";
  const value: number =
    state.status === "unanswered"
      ? question.min
      : (state.value as number);

  // Mark interaction by always firing onChange — the player reducer treats
  // any onChange as "draft". The user moving away from min is a real interaction;
  // if they want min as their answer, they need to nudge and return.
  return (
    <div className="grid gap-4">
      <div className="flex items-baseline justify-between">
        <span className="text-xs uppercase tracking-wide text-[var(--color-text-dim)]">
          Your value
        </span>
        <span className="font-mono text-2xl text-[var(--color-text)]">{value}</span>
      </div>
      <Slider
        min={question.min}
        max={question.max}
        step={question.step}
        value={[value]}
        disabled={locked}
        onValueChange={(v) => onChange(v[0])}
      />
      <div className="flex justify-between text-xs text-[var(--color-text-dim)]">
        <span>{question.min}</span>
        <span>{question.max}</span>
      </div>
      {locked && (
        <div className={cn(
          "flex justify-between font-mono text-sm rounded-md p-3 border",
          state.status === "confirmed" && state.correct
            ? "border-[var(--color-correct)] bg-[var(--color-correct)]/10"
            : "border-[var(--color-incorrect)] bg-[var(--color-incorrect)]/10",
        )}>
          <span>You: {value}</span>
          <span>Correct: {question.correctValue}</span>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add components/questions/SliderQuestion.tsx
git commit -m "Add SliderQuestion renderer with value readout and reveal compare bar"
```

---

### Task 16: Build NameQuestion renderer with autocomplete

**Files:**
- Create: `components/questions/NameQuestion.tsx`
- Create: `data/characters.json` (placeholder, replaced in Task 23)

- [ ] **Step 1: Create placeholder `data/characters.json`**

A minimal stand-in so the component works in dev. Will be replaced by the scrape script.
```json
[
  "Naruto Uzumaki",
  "Sasuke Uchiha",
  "Sakura Haruno",
  "Kakashi Hatake",
  "Itachi Uchiha",
  "Minato Namikaze",
  "Hashirama Senju",
  "Tobirama Senju",
  "Hiruzen Sarutobi",
  "Tsunade",
  "Jiraiya",
  "Orochimaru",
  "Madara Uchiha",
  "Obito Uchiha",
  "Pain",
  "Konan",
  "Kisame Hoshigaki",
  "Deidara",
  "Sasori",
  "Hidan",
  "Kakuzu",
  "Zetsu",
  "Gaara",
  "Temari",
  "Kankuro"
]
```

- [ ] **Step 2: Implement NameQuestion**

```tsx
"use client";
import { useMemo, useState } from "react";
import type { NameQuestion } from "@/lib/quiz-schema";
import type { QuestionProps } from "./types";
import { matchName } from "@/lib/match-name";
import { cn } from "@/lib/utils";
import characters from "@/data/characters.json";

export function NameQuestionRenderer({
  question,
  state,
  onChange,
}: QuestionProps<NameQuestion, string>) {
  const locked = state.status === "confirmed";
  const value: string =
    state.status === "unanswered" ? "" : (state.value as string);
  const [open, setOpen] = useState(false);

  const suggestions = useMemo(() => {
    if (!value.trim()) return [];
    const lower = value.trim().toLowerCase();
    return (characters as string[])
      .filter((c) => c.toLowerCase().includes(lower))
      .slice(0, 8);
  }, [value]);

  const correct = state.status === "confirmed" ? state.correct : false;

  return (
    <div className="grid gap-2 relative">
      <input
        type="text"
        value={value}
        disabled={locked}
        autoComplete="off"
        placeholder="Type a character name..."
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onFocus={() => setOpen(true)}
        className={cn(
          "w-full px-3 py-2 rounded-md border bg-[var(--color-surface)] text-[var(--color-text)] outline-none",
          "border-[var(--color-border)] focus:border-[var(--color-accent)]",
          locked && correct && "border-[var(--color-correct)]",
          locked && !correct && "border-[var(--color-incorrect)]",
        )}
      />
      {open && suggestions.length > 0 && !locked && (
        <ul className="absolute top-full left-0 right-0 z-10 mt-1 max-h-56 overflow-auto rounded-md border border-[var(--color-border-2)] bg-[var(--color-surface)] shadow-lg">
          {suggestions.map((s) => (
            <li key={s}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onChange(s);
                  setOpen(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-[var(--color-surface-2)] text-[var(--color-text)]"
              >
                {s}
              </button>
            </li>
          ))}
        </ul>
      )}
      {locked && !correct && (
        <p className="text-sm text-[var(--color-text-dim)]">
          Correct: <span className="text-[var(--color-correct)]">{question.acceptedAnswers[0]}</span>
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Verify build**

```bash
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add components/questions/NameQuestion.tsx data/characters.json
git commit -m "Add NameQuestion renderer with substring-matching autocomplete dropdown"
```

---

### Task 17: Build OrderQuestion renderer (sortable dnd-kit)

**Files:**
- Create: `components/questions/OrderQuestion.tsx`

- [ ] **Step 1: Implement**

```tsx
"use client";
import { useEffect, useState } from "react";
import type { OrderQuestion } from "@/lib/quiz-schema";
import type { QuestionProps } from "./types";
import { ZoomableImage } from "@/components/quiz/ZoomableImage";
import { cn } from "@/lib/utils";
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowRight, ArrowDown } from "lucide-react";

function SortableItem({
  id,
  label,
  thumbnail,
  axis,
  borderClass,
}: {
  id: string;
  label: string;
  thumbnail?: string;
  axis: "horizontal" | "vertical";
  borderClass: string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "p-3 rounded-md border bg-[var(--color-surface)] cursor-grab active:cursor-grabbing select-none",
        "flex items-center gap-2 text-[var(--color-text)]",
        axis === "horizontal" ? "min-w-[120px]" : "w-full",
        borderClass,
        isDragging && "opacity-60",
      )}
    >
      {thumbnail && <ZoomableImage src={thumbnail} alt={label} className="w-8 h-8 shrink-0" />}
      <span className="text-sm">{label}</span>
    </div>
  );
}

export function OrderQuestionRenderer({
  question,
  state,
  onChange,
}: QuestionProps<OrderQuestion, string[]>) {
  const locked = state.status === "confirmed";

  const initial =
    state.status === "unanswered"
      ? question.items.map((i) => i.id)
      : (state.value as string[]);

  const [order, setOrder] = useState<string[]>(initial);

  // If parent state changes (e.g., reset), sync.
  useEffect(() => {
    if (state.status === "unanswered") setOrder(question.items.map((i) => i.id));
    else setOrder(state.value as string[]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.status]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(e: DragEndEvent) {
    if (locked) return;
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = order.indexOf(active.id as string);
    const newIndex = order.indexOf(over.id as string);
    const next = arrayMove(order, oldIndex, newIndex);
    setOrder(next);
    onChange(next);
  }

  const labelById: Record<string, { label: string; thumbnail?: string }> = {};
  for (const item of question.items) labelById[item.id] = item;

  const Arrow = question.axis === "horizontal" ? ArrowRight : ArrowDown;

  return (
    <div className="grid gap-3">
      <div
        className={cn(
          "flex items-center gap-2 text-xs uppercase tracking-wide text-[var(--color-text-dim)]",
          question.axis === "vertical" && "flex-col items-stretch",
        )}
      >
        <span>{question.startLabel}</span>
        <Arrow className="w-4 h-4 text-[var(--color-accent)]" />
        <span>{question.endLabel}</span>
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext
          items={order}
          strategy={
            question.axis === "horizontal"
              ? horizontalListSortingStrategy
              : verticalListSortingStrategy
          }
        >
          <div
            className={cn(
              "gap-2",
              question.axis === "horizontal" ? "flex flex-wrap" : "grid",
            )}
          >
            {order.map((id, i) => {
              const correctAtI = locked && question.correctOrder[i] === id;
              const wrongAtI = locked && !correctAtI;
              const item = labelById[id];
              return (
                <SortableItem
                  key={id}
                  id={id}
                  label={item.label}
                  thumbnail={item.thumbnail}
                  axis={question.axis}
                  borderClass={cn(
                    "border-[var(--color-border)]",
                    correctAtI && "border-[var(--color-correct)] border-l-4",
                    wrongAtI && "border-[var(--color-incorrect)] border-l-4",
                  )}
                />
              );
            })}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add components/questions/OrderQuestion.tsx
git commit -m "Add OrderQuestion renderer with dnd-kit sortable and axis-aware reveal"
```

---

### Task 18: Build MatchQuestion renderer (drop zones)

**Files:**
- Create: `components/questions/MatchQuestion.tsx`

- [ ] **Step 1: Implement**

```tsx
"use client";
import { useEffect, useState } from "react";
import type { MatchQuestion } from "@/lib/quiz-schema";
import type { QuestionProps } from "./types";
import { ZoomableImage } from "@/components/quiz/ZoomableImage";
import { cn } from "@/lib/utils";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragEndEvent,
} from "@dnd-kit/core";

function Draggable({
  id,
  label,
  thumbnail,
  disabled,
}: {
  id: string;
  label: string;
  thumbnail?: string;
  disabled: boolean;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id, disabled });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={cn(
        "p-2 rounded-md border bg-[var(--color-surface-2)] cursor-grab active:cursor-grabbing",
        "flex items-center gap-2 text-sm text-[var(--color-text)] select-none",
        "border-[var(--color-border-2)]",
        isDragging && "opacity-40",
        disabled && "cursor-default",
      )}
    >
      {thumbnail && <ZoomableImage src={thumbnail} alt={label} className="w-8 h-8 shrink-0" />}
      <span>{label}</span>
    </div>
  );
}

function Droppable({
  id,
  children,
  highlight,
}: {
  id: string;
  children: React.ReactNode;
  highlight: "none" | "correct" | "incorrect";
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "min-h-[3.25rem] p-2 rounded-md border-2 border-dashed flex items-center",
        "border-[var(--color-border-2)] bg-[var(--color-surface)]",
        isOver && "border-[var(--color-accent)]",
        highlight === "correct" && "border-[var(--color-correct)] border-solid",
        highlight === "incorrect" && "border-[var(--color-incorrect)] border-solid",
      )}
    >
      {children}
    </div>
  );
}

export function MatchQuestionRenderer({
  question,
  state,
  onChange,
}: QuestionProps<MatchQuestion, Record<string, string>>) {
  const locked = state.status === "confirmed";
  const initial: Record<string, string> =
    state.status === "unanswered" ? {} : (state.value as Record<string, string>);

  const [pairs, setPairs] = useState<Record<string, string>>(initial);

  useEffect(() => {
    if (state.status === "unanswered") setPairs({});
    else setPairs(state.value as Record<string, string>);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.status]);

  const sensors = useSensors(useSensor(PointerSensor));

  function handleDragEnd(e: DragEndEvent) {
    if (locked) return;
    const rightId = e.active.id as string;
    const leftId = e.over?.id as string | undefined;
    if (!leftId) return;
    // remove rightId from any other slot, then assign
    const next: Record<string, string> = {};
    for (const [k, v] of Object.entries(pairs)) {
      if (v !== rightId) next[k] = v;
    }
    next[leftId] = rightId;
    setPairs(next);
    onChange(next);
  }

  const labelOnRight: Record<string, { label: string; thumbnail?: string }> = {};
  for (const r of question.right) labelOnRight[r.id] = r;

  const correctMap: Record<string, string> = {};
  for (const p of question.correctPairs) correctMap[p.leftId] = p.rightId;

  const placedRightIds = new Set(Object.values(pairs));
  const tray = question.right.filter((r) => !placedRightIds.has(r.id));

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-[1fr,1fr] gap-4">
        {/* Left fixed column with drop zones */}
        <div className="grid gap-2">
          <p className="text-xs uppercase tracking-wide text-[var(--color-text-dim)]">Pairs</p>
          {question.left.map((l) => {
            const placedRightId = pairs[l.id];
            const placed = placedRightId ? labelOnRight[placedRightId] : null;
            const highlight: "none" | "correct" | "incorrect" =
              !locked || !placedRightId
                ? "none"
                : correctMap[l.id] === placedRightId
                ? "correct"
                : "incorrect";
            return (
              <div key={l.id} className="grid grid-cols-[max-content,1fr] gap-2 items-center">
                <div className="p-2 rounded-md border bg-[var(--color-surface-2)] text-sm text-[var(--color-text)] flex items-center gap-2 border-[var(--color-border)]">
                  {l.thumbnail && (
                    <ZoomableImage src={l.thumbnail} alt={l.label} className="w-8 h-8 shrink-0" />
                  )}
                  <span>{l.label}</span>
                </div>
                <Droppable id={l.id} highlight={highlight}>
                  {placed ? (
                    <Draggable id={placedRightId} label={placed.label} thumbnail={placed.thumbnail} disabled={locked} />
                  ) : (
                    <span className="text-xs text-[var(--color-text-dim)]">Drop here</span>
                  )}
                </Droppable>
                {locked && correctMap[l.id] !== placedRightId && (
                  <p className="col-span-2 text-xs text-[var(--color-text-dim)]">
                    Correct: <span className="text-[var(--color-correct)]">{labelOnRight[correctMap[l.id]].label}</span>
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Right tray of unplaced items */}
        <div className="grid gap-2">
          <p className="text-xs uppercase tracking-wide text-[var(--color-text-dim)]">Drag from</p>
          <div className="grid gap-2">
            {tray.map((r) => (
              <Draggable key={r.id} id={r.id} label={r.label} thumbnail={r.thumbnail} disabled={locked} />
            ))}
            {tray.length === 0 && (
              <p className="text-xs text-[var(--color-text-dim)]">All placed.</p>
            )}
          </div>
        </div>
      </div>
    </DndContext>
  );
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add components/questions/MatchQuestion.tsx
git commit -m "Add MatchQuestion renderer with dnd-kit drop zones and per-pair reveal"
```

---

### Task 19: Build quiz framing components

**Files:**
- Create: `components/quiz/QuizHeader.tsx`
- Create: `components/quiz/RevealPanel.tsx`
- Create: `components/quiz/NavBar.tsx`
- Create: `components/quiz/QuestionFrame.tsx`

- [ ] **Step 1: Implement QuizHeader**

```tsx
"use client";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  total: number;
  currentIndex: number;
  statusByIndex: Array<"unanswered" | "draft" | "confirmed">;
  onJump: (index: number) => void;
};

export function QuizHeader({ title, total, currentIndex, statusByIndex, onJump }: Props) {
  return (
    <header className="grid gap-3 mb-6">
      <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-wide text-[var(--color-text)]">
        {title}
      </h1>
      <div className="flex items-center gap-2">
        {Array.from({ length: total }).map((_, i) => {
          const status = statusByIndex[i];
          const isCurrent = i === currentIndex;
          const clickable = isCurrent || status === "confirmed";
          return (
            <button
              key={i}
              type="button"
              disabled={!clickable}
              onClick={() => clickable && onJump(i)}
              aria-label={`Question ${i + 1}`}
              className={cn(
                "w-2.5 h-2.5 rounded-full transition-colors",
                status === "confirmed"
                  ? "bg-[var(--color-accent)]"
                  : "bg-[var(--color-border-2)]",
                isCurrent && "ring-2 ring-[var(--color-accent)] ring-offset-2 ring-offset-[var(--color-bg)]",
                clickable ? "cursor-pointer hover:scale-110" : "cursor-not-allowed opacity-60",
              )}
            />
          );
        })}
        <span className="ml-2 text-xs text-[var(--color-text-dim)]">
          {Math.min(currentIndex + 1, total)} / {total}
        </span>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Implement RevealPanel**

```tsx
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function RevealPanel({ correct, explanation }: { correct: boolean; explanation: string }) {
  return (
    <div
      className={cn(
        "mt-4 p-4 rounded-md border animate-in slide-in-from-top-2 duration-250",
        correct
          ? "border-[var(--color-correct)] bg-[var(--color-correct)]/10"
          : "border-[var(--color-incorrect)] bg-[var(--color-incorrect)]/10",
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        {correct ? (
          <Check className="w-5 h-5 text-[var(--color-correct)]" />
        ) : (
          <X className="w-5 h-5 text-[var(--color-incorrect)]" />
        )}
        <span className="font-semibold text-[var(--color-text)]">
          {correct ? "Correct" : "Incorrect"}
        </span>
      </div>
      <p className="text-sm text-[var(--color-text)] leading-relaxed">{explanation}</p>
    </div>
  );
}
```

- [ ] **Step 3: Implement NavBar**

```tsx
"use client";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  canPrev: boolean;
  canConfirm: boolean;
  isConfirmed: boolean;
  isLast: boolean;
  onPrev: () => void;
  onConfirm: () => void;
  onNext: () => void;
};

export function NavBar({
  canPrev,
  canConfirm,
  isConfirmed,
  isLast,
  onPrev,
  onConfirm,
  onNext,
}: Props) {
  return (
    <div className="flex items-center justify-between mt-6">
      <Button
        variant="ghost"
        disabled={!canPrev}
        onClick={onPrev}
        className="text-[var(--color-text-dim)] hover:text-[var(--color-text)]"
      >
        <ChevronLeft className="w-4 h-4 mr-1" /> Previous
      </Button>
      {isConfirmed ? (
        <Button
          onClick={onNext}
          className="bg-[var(--color-accent)] hover:bg-[var(--color-accent)]/90 text-white"
        >
          {isLast ? "See Results" : "Next"} <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      ) : (
        <Button
          onClick={onConfirm}
          disabled={!canConfirm}
          className="bg-[var(--color-accent)] hover:bg-[var(--color-accent)]/90 text-white"
        >
          Confirm
        </Button>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Implement QuestionFrame**

```tsx
"use client";
import type { Question } from "@/lib/quiz-schema";
import type { AnswerState } from "@/lib/player-reducer";
import type { AnswerValue } from "@/lib/scoring";
import { Card } from "@/components/ui/card";
import { ZoomableImage } from "./ZoomableImage";
import { RevealPanel } from "./RevealPanel";
import { McSingleQuestionRenderer } from "@/components/questions/McSingleQuestion";
import { McMultiQuestionRenderer } from "@/components/questions/McMultiQuestion";
import { MatchQuestionRenderer } from "@/components/questions/MatchQuestion";
import { OrderQuestionRenderer } from "@/components/questions/OrderQuestion";
import { SliderQuestionRenderer } from "@/components/questions/SliderQuestion";
import { NameQuestionRenderer } from "@/components/questions/NameQuestion";

type Props = {
  question: Question;
  state: AnswerState;
  onChange: (value: AnswerValue) => void;
};

export function QuestionFrame({ question, state, onChange }: Props) {
  return (
    <Card className="p-6 bg-[var(--color-surface)] border-[var(--color-border)]">
      <h2 className="text-xl font-medium text-[var(--color-text)] mb-4">{question.prompt}</h2>
      {question.image && (
        <div className="mb-4 max-w-md mx-auto">
          <ZoomableImage src={question.image} alt={question.prompt} />
        </div>
      )}
      <Renderer question={question} state={state} onChange={onChange} />
      {state.status === "confirmed" && (
        <RevealPanel correct={state.correct} explanation={question.explanation} />
      )}
    </Card>
  );
}

function Renderer({ question, state, onChange }: Props) {
  switch (question.type) {
    case "mc-single":
      return <McSingleQuestionRenderer question={question} state={state} onChange={onChange as (v: string) => void} />;
    case "mc-multi":
      return <McMultiQuestionRenderer question={question} state={state} onChange={onChange as (v: string[]) => void} />;
    case "match":
      return <MatchQuestionRenderer question={question} state={state} onChange={onChange as (v: Record<string, string>) => void} />;
    case "order":
      return <OrderQuestionRenderer question={question} state={state} onChange={onChange as (v: string[]) => void} />;
    case "slider":
      return <SliderQuestionRenderer question={question} state={state} onChange={onChange as (v: number) => void} />;
    case "name":
      return <NameQuestionRenderer question={question} state={state} onChange={onChange as (v: string) => void} />;
  }
}
```

- [ ] **Step 5: Verify build**

```bash
npm run build
```

- [ ] **Step 6: Commit**

```bash
git add components/quiz/QuizHeader.tsx components/quiz/RevealPanel.tsx components/quiz/NavBar.tsx components/quiz/QuestionFrame.tsx
git commit -m "Add quiz framing components: header dots, reveal panel, nav bar, question frame"
```

---

### Task 20: Build Results screen

**Files:**
- Create: `components/quiz/Results.tsx`

- [ ] **Step 1: Implement**

```tsx
"use client";
import { useEffect } from "react";
import type { Quiz } from "@/lib/quiz-schema";
import type { AnswerState } from "@/lib/player-reducer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { recordAttempt } from "@/lib/storage";
import { Check, X } from "lucide-react";
import Link from "next/link";

type Props = {
  quiz: Quiz;
  answers: Record<string, AnswerState>;
  onRetry: () => void;
  onJumpTo: (index: number) => void;
};

export function Results({ quiz, answers, onRetry, onJumpTo }: Props) {
  const total = quiz.questions.length;
  const score = quiz.questions.reduce((acc, q) => {
    const a = answers[q.id];
    return acc + (a?.status === "confirmed" && a.correct ? 1 : 0);
  }, 0);

  useEffect(() => {
    recordAttempt(quiz.slug, score, total);
  }, [quiz.slug, score, total]);

  return (
    <Card className="p-6 bg-[var(--color-surface)] border-[var(--color-border)]">
      <div className="text-center mb-6">
        <p className="text-xs uppercase tracking-widest text-[var(--color-text-dim)]">Final score</p>
        <p className="font-[family-name:var(--font-display)] text-7xl text-[var(--color-accent)] tracking-wide">
          {score} <span className="text-[var(--color-text-dim)]">/ {total}</span>
        </p>
      </div>
      <ul className="grid gap-2 mb-6">
        {quiz.questions.map((q, i) => {
          const a = answers[q.id];
          const correct = a?.status === "confirmed" && a.correct;
          return (
            <li key={q.id}>
              <button
                type="button"
                onClick={() => onJumpTo(i)}
                className="w-full flex items-center gap-3 p-3 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)] hover:border-[var(--color-border-2)] text-left"
              >
                {correct ? (
                  <Check className="w-5 h-5 text-[var(--color-correct)] shrink-0" />
                ) : (
                  <X className="w-5 h-5 text-[var(--color-incorrect)] shrink-0" />
                )}
                <span className="text-sm text-[var(--color-text)] flex-1">{q.prompt}</span>
                <span className="text-xs text-[var(--color-text-dim)]">Review</span>
              </button>
            </li>
          );
        })}
      </ul>
      <div className="flex justify-between">
        <Button variant="ghost" asChild>
          <Link href="/quizzes">Back to quizzes</Link>
        </Button>
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

- [ ] **Step 2: Verify build**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add components/quiz/Results.tsx
git commit -m "Add Results screen with score banner, breakdown, retry, and per-row jump"
```

---

### Task 21: Build QuizPage (top-level player wiring)

**Files:**
- Create: `components/quiz/QuizPage.tsx`

- [ ] **Step 1: Implement**

```tsx
"use client";
import { useReducer, useMemo } from "react";
import type { Quiz } from "@/lib/quiz-schema";
import { initialState, playerReducer, type AnswerState } from "@/lib/player-reducer";
import { scoreQuestion, type AnswerValue } from "@/lib/scoring";
import { QuizHeader } from "./QuizHeader";
import { QuestionFrame } from "./QuestionFrame";
import { NavBar } from "./NavBar";
import { Results } from "./Results";

export function QuizPage({ quiz }: { quiz: Quiz }) {
  const [state, dispatch] = useReducer(playerReducer, quiz, initialState);

  const total = quiz.questions.length;
  const isResults = state.currentIndex >= total;
  const currentQuestion = isResults ? null : quiz.questions[state.currentIndex];
  const currentAnswer: AnswerState | null = currentQuestion
    ? state.answers[currentQuestion.id]
    : null;

  const statusByIndex = useMemo(
    () => quiz.questions.map((q) => state.answers[q.id]?.status ?? "unanswered"),
    [state.answers, quiz.questions],
  );

  function handleChange(value: AnswerValue) {
    if (!currentQuestion || !currentAnswer) return;
    if (currentAnswer.status === "confirmed") return; // read-only
    dispatch({ type: "setDraft", id: currentQuestion.id, value });
  }

  function handleConfirm() {
    if (!currentQuestion || !currentAnswer || currentAnswer.status !== "draft") return;
    const correct = scoreQuestion(currentQuestion, currentAnswer.value);
    dispatch({ type: "confirm", id: currentQuestion.id, correct });
  }

  return (
    <main className="max-w-3xl mx-auto p-6 grid gap-2">
      <QuizHeader
        title={quiz.title}
        total={total}
        currentIndex={Math.min(state.currentIndex, total - 1)}
        statusByIndex={statusByIndex}
        onJump={(i) => dispatch({ type: "jumpTo", index: i })}
      />
      {isResults ? (
        <Results
          quiz={quiz}
          answers={state.answers}
          onRetry={() => dispatch({ type: "reset", quiz })}
          onJumpTo={(i) => dispatch({ type: "jumpTo", index: i })}
        />
      ) : (
        currentQuestion &&
        currentAnswer && (
          <>
            <QuestionFrame
              question={currentQuestion}
              state={currentAnswer}
              onChange={handleChange}
            />
            <NavBar
              canPrev={state.currentIndex > 0}
              canConfirm={currentAnswer.status === "draft"}
              isConfirmed={currentAnswer.status === "confirmed"}
              isLast={state.currentIndex === total - 1}
              onPrev={() => dispatch({ type: "prev" })}
              onConfirm={handleConfirm}
              onNext={() => dispatch({ type: "next" })}
            />
          </>
        )
      )}
    </main>
  );
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add components/quiz/QuizPage.tsx
git commit -m "Add QuizPage top-level component wiring reducer, scoring, and results sentinel"
```

---

### Task 22: Seed example quiz JSON + images

**Files:**
- Create: `data/quizzes/example.json`
- Create: `public/quiz-images/*.jpg` (cover + per-question + thumbnails)

- [ ] **Step 1: Source images**

Pick canonical character images from a freely-licensed source (Wikipedia article images, or public-domain manga panels). Save them under `public/quiz-images/` with descriptive filenames:
```
public/quiz-images/
├── cover.jpg                  # Naruto-themed cover
├── q1-fourth-hokage.jpg       # Minato question central image
├── q1-thumb-minato.jpg
├── q1-thumb-tobirama.jpg
├── q1-thumb-hiruzen.jpg
├── q2-akatsuki.jpg            # Akatsuki cloak group shot
├── q3-sannin.jpg              # Three Sannin
├── q4-hokages.jpg             # Hokage statues
├── q5-tailed-beasts.jpg
├── q6-itachi.jpg
```

If you cannot easily source freely-licensed images during execution, use external URLs (Wikipedia direct image links) — the schema accepts both.

- [ ] **Step 2: Author `data/quizzes/example.json`**

```json
{
  "slug": "example",
  "title": "Naruto Knowledge — Sample Quiz",
  "description": "One of every question type. Six questions, six points possible.",
  "coverImage": "/quiz-images/cover.jpg",
  "questions": [
    {
      "id": "q1",
      "type": "mc-single",
      "prompt": "Who is the Fourth Hokage of the Hidden Leaf Village?",
      "image": "/quiz-images/q1-fourth-hokage.jpg",
      "options": [
        { "id": "minato", "label": "Minato Namikaze", "thumbnail": "/quiz-images/q1-thumb-minato.jpg" },
        { "id": "tobirama", "label": "Tobirama Senju", "thumbnail": "/quiz-images/q1-thumb-tobirama.jpg" },
        { "id": "hiruzen", "label": "Hiruzen Sarutobi", "thumbnail": "/quiz-images/q1-thumb-hiruzen.jpg" }
      ],
      "correctId": "minato",
      "explanation": "Minato Namikaze, the Yellow Flash, served as the Fourth Hokage. He sealed the Nine-Tails into his newborn son Naruto, dying in the process."
    },
    {
      "id": "q2",
      "type": "mc-multi",
      "prompt": "Which of the following are members of the Akatsuki?",
      "image": "/quiz-images/q2-akatsuki.jpg",
      "options": [
        { "id": "itachi", "label": "Itachi Uchiha" },
        { "id": "kisame", "label": "Kisame Hoshigaki" },
        { "id": "jiraiya", "label": "Jiraiya" },
        { "id": "pain", "label": "Pain" },
        { "id": "kakashi", "label": "Kakashi Hatake" },
        { "id": "konan", "label": "Konan" }
      ],
      "correctIds": ["itachi", "kisame", "pain", "konan"],
      "explanation": "Itachi, Kisame, Pain, and Konan were all Akatsuki members. Jiraiya was a Sannin and infiltrated Akatsuki only as a spy. Kakashi was never a member."
    },
    {
      "id": "q3",
      "type": "match",
      "prompt": "Match each Sannin to their summon.",
      "image": "/quiz-images/q3-sannin.jpg",
      "left": [
        { "id": "jiraiya", "label": "Jiraiya" },
        { "id": "tsunade", "label": "Tsunade" },
        { "id": "orochimaru", "label": "Orochimaru" }
      ],
      "right": [
        { "id": "toads", "label": "Toads" },
        { "id": "slugs", "label": "Slugs" },
        { "id": "snakes", "label": "Snakes" }
      ],
      "correctPairs": [
        { "leftId": "jiraiya", "rightId": "toads" },
        { "leftId": "tsunade", "rightId": "slugs" },
        { "leftId": "orochimaru", "rightId": "snakes" }
      ],
      "explanation": "Each Sannin signed a different summoning contract on Mount Myoboku, Shikkotsu Forest, and Ryuchi Cave respectively."
    },
    {
      "id": "q4",
      "type": "order",
      "prompt": "Order these Hokage from earliest reign to latest.",
      "image": "/quiz-images/q4-hokages.jpg",
      "items": [
        { "id": "hashirama", "label": "Hashirama Senju" },
        { "id": "tobirama", "label": "Tobirama Senju" },
        { "id": "hiruzen", "label": "Hiruzen Sarutobi" },
        { "id": "minato", "label": "Minato Namikaze" },
        { "id": "tsunade", "label": "Tsunade" }
      ],
      "axis": "horizontal",
      "startLabel": "Earliest",
      "endLabel": "Latest",
      "correctOrder": ["hashirama", "tobirama", "hiruzen", "minato", "tsunade"],
      "explanation": "Hashirama (1st) → Tobirama (2nd) → Hiruzen (3rd) → Minato (4th) → Tsunade (5th). Hiruzen returned briefly between Minato and Tsunade but his second term doesn't count as a separate Hokage seat."
    },
    {
      "id": "q5",
      "type": "slider",
      "prompt": "How many tailed beasts are there in total?",
      "image": "/quiz-images/q5-tailed-beasts.jpg",
      "min": 0,
      "max": 10,
      "step": 1,
      "correctValue": 9,
      "explanation": "There are nine tailed beasts, originally split off from the Ten-Tails (Jubi). Numbered One-Tail (Shukaku) through Nine-Tails (Kurama)."
    },
    {
      "id": "q6",
      "type": "name",
      "prompt": "Name Sasuke's older brother.",
      "image": "/quiz-images/q6-itachi.jpg",
      "acceptedAnswers": ["Itachi Uchiha", "Itachi"],
      "explanation": "Itachi Uchiha massacred the Uchiha clan under orders from Konoha's leadership to prevent a coup, sparing only his younger brother Sasuke."
    }
  ]
}
```

- [ ] **Step 3: Verify the loader accepts it**

Add a one-off test to confirm the example file passes validation. Append to `__tests__/load-quizzes.test.ts`:
```ts
import path from "node:path";

it("loads the seeded example quiz from data/quizzes/", () => {
  const dir = path.join(process.cwd(), "data", "quizzes");
  const quizzes = loadQuizzesFrom(dir);
  expect(quizzes.find((q) => q.slug === "example")).toBeTruthy();
});
```

- [ ] **Step 4: Run tests**

```bash
npm test -- load-quizzes
```
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add data/quizzes/example.json public/quiz-images/ __tests__/load-quizzes.test.ts
git commit -m "Seed example quiz with one of each question type and matching images"
```

---

### Task 23: Build main menu, quiz list, builder/manager stubs

**Files:**
- Modify: `app/page.tsx`
- Create: `app/quizzes/page.tsx`
- Create: `app/quizzes/[slug]/page.tsx`
- Create: `app/builder/page.tsx`
- Create: `app/manager/page.tsx`
- Create: `components/menu/QuizListClient.tsx`

- [ ] **Step 1: Replace `app/page.tsx` with the main menu**

```tsx
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Hammer, FolderOpen } from "lucide-react";

const cards = [
  { href: "/quizzes", title: "Quizzes", desc: "Browse quizzes and your top scores.", icon: Trophy, badge: null },
  { href: "/builder", title: "Quiz builder", desc: "Create a new quiz.", icon: Hammer, badge: "Coming soon" },
  { href: "/manager", title: "Quiz manager", desc: "Edit and publish quizzes.", icon: FolderOpen, badge: "Coming soon" },
];

export default function Home() {
  return (
    <main className="max-w-3xl mx-auto p-6 grid gap-6">
      <header className="text-center py-8">
        <h1 className="font-[family-name:var(--font-display)] text-6xl tracking-wider text-[var(--color-text)]">
          NARUTO QUIZ
        </h1>
        <p className="text-[var(--color-text-dim)] mt-2">
          How well do you really know the Hidden Leaf?
        </p>
      </header>
      <div className="grid gap-4 md:grid-cols-3">
        {cards.map((c) => (
          <Link key={c.href} href={c.href}>
            <Card className="p-5 bg-[var(--color-surface)] border-[var(--color-border)] hover:border-[var(--color-accent)] transition-colors h-full grid gap-2">
              <div className="flex items-center justify-between">
                <c.icon className="w-6 h-6 text-[var(--color-accent)]" />
                {c.badge && (
                  <Badge variant="outline" className="text-xs border-[var(--color-border-2)] text-[var(--color-text-dim)]">
                    {c.badge}
                  </Badge>
                )}
              </div>
              <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--color-text)]">
                {c.title}
              </h2>
              <p className="text-sm text-[var(--color-text-dim)]">{c.desc}</p>
            </Card>
          </Link>
        ))}
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Implement `app/quizzes/page.tsx` as a server component delegating to a client list**

```tsx
import Link from "next/link";
import { loadQuizzes } from "@/lib/load-quizzes";
import { QuizListClient } from "@/components/menu/QuizListClient";

export default function QuizzesPage() {
  const quizzes = loadQuizzes();
  return (
    <main className="max-w-3xl mx-auto p-6">
      <Link href="/" className="text-sm text-[var(--color-text-dim)] hover:text-[var(--color-text)]">
        ← Main menu
      </Link>
      <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--color-text)] mt-4 mb-6">
        Quizzes
      </h1>
      <QuizListClient
        quizzes={quizzes.map((q) => ({
          slug: q.slug,
          title: q.title,
          description: q.description ?? null,
          questionCount: q.questions.length,
          coverImage: q.coverImage ?? null,
        }))}
      />
    </main>
  );
}
```

- [ ] **Step 3: Implement `components/menu/QuizListClient.tsx`**

```tsx
"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { getAllScores, type ScoreStore } from "@/lib/storage";

type ListItem = {
  slug: string;
  title: string;
  description: string | null;
  questionCount: number;
  coverImage: string | null;
};

export function QuizListClient({ quizzes }: { quizzes: ListItem[] }) {
  const [scores, setScores] = useState<ScoreStore>({});

  useEffect(() => {
    setScores(getAllScores());
  }, []);

  return (
    <div className="grid gap-3">
      {quizzes.map((q) => {
        const score = scores[q.slug];
        return (
          <Link key={q.slug} href={`/quizzes/${q.slug}`}>
            <Card className="p-4 bg-[var(--color-surface)] border-[var(--color-border)] hover:border-[var(--color-accent)] transition-colors flex items-center gap-4">
              {q.coverImage && (
                <img
                  src={q.coverImage}
                  alt={q.title}
                  className="w-16 h-16 rounded object-cover"
                />
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-[family-name:var(--font-display)] text-2xl text-[var(--color-text)]">
                  {q.title}
                </h3>
                {q.description && (
                  <p className="text-sm text-[var(--color-text-dim)] truncate">{q.description}</p>
                )}
                <p className="text-xs text-[var(--color-text-dim)] mt-1">
                  {q.questionCount} questions
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs uppercase tracking-wide text-[var(--color-text-dim)]">Top score</p>
                <p className="font-mono text-lg text-[var(--color-accent)]">
                  {score ? `${score.bestScore} / ${score.bestOutOf}` : "—"}
                </p>
              </div>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 4: Implement `app/quizzes/[slug]/page.tsx`**

```tsx
import { notFound } from "next/navigation";
import { loadQuizzes } from "@/lib/load-quizzes";
import { QuizPage } from "@/components/quiz/QuizPage";

export async function generateStaticParams() {
  return loadQuizzes().map((q) => ({ slug: q.slug }));
}

export default async function QuizRoute({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const quiz = loadQuizzes().find((q) => q.slug === slug);
  if (!quiz) notFound();
  return <QuizPage quiz={quiz} />;
}
```

- [ ] **Step 5: Implement `app/builder/page.tsx` and `app/manager/page.tsx`**

`app/builder/page.tsx`:
```tsx
import Link from "next/link";

export default function BuilderPage() {
  return (
    <main className="max-w-3xl mx-auto p-6 grid gap-4">
      <Link href="/" className="text-sm text-[var(--color-text-dim)] hover:text-[var(--color-text)]">
        ← Main menu
      </Link>
      <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--color-text)]">
        Quiz Builder
      </h1>
      <p className="text-[var(--color-text-dim)]">Coming soon. This is where you'll create new quizzes.</p>
    </main>
  );
}
```

`app/manager/page.tsx`:
```tsx
import Link from "next/link";

export default function ManagerPage() {
  return (
    <main className="max-w-3xl mx-auto p-6 grid gap-4">
      <Link href="/" className="text-sm text-[var(--color-text-dim)] hover:text-[var(--color-text)]">
        ← Main menu
      </Link>
      <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--color-text)]">
        Quiz Manager
      </h1>
      <p className="text-[var(--color-text-dim)]">Coming soon. This is where you'll edit and publish quizzes.</p>
    </main>
  );
}
```

- [ ] **Step 6: Verify build and dev server**

```bash
npm run build
npm run dev &
sleep 4
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/quizzes
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/quizzes/example
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/builder
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/manager
kill %1
```
Expected: all `200`.

- [ ] **Step 7: Manual verification (open browser)**

```bash
npm run dev
```
Open http://localhost:3000 and click through:
1. Main menu shows three cards.
2. Click Quizzes → list shows the example quiz with `—` top score.
3. Click the example quiz → quiz player loads on Q1.
4. For each of the 6 question types: interact, click Confirm, see reveal, click Next.
5. After Q6, Results screen renders with score banner; click a row to revisit a question read-only.
6. Click Retry quiz → state resets to Q1.
7. Re-finish with a new score → list page now shows the saved top score.
8. Test image zoom on the central image and on a thumbnail.

If any of these fails, fix the related component before proceeding.

- [ ] **Step 8: Commit**

```bash
git add app/page.tsx app/quizzes/ app/builder/ app/manager/ components/menu/
git commit -m "Add main menu, quizzes list with localStorage scores, slug route, builder/manager stubs"
```

---

### Task 24: Wikipedia character scrape script

**Files:**
- Create: `scripts/scrape-characters.ts`
- Modify: `data/characters.json`

- [ ] **Step 1: Implement scraper**

The cleanest single source for manga-canon Naruto characters is Wikipedia's character list articles. We'll fetch their HTML, extract character names from the structured sections (Part I + Part II main characters, supporting cast, antagonists), filter to manga-only, and write a deduped sorted array.

`scripts/scrape-characters.ts`:
```ts
/**
 * Scrapes Wikipedia's Naruto character list pages to produce data/characters.json.
 *
 * Usage: npx tsx scripts/scrape-characters.ts
 *
 * The script fetches a small set of Wikipedia pages, extracts heading-cased
 * character names from list items and h3/h4 headings, then dedupes. Anime-only
 * filler arcs are not on these pages by editorial convention. Boruto-only
 * characters live on a separate Wikipedia article and are excluded.
 */
import fs from "node:fs";
import path from "node:path";

const SOURCES = [
  "https://en.wikipedia.org/wiki/List_of_Naruto_characters",
  "https://en.wikipedia.org/wiki/List_of_Naruto_supporting_characters",
];

// Heuristic name matcher: 1-4 capitalized words, allowing hyphens/apostrophes.
const NAME_RE = /\b([A-Z][a-zëûōū'-]+(?:\s+[A-Z][a-zëûōū'-]+){0,3})\b/g;

// Words that look like names but aren't characters; pruned post-extraction.
const STOP = new Set([
  "Naruto", "Shippuden", "Boruto", "Hidden", "Leaf", "Konoha",
  "Akatsuki", "Sannin", "Hokage", "Sand", "Sound", "Cloud",
  "Mist", "Stone", "Rain", "Land", "Village", "Country", "Wind", "Fire",
  "Water", "Earth", "Lightning", "Part", "List", "Manga", "Anime",
  "Wikipedia", "Main", "Supporting", "Antagonists", "Allies", "Five",
  "Great", "Tailed", "Beast", "Beasts", "Nine", "Tails", "Tail",
  "Chunin", "Genin", "Jonin", "Kage", "Hyuga", "Uchiha", "Uzumaki", "Senju",
  "Sarutobi", "Hatake", "Aburame", "Akimichi", "Inuzuka", "Yamanaka",
  "Nara", "Hyuuga",
]);

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url, { headers: { "User-Agent": "naruto-quiz-scrape" } });
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return await res.text();
}

function extractNames(html: string): string[] {
  // Strip script/style blocks.
  const cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "");

  // Strip tags but preserve text spacing.
  const text = cleaned.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");

  const out = new Set<string>();
  for (const m of text.matchAll(NAME_RE)) {
    const candidate = m[1].trim();
    // Reject single capitalized words that are likely common nouns.
    const parts = candidate.split(/\s+/);
    if (parts.length === 1) continue;
    // Reject if every word is in STOP.
    if (parts.every((p) => STOP.has(p))) continue;
    out.add(candidate);
  }
  return Array.from(out);
}

async function main() {
  const all = new Set<string>();
  for (const src of SOURCES) {
    console.log(`Fetching ${src}...`);
    const html = await fetchText(src);
    for (const name of extractNames(html)) all.add(name);
  }
  const sorted = Array.from(all).sort((a, b) => a.localeCompare(b));
  const out = path.join(process.cwd(), "data", "characters.json");
  fs.writeFileSync(out, JSON.stringify(sorted, null, 2) + "\n");
  console.log(`Wrote ${sorted.length} names to ${out}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 2: Add `tsx` as a dev dep**

```bash
npm install -D tsx
```

- [ ] **Step 3: Run the scraper**

```bash
npx tsx scripts/scrape-characters.ts
```
Expected: writes `data/characters.json` with several hundred names. If output is implausibly small (<100) or huge (>5000), the heuristic needs tuning — review and adjust `NAME_RE`/`STOP` and re-run.

- [ ] **Step 4: Manual sanity check**

```bash
node -e 'const c = require("./data/characters.json"); console.log(c.length, c.includes("Itachi Uchiha"), c.includes("Naruto Uzumaki"), c.includes("Kakashi Hatake"))'
```
Expected: count 200+, all three booleans `true`.

If any of the canonical main characters are missing, the heuristic is dropping multi-part names — adjust the regex or stop list and re-run before committing.

- [ ] **Step 5: Commit**

```bash
git add scripts/scrape-characters.ts data/characters.json package.json package-lock.json
git commit -m "Add Wikipedia character scrape script and generated data/characters.json"
```

---

### Task 25: Create GitHub repo and link Vercel

**Files:**
- Modify: `README.md` (created by `create-next-app`, may need an update)

- [ ] **Step 1: Replace `README.md` with a project-relevant one**

```markdown
# Naruto Quiz

A static-friendly Next.js quiz site for Naruto and Naruto: Shippuden trivia.

## Development

```bash
npm install
npm run dev
```

## Test

```bash
npm test
```

## Adding a quiz

Drop a JSON file into `data/quizzes/`. It must conform to the zod schema in `lib/quiz-schema.ts`. The build will fail with a clear error if any field is invalid.

## Regenerating the character list

```bash
npx tsx scripts/scrape-characters.ts
```

This rewrites `data/characters.json` from Wikipedia's character list articles.

## Deployment

Pushed to `main` triggers an automatic Vercel deploy.
```

- [ ] **Step 2: Confirm everything still passes**

```bash
npm test
npm run build
```
Expected: tests pass, build succeeds.

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "Update README with project-specific instructions"
```

- [ ] **Step 4: Create GitHub repo (manual step — confirm with user before running)**

This is a destructive/visible action. Confirm with the user before executing. If they want a public repo:
```bash
gh repo create naruto-quiz --public --source=. --remote=origin --push
```
For private:
```bash
gh repo create naruto-quiz --private --source=. --remote=origin --push
```

If `gh` is not installed or authed, abort and ask the user to install/auth, or to create the repo manually via the GitHub web UI and then run:
```bash
git remote add origin git@github.com:<user>/naruto-quiz.git
git push -u origin main
```

- [ ] **Step 5: Connect Vercel (manual step — instruct the user)**

Print these instructions to the user, do NOT attempt automated linking:
1. Go to https://vercel.com/new.
2. Import the `naruto-quiz` GitHub repo.
3. Framework preset auto-detects as Next.js — accept defaults.
4. Click Deploy.
5. Once the first deploy completes, paste the production URL back into the chat. Verify by hitting it and clicking through the example quiz.

- [ ] **Step 6: Verify deployment (after user provides URL)**

```bash
curl -s -o /dev/null -w "%{http_code}\n" <production-url>
curl -s -o /dev/null -w "%{http_code}\n" <production-url>/quizzes/example
```
Expected: both `200`.

---

## Self-Review Checklist

Run through this before declaring the plan complete:

**Spec coverage** — every spec section has at least one task:
- Architecture / stack → Task 1, 2, 4, 5
- Repo layout → Task 1 + tasks creating each file
- Deployment (GitHub, Vercel) → Task 25
- Data flow (build-time validation) → Task 10
- Quiz JSON schema (all 6 types) → Task 6
- localStorage shape → Task 9
- Player state machine → Task 11
- Per-question lifecycle (draft → confirmed → reveal → next) → Task 21 (QuizPage) + Task 19 (NavBar)
- Read-only revisit → Task 21 (`onChange` short-circuits when `confirmed`) + each renderer's `locked` prop
- Component tree → Tasks 12–21
- Image zoom → Task 12
- Results sentinel → Task 20, 21
- Visual design tokens → Task 4
- Display font (Bebas Neue) → Task 4, used in headers in Tasks 19, 20, 23
- Dark Ninja reveal styling per type → Tasks 13–18
- Lucide icons → Tasks 13, 14, 17, 19, 20, 23
- Desktop-first responsiveness → handled in component layouts (max-w wrappers)
- Example quiz with one of each type → Task 22
- Character scrape + autocomplete → Tasks 16, 24
- Main menu / quizzes list / builder / manager → Task 23
- Out-of-scope items: not implemented (correct)

**Placeholder scan:**
- No "TBD" / "TODO" — confirmed.
- Every code-changing step has the actual code — confirmed.
- Test code present in every TDD task — confirmed.
- Exact commands in every "run" step — confirmed.

**Type consistency:**
- `AnswerState` defined once in `lib/player-reducer.ts`, imported by every consumer.
- `AnswerValue` defined once in `lib/scoring.ts`, imported by reducer and components.
- `QuestionProps<Q, V>` defined once in `components/questions/types.ts`.
- Question type exports (`McSingleQuestion`, etc.) come from `lib/quiz-schema.ts` and are imported by their renderers — names match.
- Storage API: `getScore`, `recordAttempt`, `getAllScores`, `ScoreStore` — used consistently in storage tests and the QuizListClient + Results.

Plan is complete.
