# Quiz Builder + Manager (Phase 2 + 3) Design

**Status:** Approved for implementation planning
**Date:** 2026-04-27
**Scope:** Phases 2 and 3 from the original phasing — admin authoring tool that produces JSON conforming to the existing quiz schema, plus a manager view for editing committed quizzes. Player UX changes are limited to the scoring math update.

## Goal

Provide an admin-only UI to author and edit quizzes that conform to the existing static-JSON schema. Output is a downloadable `.json` file that the admin commits to `data/quizzes/` by hand. Adds flexible per-question scoring schemes and a live preview pane that renders questions exactly as players see them.

## Architecture

### Storage model

Static JSON in repo, unchanged from Phase 1. The builder produces a downloadable file; commits happen manually via git. No `GITHUB_TOKEN`, no API route that writes to the filesystem.

### Stack additions

No new runtime dependencies expected — uses existing zod, dnd-kit, shadcn primitives, and the player components.

### Routes

| Route | Purpose | Component |
|---|---|---|
| `/builder` | New quiz, empty initial state | `<QuizEditor>` |
| `/manager` | List of committed quizzes ∪ local drafts, click to edit | `<ManagerList>` |
| `/manager/[slug]` | Edit existing quiz | `<QuizEditor initialQuiz={...}>` |

All three are server components that call `getCurrentAuthUser()` and wrap content in `<AdminGate>`. Without admin sign-in, the same forbidden message we already show.

### Layout (editor)

```
┌──────────────────────────────────────────────────────────┐
│ Header: title input, slug, description, cover URL        │
├──────────────────────────────┬───────────────────────────┤
│ Question list (form side)    │ Preview pane              │
│ ┌──────────────────────────┐ │ ┌───────────────────────┐ │
│ │ Q1 — mc-single  [⋮ drag] │ │ │  <QuestionFrame>      │ │
│ │   prompt, options...     │ │ │  rendering of current │ │
│ │   scoring config         │ │ │  question, in the     │ │
│ ├──────────────────────────┤ │ │  Dark Ninja theme     │ │
│ │ Q2 — categorize          │ │ │                       │ │
│ │   ...                    │ │ └───────────────────────┘ │
│ └──────────────────────────┘ │                           │
│ [+ Add question ▾]           │                           │
├──────────────────────────────┴───────────────────────────┤
│ Bottom bar: validation status · Discard draft · Download │
└──────────────────────────────────────────────────────────┘
```

## Schema additions (`lib/quiz-schema.ts`)

Each question type gets an **optional** `scoring` field. When absent, scoring defaults to all-or-nothing with `maxPoints: 1` — so existing `data/quizzes/example.json` keeps working without edits.

```ts
// Shared base across all types — every question accepts:
scoring?: {
  maxPoints?: number;            // default 1
}

// Type-specific scoring extensions:

// mc-single, name — no partial credit possible:
scoring?: { maxPoints?: number; }

// mc-multi:
scoring?: {
  maxPoints?: number;
  scheme?: "all-or-nothing" | "per-option";
}

// categorize:
scoring?: {
  maxPoints?: number;
  scheme?: "all-or-nothing" | "per-item";
}

// order:
scoring?: {
  maxPoints?: number;
  scheme?: "all-or-nothing" | "per-position";
}

// slider:
scoring?: {
  maxPoints?: number;
  scheme?: "all-or-nothing" | "tolerance";
  tolerance?: number;             // required when scheme = tolerance
  partialCredit?: number;         // 0..1, required when scheme = tolerance
}
```

Validation: when `scheme: "tolerance"`, `tolerance` and `partialCredit` are required (zod `.refine()`); `partialCredit` clamped to `[0, 1]`.

## Scoring engine update (`lib/scoring.ts`)

```ts
export type ScoreResult = { points: number; maxPoints: number };

export function scoreQuestion(q: Question, value: AnswerValue): ScoreResult;
```

Replaces today's `boolean` return. Internal switch dispatches per type and per scheme:

- **mc-single:** `value === q.correctId ? max : 0`
- **mc-multi all-or-nothing:** set equality → max or 0
- **mc-multi per-option:** `(correctly_selected + correctly_not_selected) / total_options × max`
- **categorize all-or-nothing:** every item placed in correct bucket → max or 0
- **categorize per-item:** `(items_in_correct_bucket / total_items) × max`
- **order all-or-nothing:** array deep-equal → max or 0
- **order per-position:** `(items_in_correct_position / total_items) × max`
- **slider all-or-nothing:** `value === correctValue ? max : 0`
- **slider tolerance:** `value === correctValue ? max : (Math.abs(value - correctValue) <= tolerance ? max * partialCredit : 0)`
- **name:** `matchName(value, accepted) ? max : 0`

`maxPoints` defaults to 1 when not specified.

## Player impacts

The smallest possible blast radius — only the math changes:

