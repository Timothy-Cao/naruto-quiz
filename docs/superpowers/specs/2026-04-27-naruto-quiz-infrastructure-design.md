# Naruto Quiz — Infrastructure & Player (Phase 1) Design

**Status:** Approved for implementation planning
**Date:** 2026-04-27
**Scope:** Phase 1 only. Quiz Builder (Phase 2) and Quiz Manager edit/publish workflow (Phase 3) are explicitly deferred.

## Goal

Stand up a Naruto-themed quiz site as a GitHub repo deployed to Vercel. Phase 1 ships the player infrastructure end-to-end, with one seeded example quiz that exercises every supported question type, and stub pages for the future Builder and Manager.

## Architecture

### Stack

- **Next.js 15** (App Router) + **TypeScript**
- **Tailwind CSS v4** + **shadcn/ui** primitives
- **`@dnd-kit/core`** for drag-and-drop
- **`zod`** for runtime validation of quiz JSON
- **Lucide** icons (bundled with shadcn)

### Repo layout

```
naruto-quiz/
├── app/
│   ├── page.tsx                  # Main menu (3 cards: Quizzes, Builder, Manager)
│   ├── quizzes/
│   │   ├── page.tsx              # Quiz list + top scores
│   │   └── [slug]/page.tsx       # Quiz player
│   ├── builder/page.tsx          # Stub: "Coming soon"
│   ├── manager/page.tsx          # Stub: "Coming soon"
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── quiz/                     # Player, navigation, results, reveal panel
│   ├── questions/                # One renderer per question type
│   └── ui/                       # shadcn primitives
├── lib/
│   ├── quiz-schema.ts            # zod schemas + TS types
│   ├── scoring.ts                # all-or-nothing scoring per type
│   ├── storage.ts                # localStorage adapter for scores
│   └── load-quizzes.ts           # reads /data/quizzes/*.json at build, validates
├── data/
│   ├── quizzes/
│   │   └── example.json          # Seeded one-of-each-type quiz
│   └── characters.json           # Scraped Naruto + Shippuden manga character names
├── public/quiz-images/           # Local images for example quiz
├── scripts/
│   └── scrape-characters.ts      # One-time scraper, commits names to data/
└── (next.config, tsconfig, package.json, etc.)
```

### Deployment

- New GitHub repo, new linked Vercel project, auto-deploy from `main`.
- No backend / no API routes in Phase 1. Pure static-friendly Next.js build.
- `.gitignore` includes `.superpowers/` (brainstorm artifacts) and `node_modules/`, `.next/`, `.vercel/`, `.env*.local`.

### Data flow

- Quizzes are imported at build time via `lib/load-quizzes.ts`. It reads every file in `data/quizzes/`, parses each with the zod schema, and fails the build with a clear path-and-field error on any violation.
- High scores live in `localStorage`, keyed by quiz slug. There is no shared leaderboard.

## Data model

### Common envelope

Every question in a quiz file shares this shape:

```ts
type QuestionBase = {
  id: string                      // stable, used as React key + score recall
  type: "mc-single" | "mc-multi" | "match" | "order" | "slider" | "name"
  prompt: string                  // the question text
  image?: ImageRef                // optional central image
  explanation: string             // shown on reveal
}

// ImageRef: either a path under /public ("/quiz-images/foo.png")
// or a full URL ("https://..."). Resolved by checking startsWith("http").
type ImageRef = string
```

### Type-specific shapes

```ts
// mc-single
type McSingle = QuestionBase & {
  type: "mc-single"
  options: { id: string; label: string; thumbnail?: ImageRef }[]
  correctId: string
}

// mc-multi (order-insensitive set match)
type McMulti = QuestionBase & {
  type: "mc-multi"
  options: { id: string; label: string; thumbnail?: ImageRef }[]
  correctIds: string[]
}

// match — drag-drop, 1:1 only in v1
type Match = QuestionBase & {
  type: "match"
  left:  { id: string; label: string; thumbnail?: ImageRef }[]
  right: { id: string; label: string; thumbnail?: ImageRef }[]
  correctPairs: { leftId: string; rightId: string }[]   // length === left.length
}

// order — single direction, axis configurable per question
type Order = QuestionBase & {
  type: "order"
  items: { id: string; label: string; thumbnail?: ImageRef }[]
  axis: "horizontal" | "vertical"
  startLabel: string              // e.g. "Youngest" — left or top
  endLabel: string                // e.g. "Oldest"  — right or bottom
  correctOrder: string[]          // ordered ids start→end
}

// slider — integers only in v1, range overridable per question
type Slider = QuestionBase & {
  type: "slider"
  min: number
  max: number
  step: number                    // integer
  correctValue: number
}

// name — autocomplete from data/characters.json
type Name = QuestionBase & {
  type: "name"
  acceptedAnswers: string[]       // canonical names
  // Match rule: case-insensitive substring match against any acceptedAnswers entry,
  // with leading/trailing whitespace trimmed.
}
```