- `RevealPanel` shows "X / Y points" subtle text when `maxPoints > 1` or partial credit was earned. For binary questions still showing the existing "Correct / Incorrect" headline.
- `Results` component totals points (float, formatted to 1 decimal) instead of question count: `7.5 / 10 points`.
- `lib/storage.ts`: `bestScore` becomes a float, `bestOutOf` is the sum of all question `maxPoints`.
- `lib/player-reducer.ts`: the `confirm` action carries `{ points, maxPoints }` instead of `correct: boolean`. The `correct` boolean is still derivable as `points === maxPoints` for current binary-display use cases (so the existing reveal styling — green/red borders — still works).

No question-renderer component changes for partial-credit display in v1; the renderers still show "this option was right / this option was wrong" as today. Only the score number is fractional.

## Editor state (`<QuizEditor>`)

A single `useReducer`:

```ts
type EditorState = {
  quiz: Quiz;                          // the live draft
  selectedQuestionId: string | null;   // mirrored in the preview pane
  validation: ZodIssue[];              // empty array when valid
  isDirty: boolean;                    // changed since last download or initial load
  draftLoadedAt: string | null;        // ISO timestamp of localStorage draft if loaded
}
```

Actions: `setTitle`, `setSlug`, `setDescription`, `setCoverImage`, `addQuestion`, `removeQuestion`, `duplicateQuestion`, `reorderQuestion`, `updateQuestion`, `selectQuestion`, `loadDraft`, `discardDraft`, `markClean`, `reset`.

Reducer is pure and tested in isolation.

## Header section

- **Title** (text input, large)
- **Slug** (text input + "auto" toggle; auto-derives from title via slugify when toggle on, manual entry when off)
- **Description** (textarea, optional)
- **Cover image URL** (text input, optional)

## Question list

A vertical column of `<QuestionCard>` components, one per question. Each card contains:

- Drag handle on the left edge — `@dnd-kit/sortable` makes the cards reorderable, same library `OrderQuestion` already uses
- Type badge ("MC single", "Categorize", etc.) + collapse/expand toggle
- Type-specific form (one of `<McSingleForm>`, `<McMultiForm>`, `<CategorizeForm>`, `<OrderForm>`, `<SliderForm>`, `<NameForm>`)
- Common fields exposed in every form: prompt textarea, image URL input, explanation textarea
- Scoring subsection (always present, type-aware controls)
- Footer: **Duplicate** button (copies + appends with new ID), **Delete** button (with confirm), "selected for preview" indicator (the active question is highlighted)

**+ Add question** button below the list opens a small popover with the 6 type icons. Click → appends a new question of that type with a fresh ID and sensible defaults.

## Per-type form components

In `components/builder/forms/`:

- **`McSingleForm`** — options list with `[id, label, thumbnail?]` rows + add/remove buttons + radio for "correct"
- **`McMultiForm`** — same options list with checkboxes for correct + scheme dropdown
- **`CategorizeForm`** — buckets list `[id, label, thumbnail?]` + items list `[id, label, thumbnail?, correctBucketId]` (correctBucketId is a dropdown of bucket ids)
- **`OrderForm`** — items list, axis radio (horizontal / vertical), startLabel + endLabel inputs, "Set current order as correct" helper button
- **`SliderForm`** — min, max, step, correctValue numeric inputs + scheme dropdown + tolerance and partialCredit fields shown only when `scheme: "tolerance"`
- **`NameForm`** — acceptedAnswers list of strings, with optional typeahead from `data/characters.json`

## Scoring subsection (per question)

Rendered inside every form, common UX:

- **Max points** (number input, default 1, min 0.5, step 0.5)
- **Scheme** (dropdown — options vary by type, see schema)
- Conditional fields shown only when scheme requires them (slider tolerance & partialCredit)

## Preview pane

Right half of the editor:

- Renders the existing `<QuestionFrame>` component with draft data of `selectedQuestionId`
- Header above the frame: "Preview — Question N of M" with prev/next arrows
- "Try interactions" toggle switches the preview into a mini-player so drag-drop, sliders, autocomplete all work for sanity-checking
- Below the preview: a small read-only "Scoring" panel that shows example outcomes derived live from the scoring config — e.g., "Full credit: 1 / 1 · Half right (2 of 4 items): 0.5 / 1 · None right: 0 / 1"

## Drafts (localStorage)

Single key: `naruto-quiz:builder-drafts`, shape:

```ts
{ [slug: string]: { quiz: Quiz; savedAt: string; } }
```

- **Autosave** on every state change, debounced 500ms
- **On `<QuizEditor>` mount:** if a draft exists for this slug AND its content differs from `initialQuiz` (or `initialQuiz` is undefined for `/builder`), show a banner: "Local draft from <relative time> — [Use draft] [Discard]"
- **"Download JSON"** deletes the draft for this slug after triggering the download (since at that point you're committing the canonical version)
- **Manager list** shows an "Edited locally" badge on quizzes with a localStorage draft

## Manager list (`/manager`)

Server component reads committed quizzes via `loadQuizzes()`, passes the list to a `<ManagerListClient>` that hydrates draft state from localStorage:

```
[Search box]
─────────────────────────
example       6 questions   no draft       [Edit]
naruto-jutsu  10 questions  Edited locally [Edit]
─────────────────────────
+ New quiz → /builder
```

Each row links to `/manager/[slug]`. The "+ New quiz" button links to `/builder`.

## Navigation guard

If `isDirty` is true and the user tries to navigate away without downloading, a `beforeunload` listener fires the browser's "Are you sure you want to leave?" prompt. The draft is already in localStorage so nothing is actually lost — but the prompt prevents the user from forgetting to commit.

## Validation feedback

- zod validation runs on every state change (cheap, sub-ms for <50 questions)
- Errors shown as a list in the bottom bar; clicking an error scrolls/expands the offending question card and highlights the field
- "Download JSON" button is disabled until validation passes — guarantees the file you commit is loadable

## Slug auto-derivation

When the slug "auto" toggle is on (default for new quizzes):

```ts
function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
```

For existing quizzes loaded into the editor, the toggle starts off and slug is editable directly.

## Component file structure

```
app/
├── builder/page.tsx                     # server: AdminGate + <QuizEditor> with empty initial
├── manager/
│   ├── page.tsx                         # server: AdminGate + <ManagerListClient>
│   └── [slug]/page.tsx                  # server: AdminGate + load quiz + <QuizEditor initialQuiz>

components/
├── builder/
│   ├── QuizEditor.tsx                   # top-level editor client component
│   ├── EditorHeader.tsx                 # title/slug/description/cover row
│   ├── QuestionList.tsx                 # sortable list of question cards
│   ├── QuestionCard.tsx                 # one collapsible card with type form
│   ├── PreviewPane.tsx                  # right side, renders <QuestionFrame>
│   ├── BottomBar.tsx                    # validation + draft + download
│   ├── DraftBanner.tsx                  # "Local draft from N min ago" prompt
│   ├── ScoringFields.tsx                # max + scheme + conditional fields
│   ├── AddQuestionPopover.tsx           # the [+ Add question ▾] dropdown
│   └── forms/
│       ├── McSingleForm.tsx
│       ├── McMultiForm.tsx
│       ├── CategorizeForm.tsx
│       ├── OrderForm.tsx
│       ├── SliderForm.tsx
│       └── NameForm.tsx
├── manager/
│   └── ManagerListClient.tsx            # list with localStorage draft hydration

lib/
├── builder/
│   ├── editor-reducer.ts                # pure state machine (TDD)
│   ├── drafts-storage.ts                # localStorage adapter (TDD)
│   ├── slugify.ts                       # tiny pure helper (TDD)
│   ├── default-question.ts              # factory: type → fresh question with sensible defaults
│   └── download-quiz.ts                 # JSON.stringify + Blob + a download click
├── scoring.ts                           # MODIFIED: returns ScoreResult
├── quiz-schema.ts                       # MODIFIED: optional scoring fields
├── player-reducer.ts                    # MODIFIED: confirm action carries ScoreResult
└── storage.ts                           # MODIFIED: bestScore is a float

__tests__/
├── scoring.test.ts                      # MODIFIED: covers all schemes
├── quiz-schema.test.ts                  # MODIFIED: scoring field validation
├── editor-reducer.test.ts               # NEW
├── drafts-storage.test.ts               # NEW
└── slugify.test.ts                      # NEW
```

## Testing focus

High-leverage logic gets full TDD coverage:

- `lib/scoring.ts` — every new scheme, every type, edge cases (unanswered, partial)
- `lib/builder/editor-reducer.ts` — every action transition
- `lib/builder/drafts-storage.ts` — load/save/discard semantics
- `lib/builder/slugify.ts` — Unicode, edge cases (all-numeric, leading dash)
- Updated zod schemas — accept new fields, reject malformed ones

Form components and the preview pane get light smoke tests (renders without crashing, simple interaction emits expected reducer action). No exhaustive component coverage — the iteration loop in the editor itself surfaces issues faster than tests would.

## Out of scope

Explicitly NOT in this build, so we don't drift:

- **Server-side commits via GitHub API.** Storage stays "download JSON, manually commit." No `GITHUB_TOKEN`, no git API routes.
- **Image upload.** URL-only fields. No `public/quiz-images/` upload helper, no base64.
- **Multi-user editing.** Single admin only. No locking, no conflict resolution.
- **Versioning / history.** The repo IS the version history.
- **Per-quiz scoring weights.** Per-question `maxPoints` covers it.
- **Mobile editor.** Desktop-first. Editor will be unusable on phones — fine.
- **i18n** in the editor UI. English only.
- **Quiz-level metadata beyond title/description/cover.** No tags, categories, difficulty, time limits, intro screens.
- **New question types.** The existing 6 are the full set.
- **Player feature additions.** Only the scoring math update touches the player.
- **Partial-credit reveal animation in question renderers.** They still show binary right/wrong styling per option; only the *score number* is fractional in v1.

## Open questions / future work

None at this point. Manager-level "publish to GitHub" automation is a future Phase 4 if you ever want it; not in scope here.