### Quiz envelope

```ts
type Quiz = {
  slug: string                    // URL slug; also localStorage key
  title: string
  description?: string
  coverImage?: ImageRef
  questions: Question[]
}
```

### localStorage shape

```ts
// key: "naruto-quiz:scores"
type ScoreStore = {
  [slug: string]: {
    bestScore: number             // e.g. 7
    bestOutOf: number             // e.g. 10
    bestAt: string                // ISO timestamp
    attempts: number
  }
}
```

## Player flow

### State machine

Player state is scoped to the quiz route and held in a single `useReducer` (or a small zustand store, decided at implementation time):

```ts
type PlayerState = {
  currentIndex: number
  answers: Record<questionId, AnswerState>
}

type AnswerState =
  | { status: "unanswered" }
  | { status: "draft", value: TypeSpecificValue }     // selected, not confirmed
  | { status: "confirmed", value: TypeSpecificValue, correct: boolean }
```

### Per-question lifecycle

1. `unanswered` → user interacts → `draft`. **Confirm** button enables.
2. **Confirm** → `draft` → `confirmed`. Reveal panel slides in (correct answer + explanation). **Next** button appears.
3. **Next** → advance `currentIndex`. Disabled until confirmed.
4. **Previous** is always enabled when `currentIndex > 0`. Navigating back to a `confirmed` question shows the read-only reveal view (their answer + correct + explanation). They cannot re-interact or change the answer.
5. On the last question, the **Next** label becomes **See Results**.

### Component tree

```
<QuizPage>
  <QuizHeader title progressDots />          # 1 ●●○○○ N — confirmed dots and the current dot are clickable; future dots are not
  <QuestionFrame>
    <QuestionPrompt + optional CentralImage zoom-on-click />
    {one of:
      <McSingleQuestion /> <McMultiQuestion /> <MatchQuestion />
      <OrderQuestion />    <SliderQuestion />  <NameQuestion />}
    {if confirmed:
      <RevealPanel correctness explanation />}
  </QuestionFrame>
  <NavBar prev confirm|next />
</QuizPage>
```

Each `<XxxQuestion>` component is a controlled input: it receives `{ question, value, status, onChange }`, renders the input UI for its type, and bubbles draft values up. The player owns the state machine; question components are dumb.

### Image zoom

Any `<ImageRef>` (central or thumbnail) renders inside a `<ZoomableImage>` wrapper that opens a shadcn `<Dialog>` with the full-size image on click.

### Results

Rendered when `currentIndex === questions.length` (sentinel state, same route — not a separate URL).

- **Score banner** — "7 / 10".
- **Per-question table** — ✓/✗ icon, question prompt, your answer summary. Each row is clickable, jumping back into the quiz at that question in read-only mode. From there, a **Back to Results** button returns.
- **Retry quiz** — resets player state to a fresh `unanswered` map.
- **Back to quizzes** — navigates to `/quizzes`.
- On render, `lib/storage.ts` updates the localStorage best-score for this quiz if the new score beat the previous best, and increments `attempts`.

## Scoring

All-or-nothing, 1 point per question:

- **mc-single:** chosen `id === correctId`
- **mc-multi:** set equality between chosen ids and `correctIds`
- **match:** every pair in user's mapping appears in `correctPairs`
- **order:** user array deep-equals `correctOrder`
- **slider:** user value `=== correctValue`
- **name:** trimmed, lowercased user input is a substring of (or equal to) at least one lowercased entry in `acceptedAnswers`. So "kakashi" matches "Kakashi Hatake", but "Kakashi Hatake the Sixth" does not match "Kakashi Hatake".

Per-question fractional/tolerance scoring is explicitly deferred.

## Visual design — Dark Ninja

### Theme tokens

Defined as Tailwind v4 `@theme` variables in `app/globals.css`:

```
--color-bg          #0c0a09
--color-surface     #1c1917
--color-surface-2   #292524
--color-border      #292524
--color-border-2    #44403c
--color-text        #fafaf9
--color-text-dim    #a8a29e
--color-accent      #f97316
--color-accent-2    #dc2626
--color-correct     #22c55e
--color-incorrect   #ef4444
```

### Typography

- Body & UI: system-ui sans.
- Display (question prompts, home title): **Bebas Neue** (loaded via `next/font/google`).
- Mono only for the slider value readout.

### Shapes & motion

- Corner radii: 12px on cards, 8px on inputs, full-pill on small badges.
- Borders: 1px subtle. Avoid heavy shadows (muddy in dark mode).
- 150ms ease for hover/select. 250ms slide-in for the reveal panel. 400ms cross-fade between questions on next/prev. No bouncy/scale transforms.

### Reveal styling per type

- **mc-single / mc-multi:** chosen option border turns green or red with a corner icon. If user was wrong, the correct option also gets a green outline.
- **match:** correct pairs lock in green; wrong pairs flash red, then snap to the correct partner.
- **order:** items animate to correct positions; rows already in place get a green left-border, rows that moved animate red → green.
- **slider:** track shows two markers — user value (white), correct value (green). Caption: "You: 7 · Correct: 9".
- **name:** input outlines green/red; if wrong, the correct canonical name shows below.

### Iconography

Lucide for UI icons. A small Konoha leaf SVG appears only as the home/header logo accent — not used decoratively elsewhere.

### Responsiveness

Desktop-first. Mobile must not break (the layout reflows, drag-drop falls back to tap-to-pick if touch is detected) but receives no special polish in Phase 1.

## Example quiz content

Seeded as `data/quizzes/example.json`. Every question type appears once. Each has a central image committed under `/public/quiz-images/` and a written explanation.

1. **mc-single** — "Who is the Fourth Hokage?" → Minato Namikaze. Options have small character thumbnails.
2. **mc-multi** — "Which of the following are members of the Akatsuki?" — 6 options (Itachi, Kisame, Jiraiya, Pain, Kakashi, Konan); correct set = {Itachi, Kisame, Pain, Konan}.
3. **match** — "Match each Sannin to their summon." Left fixed: Jiraiya / Tsunade / Orochimaru. Right draggable: Toads / Slugs / Snakes.
4. **order** — "Order these Hokage from earliest to latest reign." Items: Hashirama, Tobirama, Hiruzen, Minato, Tsunade. `axis: "horizontal"`, `startLabel: "Earliest"`, `endLabel: "Latest"`.
5. **slider** — "How many tailed beasts are there?" `min: 0, max: 10, step: 1`, correct 9.
6. **name** — "Name Sasuke's older brother." `acceptedAnswers: ["Itachi Uchiha", "Itachi"]`. Autocomplete sourced from `data/characters.json`.

## Character name list

`data/characters.json` is generated by `scripts/scrape-characters.ts`. The scraper targets the Wikipedia "List of Naruto characters" article (cleaner manga-canon scope than the fandom wiki). Goal: ≥95% coverage of named manga characters from Naruto and Naruto: Shippuden, excluding anime-only filler and Boruto-only characters.

The script is run locally (not in CI). The committed `characters.json` is the source of truth for the name-select autocomplete. If a single source falls short of 95%, a second pass merges in additional names.

## Main menu pages

Three navigation cards on `/`:

- **Quizzes** → `/quizzes`. Lists all quizzes from `data/quizzes/`. Each row shows title, description, and the user's top score from localStorage (or `—` if no attempts).
- **Quiz builder** → `/builder`. Stub page reading "Coming soon", with back link. The card on the main menu shows a small "Coming soon" badge.
- **Quiz manager** → `/manager`. Same stub treatment.

## Out of scope (Phase 1)

These are explicitly NOT in this build:

- Quiz builder UI (Phase 2).
- Quiz manager edit/publish workflow (Phase 3).
- GitHub-write API routes (needed by Builder/Manager to commit quiz JSON).
- Authentication / accounts.
- Shared/global leaderboards or any backend.
- Mobile polish.
- Per-question scoring tolerance (slider ±N, multi-select partial credit).
- i18n / locales — English only.
- Analytics / telemetry.
- Question shuffling, timed mode, lives, hints.
